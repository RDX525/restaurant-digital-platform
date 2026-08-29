import { getDemoRestaurantId } from "@/lib/utils";
import { generateQrTokenValue, generateSessionTokenValue } from "./tokens";
import { getTableSessionExpiry } from "./session";
import { countDemoOrdersByTable } from "@/lib/order/demo-store";
import {
  HARBOUR_KITCHEN_NAME,
  HARBOUR_KITCHEN_SLUG,
  HARBOUR_LOCATION_ID,
} from "@/lib/seeds/harbour-kitchen/constants";
import {
  buildHarbourKitchenLocation,
  buildHarbourKitchenQrTokens,
  buildHarbourKitchenTables,
} from "@/lib/seeds/harbour-kitchen/tables";
import type {
  QrScanEvent,
  ResolvedQrToken,
  RestaurantLocation,
  RestaurantTable,
  TableDashboardRow,
  TableQrToken,
  TableSession,
  ValidatedTableSession,
} from "./types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();

function clone<T>(value: T): T {
  return structuredClone(value);
}

const initialLocation: RestaurantLocation = buildHarbourKitchenLocation();
const initialTables: RestaurantTable[] = buildHarbourKitchenTables();
const initialTokens: TableQrToken[] = buildHarbourKitchenQrTokens();

let locations: RestaurantLocation[] = clone([initialLocation]);
let tables: RestaurantTable[] = clone(initialTables);
let tokens: TableQrToken[] = clone(initialTokens);
let sessions: TableSession[] = [];
let scans: QrScanEvent[] = [];

export function resetDemoTableStore(): void {
  locations = clone([initialLocation]);
  tables = clone(initialTables);
  tokens = clone(initialTokens);
  sessions = [];
  scans = [];
}

export function getDemoDefaultLocationId(): string {
  return HARBOUR_LOCATION_ID;
}

