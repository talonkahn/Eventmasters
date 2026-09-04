import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const LINKS = [
  { to: '/events',                         label: 'Browse Events' },
  { to: '/events?category=concert',        label: 'Concerts' },
  { to: '/events?category=comedy-show',    label: 'Comedy' },
  { to: '/events?category=festival',       label: 'Festivals' },
  { to: '/about',                          label: 'About' },
  { to: '/contact',                        label: 'List Event', highlight: true },
];

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, width: '100%',
        background: scrolled ? 'rgba(9,6,26,0.97)' : 'rgba(9,6,26,0.75)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid rgba(168,85,247,0.2)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, padding: '0 20px', maxWidth: 1200, margin: '0 auto', gap: 16 }}>
          {/* Logo */}
          <Link to="/" style={{ lineHeight: 0, flexShrink: 0 }}>
            <Logo variant="lockup" height={28} />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'none', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 2 }} className="nav-links">
            {LINKS.map(l => (
              <Link key={l.to} to={l.to} style={{
                padding: '8px 13px', borderRadius: 10,
                fontSize: '0.82rem', fontWeight: 600,
                color: l.highlight ? 'var(--purple-bright)' : location.pathname === l.to ? '#fff' : 'var(--slate)',
                background: l.highlight ? 'var(--purple-dim)' : location.pathname === l.to ? 'var(--glass-mid)' : 'transparent',
                border: l.highlight ? '1px solid var(--line-purple)' : '1px solid transparent',
                transition: 'all 0.18s ease', whiteSpace: 'nowrap',
              }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="nav-links" style={{ flex: 'none', gap: 8 }}>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" style={{
                    padding: '7px 14px', borderRadius: 9,
                    background: 'linear-gradient(135deg, rgba(255,179,0,0.15), rgba(255,179,0,0.08))',
                    border: '1px solid rgba(255,179,0,0.3)',
                    color: 'var(--amber)', fontSize: '0.78rem', fontWeight: 800,
                  }}>⚡ Admin</Link>
                )}
                <Link to="/my-tickets" className="btn btn-ghost btn-sm">My Tickets</Link>
                <button onClick={() => { signOut(); navigate('/'); }} className="btn btn-ghost btn-sm">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/sign-up" className="btn btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Burger */}
          <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', padding: 8, cursor: 'pointer', flexShrink: 0 }} className="nav-burger">
            {[0,1,2].map(i => (
              <span key={i} style={{
                display: 'block', width: 22, height: 2,
                background: open && i===1 ? 'transparent' : 'var(--purple-bright)',
                borderRadius: 2,
                transform: open ? (i===0 ? 'translateY(7px) rotate(45deg)' : i===2 ? 'translateY(-7px) rotate(-45deg)' : 'none') : 'none',
                transition: 'all 0.22s ease',
              }} />
            ))}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'fixed', top: 62, left: 0, right: 0, bottom: 0,
          background: 'rgba(9,6,26,0.98)', backdropFilter: 'blur(20px)',
          zIndex: 99, overflowY: 'auto', padding: '8px 20px 60px',
          borderTop: '1px solid rgba(168,85,247,0.2)',
        }}>
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{
              display: 'block', padding: '17px 0',
              fontSize: '1.05rem', fontWeight: 700,
              color: l.highlight ? 'var(--purple-bright)' : '#fff',
              borderBottom: '1px solid var(--line)',
            }}>{l.label}</Link>
          ))}
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="btn btn-amber" style={{ justifyContent: 'center' }}>⚡ Admin Dashboard</Link>}
                <Link to="/my-tickets" className="btn btn-ghost" style={{ justifyContent: 'center' }}>My Tickets</Link>
                <button onClick={() => { signOut(); navigate('/'); setOpen(false); }} className="btn btn-ghost" style={{ width: '100%' }}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="btn btn-ghost" style={{ justifyContent: 'center' }}>Sign in</Link>
                <Link to="/sign-up" className="btn btn-primary" style={{ justifyContent: 'center' }}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
