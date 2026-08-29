/** Harbour Kitchen — synthetic demo tenant for development and sales demos. */

export const HARBOUR_KITCHEN_SLUG = "harbour-kitchen";
export const LEGACY_DEMO_SLUG = "demo-restaurant";
export const HARBOUR_KITCHEN_NAME = "Harbour Kitchen";

export const SEED_TIMESTAMP = "2025-06-01T00:00:00.000Z";

/** Matches default demo restaurant migration ID for compatibility. */
export const HARBOUR_RESTAURANT_ID = "00000000-0000-4000-8000-000000000001";
export const HARBOUR_MENU_ID = "00000000-0000-4000-8000-000000000101";
export const HARBOUR_LOCATION_ID = "00000000-0000-4000-8000-000000000320";

export const HARBOUR_CATEGORY_IDS = {
  breakfast: "00000000-0000-4000-8000-000000000311",
  lunch: "00000000-0000-4000-8000-000000000312",
  dinner: "00000000-0000-4000-8000-000000000313",
  drinks: "00000000-0000-4000-8000-000000000314",
} as const;

export function harbourTableId(n: number): string {
  if (n < 1 || n > 20) throw new RangeError("Table number must be 1–20");
  return `00000000-0000-4000-8000-${String(420 + n).padStart(12, "0")}`;
}

export function harbourQrTokenId(n: number): string {
  if (n < 1 || n > 20) throw new RangeError("Table number must be 1–20");
  return `00000000-0000-4000-8000-${String(520 + n).padStart(12, "0")}`;
}

export function harbourQrTokenValue(n: number): string {
  return `hk-t${n}-qrt-${n.toString().padStart(12, "0")}`;
}

/** Synthetic demo email domain — not a real mailbox. */
export const DEMO_EMAIL_DOMAIN = "demo.harbourkitchen.nz";
