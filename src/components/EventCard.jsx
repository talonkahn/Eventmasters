import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Location01Icon, ArrowRight01Icon, Ticket01Icon, FireIcon, MusicNote01Icon, LaughingIcon, PartyIcon, Film01Icon, GlobeIcon } from '@hugeicons/core-free-icons';

export function formatNaira(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }

const CAT = {
  'concert':             { grad:'linear-gradient(135deg,#7C3AED,#A78BFA)', pill:'#EDE9FE', pillText:'#7C3AED', icon:MusicNote01Icon },
  'comedy-show':         { grad:'linear-gradient(135deg,#F59E0B,#FBBF24)', pill:'#FEF3C7', pillText:'#92400E', icon:LaughingIcon },
  'festival':            { grad:'linear-gradient(135deg,#10B981,#34D399)', pill:'#D1FAE5', pillText:'#065F46', icon:PartyIcon },
  'party':               { grad:'linear-gradient(135deg,#EC4899,#F472B6)', pill:'#FCE7F3', pillText:'#9D174D', icon:FireIcon },
  'conference-workshop': { grad:'linear-gradient(135deg,#06B6D4,#38BDF8)', pill:'#CFFAFE', pillText:'#0E7490', icon:GlobeIcon },
  'theatre':             { grad:'linear-gradient(135deg,#8B5CF6,#C084FC)', pill:'#EDE9FE', pillText:'#5B21B6', icon:Film01Icon },
  'religious':           { grad:'linear-gradient(135deg,#F59E0B,#EC4899)', pill:'#FEF3C7', pillText:'#92400E', icon:GlobeIcon },
  'sport':               { grad:'linear-gradient(135deg,#10B981,#06B6D4)', pill:'#D1FAE5', pillText:'#065F46', icon:GlobeIcon },
};
const DEF = { grad:'linear-gradient(135deg,#7C3AED,#EC4899)', pill:'#EDE9FE', pillText:'#7C3AED', icon:Ticket01Icon };

export default function EventCard({ event, featured = false, index = 0 }) {
  const cat      = CAT[event.event_categories?.slug] ?? DEF;
  const prices   = (event.ticket_types ?? []).filter(t => t.is_active).map(t => Number(t.price));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const soldOut  = prices.length > 0 && event.ticket_types.every(t => t.quantity_sold >= t.quantity_total);
  const remaining= event.ticket_types?.reduce((s,t) => s + (t.quantity_total - t.quantity_sold), 0) ?? 0;
  const lowStock = !soldOut && remaining > 0 && remaining < 30;
  const d        = new Date(event.start_at);

  return (
    <Link to={`/events/${event.slug}`} className="event-card"
      style={{
        background: '#fff', border: `1.5px solid ${featured ? 'var(--purple-mid)' : 'var(--line)'}`,
        borderRadius: 18, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', textDecoration: 'none',
        boxShadow: featured ? 'var(--shadow-purple-sm)' : 'var(--shadow-sm)',
        animation: `fadeUp 0.45s ease ${Math.min(index*0.06,0.4)}s both`,
      }}>
      {/* Image */}
      <div style={{ position:'relative', height:186, overflow:'hidden', background:'var(--purple-light)', flexShrink:0 }}>
        {event.banner_url
          ? <img src={event.banner_url} alt={event.title} className="card-img" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', background:cat.grad, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <HugeiconsIcon icon={cat.icon} size={48} color="rgba(255,255,255,0.35)" />
            </div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />

        {/* Date badge */}
        <div style={{ position:'absolute', top:12, left:12, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:11, padding:'7px 11px', display:'flex', flexDirection:'column', alignItems:'center', gap:0, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--purple)', lineHeight:1 }}>{d.getDate()}</span>
          <span style={{ fontSize:'0.58rem', fontWeight:700, color:'var(--slate)', letterSpacing:'0.07em' }}>{d.toLocaleDateString('en-US',{month:'short'}).toUpperCase()}</span>
        </div>

        {/* Badges */}
        <div style={{ position:'absolute', top:12, right:12, display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
          {featured && <span style={{ background:'var(--grad-purple)', color:'#fff', fontSize:'0.6rem', fontWeight:800, padding:'3px 10px', borderRadius:100 }}>⭐ Featured</span>}
          {soldOut  && <span style={{ background:'var(--coral)', color:'#fff', fontSize:'0.6rem', fontWeight:800, padding:'3px 10px', borderRadius:100 }}>Sold Out</span>}
          {lowStock && !soldOut && <span style={{ background:'var(--coral)', color:'#fff', fontSize:'0.6rem', fontWeight:800, padding:'3px 10px', borderRadius:100, display:'flex', alignItems:'center', gap:4 }}><HugeiconsIcon icon={FireIcon} size={9} color="#fff" />{remaining} left</span>}
        </div>

        {/* Category pill */}
        <div style={{ position:'absolute', bottom:10, left:12, background:cat.pill, color:cat.pillText, fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 10px', borderRadius:100 }}>
          {event.event_categories?.name ?? 'Event'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'14px 16px 18px', display:'flex', flexDirection:'column', gap:8, flex:1 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', lineHeight:1.25, color:'var(--ink)', letterSpacing:'0.01em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {event.title}
        </h3>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.76rem', color:'var(--slate)' }}>
            <HugeiconsIcon icon={Calendar01Icon} size={12} color="var(--purple)" />
            {d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.76rem', color:'var(--slate)', overflow:'hidden' }}>
            <HugeiconsIcon icon={Location01Icon} size={12} color="var(--pink)" />
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {event.venue_name}{event.states?.name ? `, ${event.states.name}` : ''}
            </span>
          </span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'auto', paddingTop:11, borderTop:'1px solid var(--line)' }}>
          <div>
            {minPrice != null
              ? minPrice === 0
                ? <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--green)', fontSize:'0.92rem' }}>FREE</span>
                : <>
                    <span style={{ fontSize:'0.6rem', color:'var(--slate)', display:'block', marginBottom:1, letterSpacing:'0.08em' }}>FROM</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.92rem', color:'var(--purple)' }}>{formatNaira(minPrice)}</span>
                  </>
              : <span style={{ fontSize:'0.78rem', color:'var(--slate)' }}>Price TBA</span>
            }
          </div>
          <span className="card-cta" style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.76rem', fontWeight:700, color:'var(--purple)' }}>
            Get tickets <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="var(--purple)" />
          </span>
        </div>
      </div>
    </Link>
  );
}
