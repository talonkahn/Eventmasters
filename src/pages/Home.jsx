import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Location01Icon, Calendar01Icon, MusicNote01Icon, LaughingIcon, PartyIcon, Film01Icon, Ticket01Icon, TicketStarIcon, ArrowRight01Icon, FireIcon, Shield01Icon, QrCode01Icon, ZapIcon, WhatsappIcon, Mail01Icon, GlobeIcon } from '@hugeicons/core-free-icons';
import { Events, Geo } from '../lib/apiClient';
import EventCard from '../components/EventCard';
import EventRow from '../components/EventRow';
import FeaturedCarousel from '../components/FeaturedCarousel';

const CATS = [
  { label:'All',         slug:'',                    icon:TicketStarIcon  },
  { label:'Concerts',    slug:'concert',             icon:MusicNote01Icon },
  { label:'Comedy',      slug:'comedy-show',         icon:LaughingIcon    },
  { label:'Festivals',   slug:'festival',            icon:PartyIcon       },
  { label:'Parties',     slug:'party',               icon:FireIcon        },
  { label:'Conferences', slug:'conference-workshop', icon:GlobeIcon       },
  { label:'Theatre',     slug:'theatre',             icon:Film01Icon      },
];
const TOP_STATES = ['Lagos','FCT - Abuja','Rivers','Oyo','Delta','Kano','Enugu','Cross River','Edo','Kaduna'];
const STATE_COLORS = ['var(--purple)','var(--pink)','var(--green)','var(--cyan)','var(--amber)','var(--coral)','var(--purple)','var(--pink)','var(--green)','var(--cyan)'];
const STATE_LIGHTS = ['var(--purple-light)','var(--pink-light)','var(--green-light)','var(--cyan-light)','var(--amber-light)','var(--coral-light)','var(--purple-light)','var(--pink-light)','var(--green-light)','var(--cyan-light)'];

