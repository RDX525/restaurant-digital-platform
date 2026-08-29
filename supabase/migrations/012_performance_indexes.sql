-- Phase 1 performance: composite indexes for common dashboard and analytics queries

create index if not exists idx_orders_restaurant_placed_at
  on restaurant_orders(restaurant_id, placed_at desc);

create index if not exists idx_reservations_restaurant_guest_email
  on reservations(restaurant_id, guest_email);

create index if not exists idx_reservations_restaurant_date
  on reservations(restaurant_id, reservation_date);

create index if not exists idx_qr_scans_restaurant_scanned_at
  on qr_scan_events(restaurant_id, scanned_at desc);

create index if not exists idx_qr_scans_table_scanned_at
  on qr_scan_events(table_id, scanned_at desc);

create index if not exists idx_table_qr_tokens_table_active
  on table_qr_tokens(table_id)
  where is_active = true and revoked_at is null;

create index if not exists idx_restaurant_customers_updated_at
  on restaurant_customers(restaurant_id, updated_at desc);

create index if not exists idx_reservations_restaurant_created_at
  on reservations(restaurant_id, created_at desc);
