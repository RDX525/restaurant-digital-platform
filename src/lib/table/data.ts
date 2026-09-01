import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { DEFAULT_DINING_LOCATION_NAME } from "./constants";
import { generateQrTokenValue, generateSessionTokenValue } from "./tokens";
import { getTableSessionExpiry, isSessionExpired } from "./session";
import {
  assertDemoRestaurantOwnership,
  createDemoTable,
  createDemoTableSession,
  getDemoTableToken,
  listDemoTablesWithStats,
  recordDemoScan,
  regenerateDemoToken,
  resolveDemoQrToken,
  updateDemoTable,
  validateDemoTableSession,
} from "./demo-store";
import { recordAnalyticsEvent } from "@/lib/analytics/data";
import { recordDemoAnalyticsQrScan } from "@/lib/analytics/qr-scans";
import type {
  ResolvedQrToken,
  TableDashboardRow,
  TableQrToken,
  ValidatedTableSession,
} from "./types";

function shouldUseDemoTableStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

export async function listTablesWithStats(restaurantId: string): Promise<TableDashboardRow[]> {
  if (shouldUseDemoTableStore(restaurantId)) {
    assertDemoRestaurantOwnership(restaurantId);
    return listDemoTablesWithStats(restaurantId);
  }

  const supabase = await createClient();
  const { data: tables, error } = await supabase
    .from("restaurant_tables")
    .select(
      `
      id,
      restaurant_id,
      location_id,
      label,
      is_active,
      sort_order,
      created_at,
      updated_at,
      restaurant_locations(name)
    `,
    )
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const tableRows = tables ?? [];
  if (tableRows.length === 0) return [];

  const tableIds = tableRows.map((table) => table.id);

  const [tokensResult, scanRowsResult, orderRowsResult] = await Promise.all([
    supabase
      .from("table_qr_tokens")
      .select("table_id, token")
      .in("table_id", tableIds)
      .eq("is_active", true)
      .is("revoked_at", null),
    supabase
      .from("qr_scan_events")
      .select("table_id, scanned_at")
      .eq("restaurant_id", restaurantId)
      .in("table_id", tableIds)
      .order("scanned_at", { ascending: false }),
    supabase
      .from("restaurant_orders")
      .select("table_id")
      .eq("restaurant_id", restaurantId)
      .in("table_id", tableIds),
  ]);

  if (tokensResult.error) throw tokensResult.error;
  if (scanRowsResult.error) throw scanRowsResult.error;
  if (orderRowsResult.error) throw orderRowsResult.error;

  const tokenByTable = new Map(
    (tokensResult.data ?? []).map((row) => [row.table_id as string, row.token as string]),
  );

  const scanCountByTable = new Map<string, number>();
  const lastScanByTable = new Map<string, string>();
  for (const scan of scanRowsResult.data ?? []) {
    const tableId = scan.table_id as string;
    scanCountByTable.set(tableId, (scanCountByTable.get(tableId) ?? 0) + 1);
    if (!lastScanByTable.has(tableId)) {
      lastScanByTable.set(tableId, scan.scanned_at as string);
    }
  }

  const orderCountByTable = new Map<string, number>();
  for (const order of orderRowsResult.data ?? []) {
    const tableId = order.table_id as string;
    orderCountByTable.set(tableId, (orderCountByTable.get(tableId) ?? 0) + 1);
  }

  const rows: TableDashboardRow[] = tableRows.map((table) => {
    const location = Array.isArray(table.restaurant_locations)
      ? table.restaurant_locations[0]
      : table.restaurant_locations;
    const token = tokenByTable.get(table.id) ?? null;

    return {
      id: table.id,
      restaurant_id: table.restaurant_id,
      location_id: table.location_id,
      location_name: location?.name ?? "Unknown location",
      label: table.label,
      is_active: table.is_active,
      sort_order: table.sort_order,
      token,
      qr_status: !table.is_active ? "disabled" : token ? "active" : "missing",
      last_scanned_at: lastScanByTable.get(table.id) ?? null,
      scan_count: scanCountByTable.get(table.id) ?? 0,
      order_count: orderCountByTable.get(table.id) ?? 0,
      created_at: table.created_at,
      updated_at: table.updated_at,
    };
  });

  return rows;
}

export async function createTable(
  restaurantId: string,
  label: string,
  locationId?: string,
): Promise<TableDashboardRow> {
  if (shouldUseDemoTableStore(restaurantId)) {
    assertDemoRestaurantOwnership(restaurantId);
    return createDemoTable(restaurantId, label);
  }

  const supabase = await createClient();
  const resolvedLocationId = locationId ?? (await ensureDefaultLocationId(restaurantId));

  const { data: table, error } = await supabase
    .from("restaurant_tables")
    .insert({
      restaurant_id: restaurantId,
      location_id: resolvedLocationId,
      label,
      sort_order: (await listTablesWithStats(restaurantId)).length,
    })
    .select()
    .single();

  if (error) throw error;

  await regenerateTableToken(table.id);

  const rows = await listTablesWithStats(restaurantId);
  return rows.find((row) => row.id === table.id)!;
}