export default function Home() {
  const navigate = useNavigate();
  const [events,   setEvents]   = useState([]);
  const [featured, setFeatured] = useState([]);
  const [states,   setStates]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cat,      setCat]      = useState('');
  const [search,   setSearch]   = useState('');
  const [heroIdx,  setHeroIdx]  = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [evts, countries] = await Promise.all([Events.list({ limit:40 }), Geo.countries()]);
        setEvents(evts);
        setFeatured(evts.filter(e => e.is_featured).slice(0,5));
        if (countries[0]) setStates(await Geo.statesByCountry(countries[0].id));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i+1) % featured.length), 5500);
    return () => clearInterval(t);
  }, [featured]);

  const filtered = cat ? events.filter(e => e.event_categories?.slug === cat) : events;
  const heroEv   = featured[heroIdx];

  return (
    <div>
      {/* ══ CAROUSEL ══ */}
      <FeaturedCarousel events={featured} states={states} />

            {/* Marquee */}
      {events.length > 0 && (
        <div className="home-marquee">
          <div className="home-marquee-track">
            {[...events,...events].map((e,i) => (
              <span key={i} className="home-marquee-item">
                <HugeiconsIcon icon={TicketStarIcon} size={11} color="var(--purple)" />
                {e.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══ CAROUSEL ROWS ══ */}
      <div style={{ marginTop: 48 }}>
        {loading ? (
          <div style={{ padding: '0 20px' }}>
            <div style={{ display:'flex', gap:14, overflowX:'hidden', marginBottom:40 }}>
              {Array.from({length:4}).map((_,i)=><div key={i} className="skeleton" style={{width:200,height:280,flexShrink:0,borderRadius:16}} />)}
            </div>
            <div style={{ display:'flex', gap:14, overflowX:'hidden' }}>
              {Array.from({length:4}).map((_,i)=><div key={i} className="skeleton" style={{width:200,height:280,flexShrink:0,borderRadius:16}} />)}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',color:'var(--slate)'}}>
            <p style={{fontSize:'3rem',marginBottom:12}}>🎟</p>
            <p style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',color:'var(--ink)',marginBottom:6}}>No events yet</p>
            <p style={{fontSize:'0.85rem'}}>Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured row */}
            {featured.length > 0 && (
              <EventRow
                eyebrow="FEATURED"
                title="Handpicked for You"
                events={featured}
                seeAllLink="/events"
                color="var(--purple)"
              />
            )}

            {/* Concerts */}
            {events.filter(e=>e.event_categories?.slug==='concert').length > 0 && (
              <EventRow
                title="Concerts"
                events={events.filter(e=>e.event_categories?.slug==='concert')}
                seeAllLink="/events?category=concert"
                color="#7C3AED"
              />
            )}

            {/* Comedy */}
            {events.filter(e=>e.event_categories?.slug==='comedy-show').length > 0 && (
              <EventRow
                title="Comedy Shows"
                events={events.filter(e=>e.event_categories?.slug==='comedy-show')}
                seeAllLink="/events?category=comedy-show"
                color="#D97706"
              />
            )}

            {/* Festivals */}
            {events.filter(e=>e.event_categories?.slug==='festival').length > 0 && (
              <EventRow
                title="Festivals"
                events={events.filter(e=>e.event_categories?.slug==='festival')}
                seeAllLink="/events?category=festival"
                color="#059669"
              />
            )}

            {/* Parties */}
            {events.filter(e=>e.event_categories?.slug==='party').length > 0 && (
              <EventRow
                title="Parties"
                events={events.filter(e=>e.event_categories?.slug==='party')}
                seeAllLink="/events?category=party"
                color="#DB2777"
              />
            )}

            {/* What's On — all upcoming */}
            <div style={{ borderTop:'1px solid var(--line)', paddingTop:32, marginTop:4 }}>
              <div style={{ padding:'0 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:10 }}>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,4vw,1.6rem)', color:'var(--ink)', marginBottom:3 }}>What's On</h2>
                  <p style={{ color:'var(--slate)', fontSize:'0.82rem' }}>Events happening now and coming up</p>
                </div>
                <Link to="/events" style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--purple)', display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                  See all <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                </Link>
              </div>
              <div style={{ padding:'0 16px' }}>
                <div className="cat-pills" style={{ overflowX:'auto', flexWrap:'nowrap', paddingBottom:4, scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
                  {CATS.map(c => (
                    <button key={c.slug} className={`cat-pill${cat===c.slug?' active':''}`} onClick={()=>setCat(c.slug)} style={{ flexShrink:0 }}>
                      <HugeiconsIcon icon={c.icon} size={13} color={cat===c.slug?'#fff':'var(--purple)'} />
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="events-grid" style={{ marginBottom:20 }}>
                  {(cat ? events.filter(e=>e.event_categories?.slug===cat) : events).slice(0,8).map((e,i)=>(
                    <EventCard key={e.id} event={e} featured={e.is_featured} index={i} />
                  ))}
                </div>
                <div style={{ textAlign:'center', paddingBottom:16 }}>
                  <Link to={`/events${cat?`?category=${cat}`:''}`} className="btn btn-ghost">
                    See all events <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ STATES ══ */}
      <div className="section-wrap" style={{marginTop:60}}>
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><HugeiconsIcon icon={Location01Icon} size={12} color="var(--pink)" /> Nationwide</p>
            <h2 className="section-title">Browse by State</h2>
          </div>
          <Link to="/events" className="section-view-all">All states <HugeiconsIcon icon={ArrowRight01Icon} size={13} /></Link>
        </div>
        <div className="states-grid">
          {states.filter(s=>TOP_STATES.includes(s.name)).map((s,idx)=>{
            const count = events.filter(e=>e.states?.name===s.name).length;
            const c = STATE_COLORS[idx%STATE_COLORS.length];
            const bg = STATE_LIGHTS[idx%STATE_LIGHTS.length];
            return (
              <Link key={s.id} to={`/events?state=${s.id}`} className="state-card event-card">
                <div className="state-card-left">
                  <div className="state-icon-wrap" style={{background:bg}}>
                    <HugeiconsIcon icon={Location01Icon} size={14} color={c} />
                  </div>
                  <div>
                    <p className="state-name">{s.name}</p>
                    <p className="state-count">{count} event{count!==1?'s':''}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--slate)" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══ HOW IT WORKS ══ */}
      <div className="how-section" style={{marginTop:64}}>
        <div className="section-wrap">
          <div style={{marginBottom:32}}>
            <p className="section-eyebrow"><HugeiconsIcon icon={ZapIcon} size={12} color="var(--amber)" /> Simple Process</p>
            <h2 className="section-title">How EventMasters Works</h2>
          </div>
          <div className="how-list">
            {[
              {icon:Search01Icon, num:'01', title:'Discover events',   desc:'Browse across all 37 states. Filter by category, date, or location.', color:'var(--purple)', bg:'var(--purple-light)'},
              {icon:Ticket01Icon, num:'02', title:'Pick your tickets', desc:'Choose Regular, VIP, or VVIP. See real-time availability.',             color:'var(--pink)',   bg:'var(--pink-light)'},
              {icon:Shield01Icon, num:'03', title:'Pay securely',      desc:'Card, bank transfer, USSD, or mobile money via Flutterwave.',           color:'var(--amber)',  bg:'var(--amber-light)'},
              {icon:QrCode01Icon, num:'04', title:'Show up & scan',    desc:'QR ticket arrives instantly. Show it at the gate — no printing.',       color:'var(--green)',  bg:'var(--green-light)'},
            ].map((step,i)=>(
              <div key={i} className="how-row">
                <div className="how-num-badge" style={{background:step.bg}}><span className="how-num" style={{color:step.color}}>{step.num}</span></div>
                <div className="how-icon-circle" style={{background:step.bg}}><HugeiconsIcon icon={step.icon} size={20} color={step.color} /></div>
                <div className="how-text">
                  <p className="how-title">{step.title}</p>
                  <p className="how-desc">{step.desc}</p>
                </div>
                {i<3 && <div className="how-connector" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CTA ══ */}
      <div className="section-wrap" style={{marginTop:0,paddingTop:56,paddingBottom:64}}>
        <div className="home-cta-band">
          <div className="home-cta-left">
            <div className="home-cta-icon"><HugeiconsIcon icon={MusicNote01Icon} size={26} color="#fff" /></div>
            <div>
              <h2 className="home-cta-title">Want to list your event?</h2>
              <p className="home-cta-sub">Contact us — we'll have your event live within 24 hours.</p>
            </div>
          </div>
          <div className="home-cta-btns">
            <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer" className="btn btn-white">
              <HugeiconsIcon icon={WhatsappIcon} size={17} /> WhatsApp Us
            </a>
            <a href="mailto:samuelivere92@gmail.com" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 20px',borderRadius:12,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:'0.88rem'}}>
              <HugeiconsIcon icon={Mail01Icon} size={15} /> Email Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
