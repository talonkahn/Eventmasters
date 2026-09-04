import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Location01Icon, Calendar01Icon, MusicNote01Icon, LaughingIcon, PartyIcon, Film01Icon, Ticket01Icon, TicketStarIcon, ArrowRight01Icon, FireIcon, Shield01Icon, QrCode01Icon, ZapIcon, WhatsappIcon, Mail01Icon, GlobeIcon } from '@hugeicons/core-free-icons';
import { Events, Geo } from '../lib/apiClient';
import EventCard from '../components/EventCard';

const CATS = [
  { label: 'All',         slug: '',                    icon: TicketStarIcon,  color: 'var(--purple-bright)' },
  { label: 'Concerts',    slug: 'concert',             icon: MusicNote01Icon, color: 'var(--purple-bright)' },
  { label: 'Comedy',      slug: 'comedy-show',         icon: LaughingIcon,    color: 'var(--coral)' },
  { label: 'Festivals',   slug: 'festival',            icon: PartyIcon,       color: 'var(--green)' },
  { label: 'Parties',     slug: 'party',               icon: FireIcon,        color: 'var(--pink-bright)' },
  { label: 'Conferences', slug: 'conference-workshop', icon: GlobeIcon,       color: 'var(--cyan)' },
  { label: 'Theatre',     slug: 'theatre',             icon: Film01Icon,      color: 'var(--purple-bright)' },
];
const TOP_STATES = ['Lagos','FCT - Abuja','Rivers','Oyo','Delta','Kano','Enugu','Cross River','Edo','Kaduna'];

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
        const [evts, countries] = await Promise.all([Events.list({ limit: 40 }), Geo.countries()]);
        setEvents(evts);
        setFeatured(evts.filter(e => e.is_featured).slice(0, 5));
        if (countries[0]) setStates(await Geo.statesByCountry(countries[0].id));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5500);
    return () => clearInterval(t);
  }, [featured]);

  const filtered = cat ? events.filter(e => e.event_categories?.slug === cat) : events;
  const heroEv   = featured[heroIdx];

  return (
    <div>
      {/* ═══════════ HERO ═══════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--ink)', minHeight: 520 }}>
        {/* Orbs */}
        <div className="orb orb-purple" style={{ width: 600, height: 600, top: -200, left: -100 }} />
        <div className="orb orb-pink"   style={{ width: 400, height: 400, top: -100, right: -80 }} />
        <div className="orb orb-amber"  style={{ width: 300, height: 300, bottom: -100, left: '40%', animationDelay: '2s' }} />

        {/* BG image */}
        {heroEv?.banner_url && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroEv.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(6px) brightness(0.12)', transform: 'scale(1.1)', transition: 'all 1s ease' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(9,6,26,0.97) 50%, rgba(168,85,247,0.14) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '64px 20px 40px' }}>
          {heroEv ? (
            <div style={{ maxWidth: 600 }}>
              {/* Eyebrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,107,138,0.12)', border: '1px solid rgba(255,107,138,0.3)', borderRadius: 100, padding: '5px 13px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--coral)', letterSpacing: '0.08em' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--coral)', boxShadow: '0 0 8px var(--coral)', animation: 'pulse 2s infinite' }} />
                  LIVE ON SALE
                </span>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--slate)', letterSpacing: '0.08em' }}>
                  {heroEv.event_categories?.name?.toUpperCase()}
                </span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1.04, color: '#fff', marginBottom: 14 }}>
                {heroEv.title}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--paper-2)' }}>
                  <HugeiconsIcon icon={Calendar01Icon} size={14} color="var(--purple-bright)" />
                  {new Date(heroEv.start_at).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--paper-2)' }}>
                  <HugeiconsIcon icon={Location01Icon} size={14} color="var(--pink-bright)" />
                  {heroEv.venue_name}, {heroEv.states?.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 26 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '0.12em' }}>FROM</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--amber-light)', lineHeight: 1, textShadow: '0 0 40px rgba(255,179,0,0.4)' }}>
                  ₦{Math.min(...(heroEv.ticket_types?.filter(t=>t.is_active).map(t=>Number(t.price)) || [0])).toLocaleString('en-NG')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                <Link to={`/events/${heroEv.slug}`} className="btn btn-primary">
                  Get Tickets <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
                </Link>
                <Link to="/events" className="btn btn-white">Browse All</Link>
              </div>

              {featured.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} style={{
                      width: i === heroIdx ? 36 : 22, height: 3, borderRadius: 2, border: 'none', cursor: 'pointer',
                      background: i === heroIdx ? 'var(--purple-bright)' : 'rgba(255,255,255,0.2)',
                      boxShadow: i === heroIdx ? '0 0 10px var(--purple-glow)' : 'none',
                      transition: 'all 0.3s ease', padding: 0,
                    }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 600, paddingTop: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-dim)', border: '1px solid var(--line-purple)', borderRadius: 100, padding: '5px 13px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--purple-bright)', letterSpacing: '0.08em', marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple-bright)', animation: 'pulse 2s infinite' }} />
                NIGERIA · ALL 37 STATES
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', lineHeight: 1.04, marginBottom: 16 }}>
                Find it.{' '}
                <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Book it.
                </span>{' '}
                Be there.
              </h1>
              <p style={{ color: 'var(--slate)', fontSize: '1rem', lineHeight: 1.65, marginBottom: 28, maxWidth: 440 }}>
                Every concert, comedy show, festival and party across Nigeria — one place, instant tickets.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/events" className="btn btn-primary btn-lg">Browse Events <HugeiconsIcon icon={ArrowRight01Icon} size={18} /></Link>
                <Link to="/contact" className="btn btn-white btn-lg">List Your Event</Link>
              </div>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div style={{ background: 'rgba(9,6,26,0.88)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(168,85,247,0.15)', padding: '12px 0' }}>
          <form onSubmit={e => { e.preventDefault(); navigate(search.trim() ? `/events?search=${encodeURIComponent(search)}` : '/events'); }}
            style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0, background: 'var(--glass-mid)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 14, overflow: 'hidden', padding: '6px 6px 6px 16px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <HugeiconsIcon icon={Search01Icon} size={15} color="var(--purple-bright)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, artists, venues…"
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none', padding: '10px 0', minWidth: 0, fontFamily: 'var(--font-body)' }} />
            </div>
            <div style={{ width: 1, height: 22, background: 'var(--glass-border)', margin: '0 10px', alignSelf: 'center', flexShrink: 0 }} />
            <select onChange={e => { if (e.target.value) navigate(`/events?state=${e.target.value}`); }} defaultValue=""
              style={{ background: 'transparent', border: 'none', color: 'var(--slate)', fontSize: '0.82rem', outline: 'none', padding: '10px 8px', cursor: 'pointer', maxWidth: 130, fontFamily: 'var(--font-body)' }}>
              <option value="">All States</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: 10, flexShrink: 0 }}>Search</button>
          </form>
        </div>
      </section>

      {/* Marquee */}
      {events.length > 0 && (
        <div style={{ overflow: 'hidden', background: 'linear-gradient(90deg, var(--ink-2), var(--ink-3), var(--ink-2))', borderTop: '1px solid rgba(168,85,247,0.1)', borderBottom: '1px solid rgba(168,85,247,0.1)', padding: '11px 0', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-flex', gap: 28, animation: 'marquee 50s linear infinite' }}>
            {[...events, ...events].map((e, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--slate)', display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                <HugeiconsIcon icon={TicketStarIcon} size={11} color="var(--purple)" />
                {e.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ EVENTS GRID ═══════════ */}
      <div style={{ maxWidth: 1200, margin: '52px auto 0', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 10 }}>
          <div>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
              <HugeiconsIcon icon={FireIcon} size={12} color="var(--coral)" /> On Sale Now
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#fff' }}>Upcoming Events</h2>
          </div>
          <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 700, color: 'var(--amber)', flexShrink: 0 }}>
            View all <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          </Link>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {CATS.map(c => (
            <button key={c.slug} onClick={() => setCat(c.slug)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 100, fontFamily: 'var(--font-body)',
              border: cat === c.slug ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.1)',
              background: cat === c.slug ? 'var(--grad-primary)' : 'var(--glass)',
              color: cat === c.slug ? '#fff' : 'var(--slate)',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: cat === c.slug ? '0 4px 20px var(--purple-glow)' : 'none',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)',
            }}>
              <HugeiconsIcon icon={c.icon} size={13} color={cat === c.slug ? '#fff' : c.color} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="events-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--slate)' }}>
            <HugeiconsIcon icon={Ticket01Icon} size={44} color="var(--glass-high)" />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '12px 0 4px', color: '#fff' }}>No events yet</p>
            <p style={{ fontSize: '0.85rem' }}>Check back soon.</p>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.slice(0, 12).map((e, i) => <EventCard key={e.id} event={e} featured={e.is_featured} index={i} />)}
          </div>
        )}

        {filtered.length > 12 && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to={`/events${cat ? `?category=${cat}` : ''}`} className="btn btn-ghost">
              See all {filtered.length} events <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* ═══════════ BY STATE ═══════════ */}
      <div style={{ maxWidth: 1200, margin: '64px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--pink-bright)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
              <HugeiconsIcon icon={Location01Icon} size={12} color="var(--pink-bright)" /> Nationwide
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', color: '#fff' }}>Browse by State</h2>
          </div>
          <Link to="/events" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            All states <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          </Link>
        </div>
        <div className="states-grid">
          {states.filter(s => TOP_STATES.includes(s.name)).map((s, idx) => {
            const count = events.filter(e => e.states?.name === s.name).length;
            const colors = ['var(--purple)','var(--pink)','var(--green)','var(--cyan)','var(--amber)','var(--coral)','var(--purple-bright)','var(--pink-bright)','var(--green)','var(--cyan)'];
            const c = colors[idx % colors.length];
            return (
              <Link key={s.id} to={`/events?state=${s.id}`} className="event-card" style={{
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textDecoration: 'none', backdropFilter: 'blur(10px)', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${c}20`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HugeiconsIcon icon={Location01Icon} size={14} color={c} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--slate)', marginTop: 2 }}>{count} event{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--slate)" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <div style={{ background: 'linear-gradient(180deg, var(--ink-2) 0%, var(--ink) 100%)', borderTop: '1px solid rgba(168,85,247,0.1)', borderBottom: '1px solid rgba(168,85,247,0.1)', padding: '56px 0', margin: '64px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: -150, right: -100, opacity: 0.7 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
              <HugeiconsIcon icon={ZapIcon} size={12} color="var(--amber)" /> Simple Process
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#fff' }}>How EventMasters Works</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 520 }}>
            {[
              { icon: Search01Icon, num: '01', title: 'Discover events', desc: 'Browse across all 37 states. Filter by category, date, or location.', color: 'var(--purple-bright)' },
              { icon: Ticket01Icon, num: '02', title: 'Pick your tickets', desc: 'Choose Regular, VIP, or VVIP. See real-time availability instantly.', color: 'var(--pink-bright)' },
              { icon: Shield01Icon, num: '03', title: 'Pay securely', desc: 'Card, bank transfer, USSD, or mobile money via Flutterwave.', color: 'var(--amber)' },
              { icon: QrCode01Icon, num: '04', title: 'Show up & scan', desc: 'QR ticket arrives instantly. Show it at the gate — no printing needed.', color: 'var(--green)' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', paddingBottom: 24 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${step.color}18`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: step.color }}>{step.num}</span>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${step.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HugeiconsIcon icon={step.icon} size={20} color={step.color} />
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', marginBottom: 4 }}>{step.title}</p>
                  <p style={{ color: 'var(--slate)', fontSize: '0.83rem', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
                {i < 3 && <div style={{ position: 'absolute', left: 17, top: 42, width: 1, bottom: 0, background: 'rgba(168,85,247,0.2)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ LIST EVENT CTA ═══════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 20px 64px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.07), rgba(255,179,0,0.06))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 24, padding: 'clamp(24px,5vw,40px)',
          display: 'flex', flexDirection: 'column', gap: 20,
          position: 'relative', overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="orb orb-purple" style={{ width: 300, height: 300, top: -100, right: -50, opacity: 0.6 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#fff', marginBottom: 8 }}>
              Want to list your event?
            </h2>
            <p style={{ color: 'var(--slate)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 420 }}>
              We manually verify every event. Contact us and we'll have your event live within 24 hours.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer" className="btn btn-green">
              <HugeiconsIcon icon={WhatsappIcon} size={17} /> WhatsApp Us
            </a>
            <a href="mailto:samuelivere92@gmail.com" className="btn btn-ghost">
              <HugeiconsIcon icon={Mail01Icon} size={15} /> Email Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
