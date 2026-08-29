-- Phase 2: Public Restaurant Website

alter table restaurants
  add column if not exists tagline text,
  add column if not exists about_text text,
  add column if not exists logo_url text,
  add column if not exists hero_image_url text,
  add column if not exists primary_color text not null default '#c2410c',
  add column if not exists secondary_color text not null default '#1c1917',
  add column if not exists accent_color text not null default '#f97316',
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country text default 'New Zealand',
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists google_maps_url text,
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists order_url text,
  add column if not exists reservation_url text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists is_published boolean not null default false,
  add column if not exists custom_domain text unique;

create table if not exists restaurant_gallery_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_restaurant on restaurant_gallery_images(restaurant_id);

-- Future custom-domain support (multiple domains per restaurant)
create table if not exists restaurant_domains (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  domain text unique not null,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurant_domains_restaurant on restaurant_domains(restaurant_id);
create index if not exists idx_restaurant_domains_domain on restaurant_domains(domain);

alter table restaurant_gallery_images enable row level security;
alter table restaurant_domains enable row level security;

create policy "Public read gallery" on restaurant_gallery_images for select using (true);
create policy "Allow gallery writes for demo" on restaurant_gallery_images for all using (true) with check (true);
create policy "Public read domains" on restaurant_domains for select using (true);
create policy "Allow domain writes for demo" on restaurant_domains for all using (true) with check (true);

alter publication supabase_realtime add table restaurants;
alter publication supabase_realtime add table restaurant_gallery_images;

-- Seed demo restaurant website content
update restaurants
set
  tagline = 'Authentic flavours, warm hospitality',
  about_text = 'Demo Restaurant brings together traditional recipes and modern dining in the heart of the city. Our chefs source local ingredients to craft memorable meals for every guest.',
  primary_color = '#c2410c',
  secondary_color = '#1c1917',
  accent_color = '#f97316',
  phone = '+64 9 123 4567',
  email = 'hello@demo-restaurant.co.nz',
  address_line1 = '123 Queen Street',
  city = 'Auckland',
  region = 'Auckland',
  postal_code = '1010',
  country = 'New Zealand',
  latitude = -36.848461,
  longitude = 174.763336,
  google_maps_url = 'https://maps.google.com/?q=-36.848461,174.763336',
  opening_hours = '{
    "monday": {"open": "11:30", "close": "22:00", "closed": false},
    "tuesday": {"open": "11:30", "close": "22:00", "closed": false},
    "wednesday": {"open": "11:30", "close": "22:00", "closed": false},
    "thursday": {"open": "11:30", "close": "22:00", "closed": false},
    "friday": {"open": "11:30", "close": "23:00", "closed": false},
    "saturday": {"open": "10:00", "close": "23:00", "closed": false},
    "sunday": {"open": "10:00", "close": "21:00", "closed": false}
  }'::jsonb,
  social_links = '{"instagram": "https://instagram.com/demo", "facebook": "https://facebook.com/demo"}'::jsonb,
  order_url = '/r/demo-restaurant/order',
  reservation_url = '/r/demo-restaurant/reservations',
  meta_title = 'Demo Restaurant | Auckland Dining',
  meta_description = 'Experience authentic dining at Demo Restaurant in Auckland. View our menu, gallery, and book a table today.',
  is_published = true
where slug = 'demo-restaurant';

insert into restaurant_gallery_images (restaurant_id, image_url, caption, sort_order)
select id, image_url, caption, sort_order
from restaurants r
cross join (
  values
    ('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', 'Dining room', 0),
    ('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200', 'Signature dish', 1),
    ('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200', 'Chef special', 2)
) as gallery(image_url, caption, sort_order)
where r.slug = 'demo-restaurant'
  and not exists (
    select 1 from restaurant_gallery_images g where g.restaurant_id = r.id
  );

-- Storage bucket for restaurant assets
insert into storage.buckets (id, name, public)
values ('restaurant-assets', 'restaurant-assets', true)
on conflict (id) do nothing;

create policy "Public read restaurant assets" on storage.objects
  for select using (bucket_id = 'restaurant-assets');

create policy "Allow restaurant asset uploads for demo" on storage.objects
  for insert with check (bucket_id = 'restaurant-assets');

create policy "Allow restaurant asset updates for demo" on storage.objects
  for update using (bucket_id = 'restaurant-assets');

create policy "Allow restaurant asset deletes for demo" on storage.objects
  for delete using (bucket_id = 'restaurant-assets');
