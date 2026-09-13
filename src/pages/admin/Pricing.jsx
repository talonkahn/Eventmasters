import { useEffect, useState } from 'react';
import { Events, TicketTypes } from '../../lib/apiClient';

function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminPricing() {
  const [events, setEvents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [ticketTypesByEvent, setTicketTypesByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // ticket_type id being edited
  const [draftPrice, setDraftPrice] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Events.listAll('approved')
      .then(async (evts) => {
        const live = await Events.listAll('live').catch(() => []);
        setEvents([...evts, ...live]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (eventId) => {
    if (expandedId === eventId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(eventId);
    if (!ticketTypesByEvent[eventId]) {
      const types = await TicketTypes.listForEvent(eventId);
      setTicketTypesByEvent((prev) => ({ ...prev, [eventId]: types }));
    }
  };

  const startEdit = (ticketType) => {
    setEditing(ticketType.id);
    setDraftPrice(String(ticketType.price));
    setNote('');
  };

  const saveEdit = async (eventId, ticketTypeId) => {
    setSaving(true);
    try {
      await TicketTypes.adminSetPrice(ticketTypeId, Number(draftPrice), note);
      const refreshed = await TicketTypes.listForEvent(eventId);
      setTicketTypesByEvent((prev) => ({ ...prev, [eventId]: refreshed }));
      setEditing(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Pricing control</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 24 }}>
        Override any ticket price on any live or approved event. Every change is logged.
      </p>

      <input
        placeholder="Search events…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 24 }}
      />

      {loading ? (
        <p style={{ color: 'var(--slate)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredEvents.map((e) => (
            <div key={e.id} style={styles.eventBlock}>
              <button onClick={() => toggleExpand(e.id)} style={styles.eventHeader}>
                <span>{e.title}</span>
                <span style={{ color: 'var(--slate)', fontSize: '0.82rem' }}>
                  {e.states?.name} {expandedId === e.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === e.id && (
                <div style={{ padding: '0 16px 16px' }}>
                  {!ticketTypesByEvent[e.id] ? (
                    <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>Loading ticket types…</p>
                  ) : ticketTypesByEvent[e.id].length === 0 ? (
                    <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>No ticket types for this event.</p>
                  ) : (
                    ticketTypesByEvent[e.id].map((t) => (
                      <div key={t.id} style={styles.ticketRow}>
                        <div>
                          <p style={{ fontWeight: 600 }}>{t.name}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>
                            {t.quantity_sold}/{t.quantity_total} sold
                            {t.original_price && t.original_price !== t.price && (
                              <span> · was {formatNaira(t.original_price)}</span>
                            )}
                          </p>
                        </div>

                        {editing === t.id ? (
                          <div style={styles.editBox}>
                            <input
                              type="number"
                              min="0"
                              value={draftPrice}
                              onChange={(ev) => setDraftPrice(ev.target.value)}
                              style={{ width: 110 }}
                              className="mono"
                            />
                            <input
                              placeholder="Note (optional)"
                              value={note}
                              onChange={(ev) => setNote(ev.target.value)}
                              style={{ width: 140 }}
                            />
                            <button className="btn btn-primary" disabled={saving} onClick={() => saveEdit(e.id, t.id)}>
                              {saving ? '…' : 'Save'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="mono" style={{ color: 'var(--amber)', fontWeight: 700 }}>
                              {formatNaira(t.price)}
                            </span>
                            <button className="btn btn-ghost" onClick={() => startEdit(t)}>Edit price</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          {filteredEvents.length === 0 && <p style={{ color: 'var(--slate)' }}>No events found.</p>}
        </div>
      )}
    </div>
  );
}

const styles = {
  eventBlock: {
    background: 'var(--ink-soft)',
    border: '1px solid var(--ink-line)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventHeader: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--paper)',
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 600,
    fontSize: '0.95rem',
    textAlign: 'left',
  },
  ticketRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid var(--ink-line)',
  },
  editBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
};
