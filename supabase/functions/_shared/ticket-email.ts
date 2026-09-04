import QRCode from 'npm:qrcode@1.5.4';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'EventMasters <onboarding@resend.dev>';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://eventmasters.live';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: unknown): string {
  if (!value) return 'Date to be announced';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos',
  }).format(date);
}

function formatMoney(amount: unknown, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export async function sendTicketEmail(order: any, tickets: any[]): Promise<{ sent: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not configured; ticket email skipped.');
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }

  if (!order?.buyer_email || !tickets?.length) {
    return { sent: false, error: 'Missing buyer email or tickets' };
  }

  const event = order.events ?? {};
  const ticketRows = tickets.map((ticket: any) => ({
    code: String(ticket.ticket_code),
    name: String(ticket.ticket_type_name ?? ticket.ticket_types?.name ?? 'Event Ticket'),
  }));

  const attachments: Array<Record<string, string>> = [];
  const ticketCards: string[] = [];

  for (let i = 0; i < ticketRows.length; i += 1) {
    const ticket = ticketRows[i];
    const content = await QRCode.toDataURL(ticket.code, {
      errorCorrectionLevel: 'H', margin: 2, width: 420,
    });
    const base64 = content.split(',')[1] ?? '';
    const contentId = `ticket-qr-${i + 1}`;
    attachments.push({
      content: base64,
      filename: `${ticket.code}.png`,
      content_id: contentId,
      content_type: 'image/png',
    });

    ticketCards.push(`
      <div style="margin:0 0 18px;padding:20px;border:1px solid #29304b;border-radius:16px;background:#171d35;text-align:center;">
        <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#a9b0c7;text-transform:uppercase;margin-bottom:12px;">${escapeHtml(ticket.name)}</div>
        <img src="cid:${contentId}" alt="QR code for ${escapeHtml(ticket.code)}" width="220" height="220" style="display:block;margin:0 auto 14px;background:#fff;border-radius:8px;padding:8px;" />
        <div style="font-family:monospace;font-size:16px;font-weight:800;letter-spacing:2px;color:#f2b84b;">${escapeHtml(ticket.code)}</div>
      </div>`);
  }

  const eventTitle = escapeHtml(event.title ?? 'Your Event');
  const venue = escapeHtml(event.venue_name ?? event.address ?? 'Venue to be announced');
  const date = escapeHtml(formatDate(event.start_at));
  const total = escapeHtml(formatMoney(order.amount_total, order.currency ?? 'NGN'));
  const orderRef = escapeHtml(order.provider_reference);
  const firstName = escapeHtml(String(order.buyer_name ?? 'there').trim().split(/\s+/)[0] || 'there');
  const ticketsUrl = `${SITE_URL}/my-tickets`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d1222;color:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
    <div style="text-align:center;padding:10px 0 24px;">
      <div style="font-size:25px;font-weight:900;letter-spacing:-.5px;color:#f2b84b;">EVENTMASTERS</div>
      <div style="font-size:11px;letter-spacing:2px;color:#8d95ad;margin-top:5px;">BY HSPR TECHNOLOGIES</div>
    </div>
    <div style="background:#12182c;border:1px solid #29304b;border-radius:20px;padding:28px 22px;">
      <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#183b2a;color:#6fe09c;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Payment confirmed</div>
      <h1 style="font-size:26px;line-height:1.2;margin:16px 0 8px;color:#fff;">Your tickets are ready, ${firstName}.</h1>
      <p style="font-size:15px;line-height:1.7;color:#a9b0c7;margin:0 0 22px;">Your EventMasters ticket purchase has been confirmed. Keep this email handy and show the QR code for your ticket at the gate.</p>

      <div style="padding:18px;border-radius:14px;background:#171d35;margin-bottom:22px;">
        <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:12px;">${eventTitle}</div>
        <div style="font-size:14px;color:#b7bed2;line-height:1.8;">📅 ${date}<br/>📍 ${venue}</div>
      </div>

      ${ticketCards.join('')}

      <div style="border-top:1px solid #29304b;margin-top:22px;padding-top:18px;font-size:13px;line-height:1.8;color:#9ea6bd;">
        <strong style="color:#fff;">Order reference:</strong> ${orderRef}<br/>
        <strong style="color:#fff;">Amount paid:</strong> ${total}<br/>
        <strong style="color:#fff;">Tickets:</strong> ${ticketRows.length}
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${escapeHtml(ticketsUrl)}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f2b84b;color:#101525;text-decoration:none;font-weight:800;">View My Tickets</a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;line-height:1.7;color:#68718b;margin:18px 12px 0;">EventMasters by HSPR Technologies · Keep your ticket code private and only present it at the event entrance.</p>
  </div>
</body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Prevent duplicate emails when verify + webhook race each other.
      'Idempotency-Key': `ticket-purchase/${order.id}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [order.buyer_email],
      subject: `Your EventMasters tickets — ${String(event.title ?? 'Purchase confirmed')}`,
      html,
      attachments,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Resend ticket email failed:', result);
    return { sent: false, error: result?.message ?? `Resend returned ${response.status}` };
  }

  return { sent: true, id: result?.id };
}
