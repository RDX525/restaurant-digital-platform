-- Phase 3: QR table ordering

create table if not exists restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  location_id uuid not null references restaurant_locations(id) on delete cascade,
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists table_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references restaurant_tables(id) on delete cascade,
  token text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  location_id uuid not null references restaurant_locations(id) on delete cascade,
  table_id uuid not null references restaurant_tables(id) on delete cascade,
  token_id uuid not null references table_qr_tokens(id) on delete cascade,
  session_token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  location_id uuid not null references restaurant_locations(id) on delete cascade,
  table_id uuid not null references restaurant_tables(id) on delete cascade,
  token_id uuid not null references table_qr_tokens(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create table if not exists restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  location_id uuid references restaurant_locations(id) on delete set null,
  table_id uuid references restaurant_tables(id) on delete set null,
  session_id uuid references table_sessions(id) on delete set null,
  order_type text not null check (order_type in ('pickup', 'delivery', 'dine_in')),
  status text not null default 'placed',
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  placed_at timestamptz not null default now()
);

create index if not exists idx_locations_restaurant on restaurant_locations(restaurant_id);
create index if not exists idx_tables_restaurant on restaurant_tables(restaurant_id);
create index if not exists idx_tables_location on restaurant_tables(location_id);
create index if not exists idx_qr_tokens_table on table_qr_tokens(table_id);
create index if not exists idx_qr_tokens_token on table_qr_tokens(token);
create index if not exists idx_table_sessions_token on table_sessions(session_token);
create index if not exists idx_scan_events_table on qr_scan_events(table_id);
create index if not exists idx_scan_events_restaurant on qr_scan_events(restaurant_id);
create index if not exists idx_orders_table on restaurant_orders(table_id);
create index if not exists idx_orders_restaurant on restaurant_orders(restaurant_id);

alter table restaurant_locations enable row level security;
alter table restaurant_tables enable row level security;
alter table table_qr_tokens enable row level security;
alter table table_sessions enable row level security;
alter table qr_scan_events enable row level security;
alter table restaurant_orders enable row level security;

create policy "Public read locations" on restaurant_locations for select using (true);
create policy "Public read tables" on restaurant_tables for select using (true);
create policy "Public read qr tokens" on table_qr_tokens for select using (true);
create policy "Allow location writes for demo" on restaurant_locations for all using (true) with check (true);
create policy "Allow table writes for demo" on restaurant_tables for all using (true) with check (true);
create policy "Allow qr token writes for demo" on table_qr_tokens for all using (true) with check (true);
create policy "Allow session writes for demo" on table_sessions for all using (true) with check (true);
create policy "Allow scan writes for demo" on qr_scan_events for all using (true) with check (true);
create policy "Allow order writes for demo" on restaurant_orders for all using (true) with check (true);
create policy "Public read orders" on restaurant_orders for select using (true);

-- Demo seed
insert into restaurant_locations (id, restaurant_id, name)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000001',
  'Queen Street Dining Room'
)
on conflict (id) do nothing;

insert into restaurant_tables (id, restaurant_id, location_id, label, sort_order)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000301',
    'Table 1',
    0
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000301',
    'Table 2',
    1
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000301',
    'Table 3',
    2
  )
on conflict (id) do nothing;

insert into table_qr_tokens (id, table_id, token)
values
  (
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000401',
    'demo-t1-qrt-000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000402',
    'demo-t2-qrt-000000000002'
  ),
  (
    '00000000-0000-4000-8000-000000000503',
    '00000000-0000-4000-8000-000000000403',
    'demo-t3-qrt-000000000003'
  )
on conflict (id) do nothing;
