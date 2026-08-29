-- Phase 1: Payment integration

create table if not exists payment_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references restaurant_orders(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  provider text not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'NZD',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  provider_session_id text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null references payment_sessions(id) on delete cascade,
  order_id uuid not null references restaurant_orders(id) on delete cascade,
  provider text not null,
  provider_transaction_id text not null,
  transaction_type text not null check (transaction_type in ('charge', 'refund')),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'NZD',
  created_at timestamptz not null default now()
);

create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payment_session_id uuid references payment_sessions(id) on delete set null,
  order_id uuid references restaurant_orders(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

create unique index if not exists idx_payment_sessions_idempotency
  on payment_sessions(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_payment_sessions_order on payment_sessions(order_id);
create index if not exists idx_payment_transactions_order on payment_transactions(order_id);
create index if not exists idx_payment_transactions_provider_ref
  on payment_transactions(provider, provider_transaction_id);

alter table payment_sessions enable row level security;
alter table payment_transactions enable row level security;
alter table payment_webhook_events enable row level security;

create policy "Allow payment writes for demo" on payment_sessions for all using (true) with check (true);
create policy "Allow transaction writes for demo" on payment_transactions for all using (true) with check (true);
create policy "Allow webhook writes for demo" on payment_webhook_events for all using (true) with check (true);
