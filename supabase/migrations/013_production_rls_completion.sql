-- Complete RLS policies dropped in 011 without member replacements

-- Menu child tables (scoped via menus.restaurant_id)
create policy "Members manage categories"
  on menu_categories for all
  using (
    exists (
      select 1 from menus m
      where m.id = menu_categories.menu_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  )
  with check (
    exists (
      select 1 from menus m
      where m.id = menu_categories.menu_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  );

create policy "Members manage items"
  on menu_items for all
  using (
    exists (
      select 1
      from menu_categories c
      join menus m on m.id = c.menu_id
      where c.id = menu_items.category_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  )
  with check (
    exists (
      select 1
      from menu_categories c
      join menus m on m.id = c.menu_id
      where c.id = menu_items.category_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  );

create policy "Members manage modifier groups"
  on modifier_groups for all
  using (
    exists (
      select 1
      from menu_items i
      join menu_categories c on c.id = i.category_id
      join menus m on m.id = c.menu_id
      where i.id = modifier_groups.menu_item_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  )
  with check (
    exists (
      select 1
      from menu_items i
      join menu_categories c on c.id = i.category_id
      join menus m on m.id = c.menu_id
      where i.id = modifier_groups.menu_item_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  );

create policy "Members manage modifiers"
  on modifiers for all
  using (
    exists (
      select 1
      from modifier_groups g
      join menu_items i on i.id = g.menu_item_id
      join menu_categories c on c.id = i.category_id
      join menus m on m.id = c.menu_id
      where g.id = modifiers.group_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  )
  with check (
    exists (
      select 1
      from modifier_groups g
      join menu_items i on i.id = g.menu_item_id
      join menu_categories c on c.id = i.category_id
      join menus m on m.id = c.menu_id
      where g.id = modifiers.group_id
        and public.is_restaurant_member(m.restaurant_id)
    )
  );

-- QR tokens
create policy "Members manage qr tokens"
  on table_qr_tokens for all
  using (
    exists (
      select 1 from restaurant_tables t
      where t.id = table_qr_tokens.table_id
        and public.is_restaurant_member(t.restaurant_id)
    )
  )
  with check (
    exists (
      select 1 from restaurant_tables t
      where t.id = table_qr_tokens.table_id
        and public.is_restaurant_member(t.restaurant_id)
    )
  );

-- Payment audit tables
create policy "Members manage payment transactions"
  on payment_transactions for all
  using (
    exists (
      select 1 from payment_sessions s
      where s.id = payment_transactions.payment_session_id
        and public.is_restaurant_member(s.restaurant_id)
    )
  )
  with check (
    exists (
      select 1 from payment_sessions s
      where s.id = payment_transactions.payment_session_id
        and public.is_restaurant_member(s.restaurant_id)
    )
  );

create policy "Members manage payment webhook events"
  on payment_webhook_events for all
  using (
    order_id is null
    or exists (
      select 1 from restaurant_orders o
      where o.id = payment_webhook_events.order_id
        and public.is_restaurant_member(o.restaurant_id)
    )
  )
  with check (
    order_id is null
    or exists (
      select 1 from restaurant_orders o
      where o.id = payment_webhook_events.order_id
        and public.is_restaurant_member(o.restaurant_id)
    )
  );

-- Restaurant profile updates
create policy "Members update restaurants"
  on restaurants for update
  using (public.is_restaurant_member(id))
  with check (public.is_restaurant_member(id));

-- Remove open reads on sensitive customer data (dashboard uses member session)
drop policy if exists "Public read orders" on restaurant_orders;
drop policy if exists "Public read reservations" on reservations;

-- Storage: authenticated members may manage tenant assets (API enforces auth)
create policy "Members upload menu images"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-images'
    and auth.uid() is not null
  );

create policy "Members update menu images"
  on storage.objects for update
  using (bucket_id = 'menu-images' and auth.uid() is not null);

create policy "Members delete menu images"
  on storage.objects for delete
  using (bucket_id = 'menu-images' and auth.uid() is not null);

create policy "Members upload restaurant assets"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-assets'
    and auth.uid() is not null
  );

create policy "Members update restaurant assets"
  on storage.objects for update
  using (bucket_id = 'restaurant-assets' and auth.uid() is not null);

create policy "Members delete restaurant assets"
  on storage.objects for delete
  using (bucket_id = 'restaurant-assets' and auth.uid() is not null);
