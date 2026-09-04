import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FLW_SECRET_KEY        = Deno.env.get('FLW_SECRET_KEY') ?? '';
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://eventmasters.live';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const {
      provider, eventId, buyerName, buyerEmail, buyerPhone,
      buyerId, currency, items, txRef, useInline,
    } = await req.json();

    if (!provider || !eventId || !buyerEmail || !items?.length) {
      return json({ error: 'Missing required fields' }, 400);
    }
    if (provider !== 'flutterwave') {
      return json({ error: 'Unsupported payment provider' }, 400);
    }

    const paymentCurrency = String(currency || 'NGN').toUpperCase();
    if (paymentCurrency !== 'NGN') {
      return json({ error: 'Flutterwave checkout currently supports NGN only' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Validate ticket types server-side
    const ticketTypeIds = items.map((i: any) => i.ticketTypeId);
    const { data: dbTypes, error: ttErr } = await supabase
      .from('ticket_types')
      .select('id, price, quantity_total, quantity_sold, is_active, event_id')
      .in('id', ticketTypeIds);

    if (ttErr) return json({ error: 'Failed to validate tickets: ' + ttErr.message }, 500);
    if (!dbTypes?.length) return json({ error: 'No ticket types found' }, 400);

    let verifiedTotal = 0;
    for (const item of items) {
      const dbType = dbTypes.find((t: any) => t.id === item.ticketTypeId);
      if (!dbType || !dbType.is_active || dbType.event_id !== eventId) {
        return json({ error: `Invalid ticket: ${item.name}` }, 400);
      }
      const remaining = dbType.quantity_total - dbType.quantity_sold;
      if (item.quantity > remaining) {
        return json({ error: `Only ${remaining} "${item.name}" tickets left` }, 400);
      }
      verifiedTotal += Number(dbType.price) * item.quantity;
    }

    const ref = txRef || `EM-${eventId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // Create pending order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id:           buyerId || null,
        buyer_email:        buyerEmail,
        buyer_name:         buyerName,
        buyer_phone:        buyerPhone || null,
        event_id:           eventId,
        provider:           provider,
        provider_reference: ref,
        currency:           paymentCurrency,
        amount_total:       verifiedTotal,
        status:             'pending',
      })
      .select()
      .single();

    if (orderErr) return json({ error: 'Failed to create order: ' + orderErr.message }, 500);

    // Insert order items
    const orderItems = items.map((item: any) => {
      const dbType = dbTypes.find((t: any) => t.id === item.ticketTypeId);
      return {
        order_id:       order.id,
        ticket_type_id: item.ticketTypeId,
        unit_price:     dbType.price,
        quantity:       item.quantity,
      };
    });

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) return json({ error: 'Failed to save order items: ' + itemsErr.message }, 500);

    // Inline mode — frontend handles FLW modal, just return the ref
    if (useInline && provider === 'flutterwave') {
      return json({ success: true, orderId: order.id, txRef: ref, amount: verifiedTotal });
    }

    // Redirect mode — call Flutterwave V3 API
    if (provider === 'flutterwave') {
      if (!FLW_SECRET_KEY) return json({ error: 'FLW_SECRET_KEY not set in Supabase secrets' }, 500);

      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref:       ref,
          amount:       verifiedTotal,
          currency:     paymentCurrency,
          redirect_url: `${SITE_URL}/payment-result`,
          customer:     { email: buyerEmail, name: buyerName, phonenumber: buyerPhone },
          customizations: {
            title:       'HSPR Technologies',
            description: 'EventMasters ticket purchase',
            logo:        `${SITE_URL}/favicon.svg`,
          },
        }),
      });

      const flwData = await flwRes.json();
      if (flwData.status !== 'success') {
        return json({ error: flwData.message || 'Flutterwave error' }, 500);
      }
      return json({ redirectUrl: flwData.data.link });
    }

    return json({ error: 'Unknown provider' }, 400);

  } catch (err: any) {
    console.error('create-payment error:', err);
    return json({ error: err?.message || 'Unexpected error' }, 500);
  }
});
