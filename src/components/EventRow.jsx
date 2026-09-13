import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Location01Icon, ArrowRight01Icon, ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';

function fmt(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }

const CAT_COLORS = {
  'concert':             '#7C3AED',
  'comedy-show':         '#D97706',
  'festival':            '#059669',
  'party':               '#DB2777',
  'conference-workshop': '#0891B2',
  'theatre':             '#7C3AED',
  'religious':           '#B45309',
  'sport':               '#059669',
};

// How many visible cards based on screen width
function getVisible() {
  const w = window.innerWidth;
  if (w < 480) return 1.4;   // mobile: 1 full + 0.4 peek
  if (w < 768) return 2.2;   // tablet: 2 + peek
  if (w < 1024) return 3.2;  // small desktop: 3 + peek
  return 4;                   // large desktop: 4
}

export default function EventRow({
  title, eyebrow, events = [],
  seeAllLink = '/events', color = '#7C3AED',
}) {
  const [idx,      setIdx]      = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [visible,  setVisible]  = useState(getVisible());
  const [dragStart,setDragStart]= useState(null);
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef(null);

  // Responsive visible count
  useEffect(() => {
    const fn = () => setVisible(getVisible());
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const maxIdx = Math.max(0, events.length - Math.floor(visible));

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(maxIdx, i + 1)), [maxIdx]);

  // Auto-play — advances every 4s, pauses on hover/drag
  useEffect(() => {
    if (paused || events.length <= Math.floor(visible)) return;
    const t = setInterval(() => {
      setIdx(i => i >= maxIdx ? 0 : i + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [paused, maxIdx, visible, events.length]);

  // Touch / mouse drag
  const onStart = (x) => { setDragStart(x); setDragging(false); setPaused(true); };
  const onMove  = (x) => {
    if (dragStart === null) return;
    setDragging(true);
    const delta = dragStart - x;
    if (Math.abs(delta) > 50) {
      if (delta > 0) next(); else prev();
      setDragStart(null);
    }
  };
  const onEnd = () => {
    setDragStart(null);
    setTimeout(() => setPaused(false), 2000);
  };

  if (!events.length) return null;

  // Card width as percent of container
  const cardPct  = 100 / visible;
  const translateX = -(idx * cardPct);

  return (
    <div
      style={{ marginBottom: 36, overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setDragStart(null); }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '0 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          {eyebrow && (
            <span style={{ background: color, color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100, letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
              ⭐ {eyebrow}
            </span>
          )}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,3.5vw,1.5rem)', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
            {title}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link to={seeAllLink} style={{ fontSize: '0.8rem', fontWeight: 700, color: color, display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            See all <HugeiconsIcon icon={ArrowRight01Icon} size={13} color={color} />
          </Link>
          {/* Arrows */}
          <button onClick={prev} disabled={idx === 0}
            style={{ ...S.arrowBtn, opacity: idx === 0 ? 0.35 : 1, borderColor: color + '40' }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} color={color} />
          </button>
          <button onClick={next} disabled={idx >= maxIdx}
            style={{ ...S.arrowBtn, opacity: idx >= maxIdx ? 0.35 : 1, borderColor: color + '40' }}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} color={color} />
          </button>
        </div>
      </div>

      {/* ── Carousel track ── */}
      <div
        ref={wrapRef}
        style={{ padding: '0 16px', overflow: 'hidden' }}
        onMouseDown={e  => onStart(e.clientX)}
        onMouseMove={e  => onMove(e.clientX)}
        onMouseUp={onEnd}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e  => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
      >
        <div style={{
          display: 'flex',
          gap: 0,
          transform: `translateX(calc(${translateX}% - ${idx * 12}px))`,
          transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: 'transform',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              color={color}
              cardPct={cardPct}
            />
          ))}
        </div>
      </div>

      {/* ── Dot indicators ── */}
      {events.length > Math.floor(visible) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12, padding: '0 16px' }}>
          {Array.from({ length: maxIdx + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
              style={{
                width: i === idx ? 20 : 7,
                height: 7,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: i === idx ? color : '#D1D5DB',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Individual card ── */
function EventCard({ event, color, cardPct }) {
  const d         = new Date(event.start_at);
  const catColor  = CAT_COLORS[event.event_categories?.slug] ?? color;
  const prices    = (event.ticket_types ?? []).filter(t => t.is_active).map(t => Number(t.price));
  const minPrice  = prices.length ? Math.min(...prices) : null;
  const soldOut   = prices.length > 0 && event.ticket_types.every(t => t.quantity_sold >= t.quantity_total);

  return (
    <Link
      to={`/events/${event.slug}`}
      style={{
        ...S.card,
        minWidth: `calc(${cardPct}% - 12px)`,
        maxWidth: `calc(${cardPct}% - 12px)`,
        marginRight: 12,
      }}
      draggable={false}
      onClick={e => { if (window._rowDragged) e.preventDefault(); }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden', flexShrink: 0, borderRadius: '14px 14px 0 0' }}>
        {event.banner_url
          ? <img
              src={event.banner_url}
              alt={event.title}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
            />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor}99, ${catColor}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              🎟
            </div>
        }
        {/* Date badge */}
        <div style={S.dateBadge}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', lineHeight: 1 }}>{d.getDate()}</span>
          <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em' }}>
            {d.toLocaleDateString('en-US',{month:'short'}).toUpperCase()}
          </span>
        </div>
        {/* Sold out */}
        {soldOut && (
          <span style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(239,68,68,0.92)', color: '#fff', fontSize: '0.56rem', fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
            SOLD OUT
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 11px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: color, letterSpacing: '0.01em', lineHeight: 1.2 }}>
          {d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
        </p>
        <h3 style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--ink)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
          {event.title}
        </h3>
        <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--slate)', margin: 0 }}>
          <HugeiconsIcon icon={Location01Icon} size={11} color="var(--slate)" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.states?.name || event.venue_name}
          </span>
        </p>
        {minPrice != null && !soldOut && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple)', marginTop: 'auto', paddingTop: 4 }}>
            {fmt(minPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}

const S = {
  card: {
    background: '#fff',
    border: '1px solid #EEF0F5',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    flexShrink: 0,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  dateBadge: {
    position: 'absolute', top: 7, left: 7,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    borderRadius: 8, padding: '5px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
  },
  arrowBtn: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#fff', border: '1.5px solid #E5E7EB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    transition: 'all 0.15s ease', flexShrink: 0,
  },
};
