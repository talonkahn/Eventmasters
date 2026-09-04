import { useEffect, useState, useRef } from 'react';
import { Events, TicketTypes, Geo } from '../../lib/apiClient';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const TABS = ['Events', 'Add Event', 'Pricing', 'Orders'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab,          setTab]          = useState('Events');
  const [events,       setEvents]       = useState([]);
  const [filter,       setFilter]       = useState('pending');
  const [loading,      setLoading]      = useState(true);
  const [rejectingId,  setRejectingId]  = useState(null);
  const [reason,       setReason]       = useState('');

  const loadEvents = () => {
    setLoading(true);
    Events.listAll(filter === 'all' ? undefined : filter)
      .then(setEvents).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { if (tab === 'Events') loadEvents(); }, [tab, filter]);

  const approve = async (id) => { await Events.approve(id); loadEvents(); };
  const reject  = async (id) => {
    if (!reason.trim()) return;
    await Events.reject(id, reason);
    setRejectingId(null); setReason(''); loadEvents();
  };
  const deleteEvent = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?\n\nThis will remove the event and all its ticket types. Orders and issued tickets are kept for records.`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadEvents();
  };

  const pendingCount = events.filter(e => e.status === 'pending').length;

  return (
    <div className="admin-wrap">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">samuelivere92@gmail.com · Full access</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={S.chip}>
            <span style={{ color: 'var(--amber)', fontWeight: 800 }}>{events.length}</span>
            <span style={{ color: 'var(--slate)', fontSize: '0.76rem' }}>events</span>
          </div>
          {pendingCount > 0 && (
            <div style={{ ...S.chip, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)' }}>
              <span style={{ color: 'var(--coral)', fontWeight: 800 }}>{pendingCount}</span>
              <span style={{ color: 'var(--coral)', fontSize: '0.76rem' }}>pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'Add Event' ? '+ Add Event' : t}
            {t === 'Events' && pendingCount > 0 && (
              <span style={{ background: 'var(--coral)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, borderRadius: 100, padding: '2px 6px', marginLeft: 6 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events tab */}
      {tab === 'Events' && (
        <div>
          <div className="admin-filter-row">
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button key={f} className={`admin-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {loading ? (
            <p style={{ color: 'var(--slate)', padding: '20px 0' }}>Loading…</p>
          ) : events.length === 0 ? (
            <p style={{ color: 'var(--slate)', padding: '40px 0', textAlign: 'center' }}>No events here.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(e => (
                <div key={e.id} className="admin-event-row">
                  {/* Top row: status + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${e.status}`}>{e.status}</span>
                    {e.is_featured && <span style={{ fontSize: '0.68rem', color: 'var(--amber)', fontWeight: 700 }}>⭐ Featured</span>}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', marginBottom: 4, color: '#fff', lineHeight: 1.3 }}>{e.title}</h3>
                  <p style={{ color: 'var(--slate)', fontSize: '0.8rem', marginBottom: 10 }}>
                    {e.states?.name} · {new Date(e.start_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  {e.status === 'rejected' && e.rejection_reason && (
                    <p style={{ color: 'var(--coral)', fontSize: '0.78rem', marginBottom: 10 }}>Rejected: {e.rejection_reason}</p>
                  )}
                  {/* Reject input */}
                  {rejectingId === e.id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      <input placeholder="Reason for rejection…" value={reason} onChange={ev => setReason(ev.target.value)}
                        style={{ background: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--paper)', fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--coral)', color: '#fff', border: 'none' }} onClick={() => reject(e.id)}>Confirm</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRejectingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {/* Action buttons */}
                  {rejectingId !== e.id && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {e.status === 'pending' && (
                        <button className="btn btn-green btn-sm" onClick={() => approve(e.id)}>✓ Approve</button>
                      )}
                      {e.status === 'pending' && (
                        <button className="btn btn-sm" style={{ background: 'transparent', border: '1.5px solid var(--coral)', color: 'var(--coral)' }} onClick={() => setRejectingId(e.id)}>✕ Reject</button>
                      )}
                      {e.status === 'approved' && (
                        <button className="btn btn-sm" style={{ background: 'transparent', border: '1.5px solid var(--line)', color: 'var(--slate)' }}
                          onClick={() => setRejectingId(e.id)}>✕ Reject</button>
                      )}
                      <button className="btn btn-sm"
                        style={{ background: 'transparent', border: '1.5px solid rgba(255,77,109,0.4)', color: 'var(--coral)' }}
                        onClick={() => deleteEvent(e.id, e.title)}>
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Add Event' && (
        <AddEventForm onSuccess={() => { setTab('Events'); setFilter('approved'); loadEvents(); }} />
      )}
      {tab === 'Pricing' && <PricingPanel />}
      {tab === 'Orders'  && <OrdersPanel />}
    </div>
  );
}

/* ── ADD EVENT FORM ── */
function AddEventForm({ onSuccess }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [states,     setStates]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [countryId,  setCountryId]  = useState(null);
  const [form,       setForm]       = useState({
    title: '', description: '', state_id: '', category_id: '',
    venue_name: '', address: '', start_at: '', end_at: '',
    banner_url: '', is_featured: false,
  });
  const [tickets,    setTickets]    = useState([{ name: 'Regular', price: '', quantity: '' }]);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Geo.countries().then(c => {
      if (c[0]) { setCountryId(c[0].id); Geo.statesByCountry(c[0].id).then(setStates); }
    });
    Geo.categories().then(setCategories);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Handle file picked from photo library
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    set('banner_url', ''); // clear URL input when file chosen
    setError('');
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    set('banner_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload file to Supabase Storage
  const uploadBanner = async (eventId) => {
    if (!bannerFile) return form.banner_url || null;
    setUploading(true);
    try {
      const ext  = bannerFile.name.split('.').pop();
      const path = `banners/${eventId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('event-banners')
        .upload(path, bannerFile, { upsert: true, contentType: bannerFile.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('event-banners').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const addTicket    = () => setTickets(t => [...t, { name: '', price: '', quantity: '' }]);
  const setTicket    = (i, k, v) => setTickets(t => t.map((r, ri) => ri === i ? { ...r, [k]: v } : r));
  const removeTicket = (i) => setTickets(t => t.filter((_, ri) => ri !== i));

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      + '-' + Math.random().toString(36).slice(2, 7);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.state_id || !form.start_at || !form.venue_name) {
      setError('Please fill in all required fields.'); return;
    }
    if (tickets.some(t => !t.name || t.price === '' || !t.quantity)) {
      setError('Fill in all ticket tier fields.'); return;
    }
    setSubmitting(true);
    try {
      // Create event first (need ID for banner upload)
      const { data: event, error: eErr } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          country_id:   countryId,
          state_id:     form.state_id,
          category_id:  form.category_id || null,
          title:        form.title,
          slug:         slugify(form.title),
          description:  form.description,
          venue_name:   form.venue_name,
          address:      form.address,
          banner_url:   null, // will update after upload
          start_at:     new Date(form.start_at).toISOString(),
          end_at:       form.end_at ? new Date(form.end_at).toISOString() : null,
          is_featured:  form.is_featured,
          status:       'approved',
        })
        .select()
        .single();
      if (eErr) throw eErr;

      // Upload banner if file selected
      const bannerUrl = await uploadBanner(event.id);
      if (bannerUrl) {
        await supabase.from('events').update({ banner_url: bannerUrl }).eq('id', event.id);
      }

      // Create ticket types
      const ticketRows = tickets.map(t => ({
        event_id:       event.id,
        name:           t.name,
        price:          Number(t.price),
        quantity_total: Number(t.quantity),
      }));
      const { error: tErr } = await supabase.from('ticket_types').insert(ticketRows);
      if (tErr) throw tErr;

      onSuccess();
    } catch (err) {
      setError(err.message || 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: 20 }}>
        Add New Event
      </h2>

      {/* Basic fields */}
      <div className="field"><label>Event title *</label><input value={form.title} onChange={e => set('title', e.target.value)} required /></div>
      <div className="field"><label>Description</label><textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></div>

      <div style={S.twoCol}>
        <div className="field">
          <label>State *</label>
          <select value={form.state_id} onChange={e => set('state_id', e.target.value)} required>
            <option value="">Select state</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Venue name *</label>
          <input value={form.venue_name} onChange={e => set('venue_name', e.target.value)} required />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="field">
          <label>Start date & time *</label>
          <input type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} required />
        </div>
        <div className="field">
          <label>End date & time</label>
          <input type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} />
        </div>
      </div>

      {/* Banner upload — photo library or URL */}
      <div className="field">
        <label>Event Banner</label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Preview */}
        {bannerPreview ? (
          <div style={{ marginBottom: 12 }}>
            {/* 16:9 aspect ratio container */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--ink-3)' }}>
              <img
                src={bannerPreview}
                alt="Banner preview"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Overlay with file info + actions */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(6,4,15,0.9), transparent)', padding: '28px 12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {bannerFile && (
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--paper)', fontWeight: 700, marginBottom: 1 }}>{bannerFile.name}</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--slate)' }}>
                      {(bannerFile.size / 1024).toFixed(0)}KB · {bannerFile.type.replace('image/', '').toUpperCase()}
                    </p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    Change
                  </button>
                  <button type="button" onClick={removeBanner}
                    style={{ background: 'rgba(255,77,109,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,77,109,0.4)', color: 'var(--coral)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
            {/* Recommended size note */}
            <p style={{ fontSize: '0.68rem', color: 'var(--slate)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ✓ Recommended: 1200×675px (16:9) · JPEG or PNG · Max 5MB
            </p>
          </div>
        ) : (
          /* Upload drop zone */
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed var(--line)', background: 'var(--ink-3)', borderRadius: 12, cursor: 'pointer', padding: '32px 20px', textAlign: 'center', transition: 'border-color 0.2s' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼</div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--paper)', marginBottom: 6 }}>
              Tap to upload banner
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate)', lineHeight: 1.6 }}>
              JPEG · PNG · WebP · Max 5MB<br />
              Best size: 1200×675px (16:9)
            </p>
          </div>
        )}

        {/* Or paste URL — only when no file */}
        {!bannerFile && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--slate)', marginBottom: 6, textAlign: 'center' }}>— or paste image URL —</p>
            <input
              value={form.banner_url}
              onChange={e => { set('banner_url', e.target.value); if (e.target.value) setBannerPreview(e.target.value); }}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        )}
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--amber)', fontSize: '0.82rem' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,179,0,0.3)', borderTopColor: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
            Uploading banner…
          </div>
        )}
      </div>

      {/* Featured checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input type="checkbox" id="featured" checked={form.is_featured}
          onChange={e => set('is_featured', e.target.checked)}
          style={{ width: 18, height: 18, accentColor: 'var(--amber)', cursor: 'pointer' }} />
        <label htmlFor="featured" style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
          ⭐ Feature this event on homepage
        </label>
      </div>

      {/* Ticket tiers */}
      <div style={S.ticketBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff' }}>Ticket Tiers</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addTicket}>+ Add tier</button>
        </div>
        {tickets.map((t, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={S.ticketRow}>
              <input placeholder="Tier name (e.g. Regular, VIP)" value={t.name}
                onChange={e => setTicket(i, 'name', e.target.value)}
                style={{ ...S.ticketInput, gridColumn: '1 / -1' }} />
              <input type="number" placeholder="Price (₦)" min="0" value={t.price}
                onChange={e => setTicket(i, 'price', e.target.value)}
                style={S.ticketInput} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" placeholder="Qty" min="1" value={t.quantity}
                  onChange={e => setTicket(i, 'quantity', e.target.value)}
                  style={{ ...S.ticketInput, flex: 1 }} />
                {tickets.length > 1 && (
                  <button type="button" onClick={() => removeTicket(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--coral)', fontSize: '1.3rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 10, padding: '12px 14px', color: 'var(--coral)', fontSize: '0.85rem', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '0.95rem', borderRadius: 12 }}
        disabled={submitting || uploading}>
        {submitting ? 'Publishing…' : uploading ? 'Uploading banner…' : 'Publish Event'}
      </button>
    </form>
  );
}

/* ── PRICING PANEL ── */
function PricingPanel() {
  const [events,         setEvents]         = useState([]);
  const [expanded,       setExpanded]       = useState(null);
  const [ticketsByEvent, setTicketsByEvent] = useState({});
  const [editingId,      setEditingId]      = useState(null);
  const [draftPrice,     setDraftPrice]     = useState('');
  const [note,           setNote]           = useState('');
  const [saving,         setSaving]         = useState(false);
  const [search,         setSearch]         = useState('');

  useEffect(() => {
    Events.listAll('approved').then(setEvents).catch(console.error);
  }, []);

  const toggle = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!ticketsByEvent[id]) {
      const types = await TicketTypes.listForEvent(id);
      setTicketsByEvent(p => ({ ...p, [id]: types }));
    }
  };

  const save = async (eventId, ttId) => {
    setSaving(true);
    try {
      await TicketTypes.adminSetPrice(ttId, Number(draftPrice), note);
      const refreshed = await TicketTypes.listForEvent(eventId);
      setTicketsByEvent(p => ({ ...p, [eventId]: refreshed }));
      setEditingId(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: 6 }}>Pricing Control</h2>
      <p style={{ color: 'var(--slate)', fontSize: '0.85rem', marginBottom: 16 }}>Override any ticket price. All changes are logged.</p>

      <input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '11px 14px', color: 'var(--paper)', fontSize: '0.9rem', outline: 'none', marginBottom: 14, fontFamily: 'var(--font-body)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(e => (
          <div key={e.id} style={{ background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => toggle(e.id)}
                style={{ flex: 1, background: 'none', border: 'none', color: 'var(--paper)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'var(--font-body)', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', textAlign: 'left' }}>{e.title}</span>
                <span style={{ color: 'var(--slate)', fontSize: '0.78rem', flexShrink: 0 }}>{expanded === e.id ? '▲' : '▼'}</span>
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(`Delete "${e.title}"?`)) return;
                  supabase.from('events').delete().eq('id', e.id)
                    .then(() => setEvents(ev => ev.filter(x => x.id !== e.id)));
                }}
                style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', padding: '14px 16px', fontSize: '1rem', flexShrink: 0 }}
                title="Delete event">
                🗑
              </button>
            </div>
            {expanded === e.id && (
              <div style={{ borderTop: '1px solid var(--line)', padding: '0 16px 14px' }}>
                {!ticketsByEvent[e.id] ? (
                  <p style={{ color: 'var(--slate)', fontSize: '0.82rem', padding: '12px 0' }}>Loading…</p>
                ) : ticketsByEvent[e.id].map(t => (
                  <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 2 }}>{t.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--slate)' }}>{t.quantity_sold}/{t.quantity_total} sold</p>
                      </div>
                      {editingId === t.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 8 }}>
                          <input type="number" value={draftPrice} onChange={ev => setDraftPrice(ev.target.value)}
                            placeholder="New price (₦)"
                            style={{ background: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                          <input placeholder="Note (e.g. early bird promo)" value={note} onChange={ev => setNote(ev.target.value)}
                            style={{ background: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--paper)', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => save(e.id, t.id)}>
                              {saving ? '…' : 'Save'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 700 }}>
                            ₦{Number(t.price).toLocaleString()}
                          </span>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setEditingId(t.id); setDraftPrice(String(t.price)); setNote(''); }}>
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--slate)', textAlign: 'center', padding: '40px 0' }}>No events found.</p>}
      </div>
    </div>
  );
}

/* ── ORDERS PANEL ── */
function OrdersPanel() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('orders')
      .select('*, events(title), order_items(quantity, unit_price)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setOrders(data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--slate)', padding: '20px 0' }}>Loading orders…</p>;

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.amount_total), 0);
  const paid = orders.filter(o => o.status === 'paid').length;

  return (
    <div>
      {/* Stats */}
      <div style={S.statsGrid}>
        {[
          { label: 'Total Revenue', value: '₦' + totalRevenue.toLocaleString('en-NG'), color: 'var(--green)' },
          { label: 'Paid Orders',   value: paid,          color: 'var(--amber)' },
          { label: 'All Orders',    value: orders.length, color: 'var(--slate)' },
        ].map(stat => (
          <div key={stat.label} style={S.statCard}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ color: 'var(--slate)', fontSize: '0.76rem', marginTop: 5 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.map(o => (
          <div key={o.id} className="admin-event-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.buyer_name}
              </p>
              <p style={{ color: 'var(--slate)', fontSize: '0.78rem', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.buyer_email}
              </p>
              <p style={{ color: 'var(--slate)', fontSize: '0.76rem' }}>
                {o.events?.title} · {new Date(o.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span className={`badge badge-${o.status === 'paid' ? 'approved' : o.status === 'failed' ? 'rejected' : 'pending'}`}>
                {o.status}
              </span>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 6, fontSize: '0.9rem', color: o.status === 'paid' ? 'var(--green)' : 'var(--slate)' }}>
                ₦{Number(o.amount_total).toLocaleString('en-NG')}
              </p>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p style={{ color: 'var(--slate)', padding: '40px 0', textAlign: 'center' }}>No orders yet.</p>
        )}
      </div>
    </div>
  );
}

const S = {
  chip:       { background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  twoCol:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' },
  uploadZone: { width: '100%', paddingTop: '56.25%', position: 'relative', border: '2px dashed var(--line)', background: 'var(--ink-3)', borderRadius: 12, cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color 0.2s', overflow: 'hidden' },
  ticketBox:  { background: 'var(--ink-3)', borderRadius: 12, padding: '16px', marginBottom: 20, border: '1px solid var(--line)' },
  ticketRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  ticketInput:{ background: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', color: 'var(--paper)', fontSize: '0.88rem', outline: 'none', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 },
  statCard:   { background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 12, padding: '16px 14px' },
};
