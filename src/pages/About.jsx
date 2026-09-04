import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="static-wrap">
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--purple)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>About Us</p>
      <h1 className="static-title">
        Nigeria deserves a <span style={{ color: 'var(--amber)' }}>world-class</span> events platform
      </h1>
      <p className="static-sub">
        EventMasters was built to solve a real problem: incredible Nigerian events go undiscovered, underattended, and lose revenue to friction. We built the platform we wished existed.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
        {[
          { n: '37', label: 'States covered', sub: 'All 36 + FCT' },
          { n: '22+', label: 'Events seeded', sub: 'Live on launch' },
          { n: '2', label: 'Payment options', sub: 'FLW + Stripe' },
          { n: '24h', label: 'Listing SLA', sub: 'Contact to live' },
        ].map(s => (
          <div key={s.n} style={{ background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 14, padding: '20px 16px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--amber)', lineHeight: 1 }}>{s.n}</p>
            <p style={{ fontWeight: 700, marginTop: 6, marginBottom: 2, fontSize: '0.88rem', color: '#fff' }}>{s.label}</p>
            <p style={{ color: 'var(--slate)', fontSize: '0.78rem' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fff', marginBottom: 12 }}>Built by HSPR Technologies</h2>
        <p style={{ color: 'var(--slate)', lineHeight: 1.7, marginBottom: 12, fontSize: '0.9rem' }}>
          EventMasters is a product of <strong style={{ color: 'var(--paper)' }}>HSPR Technologies Ltd</strong>, a Nigerian tech company building digital products for African communities.
        </p>
        <p style={{ color: 'var(--slate)', lineHeight: 1.7, marginBottom: 24, fontSize: '0.9rem' }}>
          We're based in Nigeria and we build for Nigeria first — with global ambitions. EventMasters will expand to cover events across the African continent.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
          <Link to="/contact" className="btn btn-ghost">List Your Event</Link>
        </div>
      </div>
    </div>
  );
}
