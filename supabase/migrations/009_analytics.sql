-- Phase 1: Analytics events (funnel metrics; revenue comes from orders table)

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  session_id text,
  path text,
  menu_item_id uuid,
  order_id uuid,
  reservation_id uuid,
  table_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_restaurant_time
  on analytics_events(restaurant_id, occurred_at desc);

create index if not exists idx_analytics_events_type
  on analytics_events(restaurant_id, event_type, occurred_at desc);

alter table analytics_events enable row level security;

create policy "Allow analytics events for demo" on analytics_events
  for all using (true) with check (true);
