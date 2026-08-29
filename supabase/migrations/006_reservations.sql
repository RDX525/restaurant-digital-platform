-- Phase 1: Reservations

create table if not exists reservation_settings (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  timezone text not null default 'Pacific/Auckland',
  reservation_hours jsonb not null default '{}'::jsonb,
  max_party_size integer not null default 12 check (max_party_size > 0),
  booking_advance_days integer not null default 60 check (booking_advance_days >= 1),
  booking_min_notice_hours integer not null default 2 check (booking_min_notice_hours >= 0),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes > 0),
  max_covers_per_slot integer not null default 24 check (max_covers_per_slot > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guest_count integer not null check (guest_count > 0),
  reservation_date date not null,
  reservation_time time not null,
  timezone text not null default 'Pacific/Auckland',
  special_request text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  rescheduled_at timestamptz,
  previous_date date,
  previous_time time,
  notifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_restaurant on reservations(restaurant_id);
create index if not exists idx_reservations_date on reservations(restaurant_id, reservation_date);
create index if not exists idx_reservations_status on reservations(status);
create index if not exists idx_reservations_slot
  on reservations(restaurant_id, reservation_date, reservation_time);

alter table reservation_settings enable row level security;
alter table reservations enable row level security;

create policy "Allow reservation settings for demo" on reservation_settings for all using (true) with check (true);
create policy "Allow reservation writes for demo" on reservations for all using (true) with check (true);
create policy "Public read reservations" on reservations for select using (true);

insert into reservation_settings (restaurant_id, timezone, reservation_hours, max_party_size, booking_advance_days)
values (
  '00000000-0000-4000-8000-000000000001',
  'Pacific/Auckland',
  '{
    "monday": {"open": "17:00", "close": "21:30", "closed": false},
    "tuesday": {"open": "17:00", "close": "21:30", "closed": false},
    "wednesday": {"open": "17:00", "close": "21:30", "closed": false},
    "thursday": {"open": "17:00", "close": "21:30", "closed": false},
    "friday": {"open": "17:00", "close": "22:00", "closed": false},
    "saturday": {"open": "12:00", "close": "22:00", "closed": false},
    "sunday": {"open": "12:00", "close": "20:30", "closed": false}
  }'::jsonb,
  12,
  60
)
on conflict (restaurant_id) do nothing;
