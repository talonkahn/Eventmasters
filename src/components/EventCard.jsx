import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Location01Icon, ArrowRight01Icon, Ticket01Icon, FireIcon, MusicNote01Icon, LaughingIcon, PartyIcon, Film01Icon, GlobeIcon } from '@hugeicons/core-free-icons';

export function formatNaira(n) {
  return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG');
}

const CAT = {
  'concert':             { grad: 'linear-gradient(135deg,#7C3AED,#A855F7)', pill: 'rgba(168,85,247,0.2)',  pillText: '#C084FC', icon: MusicNote01Icon, label: '🎵 Concert' },
  'comedy-show':         { grad: 'linear-gradient(135deg,#FF6B8A,#FFB300)', pill: 'rgba(255,107,138,0.2)', pillText: '#FF8FAB', icon: LaughingIcon,    label: '😂 Comedy' },
  'festival':            { grad: 'linear-gradient(135deg,#00E096,#00D4FF)', pill: 'rgba(0,224,150,0.15)',  pillText: '#00E096', icon: PartyIcon,       label: '🎪 Festival' },
  'party':               { grad: 'linear-gradient(135deg,#EC4899,#A855F7)', pill: 'rgba(236,72,153,0.2)',  pillText: '#F472B6', icon: FireIcon,        label: '🎉 Party' },
  'conference-workshop': { grad: 'linear-gradient(135deg,#00D4FF,#7C3AED)', pill: 'rgba(0,212,255,0.15)',  pillText: '#00D4FF', icon: GlobeIcon,       label: '💼 Conference' },
  'theatre':             { grad: 'linear-gradient(135deg,#A855F7,#EC4899)', pill: 'rgba(168,85,247,0.2)',  pillText: '#C084FC', icon: Film01Icon,      label: '🎬 Theatre' },
  'religious':           { grad: 'linear-gradient(135deg,#FFB300,#FF6B8A)', pill: 'rgba(255,179,0,0.15)',  pillText: '#FFB300', icon: GlobeIcon,       label: '✨ Religious' },
  'sport':               { grad: 'linear-gradient(135deg,#00E096,#A855F7)', pill: 'rgba(0,224,150,0.15)',  pillText: '#00E096', icon: GlobeIcon,       label: '⚽ Sport' },
};
const DEF = { grad: 'linear-gradient(135deg,#A855F7,#EC4899)', pill: 'rgba(168,85,247,0.2)', pillText: '#C084FC', icon: Ticket01Icon, label: '🎟 Event' };

export default function EventCard({ event, featured = false, index = 0 }) {
  const cat       = CAT[event.event_categories?.slug] ?? DEF;
  const prices    = (event.ticket_types ?? []).filter(t => t.is_active).map(t => Number(t.price));
  const minPrice  = prices.length ? Math.min(...prices) : null;
  const soldOut   = prices.length > 0 && event.ticket_types.every(t => t.quantity_sold >= t.quantity_total);
  const remaining = event.ticket_types?.reduce((s,t) => s + (t.quantity_total - t.quantity_sold), 0) ?? 0;
  const lowStock  = !soldOut && remaining > 0 && remaining < 30;
  const d         = new Date(event.start_at);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="event-card"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: 20, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', textDecoration: 'none',
        animation: `fadeUp 0.5s cubic-bezier(0.34,1.2,0.64,1) ${Math.min(index*0.06,0.4)}s both`,
        backdropFilter: 'blur(12px)',
        ...(featured ? { border: '1px solid rgba(168,85,247,0.35)', background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(255,255,255,0.03))' } : {}),
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 190, overflow: 'hidden', background: 'var(--ink-3)', flexShrink: 0 }}>
        {event.banner_url
          ? <img src={event.banner_url} alt={event.title} className="card-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: cat.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={cat.icon} size={48} color="rgba(255,255,255,0.25)" />
            </div>
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,6,26,0.85) 0%, rgba(9,6,26,0.1) 60%, transparent 100%)' }} />

        {/* Date badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(9,6,26,0.80)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '8px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--amber-light)', lineHeight: 1 }}>{d.getDate()}</span>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--slate)', letterSpacing: '0.07em' }}>
            {d.toLocaleDateString('en-US',{month:'short'}).toUpperCase()}
          </span>
        </div>

        {/* Top right badges */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
          {featured && (
            <span style={{ background: 'var(--grad-amber)', color: '#09061A', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>
              ⭐ Featured
            </span>
          )}
          {soldOut && (
            <span style={{ background: 'rgba(255,107,138,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>
              Sold Out
            </span>
          )}
          {lowStock && !soldOut && (
            <span style={{ background: 'rgba(255,107,138,0.85)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
              <HugeiconsIcon icon={FireIcon} size={9} color="#fff" /> {remaining} left
            </span>
          )}
        </div>

        {/* Category pill */}
        <div style={{ position: 'absolute', bottom: 10, left: 12, background: cat.pill, color: cat.pillText, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 100, backdropFilter: 'blur(8px)', border: `1px solid ${cat.pillText}30` }}>
          {cat.label}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', lineHeight: 1.2, color: '#fff', letterSpacing: '0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate)' }}>
            <HugeiconsIcon icon={Calendar01Icon} size={12} color="var(--purple-bright)" />
            {d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate)', overflow: 'hidden' }}>
            <HugeiconsIcon icon={Location01Icon} size={12} color="var(--pink-bright)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue_name}{event.states?.name ? `, ${event.states.name}` : ''}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            {minPrice != null ? (
              minPrice === 0
                ? <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>FREE</span>
                : <>
                    <span style={{ fontSize: '0.62rem', color: 'var(--slate)', display: 'block', marginBottom: 1, letterSpacing: '0.08em' }}>FROM</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--amber-light)' }}>{formatNaira(minPrice)}</span>
                  </>
            ) : <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Price TBA</span>}
          </div>
          <span className="card-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', fontWeight: 700, color: 'var(--purple-bright)' }}>
            Get tickets <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="var(--purple-bright)" />
          </span>
        </div>
      </div>
    </Link>
  );
}
