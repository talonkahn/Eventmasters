import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Events, Geo } from '../../lib/apiClient';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 7);
}

export default function NewEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countryId, setCountryId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stateId, setStateId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [startAt, setStartAt] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Geo.countries().then((countries) => {
      if (countries[0]) {
        setCountryId(countries[0].id);
        Geo.statesByCountry(countries[0].id).then(setStates);
      }
    });
    Geo.categories().then(setCategories);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !stateId || !startAt || !venueName) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const event = await Events.create({
        organizer_id: user.id,
        country_id: countryId,
        state_id: stateId,
        category_id: categoryId || null,
        title,
        slug: slugify(title),
        description,
        venue_name: venueName,
        address,
        banner_url: bannerUrl || null,
        start_at: new Date(startAt).toISOString(),
        status: 'pending',
      });
      navigate(`/organizer/events/${event.id}`);
    } catch (err) {
      setError(err.message || 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Submit an event</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 24 }}>
        Your event goes live after admin review. You can add ticket types right after submitting.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Event title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>State *</label>
            <select value={stateId} onChange={(e) => setStateId(e.target.value)} required>
              <option value="">Select state</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Venue name *</label>
          <input value={venueName} onChange={(e) => setVenueName(e.target.value)} required />
        </div>

        <div className="field">
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="field">
          <label>Date & time *</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>

        <div className="field">
          <label>Banner image URL</label>
          <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
        </div>

        {error && <p style={{ color: 'var(--coral)', fontSize: '0.88rem', marginBottom: 14 }}>{error}</p>}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}
