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
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <header className={`nav-header${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo"><Logo variant="lockup" height={28} /></Link>

          <nav className="nav-links">
            {LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className={`nav-link${location.pathname === l.to ? ' active' : ''}${l.highlight ? ' highlight' : ''}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions nav-links">
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="admin-badge">⚡ Admin</Link>}
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

          <button className={`nav-burger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {open && (
        <div className="nav-drawer">
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} className={`drawer-link${l.highlight ? ' highlight' : ''}`}>{l.label}</Link>
          ))}
          <div className="drawer-actions">
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="btn btn-primary" style={{ justifyContent:'center' }}>⚡ Admin Dashboard</Link>}
                <Link to="/my-tickets" className="btn btn-ghost" style={{ justifyContent:'center' }}>My Tickets</Link>
                <button onClick={() => { signOut(); navigate('/'); setOpen(false); }} className="btn btn-ghost" style={{ width:'100%' }}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="btn btn-ghost" style={{ justifyContent:'center' }}>Sign in</Link>
                <Link to="/sign-up" className="btn btn-primary" style={{ justifyContent:'center' }}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