export async function updateTable(
  restaurantId: string,
  tableId: string,
  patch: Partial<{ label: string; is_active: boolean; sort_order: number }>,
): Promise<TableDashboardRow | null> {
  if (shouldUseDemoTableStore(restaurantId)) {
    assertDemoRestaurantOwnership(restaurantId);
    return updateDemoTable(restaurantId, tableId, patch);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rows = await listTablesWithStats(restaurantId);
  return rows.find((row) => row.id === tableId) ?? null;
}

export async function regenerateTableToken(tableId: string): Promise<TableQrToken> {
  if (!isSupabaseConfigured()) {
    return regenerateDemoToken(tableId);
  }

  const supabase = await createClient();

  await supabase
    .from("table_qr_tokens")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("table_id", tableId)
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("table_qr_tokens")
    .insert({
      table_id: tableId,
      token: generateQrTokenValue(),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveTableToken(
  restaurantId: string,
  tableId: string,
): Promise<TableQrToken | null> {
  if (shouldUseDemoTableStore(restaurantId)) {
    assertDemoRestaurantOwnership(restaurantId);
    const table = listDemoTablesWithStats(restaurantId).find((row) => row.id === tableId);
    if (!table) return null;
    return getDemoTableToken(tableId);
  }

  const supabase = await createClient();
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!table) return null;

  const { data } = await supabase
    .from("table_qr_tokens")
    .select("*")
    .eq("table_id", tableId)
    .eq("is_active", true)
    .is("revoked_at", null)
    .maybeSingle();

  return data;
}

export async function resolveQrToken(tokenValue: string): Promise<ResolvedQrToken | null> {
  if (!isSupabaseConfigured()) {
    return resolveDemoQrToken(tokenValue);
  }

  const supabase = createAdminClient();
  const { data: token } = await supabase
    .from("table_qr_tokens")
    .select("*")
    .eq("token", tokenValue)
    .eq("is_active", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (!token) return null;

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", token.table_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!table) return null;

  const [{ data: location }, { data: restaurant }] = await Promise.all([
    supabase
      .from("restaurant_locations")
      .select("*")
      .eq("id", table.location_id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("restaurants")
      .select("id, slug, name, is_published")
      .eq("id", table.restaurant_id)
      .maybeSingle(),
  ]);

  if (!location) return null;
  if (!restaurant) return null;

  return {
    token,
    table,
    location,
    restaurant_id: restaurant.id,
    restaurant_slug: restaurant.slug,
    restaurant_name: restaurant.name,
    is_published: restaurant.is_published,
  };
}

export async function recordQrScan(
  resolved: ResolvedQrToken,
  meta: { userAgent?: string | null; referrer?: string | null },
): Promise<void> {
  const scannedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    recordDemoScan(resolved, meta);
    recordDemoAnalyticsQrScan({
      restaurant_id: resolved.restaurant_id,
      table_id: resolved.table.id,
      scanned_at: scannedAt,
    });
    await recordAnalyticsEvent({
      restaurantId: resolved.restaurant_id,
      eventType: "QR_SCAN",
      tableId: resolved.table.id,
      occurredAt: scannedAt,
      userAgent: meta.userAgent ?? undefined,
      metadata: { referrer: meta.referrer ?? null },
    });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("qr_scan_events").insert({
    restaurant_id: resolved.restaurant_id,
    location_id: resolved.location.id,
    table_id: resolved.table.id,
    token_id: resolved.token.id,
    user_agent: meta.userAgent ?? null,
    referrer: meta.referrer ?? null,
  });

  if (error) throw error;

  await recordAnalyticsEvent({
    restaurantId: resolved.restaurant_id,
    eventType: "QR_SCAN",
    tableId: resolved.table.id,
    userAgent: meta.userAgent ?? undefined,
    metadata: { referrer: meta.referrer ?? null },
  });
}

export async function createTableSession(resolved: ResolvedQrToken) {
  if (!isSupabaseConfigured()) {
    return createDemoTableSession(resolved);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("table_sessions")
    .insert({
      restaurant_id: resolved.restaurant_id,
      location_id: resolved.location.id,
      table_id: resolved.table.id,
      token_id: resolved.token.id,
      session_token: generateSessionTokenValue(),
      expires_at: getTableSessionExpiry(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validateTableSession(
  sessionToken: string,
): Promise<ValidatedTableSession | null> {
  if (!isSupabaseConfigured()) {
    return validateDemoTableSession(sessionToken);
  }

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!session || isSessionExpired(session.expires_at)) return null;

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", session.table_id)
    .eq("restaurant_id", session.restaurant_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!table) return null;

  const { data: location } = await supabase
    .from("restaurant_locations")
    .select("*")
    .eq("id", session.location_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!location) return null;

  const { data: token } = await supabase
    .from("table_qr_tokens")
    .select("*")
    .eq("id", session.token_id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (!token) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug, name")
    .eq("id", session.restaurant_id)
    .maybeSingle();

  if (!restaurant) return null;

  return {
    session,
    table,
    location,
    restaurant_id: session.restaurant_id,
    restaurant_slug: restaurant.slug,
    restaurant_name: restaurant.name,
    table_label: table.label,
    location_name: location.name,
  };
}

export async function ensureDefaultLocationId(restaurantId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_locations")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return data.id;

  const now = new Date().toISOString();
  const { data: created, error: createError } = await supabase
    .from("restaurant_locations")
    .insert({
      restaurant_id: restaurantId,
      name: DEFAULT_DINING_LOCATION_NAME,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (createError) throw createError;
  if (!created?.id) {
    throw new Error("Could not create a dining location for this restaurant.");
  }

  return created.id;
}
