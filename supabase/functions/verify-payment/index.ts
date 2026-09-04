import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendTicketEmail } from '../_shared/ticket-email.ts';

const FLW_SECRET_KEY        = Deno.env.get('FLW_SECRET_KEY') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function generateTicketCode(): string {
  return 'EM-' + crypto.randomUUID().split('-')[0].toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { txRef, transactionId, provider } = await req.json();

    if (!txRef || !transactionId) return json({ error: 'Missing txRef or transactionId' }, 400);
    if (!FLW_SECRET_KEY) return json({ error: 'FLW_SECRET_KEY not configured in Supabase secrets' }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Find the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('provider_reference', txRef)
      .single();

    if (orderErr || !order) return json({ error: 'Order not found' }, 404);

    // Already paid — return it (idempotent)
    if (order.status === 'paid') {
      const { data: full } = await supabase
        .from('orders')
        .select('*, events(title,slug,start_at,venue_name,address), order_items(*, ticket_types(name), tickets(ticket_code))')
        .eq('id', order.id).single();

      if (full && !full.ticket_email_sent_at) {
        const tickets = full.order_items?.flatMap((item: any) =>
          (item.tickets ?? []).map((ticket: any) => ({ ...ticket, ticket_type_name: item.ticket_types?.name }))
        ) ?? [];
        const email = await sendTicketEmail(full, tickets);
        if (email.sent) {
          await supabase.from('orders').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', order.id);
          full.ticket_email_sent_at = new Date().toISOString();
        }
      }
      return json({ success: true, order: full, emailSent: Boolean(full?.ticket_email_sent_at) });
    }

    // Re-verify with Flutterwave V3
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
    );
    const verifyData = await verifyRes.json();

    const transaction = verifyData.data;
    if (verifyData.status !== 'success' || transaction?.status !== 'successful') {
      return json({ error: 'Payment not verified by Flutterwave', flwStatus: transaction?.status }, 400);
    }

    // Never trust the browser callback alone: validate the V3 transaction
    // against the order that was created server-side.
    if (String(transaction.tx_ref) !== String(order.provider_reference)) {
      return json({ error: 'Transaction reference mismatch' }, 400);
    }
    if (String(transaction.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
      return json({ error: 'Currency mismatch' }, 400);
    }
    if (Number(transaction.amount) !== Number(order.amount_total)) {
      return json({ error: 'Amount mismatch' }, 400);
    }

    // Reserve stock atomically
    for (const item of order.order_items) {
      const { data: ok } = await supabase.rpc('confirm_ticket_sale', {
        p_ticket_type_id: item.ticket_type_id,
        p_quantity:       item.quantity,
      });
      if (!ok) {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
        return json({ error: 'Tickets sold out — contact support for refund' }, 409);
      }
    }

    // Issue QR tickets
    const ticketRows = order.order_items.flatMap((item: any) =>
      Array.from({ length: item.quantity }).map(() => ({
        order_item_id: item.id,
        ticket_code:   generateTicketCode(),
      }))
    );
    await supabase.from('tickets').insert(ticketRows);

    // Mark paid
    await supabase.from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', order.id);

    // Return full order with ticket codes
    const { data: full } = await supabase
      .from('orders')
      .select('*, events(title,slug,start_at,venue_name,address), order_items(*, ticket_types(name), tickets(ticket_code))')
      .eq('id', order.id).single();

    // Email is a post-payment notification. If Resend is unavailable, keep the
    // order paid and let a later verification/webhook retry the email.
    let emailSent = Boolean(full?.ticket_email_sent_at);
    if (full && !emailSent) {
      const tickets = full.order_items?.flatMap((item: any) =>
        (item.tickets ?? []).map((ticket: any) => ({ ...ticket, ticket_type_name: item.ticket_types?.name }))
      ) ?? [];
      const email = await sendTicketEmail(full, tickets);
      if (email.sent) {
        const sentAt = new Date().toISOString();
        await supabase.from('orders').update({ ticket_email_sent_at: sentAt }).eq('id', order.id);
        full.ticket_email_sent_at = sentAt;
        emailSent = true;
      }
    }

    return json({ success: true, order: full, emailSent });

  } catch (err: any) {
    console.error('verify-payment error:', err);
    return json({ error: err?.message || 'Unexpected error' }, 500);
  }
});
