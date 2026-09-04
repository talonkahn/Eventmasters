import { supabase } from './supabaseClient';

/**
 * apiClient — thin, consistent wrapper around Supabase queries.
 * Keeps the same entity-call shape used across HSPR products
 * (9jatax, campusmarket) so logic reads the same way everywhere.
 */

function handle({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// ---------------- Geography ----------------
export const Geo = {
  countries: () =>
    supabase.from('countries').select('*').eq('is_active', true).order('name').then(handle),

  statesByCountry: (countryId) =>
    supabase.from('states').select('*').eq('country_id', countryId).order('name').then(handle),

  categories: () => supabase.from('event_categories').select('*').order('name').then(handle),
};

// ---------------- Events ----------------
export const Events = {
  /** Public browse: approved/live events, optional filters */
  list: async ({ stateId, categoryId, search, limit = 24, offset = 0 } = {}) => {
    let query = supabase
      .from('events')
      .select(
        `*, states(name, slug), event_categories(name, slug), ticket_types(id, name, price, quantity_total, quantity_sold, is_active)`
      )
      .in('status', ['approved', 'live'])
      .order('start_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (stateId) query = query.eq('state_id', stateId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (search) query = query.ilike('title', `%${search}%`);

    return query.then(handle);
  },

  getBySlug: (slug) =>
    supabase
      .from('events')
      .select(
        `*, states(name, slug), countries(name, code, currency), event_categories(name, slug),
         ticket_types(*), profiles!events_organizer_id_fkey(full_name, organizer_business_name)`
      )
      .eq('slug', slug)
      .single()
      .then(handle),

  /** Organizer: own events, any status */
  listMine: (organizerId) =>
    supabase
      .from('events')
      .select(`*, states(name), event_categories(name), ticket_types(id, name, price, quantity_sold, quantity_total)`)
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })
      .then(handle),

  create: (payload) => supabase.from('events').insert(payload).select().single().then(handle),

  update: (id, payload) =>
    supabase.from('events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single().then(handle),

  /** Admin: all events regardless of status, optional status filter */
  listAll: (status) => {
    let query = supabase
      .from('events')
      .select(`*, states(name), event_categories(name), profiles!events_organizer_id_fkey(full_name, organizer_business_name)`)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    return query.then(handle);
  },

  approve: (id) => supabase.from('events').update({ status: 'approved' }).eq('id', id).then(handle),

  reject: (id, reason) =>
    supabase.from('events').update({ status: 'rejected', rejection_reason: reason }).eq('id', id).then(handle),
};

// ---------------- Ticket Types ----------------
export const TicketTypes = {
  listForEvent: (eventId) =>
    supabase.from('ticket_types').select('*').eq('event_id', eventId).order('price').then(handle),

  create: (payload) => supabase.from('ticket_types').insert(payload).select().single().then(handle),

  update: (id, payload) =>
    supabase.from('ticket_types').update(payload).eq('id', id).select().single().then(handle),

  /** Admin-only price override via the SECURITY DEFINER function (audit-logged) */
  adminSetPrice: (ticketTypeId, newPrice, note) =>
    supabase.rpc('admin_update_ticket_price', {
      p_ticket_type_id: ticketTypeId,
      p_new_price: newPrice,
      p_note: note || null,
    }).then(handle),

  priceHistory: (ticketTypeId) =>
    supabase
      .from('price_edit_log')
      .select('*, profiles(full_name)')
      .eq('ticket_type_id', ticketTypeId)
      .order('created_at', { ascending: false })
      .then(handle),
};

// ---------------- Orders ----------------
export const Orders = {
  create: (payload) => supabase.from('orders').insert(payload).select().single().then(handle),

  addItems: (items) => supabase.from('order_items').insert(items).select().then(handle),

  getByReference: (reference) =>
    supabase.from('orders').select('*, order_items(*, ticket_types(name, event_id))').eq('provider_reference', reference).single().then(handle),

  mine: (buyerId) =>
    supabase
      .from('orders')
      .select(`*, events(title, slug, start_at, banner_url), order_items(*, tickets(*))`)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .then(handle),

  forOrganizerEvent: (eventId) =>
    supabase.from('orders').select('*, order_items(*)').eq('event_id', eventId).eq('status', 'paid').then(handle),
};

// ---------------- Profiles ----------------
export const Profiles = {
  get: (id) => supabase.from('profiles').select('*').eq('id', id).single().then(handle),
  update: (id, payload) => supabase.from('profiles').update(payload).eq('id', id).select().single().then(handle),
  listOrganizers: () => supabase.from('profiles').select('*').eq('role', 'organizer').then(handle),
};
