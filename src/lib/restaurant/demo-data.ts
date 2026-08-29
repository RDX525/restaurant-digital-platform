import type { PublicRestaurant } from "./types";
import { getDemoRestaurantId } from "@/lib/utils";
import { buildHarbourKitchenRestaurant } from "@/lib/seeds/harbour-kitchen/restaurant";
import {
  HARBOUR_KITCHEN_SLUG,
  LEGACY_DEMO_SLUG,
} from "@/lib/seeds/harbour-kitchen/constants";
import { seedHarbourKitchenInMemoryStores } from "@/lib/seeds/harbour-kitchen/bootstrap-in-memory";

export const DEMO_RESTAURANT_SLUG = HARBOUR_KITCHEN_SLUG;

let inMemorySeeded = false;

/** Load transactional demo stores (orders, reservations, analytics, etc.). */
export function ensureDemoStoresSeeded(): void {
  if (inMemorySeeded) return;
  seedHarbourKitchenInMemoryStores();
  inMemorySeeded = true;
}

/** Restaurant profile only — does not reset transactional demo stores. */
export function getDemoRestaurant(): PublicRestaurant {
  return buildHarbourKitchenRestaurant();
}

export function isDemoRestaurantSlug(slug: string): boolean {
  return slug === HARBOUR_KITCHEN_SLUG || slug === LEGACY_DEMO_SLUG;
}

export function isDemoRestaurantId(id: string): boolean {
  return id === getDemoRestaurantId();
}

/** Re-seed in-memory demo data (development / sales demos). */
export function reseedDemoRestaurant(): PublicRestaurant {
  seedHarbourKitchenInMemoryStores();
  inMemorySeeded = true;
  return getDemoRestaurant();
}
