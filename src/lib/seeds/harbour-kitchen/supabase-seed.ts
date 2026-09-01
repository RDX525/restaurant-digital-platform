import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHarbourKitchenRestaurant } from "./restaurant";
import { buildHarbourKitchenFullMenu, buildHarbourKitchenMenus } from "./menu";
import {
  buildHarbourKitchenLocation,
  buildHarbourKitchenQrTokens,
  buildHarbourKitchenTables,
} from "./tables";
import {
  buildHarbourKitchenAnalyticsEvents,
  buildHarbourKitchenCustomers,
  buildHarbourKitchenInsights,
  buildHarbourKitchenOrders,
  buildHarbourKitchenQrScans,
  buildHarbourKitchenReservations,
} from "./transactions";
import { HARBOUR_KITCHEN_SLUG, HARBOUR_RESTAURANT_ID } from "./constants";
import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";

const RID = HARBOUR_RESTAURANT_ID;

async function mustUpsert(
  supabase: SupabaseClient,
  table: string,
  row: Record<string, unknown> | Record<string, unknown>[],
): Promise<void> {
  const { error } = await supabase.from(table).upsert(row);
  if (error) {
    throw new Error(`Seed upsert ${table} failed: ${error.message}`);
  }
}

async function deleteHarbourKitchenData(supabase: SupabaseClient): Promise<void> {
  const fullMenu = buildHarbourKitchenFullMenu();
  const groupIds = fullMenu.categories.flatMap((c) =>
    c.items.flatMap((i) => i.modifier_groups.map((g) => g.id)),
  );
  const itemIds = fullMenu.categories.flatMap((c) => c.items.map((i) => i.id));
  const categoryIds = fullMenu.categories.map((c) => c.id);
  const tableIds = buildHarbourKitchenTables().map((t) => t.id);

  if (groupIds.length) await supabase.from("modifiers").delete().in("group_id", groupIds);
  if (groupIds.length) await supabase.from("modifier_groups").delete().in("id", groupIds);
  if (itemIds.length) await supabase.from("menu_items").delete().in("id", itemIds);
  if (categoryIds.length) await supabase.from("menu_categories").delete().in("id", categoryIds);

  await supabase.from("analytics_events").delete().eq("restaurant_id", RID);
  await supabase.from("ai_insights").delete().eq("restaurant_id", RID);
  await supabase.from("qr_scan_events").delete().eq("restaurant_id", RID);
  await supabase.from("restaurant_orders").delete().eq("restaurant_id", RID);
  await supabase.from("reservations").delete().eq("restaurant_id", RID);
  await supabase.from("restaurant_customers").delete().eq("restaurant_id", RID);
  await supabase.from("table_qr_tokens").delete().in("table_id", tableIds);
  await supabase.from("restaurant_tables").delete().eq("restaurant_id", RID);
  await supabase.from("restaurant_locations").delete().eq("restaurant_id", RID);
  await supabase.from("menus").delete().eq("restaurant_id", RID);
  await supabase.from("restaurant_gallery_images").delete().eq("restaurant_id", RID);
  await supabase.from("reservation_settings").delete().eq("restaurant_id", RID);
  await supabase.from("notification_preferences").delete().eq("restaurant_id", RID);
}

