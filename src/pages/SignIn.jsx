import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function SignIn() {
  const { signIn }  = useAuth();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn({ email, password }); navigate(params.get('redirect') || '/'); }
    catch (err) { setError(err.message || 'Incorrect email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo-wrap">
          <Logo variant="stacked" height={36} />
          <p className="auth-sub">Sign in to access your tickets</p>
        </div>
        <form onSubmit={handle}>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></div>
          {error && <p style={{ color: 'var(--coral)', fontSize: '0.83rem', marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.85rem', color: 'var(--slate)' }}>
          No account? <Link to="/sign-up" style={{ color: 'var(--amber)', fontWeight: 700 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
