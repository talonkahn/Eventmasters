-- ============================================================
-- Auto-create profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Atomic ticket reservation: prevents overselling under concurrency.
-- Call this inside the payment-confirmation edge function AFTER
-- the provider confirms payment succeeded.
-- ============================================================
create or replace function public.confirm_ticket_sale(
  p_ticket_type_id uuid,
  p_quantity integer
) returns boolean as $$
declare
  v_updated integer;
begin
  update ticket_types
  set quantity_sold = quantity_sold + p_quantity
  where id = p_ticket_type_id
    and quantity_sold + p_quantity <= quantity_total
  returning 1 into v_updated;

  return v_updated is not null;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Admin price override, with audit trail written in the same transaction
-- ============================================================
create or replace function public.admin_update_ticket_price(
  p_ticket_type_id uuid,
  p_new_price numeric,
  p_note text default null
) returns void as $$
declare
  v_old_price numeric;
  v_caller_role user_role;
begin
  select role into v_caller_role from profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can override ticket prices';
  end if;

  select price into v_old_price from ticket_types where id = p_ticket_type_id;

  update ticket_types
  set price = p_new_price,
      original_price = coalesce(original_price, v_old_price),
      price_last_edited_by = auth.uid(),
      price_last_edited_at = now()
  where id = p_ticket_type_id;

  insert into price_edit_log (ticket_type_id, edited_by, old_price, new_price, note)
  values (p_ticket_type_id, auth.uid(), v_old_price, p_new_price, p_note);
end;
$$ language plpgsql security definer;
