import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, QrCode01Icon, ArrowRight01Icon, CheckmarkCircle01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import { Events, TicketTypes, Geo, PromoCodes, ManualAttendees, Waitlist, Analytics } from '../../lib/apiClient';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const TABS = ['Events', 'Add Event', 'Attendees', 'Check-in', 'Promo Codes', 'Pricing', 'Analytics', 'Orders'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Events');
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

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
    if (!window.confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadEvents();
  };

  const pendingCount = events.filter(e => e.status === 'pending').length;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">HSPR Technologies · samuelivere92@gmail.com</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div style={{ background:'var(--purple-light)', border:'1px solid var(--purple-mid)', borderRadius:10, padding:'8px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, color:'var(--purple)', fontSize:'1.1rem', lineHeight:1 }}>{events.length}</span>
            <span style={{ fontSize:'0.68rem', color:'var(--purple)' }}>events</span>
          </div>
          {pendingCount > 0 && (
            <div style={{ background:'var(--coral-light)', border:'1px solid var(--coral)', borderRadius:10, padding:'8px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, color:'var(--coral)', fontSize:'1.1rem', lineHeight:1 }}>{pendingCount}</span>
              <span style={{ fontSize:'0.68rem', color:'var(--coral)' }}>pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {t === 'Events' && pendingCount > 0 && (
              <span style={{ background:'var(--coral)', color:'#fff', fontSize:'0.58rem', fontWeight:800, borderRadius:100, padding:'2px 6px', marginLeft:5 }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Events'      && <EventsTab events={events} loading={loading} filter={filter} setFilter={setFilter} approve={approve} reject={reject} deleteEvent={deleteEvent} rejectingId={rejectingId} setRejectingId={setRejectingId} reason={reason} setReason={setReason} />}
      {tab === 'Add Event'   && <AddEventForm onSuccess={() => { setTab('Events'); setFilter('approved'); loadEvents(); }} user={user} />}
      {tab === 'Attendees'   && <AttendeesTab events={events} />}
      {tab === 'Check-in'    && <CheckInTab events={events} />}
      {tab === 'Promo Codes' && <PromoCodesTab events={events} />}
      {tab === 'Pricing'     && <PricingPanel />}
      {tab === 'Analytics'   && <AnalyticsTab events={events} />}
      {tab === 'Orders'      && <OrdersPanel />}
    </div>
  );
}

/* ══════════════════════════════════════
   EVENTS TAB
══════════════════════════════════════ */
function EventsTab({ events, loading, filter, setFilter, approve, reject, deleteEvent, rejectingId, setRejectingId, reason, setReason }) {
  return (
    <div>
      <div className="admin-filter-row">
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} className={`admin-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <p style={{ color:'var(--slate)', padding:'20px 0' }}>Loading…</p>
      : events.length === 0 ? <p style={{ color:'var(--slate)', padding:'40px 0', textAlign:'center' }}>No events here.</p>
      : events.map(e => (
        <div key={e.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14, padding:'16px', marginBottom:10, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                <span className={`badge badge-${e.status}`}>{e.status}</span>
                {e.is_featured && <span style={{ fontSize:'0.68rem', color:'var(--amber)', fontWeight:700 }}>⭐ Featured</span>}
              </div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.98rem', color:'var(--ink)', marginBottom:4, lineHeight:1.3 }}>{e.title}</h3>
              <p style={{ color:'var(--slate)', fontSize:'0.8rem', marginBottom:rejectingId === e.id ? 10 : 0 }}>
                {e.states?.name} · {new Date(e.start_at).toLocaleDateString('en-US',{dateStyle:'medium'})}
              </p>
            </div>
          </div>

          {rejectingId === e.id && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
              <input placeholder="Reason for rejection…" value={reason} onChange={ev => setReason(ev.target.value)}
                style={{ background:'var(--bg)', border:'1.5px solid var(--line-2)', borderRadius:9, padding:'10px 12px', color:'var(--ink)', fontSize:'0.88rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-coral btn-sm" onClick={() => reject(e.id)}>Confirm Reject</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setRejectingId(null)}>Cancel</button>
              </div>
            </div>
          )}

          {rejectingId !== e.id && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
              {e.status === 'pending'  && <button className="btn btn-green btn-sm" onClick={() => approve(e.id)}>✓ Approve</button>}
              {(e.status === 'pending' || e.status === 'approved') && (
                <button className="btn btn-sm" style={{ background:'transparent', border:'1.5px solid var(--coral)', color:'var(--coral)' }} onClick={() => setRejectingId(e.id)}>✕ Reject</button>
              )}
              <button className="btn btn-sm" style={{ background:'transparent', border:'1.5px solid var(--line-2)', color:'var(--slate)' }} onClick={() => deleteEvent(e.id, e.title)}>🗑 Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   ADD EVENT FORM
══════════════════════════════════════ */
function AddEventForm({ onSuccess, user }) {
  const fileInputRef = useRef(null);
  const [states,     setStates]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [countryId,  setCountryId]  = useState(null);
  const [form,       setForm]       = useState({ title:'', description:'', state_id:'', category_id:'', venue_name:'', address:'', start_at:'', end_at:'', banner_url:'', is_featured:false });
  const [tickets,    setTickets]    = useState([{ name:'Regular', price:'', quantity:'' }]);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Geo.countries().then(c => { if (c[0]) { setCountryId(c[0].id); Geo.statesByCountry(c[0].id).then(setStates); } });
    Geo.categories().then(setCategories);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); set('banner_url', ''); setError('');
  };
  const removeBanner = () => { setBannerFile(null); setBannerPreview(''); set('banner_url', ''); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const uploadBanner = async (eventId) => {
    if (!bannerFile) return form.banner_url || null;
    setUploading(true);
    try {
      const ext = bannerFile.name.split('.').pop();
      const path = `banners/${eventId}.${ext}`;
      const { error: upErr } = await supabase.storage.from('event-banners').upload(path, bannerFile, { upsert:true, contentType:bannerFile.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('event-banners').getPublicUrl(path);
      return data.publicUrl;
    } finally { setUploading(false); }
  };
  const addTicket    = () => setTickets(t => [...t, { name:'', price:'', quantity:'' }]);
  const setTicket    = (i, k, v) => setTickets(t => t.map((r, ri) => ri === i ? { ...r, [k]: v } : r));
  const removeTicket = (i) => setTickets(t => t.filter((_, ri) => ri !== i));
  function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 7); }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.title || !form.state_id || !form.start_at || !form.venue_name) { setError('Fill in all required fields.'); return; }
    if (tickets.some(t => !t.name || t.price === '' || !t.quantity)) { setError('Fill in all ticket tier fields.'); return; }
    setSubmitting(true);
    try {
      const { data: event, error: eErr } = await supabase.from('events').insert({ organizer_id:user.id, country_id:countryId, state_id:form.state_id, category_id:form.category_id||null, title:form.title, slug:slugify(form.title), description:form.description, venue_name:form.venue_name, address:form.address, banner_url:null, start_at:new Date(form.start_at).toISOString(), end_at:form.end_at?new Date(form.end_at).toISOString():null, is_featured:form.is_featured, status:'approved' }).select().single();
      if (eErr) throw eErr;
      const bannerUrl = await uploadBanner(event.id);
      if (bannerUrl) await supabase.from('events').update({ banner_url:bannerUrl }).eq('id', event.id);
      await supabase.from('ticket_types').insert(tickets.map(t => ({ event_id:event.id, name:t.name, price:Number(t.price), quantity_total:Number(t.quantity) })));
      onSuccess();
    } catch (err) { setError(err.message || 'Could not create event.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth:680 }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)', marginBottom:20 }}>Add New Event</h2>
      <div className="field"><label>Event title *</label><input value={form.title} onChange={e => set('title', e.target.value)} required /></div>
      <div className="field"><label>Description</label><textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
        <div className="field"><label>State *</label><select value={form.state_id} onChange={e => set('state_id', e.target.value)} required><option value="">Select state</option>{states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Category</label><select value={form.category_id} onChange={e => set('category_id', e.target.value)}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label>Venue name *</label><input value={form.venue_name} onChange={e => set('venue_name', e.target.value)} required /></div>
        <div className="field"><label>Address</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
        <div className="field"><label>Start date & time *</label><input type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} required /></div>
        <div className="field"><label>End date & time</label><input type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} /></div>
      </div>

      {/* Banner upload */}
      <div className="field">
        <label>Event Banner</label>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display:'none' }} onChange={handleFileChange} />
        {bannerPreview ? (
          <div style={{ marginBottom:10 }}>
            <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', borderRadius:12, overflow:'hidden', border:'1.5px solid var(--line)' }}>
              <img src={bannerPreview} alt="Banner preview" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding:'20px 12px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                {bannerFile && <p style={{ fontSize:'0.7rem', color:'#fff', fontWeight:700 }}>{bannerFile.name} · {(bannerFile.size/1024).toFixed(0)}KB</p>}
                <div style={{ display:'flex', gap:6 }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>Change</button>
                  <button type="button" onClick={removeBanner} style={{ background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', color:'#fff', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>Remove</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} style={{ border:'2px dashed var(--line-2)', background:'var(--bg)', borderRadius:12, cursor:'pointer', padding:'32px 20px', textAlign:'center', transition:'border-color 0.2s' }}>
            <p style={{ fontSize:'1.8rem', marginBottom:8 }}>🖼</p>
            <p style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--ink)', marginBottom:5 }}>Tap to upload banner</p>
            <p style={{ fontSize:'0.75rem', color:'var(--slate)', lineHeight:1.6 }}>JPEG · PNG · WebP · Max 5MB<br />Best size: 1200×675px (16:9)</p>
          </div>
        )}
        {!bannerFile && (
          <div style={{ marginTop:10 }}>
            <p style={{ fontSize:'0.7rem', color:'var(--slate)', marginBottom:6, textAlign:'center' }}>— or paste image URL —</p>
            <input value={form.banner_url} onChange={e => { set('banner_url', e.target.value); if (e.target.value) setBannerPreview(e.target.value); }} placeholder="https://example.com/banner.jpg" />
          </div>
        )}
        {uploading && <p style={{ color:'var(--purple)', fontSize:'0.82rem', marginTop:6 }}>⏳ Uploading…</p>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} style={{ width:18, height:18, accentColor:'var(--purple)', cursor:'pointer' }} />
        <label htmlFor="featured" style={{ fontWeight:600, cursor:'pointer', fontSize:'0.88rem' }}>⭐ Feature on homepage</label>
      </div>

      {/* Ticket tiers */}
      <div style={{ background:'var(--purple-light)', borderRadius:14, padding:'16px', marginBottom:20, border:'1px solid var(--purple-mid)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:'var(--purple)' }}>Ticket Tiers</h3>
          <button type="button" className="btn btn-light btn-sm" onClick={addTicket}>+ Add tier</button>
        </div>
        {tickets.map((t, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 10px', marginBottom:10 }}>
            <input placeholder="Tier name (e.g. VIP)" value={t.name} onChange={e => setTicket(i,'name',e.target.value)} style={{ gridColumn:'1/-1', background:'var(--surface)', border:'1.5px solid var(--purple-mid)', borderRadius:9, padding:'10px 12px', color:'var(--ink)', fontSize:'0.88rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
            <input type="number" placeholder="Price (₦)" min="0" value={t.price} onChange={e => setTicket(i,'price',e.target.value)} style={{ background:'var(--surface)', border:'1.5px solid var(--purple-mid)', borderRadius:9, padding:'10px 12px', color:'var(--ink)', fontSize:'0.88rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="number" placeholder="Qty" min="1" value={t.quantity} onChange={e => setTicket(i,'quantity',e.target.value)} style={{ flex:1, background:'var(--surface)', border:'1.5px solid var(--purple-mid)', borderRadius:9, padding:'10px 12px', color:'var(--ink)', fontSize:'0.88rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
              {tickets.length > 1 && <button type="button" onClick={() => removeTicket(i)} style={{ background:'none', border:'none', color:'var(--coral)', fontSize:'1.4rem', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>}
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ background:'var(--coral-light)', border:'1px solid var(--coral)', borderRadius:10, padding:'12px 14px', color:'#991B1B', fontSize:'0.85rem', marginBottom:16 }}>⚠ {error}</div>}
      <button className="btn btn-primary" style={{ width:'100%', padding:'14px', fontSize:'0.95rem', borderRadius:12 }} disabled={submitting || uploading}>
        {submitting ? 'Publishing…' : uploading ? 'Uploading banner…' : 'Publish Event'}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════
   ATTENDEES TAB — manual add + view
══════════════════════════════════════ */
function AttendeesTab({ events }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendees, setAttendees]         = useState([]);
  const [ticketTypes, setTicketTypes]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [form, setForm]                   = useState({ full_name:'', email:'', phone:'', ticket_type_id:'', quantity:1, payment_method:'cash', notes:'' });
  const [adding, setAdding]               = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [error, setError]                 = useState('');

  const loadAttendees = async (evId) => {
    setLoading(true);
    const [att, tt] = await Promise.all([ManualAttendees.listForEvent(evId), TicketTypes.listForEvent(evId)]);
    setAttendees(att); setTicketTypes(tt); setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setError('');
    if (!form.full_name.trim()) { setError('Name is required.'); return; }
    setAdding(true);
    try {
      await ManualAttendees.create({ ...form, event_id: selectedEvent, quantity: Number(form.quantity) });
      setForm({ full_name:'', email:'', phone:'', ticket_type_id:'', quantity:1, payment_method:'cash', notes:'' });
      setShowForm(false);
      loadAttendees(selectedEvent);
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleCheckIn = async (id) => {
    await ManualAttendees.checkIn(id);
    loadAttendees(selectedEvent);
  };

  const exportCSV = () => {
    if (!attendees.length) return;
    const rows = [['Name','Email','Phone','Ticket','Qty','Payment','Checked In','Code']];
    attendees.forEach(a => rows.push([a.full_name, a.email||'', a.phone||'', a.ticket_types?.name||'', a.quantity, a.payment_method, a.checked_in?'Yes':'No', a.ticket_code]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='attendees.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const approvedEvents = events.filter(e => e.status === 'approved');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)' }}>Attendees</h2>
        <div style={{ display:'flex', gap:8 }}>
          {selectedEvent && <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export CSV</button>}
          {selectedEvent && <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>+ Add Manual Attendee</button>}
        </div>
      </div>

      <div className="field">
        <label>Select Event</label>
        <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); if (e.target.value) loadAttendees(e.target.value); else setAttendees([]); }}>
          <option value="">— choose event —</option>
          {approvedEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {showForm && selectedEvent && (
        <form onSubmit={handleAdd} style={{ background:'var(--purple-light)', border:'1px solid var(--purple-mid)', borderRadius:14, padding:18, marginBottom:20 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:'var(--purple)', marginBottom:14 }}>Add Attendee (offline payment)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
            <div className="field"><label>Full name *</label><input value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} required /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
            <div className="field">
              <label>Ticket type</label>
              <select value={form.ticket_type_id} onChange={e => setForm(f=>({...f,ticket_type_id:e.target.value}))}>
                <option value="">— optional —</option>
                {ticketTypes.map(t => <option key={t.id} value={t.id}>{t.name} — ₦{Number(t.price).toLocaleString()}</option>)}
              </select>
            </div>
            <div className="field"><label>Quantity</label><input type="number" min="1" max="20" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} /></div>
            <div className="field">
              <label>Payment method</label>
              <select value={form.payment_method} onChange={e => setForm(f=>({...f,payment_method:e.target.value}))}>
                {['cash','bank_transfer','cheque','complimentary','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Notes</label><input value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any notes…" /></div>
          {error && <p style={{ color:'var(--coral)', fontSize:'0.82rem', marginBottom:10 }}>{error}</p>}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary btn-sm" disabled={adding}>{adding?'Adding…':'Add Attendee'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color:'var(--slate)', padding:'20px 0' }}>Loading…</p>
      : !selectedEvent ? <p style={{ color:'var(--slate)', padding:'40px 0', textAlign:'center' }}>Select an event to view attendees.</p>
      : attendees.length === 0 ? <p style={{ color:'var(--slate)', padding:'40px 0', textAlign:'center' }}>No manual attendees yet.</p>
      : attendees.map(a => (
        <div key={a.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 16px', marginBottom:10, boxShadow:'var(--shadow-sm)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--ink)', marginBottom:3 }}>{a.full_name}</p>
            <p style={{ fontSize:'0.76rem', color:'var(--slate)', marginBottom:2 }}>{a.email || '—'} · {a.phone || '—'}</p>
            <p style={{ fontSize:'0.72rem', color:'var(--slate)' }}>{a.ticket_types?.name || 'No ticket type'} · {a.quantity} ticket{a.quantity>1?'s':''} · {a.payment_method.replace('_',' ')}</p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--purple)', marginTop:3, letterSpacing:'0.06em' }}>{a.ticket_code}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
            {a.checked_in
              ? <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--green)', background:'var(--green-light)', padding:'4px 10px', borderRadius:100 }}>✓ Checked in</span>
              : <button className="btn btn-light btn-sm" onClick={() => handleCheckIn(a.id)}>Check in</button>
            }
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   CHECK-IN TAB — QR scanner
══════════════════════════════════════ */
function CheckInTab({ events }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanInput, setScanInput]         = useState('');
  const [result, setResult]               = useState(null);
  const [scanning, setScanning]           = useState(false);
  const [history, setHistory]             = useState([]);
  const inputRef = useRef(null);

  const approvedEvents = events.filter(e => e.status === 'approved');

  const doScan = async (code) => {
    if (!code.trim() || !selectedEvent) return;
    setScanning(true); setResult(null);
    try {
      const res = await supabase.rpc('check_in_ticket', { p_ticket_code: code.trim().toUpperCase(), p_event_id: selectedEvent });
      const data = res.data;
      setResult(data);
      if (data?.success) {
        setHistory(h => [{ code: code.trim().toUpperCase(), time: new Date().toLocaleTimeString(), success: true }, ...h.slice(0, 19)]);
      } else {
        setHistory(h => [{ code: code.trim().toUpperCase(), time: new Date().toLocaleTimeString(), success: false, error: data?.error }, ...h.slice(0, 19)]);
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setScanning(false);
      setScanInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)', marginBottom:6 }}>Check-in Scanner</h2>
      <p style={{ color:'var(--slate)', fontSize:'0.85rem', marginBottom:20 }}>Scan or type ticket QR codes to check in attendees.</p>

      <div className="field">
        <label>Select Event</label>
        <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); setResult(null); setHistory([]); }}>
          <option value="">— choose event —</option>
          {approvedEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* Scan input */}
          <div style={{ background:'var(--purple-light)', border:'2px solid var(--purple-mid)', borderRadius:16, padding:20, marginBottom:16, textAlign:'center' }}>
            <HugeiconsIcon icon={QrCode01Icon} size={40} color="var(--purple)" />
            <p style={{ fontWeight:700, marginTop:10, marginBottom:14, color:'var(--purple)', fontFamily:'var(--font-display)', fontSize:'1rem' }}>Scan or type ticket code</p>
            <div style={{ display:'flex', gap:8, maxWidth:400, margin:'0 auto' }}>
              <input
                ref={inputRef}
                value={scanInput}
                onChange={e => setScanInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && doScan(scanInput)}
                placeholder="EM-XXXXXXXX"
                autoFocus
                style={{ flex:1, background:'var(--surface)', border:'1.5px solid var(--purple-mid)', borderRadius:10, padding:'12px 14px', color:'var(--ink)', fontFamily:'var(--font-mono)', fontSize:'1rem', outline:'none', letterSpacing:'0.05em' }}
              />
              <button className="btn btn-primary" onClick={() => doScan(scanInput)} disabled={scanning || !scanInput.trim()}>
                {scanning ? '…' : 'Check In'}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ borderRadius:14, padding:16, marginBottom:16, textAlign:'center', background: result.success ? 'var(--green-light)' : 'var(--coral-light)', border: `2px solid ${result.success ? 'var(--green)' : 'var(--coral)'}` }}>
              <p style={{ fontSize:'2.5rem', marginBottom:6 }}>{result.success ? '✅' : '❌'}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontWeight:800, color: result.success ? '#065F46' : '#991B1B' }}>
                {result.success ? 'Checked In!' : result.error || 'Invalid ticket'}
              </p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <p style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Recent scans</p>
              {history.map((h, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:10, marginBottom:8, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:'1.1rem' }}>{h.success ? '✅' : '❌'}</span>
                    <div>
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', fontWeight:700, color:'var(--ink)', letterSpacing:'0.06em' }}>{h.code}</p>
                      {!h.success && <p style={{ fontSize:'0.72rem', color:'var(--coral)' }}>{h.error}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'var(--slate)' }}>{h.time}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PROMO CODES TAB
══════════════════════════════════════ */
function PromoCodesTab({ events }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [codes, setCodes]                 = useState([]);
  const [loading, setLoading]             = useState(false);
  const [form, setForm]                   = useState({ code:'', discount_type:'percent', discount_value:'', max_uses:'', expires_at:'' });
  const [adding, setAdding]               = useState(false);
  const [error, setError]                 = useState('');

  const approvedEvents = events.filter(e => e.status === 'approved');

  const loadCodes = async (evId) => {
    setLoading(true);
    const data = await PromoCodes.listForEvent(evId);
    setCodes(data); setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setError('');
    if (!form.code.trim() || !form.discount_value) { setError('Code and discount value required.'); return; }
    setAdding(true);
    try {
      await PromoCodes.create({
        event_id: selectedEvent || null,
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      setForm({ code:'', discount_type:'percent', discount_value:'', max_uses:'', expires_at:'' });
      if (selectedEvent) loadCodes(selectedEvent);
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const toggleCode = async (id, is_active) => {
    await PromoCodes.toggle(id, !is_active);
    if (selectedEvent) loadCodes(selectedEvent);
  };

  const deleteCode = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    await PromoCodes.delete(id);
    if (selectedEvent) loadCodes(selectedEvent);
  };

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)', marginBottom:6 }}>Promo Codes</h2>
      <p style={{ color:'var(--slate)', fontSize:'0.85rem', marginBottom:20 }}>Create discount codes for buyers to use at checkout.</p>

      {/* Create form */}
      <form onSubmit={handleAdd} style={{ background:'var(--purple-light)', border:'1px solid var(--purple-mid)', borderRadius:14, padding:18, marginBottom:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:'var(--purple)', marginBottom:14 }}>Create New Promo Code</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
          <div className="field">
            <label>Code *</label>
            <input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="SAVE20" style={{ fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }} required />
          </div>
          <div className="field">
            <label>Event (optional — blank = all events)</label>
            <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); if (e.target.value) loadCodes(e.target.value); }}>
              <option value="">All events</option>
              {approvedEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Discount type *</label>
            <select value={form.discount_type} onChange={e => setForm(f=>({...f,discount_type:e.target.value}))}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat amount (₦)</option>
            </select>
          </div>
          <div className="field">
            <label>Discount value * {form.discount_type === 'percent' ? '(%)' : '(₦)'}</label>
            <input type="number" min="1" max={form.discount_type==='percent'?100:undefined} value={form.discount_value} onChange={e => setForm(f=>({...f,discount_value:e.target.value}))} required />
          </div>
          <div className="field">
            <label>Max uses (blank = unlimited)</label>
            <input type="number" min="1" value={form.max_uses} onChange={e => setForm(f=>({...f,max_uses:e.target.value}))} placeholder="e.g. 100" />
          </div>
          <div className="field">
            <label>Expires (blank = never)</label>
            <input type="datetime-local" value={form.expires_at} onChange={e => setForm(f=>({...f,expires_at:e.target.value}))} />
          </div>
        </div>
        {error && <p style={{ color:'var(--coral)', fontSize:'0.82rem', marginBottom:10 }}>{error}</p>}
        <button className="btn btn-primary btn-sm" disabled={adding}>{adding ? 'Creating…' : 'Create Promo Code'}</button>
      </form>

      {/* Codes list */}
      {loading ? <p style={{ color:'var(--slate)' }}>Loading…</p>
      : codes.length === 0 ? <p style={{ color:'var(--slate)', textAlign:'center', padding:'30px 0' }}>{selectedEvent ? 'No promo codes for this event.' : 'Select an event to view its codes.'}</p>
      : codes.map(c => (
        <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 16px', marginBottom:10, boxShadow:'var(--shadow-sm)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div>
            <p style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:'1rem', color:'var(--purple)', letterSpacing:'0.08em', marginBottom:4 }}>{c.code}</p>
            <p style={{ fontSize:'0.78rem', color:'var(--slate)' }}>
              {c.discount_type === 'percent' ? `${c.discount_value}% off` : `₦${Number(c.discount_value).toLocaleString()} off`}
              {c.max_uses ? ` · ${c.uses}/${c.max_uses} used` : ` · ${c.uses} used`}
              {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className={`btn btn-sm ${c.is_active ? 'btn-ghost' : 'btn-green'}`} onClick={() => toggleCode(c.id, c.is_active)}>
              {c.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button className="btn btn-sm" style={{ background:'transparent', border:'1.5px solid var(--coral)', color:'var(--coral)' }} onClick={() => deleteCode(c.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   ANALYTICS TAB
══════════════════════════════════════ */
function AnalyticsTab({ events }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(false);

  const approvedEvents = events.filter(e => e.status === 'approved');

  const load = async (evId) => {
    setLoading(true); setData(null);
    try {
      const [orders, ticketTypes] = await Promise.all([
        supabase.from('orders').select('amount_total, created_at, status').eq('event_id', evId),
        supabase.from('ticket_types').select('*, order_items(quantity)').eq('event_id', evId),
      ]);
      const paidOrders   = (orders.data||[]).filter(o => o.status === 'paid');
      const totalRevenue = paidOrders.reduce((s,o) => s + Number(o.amount_total), 0);
      const totalOrders  = paidOrders.length;

      // Daily revenue last 14 days
      const daily = {};
      paidOrders.forEach(o => {
        const day = new Date(o.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
        daily[day] = (daily[day] || 0) + Number(o.amount_total);
      });

      setData({ totalRevenue, totalOrders, ticketTypes: ticketTypes.data||[], daily });
    } finally { setLoading(false); }
  };

  const maxRevenue = data ? Math.max(...Object.values(data.daily), 1) : 1;

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)', marginBottom:6 }}>Analytics</h2>
      <p style={{ color:'var(--slate)', fontSize:'0.85rem', marginBottom:20 }}>Revenue and ticket sales for each event.</p>

      <div className="field">
        <label>Select Event</label>
        <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); if (e.target.value) load(e.target.value); else setData(null); }}>
          <option value="">— choose event —</option>
          {approvedEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {loading && <p style={{ color:'var(--slate)' }}>Loading…</p>}

      {data && (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, marginBottom:24 }}>
            {[
              { label:'Total Revenue', value:'₦'+data.totalRevenue.toLocaleString('en-NG'), color:'var(--purple)' },
              { label:'Paid Orders',   value:data.totalOrders,                               color:'var(--green)'  },
              { label:'Ticket Types',  value:data.ticketTypes.length,                        color:'var(--amber)'  },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14, padding:'16px', boxShadow:'var(--shadow-sm)' }}>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</p>
                <p style={{ color:'var(--slate)', fontSize:'0.76rem', marginTop:6 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Ticket breakdown */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:16, padding:18, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Tickets by tier</p>
            {data.ticketTypes.map(t => {
              const sold = t.quantity_sold || 0;
              const pct  = t.quantity_total ? Math.round(sold / t.quantity_total * 100) : 0;
              return (
                <div key={t.id} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--ink)' }}>{t.name}</span>
                    <span style={{ fontSize:'0.82rem', color:'var(--slate)' }}>{sold} / {t.quantity_total} sold ({pct}%)</span>
                  </div>
                  <div style={{ height:8, background:'var(--line)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'var(--grad-purple)', borderRadius:4, transition:'width 0.6s ease' }} />
                  </div>
                  <p style={{ fontSize:'0.72rem', color:'var(--slate)', marginTop:3 }}>₦{Number(t.price).toLocaleString()} per ticket · ₦{(sold * Number(t.price)).toLocaleString()} revenue</p>
                </div>
              );
            })}
          </div>

          {/* Daily revenue chart */}
          {Object.keys(data.daily).length > 0 && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:16, padding:18, boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>Daily Revenue</p>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, overflowX:'auto', paddingBottom:4 }}>
                {Object.entries(data.daily).sort(([a],[b]) => new Date(a)-new Date(b)).map(([day, rev]) => (
                  <div key={day} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, flex:1, minWidth:36 }}>
                    <div title={`₦${rev.toLocaleString()}`} style={{ width:'100%', background:'var(--grad-purple)', borderRadius:'4px 4px 0 0', height:`${Math.max(4, (rev/maxRevenue)*100)}px`, transition:'height 0.5s ease', cursor:'pointer' }} />
                    <span style={{ fontSize:'0.6rem', color:'var(--slate)', whiteSpace:'nowrap' }}>{day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PRICING PANEL
══════════════════════════════════════ */
function PricingPanel() {
  const [events,         setEvents]         = useState([]);
  const [expanded,       setExpanded]       = useState(null);
  const [ticketsByEvent, setTicketsByEvent] = useState({});
  const [editingId,      setEditingId]      = useState(null);
  const [draftPrice,     setDraftPrice]     = useState('');
  const [note,           setNote]           = useState('');
  const [saving,         setSaving]         = useState(false);
  const [search,         setSearch]         = useState('');

  useEffect(() => { Events.listAll('approved').then(setEvents).catch(console.error); }, []);

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
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--ink)', marginBottom:6 }}>Pricing Control</h2>
      <p style={{ color:'var(--slate)', fontSize:'0.85rem', marginBottom:16 }}>Override ticket prices. All changes are logged.</p>
      <input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width:'100%', boxSizing:'border-box', background:'var(--surface)', border:'1.5px solid var(--line-2)', borderRadius:11, padding:'11px 14px', color:'var(--ink)', fontSize:'0.9rem', outline:'none', marginBottom:14 }} />
      {filtered.map(e => (
        <div key={e.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden', marginBottom:10, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <button onClick={() => toggle(e.id)} style={{ flex:1, background:'none', border:'none', color:'var(--ink)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', fontFamily:'var(--font-body)', gap:8 }}>
              <span style={{ fontWeight:700, fontSize:'0.88rem', textAlign:'left' }}>{e.title}</span>
              <span style={{ color:'var(--slate)', fontSize:'0.78rem', flexShrink:0 }}>{expanded === e.id ? '▲' : '▼'}</span>
            </button>
            <button onClick={() => { if (!window.confirm(`Delete "${e.title}"?`)) return; supabase.from('events').delete().eq('id', e.id).then(() => setEvents(ev => ev.filter(x => x.id !== e.id))); }}
              style={{ background:'none', border:'none', color:'var(--coral)', cursor:'pointer', padding:'14px 16px', fontSize:'1rem', flexShrink:0 }} title="Delete event">🗑</button>
          </div>
          {expanded === e.id && (
            <div style={{ borderTop:'1px solid var(--line)', padding:'0 16px 14px' }}>
              {!ticketsByEvent[e.id] ? <p style={{ color:'var(--slate)', fontSize:'0.82rem', padding:'12px 0' }}>Loading…</p>
              : ticketsByEvent[e.id].map(t => (
                <div key={t.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--ink)', marginBottom:2 }}>{t.name}</p>
                      <p style={{ fontSize:'0.72rem', color:'var(--slate)' }}>{t.quantity_sold}/{t.quantity_total} sold</p>
                    </div>
                    {editingId === t.id ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', marginTop:8 }}>
                        <input type="number" value={draftPrice} onChange={ev => setDraftPrice(ev.target.value)} placeholder="New price (₦)"
                          style={{ background:'var(--purple-light)', border:'1.5px solid var(--purple-mid)', borderRadius:9, padding:'10px 12px', color:'var(--purple)', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.9rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
                        <input placeholder="Note (e.g. early bird)" value={note} onChange={ev => setNote(ev.target.value)}
                          style={{ background:'var(--bg)', border:'1.5px solid var(--line-2)', borderRadius:9, padding:'10px 12px', color:'var(--ink)', fontSize:'0.82rem', outline:'none', width:'100%', boxSizing:'border-box' }} />
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => save(e.id, t.id)}>{saving ? '…' : 'Save'}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontFamily:'var(--font-mono)', color:'var(--purple)', fontWeight:700 }}>₦{Number(t.price).toLocaleString()}</span>
                        <button className="btn btn-light btn-sm" onClick={() => { setEditingId(t.id); setDraftPrice(String(t.price)); setNote(''); }}>Edit</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   ORDERS PANEL
══════════════════════════════════════ */
function OrdersPanel() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    supabase.from('orders').select('*, events(title), order_items(quantity, unit_price)')
      .order('created_at', { ascending:false }).limit(200)
      .then(({ data }) => setOrders(data||[])).finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s,o) => s + Number(o.amount_total), 0);
  const paidCount    = orders.filter(o => o.status === 'paid').length;
  const filtered     = search ? orders.filter(o => o.buyer_name?.toLowerCase().includes(search.toLowerCase()) || o.buyer_email?.toLowerCase().includes(search.toLowerCase())) : orders;

  const exportCSV = () => {
    const rows = [['Name','Email','Event','Amount','Status','Date']];
    orders.filter(o=>o.status==='paid').forEach(o => rows.push([o.buyer_name||'',o.buyer_email||'',o.events?.title||'','₦'+Number(o.amount_total).toLocaleString(),o.status,new Date(o.created_at).toLocaleDateString()]));
    const csv  = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='orders.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Revenue', value:'₦'+totalRevenue.toLocaleString('en-NG'), color:'var(--purple)' },
          { label:'Paid Orders',   value:paidCount,                                 color:'var(--green)'  },
          { label:'All Orders',    value:orders.length,                             color:'var(--slate)'  },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14, padding:'16px', boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ color:'var(--slate)', fontSize:'0.76rem', marginTop:6 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, background:'var(--surface)', border:'1.5px solid var(--line-2)', borderRadius:11, padding:'10px 14px', color:'var(--ink)', fontSize:'0.88rem', outline:'none' }} />
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {loading ? <p style={{ color:'var(--slate)' }}>Loading…</p>
      : filtered.map(o => (
        <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 16px', marginBottom:10, boxShadow:'var(--shadow-sm)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--ink)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.buyer_name}</p>
            <p style={{ color:'var(--slate)', fontSize:'0.78rem', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.buyer_email}</p>
            <p style={{ color:'var(--slate)', fontSize:'0.76rem' }}>{o.events?.title} · {new Date(o.created_at).toLocaleDateString('en-US',{dateStyle:'medium'})}</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <span className={`badge badge-${o.status==='paid'?'approved':o.status==='failed'?'rejected':'pending'}`}>{o.status}</span>
            <p style={{ fontFamily:'var(--font-mono)', fontWeight:700, marginTop:6, fontSize:'0.9rem', color:o.status==='paid'?'var(--purple)':'var(--slate)' }}>₦{Number(o.amount_total).toLocaleString('en-NG')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
