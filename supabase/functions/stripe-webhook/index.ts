// supabase/functions/stripe-webhook/index.ts
// Listens for checkout.session.completed events from Stripe,
// verifies the webhook signature, then marks the order paid
// and issues tickets.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function generateTicketCode() {
  return 'EM-' + crypto.randomUUID().split('-')[0].toUpperCase();
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('Ignored event type', { status: 200 });
  }

  const session = event.data.object as any;
  const txRef = session.client_reference_id;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`provider_reference.eq.${txRef},provider_reference.eq.${session.id}`)
      .single();

    if (orderError || !order) {
      console.error('Order not found for session', session.id, txRef);
      return new Response('Order not found', { status: 404 });
    }

    if (order.status === 'paid') {
      return new Response('Already processed', { status: 200 }); // idempotent
    }

    const amountPaid = session.amount_total / 100;
    if (amountPaid < Number(order.amount_total)) {
      console.error('Amount mismatch', amountPaid, order.amount_total);
      return new Response('Amount mismatch', { status: 400 });
    }

    for (const item of order.order_items) {
      const { data: ok } = await supabase.rpc('confirm_ticket_sale', {
        p_ticket_type_id: item.ticket_type_id,
        p_quantity: item.quantity,
      });
      if (!ok) {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return new Response('Sold out — order marked failed, refund manually', { status: 200 });
      }
    }

    const ticketRows = order.order_items.flatMap((item: any) =>
      Array.from({ length: item.quantity }).map(() => ({
        order_item_id: item.id,
        ticket_code: generateTicketCode(),
      }))
    );
    await supabase.from('tickets').insert(ticketRows);

    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), provider_reference: session.id })
      .eq('id', order.id);

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Internal error', { status: 500 });
  }
});
