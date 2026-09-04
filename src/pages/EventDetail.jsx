import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar01Icon, Location01Icon, Ticket01Icon, ArrowLeft01Icon,
  WhatsappIcon, Shield01Icon,
} from '@hugeicons/core-free-icons';
import { Events } from '../lib/apiClient';

function fmt(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }

const CAT_STYLES = {
  'concert':             { bg: 'rgba(168,85,247,0.15)', color: '#C084FC', iconBg: 'rgba(168,85,247,0.12)' },
  'comedy-show':         { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D', iconBg: 'rgba(245,158,11,0.12)' },
  'festival':            { bg: 'rgba(16,185,129,0.15)', color: '#6EE7B7', iconBg: 'rgba(16,185,129,0.12)' },
  'party':               { bg: 'rgba(236,72,153,0.15)', color: '#F9A8D4', iconBg: 'rgba(236,72,153,0.12)' },
  'conference-workshop': { bg: 'rgba(56,189,248,0.15)', color: '#7DD3FC', iconBg: 'rgba(56,189,248,0.12)' },
  'theatre':             { bg: 'rgba(192,38,211,0.15)', color: '#E879F9', iconBg: 'rgba(192,38,211,0.12)' },
  'religious':           { bg: 'rgba(252,211,77,0.12)', color: '#FDE68A', iconBg: 'rgba(252,211,77,0.08)' },
};
const DEF = { bg: 'rgba(168,85,247,0.12)', color: '#C084FC', iconBg: 'rgba(168,85,247,0.1)' };

export default function EventDetail() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [event,    setEvent]     = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [error,    setError]     = useState('');
  const [qtys,     setQtys]      = useState({});
  const [panelOpen,setPanelOpen] = useState(false);

  useEffect(() => {
    Events.getBySlug(slug).then(setEvent).catch(() => setError('Event not found.')).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  const setQty = (id, val, max) => setQtys(p => ({ ...p, [id]: Math.max(0, Math.min(val, max)) }));
  const total  = event?.ticket_types?.reduce((s, t) => s + (qtys[t.id] || 0) * Number(t.price), 0) || 0;
  const hasSel = Object.values(qtys).some(q => q > 0);

  const goCheckout = () => {
    const items = event.ticket_types.filter(t => (qtys[t.id] || 0) > 0)
      .map(t => ({ ticketTypeId: t.id, name: t.name, price: t.price, quantity: qtys[t.id] }));
    navigate('/checkout', { state: { eventId: event.id, eventTitle: event.title, eventSlug: event.slug, currency: 'NGN', items, total } });
  };

  if (loading) return <Spinner />;
  if (error || !event) return (
    <div style={{ padding: '80px 16px', textAlign: 'center', color: 'var(--slate)' }}>
      <p style={{ marginBottom: 16 }}>{error || 'Event not found.'}</p>
      <Link to="/events" className="btn btn-ghost">← Back to events</Link>
    </div>
  );

  const d   = new Date(event.start_at);
  const cat = CAT_STYLES[event.event_categories?.slug] ?? DEF;
  const activeTickets = (event.ticket_types ?? []).filter(t => t.is_active);
  const minPrice = activeTickets.length ? Math.min(...activeTickets.map(t => Number(t.price))) : null;

  const TicketPanelContent = () => (
    <>
      <div className="ticket-panel-handle" onClick={() => setPanelOpen(false)} />
      <h3 className="ticket-panel-title">
        <HugeiconsIcon icon={Ticket01Icon} size={17} color="var(--amber)" />
        Select Tickets
      </h3>
      {activeTickets.length === 0 ? (
        <p style={{ color: 'var(--slate)', fontSize: '0.88rem', padding: '16px 0' }}>No tickets available yet.</p>
      ) : activeTickets.map(t => {
        const rem = t.quantity_total - t.quantity_sold;
        const qty = qtys[t.id] || 0;
        const out = rem <= 0;
        return (
          <div key={t.id} className="ticket-row">
            <div className="ticket-row-info">
              <p className="ticket-row-name">{t.name}</p>
              <p className="ticket-row-price">{fmt(t.price)}</p>
              <p className={`ticket-row-avail${!out && rem < 20 ? ' low' : ''}`}>
                {out ? '🔴 Sold out' : rem < 20 ? `⚡ Only ${rem} left` : `${rem.toLocaleString()} available`}
              </p>
            </div>
            {!out && (
              <div className="stepper">
                <button className="stepper-btn" onClick={() => setQty(t.id, qty - 1, rem)} disabled={qty === 0}>−</button>
                <span className="stepper-num">{qty}</span>
                <button className="stepper-btn" onClick={() => setQty(t.id, qty + 1, rem)} disabled={qty >= Math.min(rem, 10)}>+</button>
              </div>
            )}
          </div>
        );
      })}
      {hasSel && (
        <div className="ticket-total-row">
          <span className="ticket-total-label">Total</span>
          <span className="ticket-total-amt">{fmt(total)}</span>
        </div>
      )}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: '14px', borderRadius: 12 }}
        disabled={!hasSel} onClick={goCheckout}>
        {hasSel ? `Checkout — ${fmt(total)}` : 'Select tickets to continue'}
      </button>
      <p className="ticket-secure-note">
        <HugeiconsIcon icon={Shield01Icon} size={11} color="var(--slate-2)" />
        Secured by Flutterwave · SSL Encrypted
      </p>
    </>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero banner */}
      <div className="detail-hero">
        {event.banner_url
          ? <img src={event.banner_url} alt={event.title} />
          : <div className="detail-hero-placeholder">
              <HugeiconsIcon icon={Ticket01Icon} size={52} color="var(--line)" />
            </div>
        }
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <Link to="/events" className="detail-back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={13} color="var(--slate)" /> All Events
          </Link>
          <div className="detail-cat-tag" style={{ background: cat.bg, color: cat.color }}>
            {event.event_categories?.name ?? 'Event'}
          </div>
          <h1 className="detail-title">{event.title}</h1>
        </div>
      </div>

      {/* Body */}
      <div className="detail-body">
        {/* Main */}
        <div className="detail-main">
          <div className="detail-section">
            <p className="detail-meta-item">
              <HugeiconsIcon icon={Calendar01Icon} size={14} color={cat.color} />
              {d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} at {d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}
            </p>
            <p className="detail-meta-item">
              <HugeiconsIcon icon={Location01Icon} size={14} color={cat.color} />
              {event.venue_name}{event.address ? `, ${event.address}` : ''}{event.states?.name ? `, ${event.states.name}` : ''}
            </p>
          </div>

          {event.description && (
            <div className="detail-section">
              <h2 className="detail-section-title">About this event</h2>
              <p className="detail-desc">{event.description}</p>
            </div>
          )}

          <div className="detail-info-grid">
            {[
              { label: 'Date & Time', value: d.toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}), sub: d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}), icon: Calendar01Icon, bg: 'rgba(168,85,247,0.1)', color: 'var(--purple)' },
              { label: 'Venue',       value: event.venue_name, sub: event.states?.name, icon: Location01Icon, bg: 'rgba(236,72,153,0.1)', color: 'var(--pink)' },
              { label: 'Organizer',   value: event.profiles?.organizer_business_name || event.profiles?.full_name || 'EventMasters', sub: 'Verified Event', icon: Shield01Icon, bg: 'rgba(255,179,0,0.1)', color: 'var(--amber)' },
            ].map(info => (
              <div key={info.label} className="detail-info-card">
                <div className="detail-info-icon" style={{ background: info.bg }}>
                  <HugeiconsIcon icon={info.icon} size={17} color={info.color} />
                </div>
                <div>
                  <p className="detail-info-label">{info.label}</p>
                  <p className="detail-info-value">{info.value}</p>
                  {info.sub && <p className="detail-info-sub">{info.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="share-row">
            <span className="share-label">Share:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(event.title + ' — tickets: ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <HugeiconsIcon icon={WhatsappIcon} size={13} color="var(--green)" /> WhatsApp
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Going to ' + event.title + '! Tickets: ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              X / Twitter
            </a>
          </div>
        </div>

        {/* Sidebar (desktop) / bottom sheet (mobile) */}
        <div className="detail-sidebar">
          <div className={`ticket-panel${panelOpen ? ' open' : ''}`}>
            <TicketPanelContent />
          </div>
        </div>
      </div>

      {/* Mobile CTA bar */}
      <div className="ticket-cta-bar">
        <div style={{ flex: 1 }}>
          <span className="ticket-cta-price-label">From</span>
          <span className="ticket-cta-price-val">{minPrice != null ? fmt(minPrice) : 'Price TBA'}</span>
        </div>
        <button className="btn btn-primary" style={{ padding: '11px 20px' }}
          onClick={() => setPanelOpen(v => !v)}>
          <HugeiconsIcon icon={Ticket01Icon} size={15} />
          {panelOpen ? 'Close' : 'Get Tickets'}
        </button>
      </div>

      {panelOpen && (
        <div onClick={() => setPanelOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,0.65)', zIndex: 49 }} />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
}
