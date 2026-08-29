-- P0: RLS completion for QR sessions, scan analytics, and storage tenant paths

-- Members can read QR scan events for their restaurant
create policy "Members read qr scans"
  on qr_scan_events for select
  using (public.is_restaurant_member(restaurant_id));

-- Members can read table sessions for dashboard support
create policy "Members read table sessions"
  on table_sessions for select
  using (public.is_restaurant_member(restaurant_id));

-- Restrict QR token reads to members (public resolution uses service role on server)
drop policy if exists "Public read qr tokens" on table_qr_tokens;

create policy "Members read qr tokens"
  on table_qr_tokens for select
  using (
    exists (
      select 1 from restaurant_tables t
      where t.id = table_qr_tokens.table_id
        and public.is_restaurant_member(t.restaurant_id)
    )
  );

-- Storage: require path prefix to match a restaurant the user belongs to
drop policy if exists "Members upload menu images" on storage.objects;
drop policy if exists "Members update menu images" on storage.objects;
drop policy if exists "Members delete menu images" on storage.objects;
drop policy if exists "Members upload restaurant assets" on storage.objects;
drop policy if exists "Members update restaurant assets" on storage.objects;
drop policy if exists "Members delete restaurant assets" on storage.objects;

create policy "Members upload menu images"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );

create policy "Members update menu images"
  on storage.objects for update
  using (
    bucket_id = 'menu-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );

create policy "Members delete menu images"
  on storage.objects for delete
  using (
    bucket_id = 'menu-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );

create policy "Members upload restaurant assets"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );

create policy "Members update restaurant assets"
  on storage.objects for update
  using (
    bucket_id = 'restaurant-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );

create policy "Members delete restaurant assets"
  on storage.objects for delete
  using (
    bucket_id = 'restaurant-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select restaurant_id::text from restaurant_members where user_id = auth.uid()
    )
  );
