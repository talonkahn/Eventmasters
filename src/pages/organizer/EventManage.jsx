import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Events, TicketTypes } from '../../lib/apiClient';

function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

export default function OrganizerEventDetail() {
  const { eventId } = useParams();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  const load = () => TicketTypes.listForEvent(eventId).then(setTicketTypes).catch(console.error);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [eventId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !price || !quantity) {
      setError('Fill in all fields.');
      return;
    }
    try {
      await TicketTypes.create({
        event_id: eventId,
        name,
        price: Number(price),
        quantity_total: Number(quantity),
      });
      setName('');
      setPrice('');
      setQuantity('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 24 }}>Manage ticket types</h1>

      {loading ? (
        <p style={{ color: 'var(--slate)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {ticketTypes.map((t) => {
            const remaining = t.quantity_total - t.quantity_sold;
            return (
              <div key={t.id} style={styles.row}>
                <div>
                  <p style={{ fontWeight: 600 }}>{t.name}</p>
                  <p className="mono" style={{ color: 'var(--amber)', fontSize: '0.9rem' }}>{formatNaira(t.price)}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--slate)' }}>
                  <p>{t.quantity_sold} sold</p>
                  <p>{remaining} remaining</p>
                </div>
              </div>
            );
          })}
          {ticketTypes.length === 0 && <p style={{ color: 'var(--slate)' }}>No ticket types yet.</p>}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} style={styles.form}>
          <div className="field">
            <label>Ticket name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Regular, VIP, Table for 4…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Price (NGN)</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label>Quantity available</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
          {error && <p style={{ color: 'var(--coral)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit">Add ticket type</button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add ticket type</button>
      )}
    </div>
  );
}

const styles = {
  row: {
    background: 'var(--ink-soft)',
    border: '1px solid var(--ink-line)',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    justifyContent: 'space-between',
  },
  form: {
    background: 'var(--ink-soft)',
    border: '1px solid var(--ink-line)',
    borderRadius: 12,
    padding: 20,
  },
};
