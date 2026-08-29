-- Phase 1 Menu Management Schema

create extension if not exists "pgcrypto";

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  photo_url text,
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  dietary_info text[] not null default '{}',
  is_available boolean not null default true,
  is_sold_out boolean not null default false,
  is_popular boolean not null default false,
  is_recommended boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists modifier_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  name text not null,
  is_required boolean not null default false,
  min_selections integer not null default 0 check (min_selections >= 0),
  max_selections integer not null default 1 check (max_selections >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_restaurant on menus(restaurant_id);
create index if not exists idx_categories_menu on menu_categories(menu_id);
create index if not exists idx_items_category on menu_items(category_id);
create index if not exists idx_modifier_groups_item on modifier_groups(menu_item_id);
create index if not exists idx_modifiers_group on modifiers(group_id);

-- Demo seed data
insert into restaurants (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'Demo Restaurant', 'demo-restaurant')
on conflict (id) do nothing;

-- Storage bucket for menu item photos
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- RLS
alter table restaurants enable row level security;
alter table menus enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifiers enable row level security;

create policy "Public read restaurants" on restaurants for select using (true);
create policy "Public read menus" on menus for select using (true);
create policy "Public read categories" on menu_categories for select using (true);
create policy "Public read items" on menu_items for select using (true);
create policy "Public read modifier groups" on modifier_groups for select using (true);
create policy "Public read modifiers" on modifiers for select using (true);

create policy "Allow all menu writes for demo" on menus for all using (true) with check (true);
create policy "Allow all category writes for demo" on menu_categories for all using (true) with check (true);
create policy "Allow all item writes for demo" on menu_items for all using (true) with check (true);
create policy "Allow all modifier group writes for demo" on modifier_groups for all using (true) with check (true);
create policy "Allow all modifier writes for demo" on modifiers for all using (true) with check (true);

create policy "Public read menu images" on storage.objects
  for select using (bucket_id = 'menu-images');

create policy "Allow menu image uploads for demo" on storage.objects
  for insert with check (bucket_id = 'menu-images');

create policy "Allow menu image updates for demo" on storage.objects
  for update using (bucket_id = 'menu-images');

create policy "Allow menu image deletes for demo" on storage.objects
  for delete using (bucket_id = 'menu-images');

-- Realtime
alter publication supabase_realtime add table menus;
alter publication supabase_realtime add table menu_categories;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table modifier_groups;
alter publication supabase_realtime add table modifiers;
