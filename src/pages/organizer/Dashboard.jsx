import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Events } from '../../lib/apiClient';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Events.listMine(user.id).then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const totalSold = (e) => e.ticket_types?.reduce((sum, t) => sum + t.quantity_sold, 0) || 0;
  const totalRevenue = (e) =>
    e.ticket_types?.reduce((sum, t) => sum + t.quantity_sold * Number(t.price), 0) || 0;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.7rem' }}>Organizer hub</h1>
        <Link to="/organizer/new" className="btn btn-primary">+ Submit event</Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--slate)' }}>Loading…</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--slate)' }}>
          <p>You haven't submitted any events yet.</p>
          <Link to="/organizer/new" className="btn btn-primary" style={{ marginTop: 12 }}>Submit your first event</Link>
        </div>
      ) : (
        <div style={styles.list}>
          {events.map((e) => (
            <Link to={`/organizer/events/${e.id}`} key={e.id} style={styles.row}>
              <div>
                <span className={`badge badge-${e.status === 'pending' ? 'pending' : e.status === 'rejected' ? 'rejected' : 'approved'}`}>
                  {e.status}
                </span>
                <h3 style={{ fontSize: '1.05rem', margin: '8px 0 4px' }}>{e.title}</h3>
                <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>
                  {e.states?.name} · {new Date(e.start_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
                {e.status === 'rejected' && e.rejection_reason && (
                  <p style={{ color: 'var(--coral)', fontSize: '0.82rem', marginTop: 4 }}>
                    Reason: {e.rejection_reason}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="mono" style={{ fontWeight: 700 }}>
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalRevenue(e))}
                </p>
                <p style={{ color: 'var(--slate)', fontSize: '0.82rem' }}>{totalSold(e)} tickets sold</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: {
    background: 'var(--ink-soft)',
    border: '1px solid var(--ink-line)',
    borderRadius: 12,
    padding: 18,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};
