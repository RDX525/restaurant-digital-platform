-- Phase 1: Transactional notifications

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  scope text not null check (scope in ('restaurant', 'customer')),
  customer_email text,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default true,
  type_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_notification_preferences_unique
  on notification_preferences (restaurant_id, scope, coalesce(customer_email, ''));

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  entity_type text not null check (entity_type in ('order', 'reservation')),
  entity_id uuid not null,
  notification_type text not null,
  channel text not null check (channel in ('email', 'sms')),
  recipient text not null,
  subject text,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'retrying')),
  provider text not null,
  provider_message_id text,
  error_message text,
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 3 check (max_retries >= 0),
  next_retry_at timestamptz,
  idempotency_key text not null unique,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_logs_restaurant
  on notification_logs(restaurant_id, created_at desc);

create index if not exists idx_notification_logs_retry
  on notification_logs(status, next_retry_at)
  where status in ('failed', 'retrying');

create index if not exists idx_notification_preferences_restaurant
  on notification_preferences(restaurant_id);

insert into notification_preferences (restaurant_id, scope, customer_email, email_enabled, sms_enabled)
values ('00000000-0000-4000-8000-000000000001', 'restaurant', null, true, true)
on conflict do nothing;

alter table notification_preferences enable row level security;
alter table notification_logs enable row level security;

create policy "Allow notification preferences for demo" on notification_preferences
  for all using (true) with check (true);

create policy "Allow notification logs for demo" on notification_logs
  for all using (true) with check (true);
