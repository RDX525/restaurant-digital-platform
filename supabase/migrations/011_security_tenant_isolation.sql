-- Phase 1 security: tenant membership and hardened RLS

create table if not exists restaurant_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists idx_restaurant_members_restaurant
  on restaurant_members(restaurant_id);

alter table restaurant_members enable row level security;

create policy "Members can read own memberships"
  on restaurant_members for select
  using (auth.uid() = user_id);

create or replace function public.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from restaurant_members
    where user_id = auth.uid()
      and restaurant_id = target_restaurant_id
  );
$$;

-- Remove permissive demo write policies
drop policy if exists "Allow all menu writes for demo" on menus;
drop policy if exists "Allow all category writes for demo" on menu_categories;
drop policy if exists "Allow all item writes for demo" on menu_items;
drop policy if exists "Allow all modifier group writes for demo" on modifier_groups;
drop policy if exists "Allow all modifier writes for demo" on modifiers;
drop policy if exists "Allow gallery writes for demo" on restaurant_gallery_images;
drop policy if exists "Allow domain writes for demo" on restaurant_domains;
drop policy if exists "Allow location writes for demo" on restaurant_locations;
drop policy if exists "Allow table writes for demo" on restaurant_tables;
drop policy if exists "Allow qr token writes for demo" on table_qr_tokens;
drop policy if exists "Allow table session writes for demo" on table_sessions;
drop policy if exists "Allow qr scan writes for demo" on qr_scan_events;
drop policy if exists "Allow order writes for demo" on restaurant_orders;
drop policy if exists "Allow payment writes for demo" on payment_sessions;
drop policy if exists "Allow payment transaction writes for demo" on payment_transactions;
drop policy if exists "Allow payment webhook writes for demo" on payment_webhook_events;
drop policy if exists "Allow reservation settings writes for demo" on reservation_settings;
drop policy if exists "Allow reservation writes for demo" on reservations;
drop policy if exists "Allow customer writes for demo" on restaurant_customers;
drop policy if exists "Allow notification preference writes for demo" on notification_preferences;
drop policy if exists "Allow notification log writes for demo" on notification_logs;
drop policy if exists "Allow analytics events for demo" on analytics_events;
drop policy if exists "Allow ai insights for demo" on ai_insights;

-- Member-scoped writes for dashboard-managed tenant data
create policy "Members manage menus"
  on menus for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage gallery"
  on restaurant_gallery_images for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage domains"
  on restaurant_domains for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage locations"
  on restaurant_locations for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage tables"
  on restaurant_tables for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage orders"
  on restaurant_orders for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage payment sessions"
  on payment_sessions for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage reservations"
  on reservations for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage reservation settings"
  on reservation_settings for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage customers"
  on restaurant_customers for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage notification preferences"
  on notification_preferences for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage notification logs"
  on notification_logs for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage analytics events"
  on analytics_events for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

create policy "Members manage ai insights"
  on ai_insights for all
  using (public.is_restaurant_member(restaurant_id))
  with check (public.is_restaurant_member(restaurant_id));

-- Public customer flows: allow inserts only
create policy "Public can create orders"
  on restaurant_orders for insert
  with check (true);

create policy "Public can create reservations"
  on reservations for insert
  with check (true);

create policy "Public can create analytics events"
  on analytics_events for insert
  with check (true);

create policy "Public can create qr scans"
  on qr_scan_events for insert
  with check (true);

create policy "Public can create table sessions"
  on table_sessions for insert
  with check (true);

-- Storage: remove open writes; server uses service role after auth checks
drop policy if exists "Allow menu image uploads for demo" on storage.objects;
drop policy if exists "Allow menu image updates for demo" on storage.objects;
drop policy if exists "Allow menu image deletes for demo" on storage.objects;
drop policy if exists "Allow restaurant asset uploads for demo" on storage.objects;
drop policy if exists "Allow restaurant asset updates for demo" on storage.objects;
drop policy if exists "Allow restaurant asset deletes for demo" on storage.objects;
