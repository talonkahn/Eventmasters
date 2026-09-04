import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="not-found-wrap">
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem', fontWeight: 800, color: 'var(--line)', lineHeight: 1, marginBottom: 8 }}>404</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#fff', marginBottom: 10 }}>Page not found</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 24, fontSize: '0.9rem' }}>This page doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/events" className="btn btn-ghost">Browse Events</Link>
        </div>
      </div>
    </div>
  );
}
