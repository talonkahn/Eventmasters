import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!user) return <Navigate to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`} replace />;

  if (requireRole === 'admin' && profile?.role !== 'admin') return <Navigate to="/" replace />;
  if (requireRole === 'organizer' && !['organizer','admin'].includes(profile?.role)) return <Navigate to="/" replace />;

  return children;
}
