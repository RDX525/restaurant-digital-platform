export interface RestaurantLocation {
  id: string;
  restaurant_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  location_id: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TableQrToken {
  id: string;
  table_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

export interface QrScanEvent {
  id: string;
  restaurant_id: string;
  location_id: string;
  table_id: string;
  token_id: string;
  scanned_at: string;
  user_agent: string | null;
  referrer: string | null;
}

export interface TableSession {
  id: string;
  restaurant_id: string;
  location_id: string;
  table_id: string;
  token_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface ResolvedQrToken {
  token: TableQrToken;
  table: RestaurantTable;
  location: RestaurantLocation;
  restaurant_id: string;
  restaurant_slug: string;
  restaurant_name: string;
  is_published: boolean;
}

export interface ValidatedTableSession {
  session: TableSession;
  table: RestaurantTable;
  location: RestaurantLocation;
  restaurant_id: string;
  restaurant_slug: string;
  restaurant_name: string;
  table_label: string;
  location_name: string;
}

export interface TableDashboardRow {
  id: string;
  restaurant_id: string;
  location_id: string;
  location_name: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  token: string | null;
  qr_status: "active" | "disabled" | "missing";
  last_scanned_at: string | null;
  scan_count: number;
  order_count: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantOrderRecord {
  id: string;
  restaurant_id: string;
  location_id: string | null;
  table_id: string | null;
  session_id: string | null;
  order_type: "pickup" | "delivery" | "dine_in";
  status: string;
  customer: Record<string, unknown>;
  items: unknown[];
  totals: Record<string, unknown>;
  placed_at: string;
}
