import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import { Events, Geo } from '../lib/apiClient';
import EventCard from '../components/EventCard';

const CATS = [
  { label: 'All', slug: '' },
  { label: 'Concerts', slug: 'concert' },
  { label: 'Comedy', slug: 'comedy-show' },
  { label: 'Festivals', slug: 'festival' },
  { label: 'Parties', slug: 'party' },
  { label: 'Conferences', slug: 'conference-workshop' },
  { label: 'Theatre', slug: 'theatre' },
];

export default function BrowseEvents() {
  const [params, setParams] = useSearchParams();
  const [events,     setEvents]     = useState([]);
  const [states,     setStates]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState(params.get('search') || '');

  const stateId = params.get('state')    || '';
  const catSlug = params.get('category') || '';

  useEffect(() => {
    Geo.countries().then(async c => {
      if (c[0]) {
        const [st, cat] = await Promise.all([Geo.statesByCountry(c[0].id), Geo.categories()]);
        setStates(st); setCategories(cat);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const catObj = categories.find(c => c.slug === catSlug);
    Events.list({ stateId: stateId || undefined, categoryId: catObj?.id, search: search || undefined, limit: 80 })
      .then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, [stateId, catSlug, search, categories]);

  const setCat = slug => {
    const n = new URLSearchParams(params);
    slug ? n.set('category', slug) : n.delete('category');
    setParams(n);
  };

  const setStateFilter = val => {
    const n = new URLSearchParams(params);
    val ? n.set('state', val) : n.delete('state');
    setParams(n);
  };

  const heading = catSlug
    ? (CATS.find(c => c.slug === catSlug)?.label ?? 'Events') + ' in Nigeria'
    : stateId ? `Events in ${states.find(s => s.id === stateId)?.name ?? '...'}`
    : 'All Events in Nigeria';

  return (
    <div className="browse-wrap">
      <h1 className="browse-title">{heading}</h1>
      <p className="browse-sub">
        {loading ? 'Loading…' : `${events.length} upcoming event${events.length !== 1 ? 's' : ''}`}
      </p>

      <div className="browse-filters">
        <div className="browse-search">
          <HugeiconsIcon icon={Search01Icon} size={15} color="var(--slate)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…" />
        </div>
        <select value={stateId} onChange={e => setStateFilter(e.target.value)} className="browse-select">
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="cat-pills" style={{ marginBottom: 20 }}>
        {CATS.map(c => (
          <button key={c.slug} className={`cat-pill${catSlug === c.slug ? ' active' : ''}`} onClick={() => setCat(c.slug)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="events-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--slate)' }}>
          <HugeiconsIcon icon={Ticket01Icon} size={44} color="var(--line)" />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '12px 0 4px', color: '#fff' }}>No events found</p>
          <p style={{ fontSize: '0.85rem' }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((e, i) => <EventCard key={e.id} event={e} featured={e.is_featured} index={i} />)}
        </div>
      )}
    </div>
  );
}
