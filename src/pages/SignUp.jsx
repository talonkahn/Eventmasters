import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function SignUp() {
  const { signUp }  = useAuth();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try { await signUp({ email, password, fullName }); setDone(true); }
    catch (err) { setError(err.message || 'Could not create account.'); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: 'var(--slate)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--paper)' }}>{email}</strong>. Confirm it then sign in.
        </p>
        <Link to="/sign-in" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Go to sign in</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo-wrap">
          <Logo variant="stacked" height={36} />
          <p className="auth-sub">Create your account to buy tickets</p>
        </div>
        <div style={{ background: 'rgba(16,217,122,0.06)', border: '1px solid rgba(16,217,122,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: '0.82rem', lineHeight: 1.6 }}>
          Want to <strong>list an event?</strong>{' '}
          <a href="https://wa.me/2346730044" style={{ color: 'var(--green)', fontWeight: 700 }}>WhatsApp us</a>{' '}or{' '}
          <a href="mailto:samuelivere92@gmail.com" style={{ color: 'var(--amber)' }}>email admin</a>
        </div>
        <form onSubmit={handle}>
          <div className="field"><label>Full name</label><input value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" /></div>
          {error && <p style={{ color: 'var(--coral)', fontSize: '0.83rem', marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.85rem', color: 'var(--slate)' }}>
          Already have an account? <Link to="/sign-in" style={{ color: 'var(--amber)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
