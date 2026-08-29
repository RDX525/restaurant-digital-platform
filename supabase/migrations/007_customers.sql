-- Phase 1: Customer profiles (tenant-scoped, first-party interactions)

create table if not exists restaurant_customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  address text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  total_orders integer not null default 0 check (total_orders >= 0),
  paid_order_count integer not null default 0 check (paid_order_count >= 0),
  total_spend numeric(10, 2) not null default 0 check (total_spend >= 0),
  last_reservation_at timestamptz,
  total_reservations integer not null default 0 check (total_reservations >= 0),
  lifecycle_stage text not null default 'active'
    check (lifecycle_stage in ('active', 'inactive', 'churned')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, email)
);

create index if not exists idx_restaurant_customers_restaurant
  on restaurant_customers(restaurant_id);

create index if not exists idx_restaurant_customers_email
  on restaurant_customers(restaurant_id, email);

create index if not exists idx_restaurant_customers_search
  on restaurant_customers(restaurant_id, lower(name), lower(phone), lower(email));

alter table restaurant_customers enable row level security;

create policy "Allow customer access for demo" on restaurant_customers
  for all using (true) with check (true);