export function listDemoTablesWithStats(restaurantId: string): TableDashboardRow[] {
  return tables
    .filter((table) => table.restaurant_id === restaurantId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((table) => {
      const location = locations.find((entry) => entry.id === table.location_id);
      const activeToken = tokens.find(
        (entry) => entry.table_id === table.id && entry.is_active && !entry.revoked_at,
      );
      const tableScans = scans.filter((entry) => entry.table_id === table.id);
      const tableOrders = countDemoOrdersByTable(table.id);

      return {
        id: table.id,
        restaurant_id: table.restaurant_id,
        location_id: table.location_id,
        location_name: location?.name ?? "Unknown location",
        label: table.label,
        is_active: table.is_active,
        sort_order: table.sort_order,
        token: activeToken?.token ?? null,
        qr_status: !table.is_active
          ? "disabled"
          : activeToken
            ? "active"
            : "missing",
        last_scanned_at:
          tableScans.length > 0
            ? tableScans.reduce((latest, entry) =>
                entry.scanned_at > latest ? entry.scanned_at : latest,
              tableScans[0]!.scanned_at)
            : null,
        scan_count: tableScans.length,
        order_count: tableOrders,
        created_at: table.created_at,
        updated_at: table.updated_at,
      };
    });
}

export function createDemoTable(restaurantId: string, label: string): TableDashboardRow {
  assertDemoRestaurantOwnership(restaurantId);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const table: RestaurantTable = {
    id,
    restaurant_id: restaurantId,
    location_id: HARBOUR_LOCATION_ID,
    label,
    is_active: true,
    sort_order: tables.filter((entry) => entry.restaurant_id === restaurantId).length,
    created_at: now,
    updated_at: now,
  };
  tables.push(table);
  regenerateDemoToken(table.id);
  return listDemoTablesWithStats(restaurantId).find((entry) => entry.id === table.id)!;
}

export function updateDemoTable(
  restaurantId: string,
  tableId: string,
  patch: Partial<Pick<RestaurantTable, "label" | "is_active" | "sort_order">>,
): TableDashboardRow | null {
  const table = tables.find(
    (entry) => entry.id === tableId && entry.restaurant_id === restaurantId,
  );
  if (!table) return null;

  if (patch.label !== undefined) table.label = patch.label;
  if (patch.is_active !== undefined) table.is_active = patch.is_active;
  if (patch.sort_order !== undefined) table.sort_order = patch.sort_order;
  table.updated_at = new Date().toISOString();

  return listDemoTablesWithStats(restaurantId).find((entry) => entry.id === tableId) ?? null;
}

export function regenerateDemoToken(tableId: string): TableQrToken {
  tokens.forEach((entry) => {
    if (entry.table_id === tableId && entry.is_active) {
      entry.is_active = false;
      entry.revoked_at = new Date().toISOString();
    }
  });

  const token: TableQrToken = {
    id: crypto.randomUUID(),
    table_id: tableId,
    token: generateQrTokenValue(),
    is_active: true,
    created_at: new Date().toISOString(),
    revoked_at: null,
  };
  tokens.push(token);
  return token;
}

export function resolveDemoQrToken(tokenValue: string): ResolvedQrToken | null {
  const token = tokens.find(
    (entry) => entry.token === tokenValue && entry.is_active && !entry.revoked_at,
  );
  if (!token) return null;

  const table = tables.find((entry) => entry.id === token.table_id);
  if (!table || !table.is_active) return null;

  const location = locations.find((entry) => entry.id === table.location_id);
  if (!location || !location.is_active) return null;

  if (table.restaurant_id !== DEMO_RESTAURANT_ID) return null;

  return {
    token,
    table,
    location,
    restaurant_id: DEMO_RESTAURANT_ID,
    restaurant_slug: HARBOUR_KITCHEN_SLUG,
    restaurant_name: HARBOUR_KITCHEN_NAME,
    is_published: true,
  };
}

export function recordDemoScan(
  resolved: ResolvedQrToken,
  meta: { userAgent?: string | null; referrer?: string | null },
): QrScanEvent {
  const event: QrScanEvent = {
    id: crypto.randomUUID(),
    restaurant_id: resolved.restaurant_id,
    location_id: resolved.location.id,
    table_id: resolved.table.id,
    token_id: resolved.token.id,
    scanned_at: new Date().toISOString(),
    user_agent: meta.userAgent ?? null,
    referrer: meta.referrer ?? null,
  };
  scans.push(event);
  return event;
}

export function createDemoTableSession(resolved: ResolvedQrToken): TableSession {
  const session: TableSession = {
    id: crypto.randomUUID(),
    restaurant_id: resolved.restaurant_id,
    location_id: resolved.location.id,
    table_id: resolved.table.id,
    token_id: resolved.token.id,
    session_token: generateSessionTokenValue(),
    expires_at: getTableSessionExpiry(),
    created_at: new Date().toISOString(),
  };
  sessions.push(session);
  return session;
}

export function validateDemoTableSession(sessionToken: string): ValidatedTableSession | null {
  const session = sessions.find((entry) => entry.session_token === sessionToken);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  const table = tables.find((entry) => entry.id === session.table_id);
  if (!table || !table.is_active || table.restaurant_id !== session.restaurant_id) return null;

  const location = locations.find((entry) => entry.id === session.location_id);
  if (!location || !location.is_active) return null;

  const token = tokens.find(
    (entry) => entry.id === session.token_id && entry.is_active && !entry.revoked_at,
  );
  if (!token) return null;

  return {
    session,
    table,
    location,
    restaurant_id: session.restaurant_id,
    restaurant_slug: HARBOUR_KITCHEN_SLUG,
    restaurant_name: HARBOUR_KITCHEN_NAME,
    table_label: table.label,
    location_name: location.name,
  };
}
export function assertDemoRestaurantOwnership(restaurantId: string): void {
  if (restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }
}

export function getDemoTableToken(tableId: string): TableQrToken | null {
  return (
    tokens.find(
      (entry) => entry.table_id === tableId && entry.is_active && !entry.revoked_at,
    ) ?? null
  );
}
