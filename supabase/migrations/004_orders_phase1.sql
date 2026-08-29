-- Phase 1: Direct ordering

alter table restaurant_orders
  add column if not exists order_number text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists idempotency_key text,
  add column if not exists subtotal numeric(10,2) not null default 0,
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists delivery_fee numeric(10,2) not null default 0,
  add column if not exists tax_amount numeric(10,2) not null default 0,
  add column if not exists total numeric(10,2) not null default 0,
  add column if not exists customer_email text,
  add column if not exists table_label text,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists estimated_ready_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Migrate legacy status values
update restaurant_orders set status = 'new' where status = 'placed';

alter table restaurant_orders drop constraint if exists restaurant_orders_status_check;
alter table restaurant_orders
  add constraint restaurant_orders_status_check
  check (status in ('new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'));

alter table restaurant_orders drop constraint if exists restaurant_orders_payment_status_check;
alter table restaurant_orders
  add constraint restaurant_orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

create unique index if not exists idx_orders_idempotency
  on restaurant_orders(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_orders_customer_email on restaurant_orders(customer_email);
create index if not exists idx_orders_status on restaurant_orders(status);
create index if not exists idx_orders_placed_at on restaurant_orders(placed_at desc);

alter table restaurant_orders alter column status set default 'new';