export async function seedHarbourKitchenSupabase(
  supabase: SupabaseClient,
  options?: { reset?: boolean },
): Promise<void> {
  if (options?.reset) {
    await deleteHarbourKitchenData(supabase);
  }

  const restaurant = buildHarbourKitchenRestaurant();
  const { gallery, ...restaurantRow } = restaurant;

  await mustUpsert(supabase, "restaurants", {
    id: RID,
    name: restaurant.name,
    slug: HARBOUR_KITCHEN_SLUG,
    tagline: restaurant.tagline,
    about_text: restaurant.about_text,
    logo_url: restaurant.logo_url,
    hero_image_url: restaurant.hero_image_url,
    primary_color: restaurant.primary_color,
    secondary_color: restaurant.secondary_color,
    accent_color: restaurant.accent_color,
    phone: restaurant.phone,
    email: restaurant.email,
    address_line1: restaurant.address_line1,
    address_line2: restaurant.address_line2,
    city: restaurant.city,
    region: restaurant.region,
    postal_code: restaurant.postal_code,
    country: restaurant.country,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    google_maps_url: restaurant.google_maps_url,
    opening_hours: restaurant.opening_hours,
    social_links: restaurant.social_links,
    order_url: restaurant.order_url,
    reservation_url: restaurant.reservation_url,
    meta_title: restaurant.meta_title,
    meta_description: restaurant.meta_description,
    is_published: true,
    custom_domain: null,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("restaurant_gallery_images").upsert(
    gallery.map((image) => ({
      id: image.id,
      restaurant_id: RID,
      image_url: image.image_url,
      caption: image.caption,
      sort_order: image.sort_order,
    })),
  );

  for (const menu of buildHarbourKitchenMenus()) {
    await supabase.from("menus").upsert({
      id: menu.id,
      restaurant_id: menu.restaurant_id,
      name: menu.name,
      description: menu.description,
      is_active: menu.is_active,
      sort_order: menu.sort_order,
    });
  }

  const fullMenu = buildHarbourKitchenFullMenu();
  for (const category of fullMenu.categories) {
    await supabase.from("menu_categories").upsert({
      id: category.id,
      menu_id: category.menu_id,
      name: category.name,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });

    for (const menuItem of category.items) {
      await mustUpsert(supabase, "menu_items", {
        id: menuItem.id,
        category_id: menuItem.category_id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        photo_url: menuItem.photo_url,
        ingredients: menuItem.ingredients,
        allergens: menuItem.allergens,
        dietary_info: menuItem.dietary_info,
        is_available: menuItem.is_available,
        is_sold_out: menuItem.is_sold_out,
        is_popular: menuItem.is_popular,
        is_recommended: menuItem.is_recommended,
        sort_order: menuItem.sort_order,
      });

      for (const group of menuItem.modifier_groups) {
        await supabase.from("modifier_groups").upsert({
          id: group.id,
          menu_item_id: group.menu_item_id,
          name: group.name,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          sort_order: group.sort_order,
        });

        for (const modifier of group.modifiers) {
          await supabase.from("modifiers").upsert({
            id: modifier.id,
            group_id: modifier.group_id,
            name: modifier.name,
            price: modifier.price,
            sort_order: modifier.sort_order,
          });
        }
      }
    }
  }

  const location = buildHarbourKitchenLocation();
  await supabase.from("restaurant_locations").upsert(location);
  await supabase.from("restaurant_tables").upsert(buildHarbourKitchenTables());
  await supabase.from("table_qr_tokens").upsert(buildHarbourKitchenQrTokens());

  await supabase.from("reservation_settings").upsert({
    restaurant_id: RID,
    timezone: "Pacific/Auckland",
    reservation_hours: normalizeOpeningHours({
      monday: { open: "17:00", close: "21:30", closed: false },
      tuesday: { open: "17:00", close: "21:30", closed: false },
      wednesday: { open: "17:00", close: "21:30", closed: false },
      thursday: { open: "17:00", close: "21:30", closed: false },
      friday: { open: "17:00", close: "22:00", closed: false },
      saturday: { open: "12:00", close: "22:00", closed: false },
      sunday: { open: "12:00", close: "20:30", closed: false },
    }),
    max_party_size: 10,
    booking_advance_days: 60,
    booking_min_notice_hours: 2,
    slot_interval_minutes: 30,
    max_covers_per_slot: 24,
  });

  await supabase.from("notification_preferences").upsert({
    restaurant_id: RID,
    scope: "restaurant",
    customer_email: null,
    email_enabled: true,
    sms_enabled: true,
  });

  await supabase.from("restaurant_orders").upsert(
    buildHarbourKitchenOrders().map((order) => ({
      id: order.id,
      order_number: order.order_number,
      restaurant_id: order.restaurant_id,
      location_id: order.location_id,
      table_id: order.table_id,
      session_id: order.session_id,
      table_label: order.table_label,
      order_type: order.order_type,
      status: order.status,
      payment_status: order.payment_status,
      customer: order.customer,
      customer_email: order.customer_email,
      items: order.items,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      delivery_fee: order.delivery_fee,
      tax_amount: order.tax_amount,
      total: order.total,
      idempotency_key: order.idempotency_key,
      cancellation_reason: order.cancellation_reason,
      cancelled_at: order.cancelled_at,
      placed_at: order.placed_at,
      estimated_ready_at: order.estimated_ready_at,
    })),
  );

  await supabase.from("reservations").upsert(
    buildHarbourKitchenReservations().map((reservation) => ({
      id: reservation.id,
      restaurant_id: reservation.restaurant_id,
      status: reservation.status,
      guest_name: reservation.guest_name,
      guest_email: reservation.guest_email,
      guest_phone: reservation.guest_phone,
      guest_count: reservation.guest_count,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      timezone: reservation.timezone,
      special_request: reservation.special_request,
      confirmed_at: reservation.confirmed_at,
      cancelled_at: reservation.cancelled_at,
      cancellation_reason: reservation.cancellation_reason,
      rescheduled_at: reservation.rescheduled_at,
      previous_date: reservation.previous_date,
      previous_time: reservation.previous_time,
      notifications: reservation.notifications,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
    })),
  );

  await supabase.from("restaurant_customers").upsert(
    buildHarbourKitchenCustomers().map((customer) => ({
      id: customer.id,
      restaurant_id: customer.restaurant_id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      first_order_at: customer.first_order_at,
      last_order_at: customer.last_order_at,
      total_orders: customer.total_orders,
      paid_order_count: customer.paid_order_count,
      total_spend: customer.total_spend,
      last_reservation_at: customer.last_reservation_at,
      total_reservations: customer.total_reservations,
      lifecycle_stage: customer.lifecycle_stage,
      metadata: customer.metadata,
    })),
  );

  await supabase.from("analytics_events").upsert(
    buildHarbourKitchenAnalyticsEvents().map((event) => ({
      id: event.id,
      restaurant_id: event.restaurant_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at,
      session_id: event.session_id,
      path: event.path,
      menu_item_id: event.menu_item_id,
      order_id: event.order_id,
      reservation_id: event.reservation_id,
      table_id: event.table_id,
      metadata: event.metadata,
      user_agent: event.user_agent,
    })),
  );

  const tokens = buildHarbourKitchenQrTokens();
  await supabase.from("qr_scan_events").upsert(
    buildHarbourKitchenQrScans().map((scan, index) => ({
      id: `00000000-0000-4000-8000-${String(770 + index).padStart(12, "0")}`,
      restaurant_id: scan.restaurant_id,
      location_id: buildHarbourKitchenLocation().id,
      table_id: scan.table_id,
      token_id: tokens.find((t) => t.table_id === scan.table_id)?.id ?? null,
      scanned_at: scan.scanned_at,
    })),
  );

  await supabase.from("ai_insights").upsert(
    buildHarbourKitchenInsights().map((insight) => ({
      id: insight.id,
      restaurant_id: insight.restaurant_id,
      insight_type: insight.insight_type,
      source_metrics: insight.source_metrics,
      generated_text: insight.generated_text,
      created_at: insight.created_at,
    })),
  );

  void restaurantRow;
}
