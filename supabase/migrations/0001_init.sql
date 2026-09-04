-- ============================================================
-- EVENT MASTER — Initial Schema
-- Countries -> States -> Events -> Ticket Types -> Orders -> Tickets
-- ============================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- GEOGRAPHY (built so adding a new country later is just a row)
-- ----------------------------------------------------------------
create table countries (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,            -- 'Nigeria'
  code text not null unique,            -- 'NG'
  currency text not null,               -- 'NGN'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table states (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid not null references countries(id) on delete cascade,
  name text not null,                   -- 'Lagos', 'Rivers', 'FCT'
  slug text not null,
  created_at timestamptz not null default now(),
  unique (country_id, slug)
);

-- ----------------------------------------------------------------
-- PROFILES (extends Supabase auth.users)
-- ----------------------------------------------------------------
create type user_role as enum ('buyer', 'organizer', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'buyer',
  organizer_business_name text,
  organizer_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------
create type event_status as enum ('pending', 'approved', 'rejected', 'live', 'completed', 'cancelled');

create table event_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,            -- 'Concert', 'Comedy', 'Conference', 'Festival', 'Sport', 'Party'
  slug text not null unique
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid not null references profiles(id) on delete cascade,
  country_id uuid not null references countries(id),
  state_id uuid not null references states(id),
  category_id uuid references event_categories(id),
  title text not null,
  slug text not null unique,
  description text,
  venue_name text,
  address text,
  banner_url text,
  start_at timestamptz not null,
  end_at timestamptz,
  status event_status not null default 'pending',
  rejection_reason text,
  is_featured boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_state on events(state_id);
create index idx_events_status on events(status);
create index idx_events_start_at on events(start_at);

-- ----------------------------------------------------------------
-- TICKET TYPES  (admin can override price on ANY of these)
-- ----------------------------------------------------------------
create table ticket_types (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,                   -- 'Regular', 'VIP', 'Table for 4'
  description text,
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2),         -- set when admin overrides, to preserve history
  quantity_total integer not null check (quantity_total >= 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  is_active boolean not null default true,
  price_last_edited_by uuid references profiles(id),
  price_last_edited_at timestamptz,
  created_at timestamptz not null default now(),
  check (quantity_sold <= quantity_total)
);

create index idx_ticket_types_event on ticket_types(event_id);

-- ----------------------------------------------------------------
-- ORDERS & TICKETS
-- ----------------------------------------------------------------
create type payment_provider as enum ('flutterwave', 'stripe');
create type order_status as enum ('pending', 'paid', 'failed', 'refunded');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles(id),       -- nullable: guest checkout allowed
  buyer_email text not null,
  buyer_name text not null,
  buyer_phone text,
  event_id uuid not null references events(id),
  provider payment_provider not null,
  provider_reference text unique,              -- tx_ref / payment_intent id
  currency text not null,
  amount_total numeric(12,2) not null,
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index idx_orders_provider_ref on orders(provider_reference);
create index idx_orders_event on orders(event_id);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  ticket_type_id uuid not null references ticket_types(id),
  unit_price numeric(12,2) not null,    -- price AT time of purchase
  quantity integer not null check (quantity > 0)
);

-- Individual scannable tickets (one row per seat/admission)
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  ticket_code text not null unique,     -- short human + QR-encodable code
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- PRICE EDIT AUDIT LOG (admin price tweaks are tracked)
-- ----------------------------------------------------------------
create table price_edit_log (
  id uuid primary key default uuid_generate_v4(),
  ticket_type_id uuid not null references ticket_types(id) on delete cascade,
  edited_by uuid not null references profiles(id),
  old_price numeric(12,2) not null,
  new_price numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table ticket_types enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table tickets enable row level security;
alter table price_edit_log enable row level security;
alter table countries enable row level security;
alter table states enable row level security;
alter table event_categories enable row level security;

-- Public read for geography/categories
create policy "public read countries" on countries for select using (true);
create policy "public read states" on states for select using (true);
create policy "public read categories" on event_categories for select using (true);

-- Profiles: users manage their own; admins read all
create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "admins read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Events: public sees only approved/live; organizers see own; admins see all
create policy "public read live events" on events for select using (status in ('approved','live','completed'));
create policy "organizers read own events" on events for select using (organizer_id = auth.uid());
create policy "admins read all events" on events for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "organizers insert events" on events for insert with check (
  organizer_id = auth.uid()
  and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('organizer','admin'))
);
create policy "organizers update own pending events" on events for update using (
  organizer_id = auth.uid()
);
create policy "admins update any event" on events for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Ticket types: public reads active ones for approved events; organizer/admin manage
create policy "public read active ticket types" on ticket_types for select using (
  is_active = true
  and exists (select 1 from events e where e.id = event_id and e.status in ('approved','live'))
);
create policy "organizers manage own ticket types" on ticket_types for all using (
  exists (select 1 from events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "admins manage all ticket types" on ticket_types for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Orders/tickets: buyers see own; organizers see orders for their events; admins see all
create policy "buyers read own orders" on orders for select using (buyer_id = auth.uid());
create policy "organizers read event orders" on orders for select using (
  exists (select 1 from events e where e.id = event_id and e.organizer_id = auth.uid())
);
create policy "admins read all orders" on orders for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "price log admin only" on price_edit_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================
-- SEED: Nigeria + 36 states + FCT + categories
-- ============================================================
insert into countries (name, code, currency) values ('Nigeria', 'NG', 'NGN');

insert into states (country_id, name, slug)
select id, s.name, s.slug from countries,
  (values
    ('Abia','abia'),('Adamawa','adamawa'),('Akwa Ibom','akwa-ibom'),('Anambra','anambra'),
    ('Bauchi','bauchi'),('Bayelsa','bayelsa'),('Benue','benue'),('Borno','borno'),
    ('Cross River','cross-river'),('Delta','delta'),('Ebonyi','ebonyi'),('Edo','edo'),
    ('Ekiti','ekiti'),('Enugu','enugu'),('FCT - Abuja','fct-abuja'),('Gombe','gombe'),
    ('Imo','imo'),('Jigawa','jigawa'),('Kaduna','kaduna'),('Kano','kano'),
    ('Katsina','katsina'),('Kebbi','kebbi'),('Kogi','kogi'),('Kwara','kwara'),
    ('Lagos','lagos'),('Nasarawa','nasarawa'),('Niger','niger'),('Ogun','ogun'),
    ('Ondo','ondo'),('Osun','osun'),('Oyo','oyo'),('Plateau','plateau'),
    ('Rivers','rivers'),('Sokoto','sokoto'),('Taraba','taraba'),('Yobe','yobe'),
    ('Zamfara','zamfara')
  ) as s(name, slug)
where countries.code = 'NG';

insert into event_categories (name, slug) values
  ('Concert','concert'),
  ('Comedy Show','comedy-show'),
  ('Festival','festival'),
  ('Conference','conference'),
  ('Party','party'),
  ('Sport','sport'),
  ('Theatre','theatre'),
  ('Conference & Workshop','conference-workshop'),
  ('Religious','religious'),
  ('Other','other');
