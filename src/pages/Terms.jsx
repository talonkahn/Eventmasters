export default function Terms() {
  const year = new Date().getFullYear();
  const items = [
    ['Use of Platform', 'EventMasters is a Nigerian events ticketing platform operated by HSPR Technologies Ltd. By using this platform you agree to these terms. The platform is available to users aged 18 and above.'],
    ['Ticket Purchases', 'All ticket sales are final. Refunds are only issued if an event is cancelled by the organizer. EventMasters is not responsible for event quality, changes, or cancellations beyond issuing refunds in confirmed cancellation cases.'],
    ['Event Listings', 'All events are manually reviewed and approved by EventMasters admin before going live. To list an event, contact us via WhatsApp (+234 673 0044) or email (samuelivere92@gmail.com). EventMasters reserves the right to reject any event.'],
    ['Payments', 'Payments are processed securely via Flutterwave (NGN) and Stripe (international). EventMasters does not store card details. Payment disputes must be raised within 7 days of purchase.'],
    ['Prohibited Use', 'You may not use EventMasters for fraudulent ticket purchases, reselling tickets above face value without permission, or any illegal activity under Nigerian law.'],
    ['Intellectual Property', 'All content, design, and code on EventMasters is the property of HSPR Technologies Ltd. You may not copy or reproduce any part without written permission.'],
    ['Limitation of Liability', 'HSPR Technologies Ltd is not liable for losses arising from event cancellations, venue changes, or third-party payment failures beyond our reasonable control.'],
    ['Governing Law', 'These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in Nigerian courts.'],
  ];
  return (
    <div className="static-wrap">
      <h1 className="static-title">Terms of Service</h1>
      <p style={{ color: 'var(--slate-2)', fontSize: '0.82rem', marginBottom: 28 }}>Last updated: January {year}</p>
      {items.map(([title, body]) => (
        <div key={title} style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff', marginBottom: 7 }}>{title}</h3>
          <p style={{ color: 'var(--slate)', lineHeight: 1.7, fontSize: '0.88rem' }}>{body}</p>
        </div>
      ))}
      <p style={{ color: 'var(--slate-2)', fontSize: '0.76rem', marginTop: 32, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
        © {year} EventMasters · HSPR Technologies Ltd · samuelivere92@gmail.com
      </p>
    </div>
  );
}
