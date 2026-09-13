-- ══════════════════════════════════════════
-- 1. PROMO CODES
-- ══════════════════════════════════════════
create table if not exists promo_codes (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events(id) on delete cascade,
  code          text not null,
  discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric(10,2) not null,
  max_uses      int,
  uses          int not null default 0,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create unique index if not exists promo_codes_event_code_idx on promo_codes (event_id, upper(code));

-- RLS
alter table promo_codes enable row level security;
create policy "Admin manages promo codes" on promo_codes
  using (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com')
  with check (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com');
create policy "Public can read active promo codes" on promo_codes
  for select using (is_active = true);

-- ══════════════════════════════════════════
-- 2. MANUAL ATTENDEES
-- ══════════════════════════════════════════
create table if not exists manual_attendees (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id) on delete set null,
  full_name     text not null,
  email         text,
  phone         text,
  quantity      int not null default 1,
  payment_method text default 'cash',
  notes         text,
  ticket_code   text unique default 'MA-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  checked_in    boolean not null default false,
  checked_in_at timestamptz,
  created_at    timestamptz not null default now()
);
alter table manual_attendees enable row level security;
create policy "Admin manages manual attendees" on manual_attendees
  using (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com')
  with check (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com');

-- ══════════════════════════════════════════
-- 3. WAITLIST
-- ══════════════════════════════════════════
create table if not exists waitlist (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  phone         text,
  notified      boolean not null default false,
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table waitlist enable row level security;
create policy "Anyone can join waitlist" on waitlist
  for insert with check (true);
create policy "Admin reads waitlist" on waitlist
  for select using (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com');

-- ══════════════════════════════════════════
-- 4. CHECK-IN LOG (for scanning)
-- ══════════════════════════════════════════
-- tickets table already has checked_in boolean
-- Add check-in log for history
create table if not exists checkin_log (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references tickets(id) on delete cascade,
  ticket_code text not null,
  event_id    uuid references events(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by text
);
alter table checkin_log enable row level security;
create policy "Admin manages checkins" on checkin_log
  using (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com')
  with check (auth.jwt() ->> 'email' = 'samuelivere92@gmail.com');

-- Mark ticket as checked in
create or replace function check_in_ticket(p_ticket_code text, p_event_id uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  v_order_item order_items%rowtype;
begin
  -- Find ticket
  select * into v_ticket from tickets where ticket_code = p_ticket_code;
  if not found then
    return json_build_object('success', false, 'error', 'Ticket not found');
  end if;
  if v_ticket.checked_in then
    return json_build_object('success', false, 'error', 'Already checked in', 'checked_in_at', v_ticket.checked_in_at);
  end if;
  -- Mark checked in
  update tickets set checked_in = true, checked_in_at = now() where id = v_ticket.id;
  insert into checkin_log (ticket_id, ticket_code, event_id) values (v_ticket.id, p_ticket_code, p_event_id);
  return json_build_object('success', true, 'ticket_code', p_ticket_code);
end;
$$;

-- ══════════════════════════════════════════
-- 5. PROMO CODE VALIDATION FUNCTION
-- ══════════════════════════════════════════
create or replace function validate_promo_code(p_code text, p_event_id uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_promo promo_codes%rowtype;
begin
  select * into v_promo
  from promo_codes
  where upper(code) = upper(p_code)
    and (event_id = p_event_id or event_id is null)
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses < max_uses);

  if not found then
    return json_build_object('valid', false, 'error', 'Invalid or expired promo code');
  end if;

  return json_build_object(
    'valid', true,
    'id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value
  );
end;
$$;

-- ══════════════════════════════════════════
-- 6. INDEX for performance
-- ══════════════════════════════════════════
create index if not exists idx_orders_event_id   on orders(event_id);
create index if not exists idx_orders_status      on orders(status);
create index if not exists idx_tickets_ticket_code on tickets(ticket_code);
