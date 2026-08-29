-- P2: Staff invites, audit logs, reservation slot capacity enforcement

create table if not exists restaurant_invites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'staff')),
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurant_invites_restaurant
  on restaurant_invites(restaurant_id);

create index if not exists idx_restaurant_invites_pending_email
  on restaurant_invites(restaurant_id, lower(email))
  where accepted_at is null and revoked_at is null;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  actor_user_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_restaurant_created
  on audit_logs(restaurant_id, created_at desc);

alter table restaurant_invites enable row level security;
alter table audit_logs enable row level security;

create policy "Members read invites"
  on restaurant_invites for select
  using (public.is_restaurant_member(restaurant_id));

create policy "Members manage invites"
  on restaurant_invites for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members read audit logs"
  on audit_logs for select
  using (public.is_restaurant_member(restaurant_id));

-- Server writes audit rows via service role after permission checks.

create or replace function public.enforce_reservation_slot_capacity()
returns trigger
language plpgsql
as $$
declare
  max_covers integer;
  current_covers integer;
begin
  if NEW.status not in ('pending', 'confirmed') then
    return NEW;
  end if;

  select rs.max_covers_per_slot
    into max_covers
  from reservation_settings rs
  where rs.restaurant_id = NEW.restaurant_id;

  if max_covers is null then
    return NEW;
  end if;

  select coalesce(sum(r.guest_count), 0)
    into current_covers
  from reservations r
  where r.restaurant_id = NEW.restaurant_id
    and r.reservation_date = NEW.reservation_date
    and r.reservation_time = NEW.reservation_time
    and r.status in ('pending', 'confirmed')
    and (TG_OP = 'INSERT' or r.id <> NEW.id);

  if current_covers + NEW.guest_count > max_covers then
    raise exception 'Reservation slot capacity exceeded'
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists reservations_enforce_slot_capacity on reservations;

create trigger reservations_enforce_slot_capacity
  before insert or update of status, guest_count, reservation_date, reservation_time
  on reservations
  for each row
  execute function public.enforce_reservation_slot_capacity();
