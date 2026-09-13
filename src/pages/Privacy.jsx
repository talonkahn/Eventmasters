export default function Privacy() {
  const year = new Date().getFullYear();
  const items = [
    ['Information We Collect', 'We collect your name, email, and phone number when you purchase tickets or create an account. We also collect payment reference numbers (not card details) and event attendance data.'],
    ['How We Use Your Information', 'Your information is used to issue tickets, send confirmation emails, and provide customer support. We do not sell your personal data to third parties.'],
    ['Payment Data', 'Card and bank details are handled entirely by Flutterwave and Stripe. EventMasters only receives a payment reference and status after a transaction is complete.'],
    ['Cookies', 'We use minimal session cookies to keep you logged in. We do not use tracking cookies or third-party advertising cookies.'],
    ['Data Retention', 'Your account data is retained for as long as your account is active. Ticket and order records are retained for 3 years for audit purposes. You may request deletion by emailing samuelivere92@gmail.com.'],
    ['Your Rights', 'Under Nigerian data protection regulations (NDPR), you have the right to access, correct, or delete your personal data. Contact us at samuelivere92@gmail.com for any data requests.'],
    ['Security', 'All data is stored in Supabase with row-level security policies. Connections are encrypted via SSL/TLS.'],
    ['Contact', 'For privacy concerns, contact HSPR Technologies Ltd at samuelivere92@gmail.com or WhatsApp +234 673 0044.'],
  ];
  return (
    <div className="static-wrap">
      <h1 className="static-title">Privacy Policy</h1>
      <p style={{ color: 'var(--slate-2)', fontSize: '0.82rem', marginBottom: 28 }}>Last updated: January {year}</p>
      {items.map(([title, body]) => (
        <div key={title} style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff', marginBottom: 7 }}>{title}</h3>
          <p style={{ color: 'var(--slate)', lineHeight: 1.7, fontSize: '0.88rem' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
