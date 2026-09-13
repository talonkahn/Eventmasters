import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Location01Icon, ArrowRight01Icon, ArrowLeft01Icon, Ticket01Icon, Search01Icon } from '@hugeicons/core-free-icons';

function fmt(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }

export default function FeaturedCarousel({ events = [], states = [] }) {
  const navigate   = useNavigate();
  const [search, setSearch] = useState('');
  const handleSearch = e => { e.preventDefault(); navigate(search.trim() ? `/events?search=${encodeURIComponent(search)}` : '/events'); };
  const [idx,       setIdx]       = useState(0);
  const [dragging,  setDragging]  = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [paused,    setPaused]    = useState(false);
  const trackRef = useRef(null);
  const total    = events.length;

  const prev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);

  // Auto-advance
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, total]);

  // Touch / mouse drag
  const onDragStart = (clientX) => { setDragging(true); setDragStart(clientX); setDragDelta(0); setPaused(true); };
  const onDragMove  = (clientX) => { if (!dragging) return; setDragDelta(clientX - dragStart); };
  const onDragEnd   = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragDelta < -50) next();
    else if (dragDelta > 50) prev();
    setDragDelta(0);
    setTimeout(() => setPaused(false), 2000);
  };

  if (!total) return null;

  const ev = events[idx];
  const minPrice = ev.ticket_types?.filter(t => t.is_active).length
    ? Math.min(...ev.ticket_types.filter(t => t.is_active).map(t => Number(t.price)))
    : null;
  const d = new Date(ev.start_at);

  return (
    <section
      style={S.wrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setDragging(false); setDragDelta(0); }}
      onMouseDown={e  => onDragStart(e.clientX)}
      onMouseMove={e  => onDragMove(e.clientX)}
      onMouseUp={onDragEnd}
      onTouchStart={e => onDragStart(e.touches[0].clientX)}
      onTouchMove={e  => onDragMove(e.touches[0].clientX)}
      onTouchEnd={onDragEnd}
    >
      {/* ── Slides track ── */}
      <div ref={trackRef} style={S.track}>
        {events.map((ev, i) => (
          <div key={ev.id} style={{
            ...S.slide,
            transform: `translateX(calc(${(i - idx) * 100}% + ${i === idx ? dragDelta : 0}px))`,
            transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
            opacity: Math.abs(i - idx) > 1 ? 0 : 1,
          }}>
            {/* BG image */}
            {ev.banner_url
              ? <div style={{ ...S.bgImg, backgroundImage: `url(${ev.banner_url})` }} />
              : <div style={{ ...S.bgImg, background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }} />
            }
            <div style={S.overlay} />
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={S.content}>
        {/* Eyebrow */}
        <div style={S.eyebrow}>
          <span style={S.livePill}>
            <span style={S.liveDot} />
            LIVE ON SALE
          </span>
          <span style={S.catLabel}>
            {ev.event_categories?.name?.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h1 style={S.title}>{ev.title}</h1>

        {/* Meta */}
        <div style={S.meta}>
          <span style={S.metaItem}>
            <HugeiconsIcon icon={Calendar01Icon} size={14} color="rgba(255,255,255,0.85)" />
            {d.toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' })}
          </span>
          <span style={S.metaDot}>·</span>
          <span style={S.metaItem}>
            <HugeiconsIcon icon={Location01Icon} size={14} color="rgba(255,255,255,0.85)" />
            {ev.venue_name}, {ev.states?.name}
          </span>
        </div>

        {/* Price */}
        {minPrice != null && (
          <div style={S.priceRow}>
            <span style={S.priceLabel}>FROM</span>
            <span style={S.price}>{fmt(minPrice)}</span>
          </div>
        )}

        {/* CTA */}
        <div style={S.actions}>
          <Link to={`/events/${ev.slug}`} className="btn btn-white btn-lg"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            Get Tickets <HugeiconsIcon icon={Ticket01Icon} size={17} />
          </Link>
          <Link to="/events" style={S.browseBtn}>
            Browse All <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Link>
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      {total > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
            style={{ ...S.arrow, left: 16 }} aria-label="Previous">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#fff" />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
            style={{ ...S.arrow, right: 16 }} aria-label="Next">
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#fff" />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {total > 1 && (
        <div style={S.dots}>
          {events.map((_, i) => (
            <button key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); setPaused(true); setTimeout(() => setPaused(false), 3000); }}
              style={{
                ...S.dot,
                width:        i === idx ? 28 : 8,
                background:   i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow:    i === idx ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Search bar overlay ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:30, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.15)', padding:'12px 16px' }}>
        <form onSubmit={handleSearch} style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', gap:0, background:'rgba(255,255,255,0.95)', borderRadius:14, overflow:'hidden', padding:'5px 6px 5px 16px', boxShadow:'0 4px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <HugeiconsIcon icon={Search01Icon} size={16} color="var(--purple,#7C3AED)" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, artists, venues…"
              style={{ flex:1, background:'none', border:'none', color:'#111', fontSize:'0.9rem', outline:'none', padding:'10px 0', minWidth:0, fontFamily:'var(--font-body)' }} />
          </div>
          <div style={{ width:1, height:22, background:'#E8EAF0', margin:'0 10px', flexShrink:0 }} />
          <select onChange={e=>{if(e.target.value)navigate(`/events?state=${e.target.value}`);}} defaultValue=""
            style={{ background:'transparent', border:'none', color:'#6B7280', fontSize:'0.82rem', outline:'none', padding:'10px 8px', cursor:'pointer', maxWidth:130, fontFamily:'var(--font-body)' }}>
            <option value="">All States</option>
            {states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', flexShrink:0, fontFamily:'var(--font-body)' }}>Search</button>
        </form>
      </div>

      {/* ── Progress bar ── */}
      {total > 1 && !paused && (
        <div style={S.progressWrap}>
          <div key={idx} style={S.progressBar} />
        </div>
      )}

      {/* ── Slide counter ── */}
      {total > 1 && (
        <div style={S.counter}>
          <span style={{ color: '#fff', fontWeight: 800 }}>{String(idx + 1).padStart(2,'0')}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{String(total).padStart(2,'0')}</span>
        </div>
      )}
    </section>
  );
}

const S = {
  wrap: {
    position: 'relative',
    height: 'clamp(460px, 55vw, 580px)',
    overflow: 'hidden',
    background: '#09061A',
    cursor: 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  track: {
    position: 'absolute', inset: 0,
  },
  slide: {
    position: 'absolute', inset: 0,
    willChange: 'transform',
  },
  bgImg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
    filter: 'brightness(0.45)',
    transition: 'none',
  },
  overlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(105deg, rgba(9,6,26,0.92) 35%, rgba(124,58,237,0.3) 75%, rgba(236,72,153,0.15) 100%)',
  },

  content: {
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    padding: 'clamp(24px, 4vw, 48px)',
    maxWidth: 720,
    pointerEvents: 'none',
  },

  eyebrow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  livePill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(12px)', borderRadius: 100,
    padding: '5px 13px', fontSize: '0.65rem', fontWeight: 800,
    color: '#fff', letterSpacing: '0.09em',
  },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#FF6B8A', flexShrink: 0, boxShadow: '0 0 8px #FF6B8A', animation: 'pulse 2s infinite' },
  catLabel: { fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.09em' },

  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 5.5vw, 4rem)',
    lineHeight: 1.04, color: '#fff',
    marginBottom: 14, letterSpacing: '0.01em',
    textShadow: '0 2px 20px rgba(0,0,0,0.4)',
  },

  meta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: 'rgba(255,255,255,0.8)' },
  metaDot:  { color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' },

  priceRow:  { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 22 },
  priceLabel:{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' },
  price:     { fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 600, color: '#fff', lineHeight: 1 },

  actions: { display: 'flex', gap: 12, flexWrap: 'wrap', pointerEvents: 'all' },
  browseBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 22px', borderRadius: 16,
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
    backdropFilter: 'blur(8px)', transition: 'all 0.18s ease',
  },

  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 20, width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
    backdropFilter: 'blur(12px)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s ease',
  },

  dots: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 6, alignItems: 'center', zIndex: 20,
  },
  dot: {
    height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
    transition: 'all 0.35s ease', padding: 0,
  },

  progressWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, background: 'rgba(255,255,255,0.12)', zIndex: 20,
  },
  progressBar: {
    height: '100%', background: 'var(--purple-bright, #8B5CF6)',
    animation: 'carouselProgress 5s linear forwards',
  },

  counter: {
    position: 'absolute', top: 20, right: 20,
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '5px 10px',
    display: 'flex', alignItems: 'center', zIndex: 20,
  },
};
