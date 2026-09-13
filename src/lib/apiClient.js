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

// ---------------- Promo Codes ----------------
export const PromoCodes = {
  listForEvent: (eventId) =>
    supabase.from('promo_codes').select('*').eq('event_id', eventId).order('created_at', { ascending: false }).then(handle),

  create: (payload) => supabase.from('promo_codes').insert(payload).select().single().then(handle),

  toggle: (id, is_active) => supabase.from('promo_codes').update({ is_active }).eq('id', id).then(handle),

  delete: (id) => supabase.from('promo_codes').delete().eq('id', id).then(handle),

  validate: (code, eventId) =>
    supabase.rpc('validate_promo_code', { p_code: code, p_event_id: eventId }).then(handle),

  incrementUse: (id) =>
    supabase.rpc('increment_promo_use', { p_promo_id: id }).then(handle),
};

// ---------------- Manual Attendees ----------------
export const ManualAttendees = {
  listForEvent: (eventId) =>
    supabase.from('manual_attendees').select('*, ticket_types(name)').eq('event_id', eventId).order('created_at', { ascending: false }).then(handle),

  create: (payload) => supabase.from('manual_attendees').insert(payload).select().single().then(handle),

  checkIn: (id) =>
    supabase.from('manual_attendees').update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq('id', id).then(handle),

  delete: (id) => supabase.from('manual_attendees').delete().eq('id', id).then(handle),
};

// ---------------- Waitlist ----------------
export const Waitlist = {
  join: (payload) => supabase.from('waitlist').insert(payload).select().single().then(handle),

  listForEvent: (eventId) =>
    supabase.from('waitlist').select('*').eq('event_id', eventId).order('created_at').then(handle),

  markNotified: (id) =>
    supabase.from('waitlist').update({ notified: true, notified_at: new Date().toISOString() }).eq('id', id).then(handle),
};

// ---------------- Check-in ----------------
export const CheckIn = {
  scanTicket: (ticketCode, eventId) =>
    supabase.rpc('check_in_ticket', { p_ticket_code: ticketCode, p_event_id: eventId }).then(handle),

  listForEvent: (eventId) =>
    supabase.from('checkin_log').select('*').eq('event_id', eventId).order('checked_in_at', { ascending: false }).then(handle),

  stats: (eventId) =>
    supabase.from('tickets')
      .select('checked_in', { count: 'exact' })
      .eq('checked_in', true)
      .then(handle),
};

// ---------------- Analytics ----------------
export const Analytics = {
  eventRevenue: async (eventId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('amount_total, created_at, status')
      .eq('event_id', eventId)
      .eq('status', 'paid');
    if (error) throw new Error(error.message);
    return data;
  },

  ticketsSoldByType: async (eventId) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('quantity, unit_price, ticket_types(name)')
      .eq('orders.event_id', eventId);
    if (error) throw new Error(error.message);
    return data;
  },

  topEvents: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('event_id, amount_total, events(title, start_at)')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data;
  },
};
