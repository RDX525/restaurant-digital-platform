import type {
  RestaurantLocation,
  RestaurantTable,
  TableQrToken,
} from "@/lib/table/types";
import {
  HARBOUR_KITCHEN_NAME,
  HARBOUR_LOCATION_ID,
  HARBOUR_RESTAURANT_ID,
  SEED_TIMESTAMP,
  harbourQrTokenId,
  harbourQrTokenValue,
  harbourTableId,
} from "./constants";

export function buildHarbourKitchenLocation(): RestaurantLocation {
  return {
    id: HARBOUR_LOCATION_ID,
    restaurant_id: HARBOUR_RESTAURANT_ID,
    name: "Harbour Dining Room",
    is_active: true,
    created_at: SEED_TIMESTAMP,
    updated_at: SEED_TIMESTAMP,
  };
}

export function buildHarbourKitchenTables(): RestaurantTable[] {
  return Array.from({ length: 20 }, (_, index) => {
    const n = index + 1;
    return {
      id: harbourTableId(n),
      restaurant_id: HARBOUR_RESTAURANT_ID,
      location_id: HARBOUR_LOCATION_ID,
      label: `Table ${n}`,
      is_active: true,
      sort_order: index,
      created_at: SEED_TIMESTAMP,
      updated_at: SEED_TIMESTAMP,
    };
  });
}

export function buildHarbourKitchenQrTokens(): TableQrToken[] {
  return Array.from({ length: 20 }, (_, index) => {
    const n = index + 1;
    return {
      id: harbourQrTokenId(n),
      table_id: harbourTableId(n),
      token: harbourQrTokenValue(n),
      is_active: true,
      created_at: SEED_TIMESTAMP,
      revoked_at: null,
    };
  });
}

export const HARBOUR_KITCHEN_DISPLAY_NAME = HARBOUR_KITCHEN_NAME;
