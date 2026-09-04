import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTicketEmail } from '../_shared/ticket-email.ts';

const FLW_SECRET_KEY        = Deno.env.get('FLW_SECRET_KEY') ?? '';
const FLW_WEBHOOK_HASH      = Deno.env.get('FLW_WEBHOOK_HASH') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

function generateTicketCode(): string {
  return 'EM-' + crypto.randomUUID().split('-')[0].toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  try {
    const signature = req.headers.get('verif-hash');
    if (FLW_WEBHOOK_HASH && signature !== FLW_WEBHOOK_HASH) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    if (payload?.event !== 'charge.completed') {
      return new Response('Ignored', { status: 200 });
    }

    const txRef   = payload?.data?.tx_ref;
    const flwTxId = payload?.data?.id;
    if (!txRef || !flwTxId) return new Response('Missing data', { status: 400 });

    // Re-verify with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${flwTxId}/verify`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    const verifyData = await verifyRes.json();

    const transaction = verifyData.data;
    if (verifyData.status !== 'success' || transaction?.status !== 'successful') {
      return new Response('Not successful', { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('provider_reference', txRef)
      .single();

    if (!order) return new Response('Order not found', { status: 200 });
    if (order.status === 'paid') {
      if (!order.ticket_email_sent_at) {
        const { data: full } = await supabase
          .from('orders')
          .select('*, events(title,slug,start_at,venue_name,address), order_items(*, ticket_types(name), tickets(ticket_code))')
          .eq('id', order.id).single();
        if (full) {
          const tickets = full.order_items?.flatMap((item: any) =>
            (item.tickets ?? []).map((ticket: any) => ({ ...ticket, ticket_type_name: item.ticket_types?.name }))
          ) ?? [];
          const email = await sendTicketEmail(full, tickets);
          if (email.sent) {
            await supabase.from('orders').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', order.id);
          }
        }
      }
      return new Response('Already processed', { status: 200 });
    }

    if (String(transaction.tx_ref) !== String(order.provider_reference)) {
      return new Response('Reference mismatch', { status: 200 });
    }
    if (String(transaction.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
      return new Response('Currency mismatch', { status: 200 });
    }
    if (Number(transaction.amount) !== Number(order.amount_total)) {
      return new Response('Amount mismatch', { status: 200 });
    }

    for (const item of order.order_items) {
      const { data: ok } = await supabase.rpc('confirm_ticket_sale', {
        p_ticket_type_id: item.ticket_type_id,
        p_quantity:       item.quantity,
      });
      if (!ok) {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return new Response('Sold out', { status: 200 });
      }
    }

    const ticketRows = order.order_items.flatMap((item: any) =>
      Array.from({ length: item.quantity }).map(() => ({
        order_item_id: item.id,
        ticket_code:   generateTicketCode(),
      }))
    );
    await supabase.from('tickets').insert(ticketRows);
    await supabase.from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', order.id);

    // Email is intentionally best-effort: payment/ticket issuance must remain
    // successful even if Resend is temporarily unavailable.
    const { data: full } = await supabase
      .from('orders')
      .select('*, events(title,slug,start_at,venue_name,address), order_items(*, ticket_types(name), tickets(ticket_code))')
      .eq('id', order.id).single();
    if (full) {
      const tickets = full.order_items?.flatMap((item: any) =>
        (item.tickets ?? []).map((ticket: any) => ({ ...ticket, ticket_type_name: item.ticket_types?.name }))
      ) ?? [];
      const email = await sendTicketEmail(full, tickets);
      if (email.sent) {
        await supabase.from('orders').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', order.id);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('webhook error:', err);
    return new Response('Error', { status: 500 });
  }
});
