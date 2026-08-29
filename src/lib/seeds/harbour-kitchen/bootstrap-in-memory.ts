import { resetDemoAnalyticsStore, loadDemoAnalyticsEvents } from "@/lib/analytics/demo-store";
import { resetDemoAnalyticsQrScans, loadDemoAnalyticsQrScans } from "@/lib/analytics/qr-scans";
import { resetDemoCustomerStore, loadDemoCustomers } from "@/lib/customer/demo-store";
import { resetDemoIntelligenceStore, loadDemoInsights } from "@/lib/intelligence/demo-store";
import { resetDemoOrderStore, loadDemoOrders } from "@/lib/order/demo-store";
import { resetDemoReservationStore, loadDemoReservations } from "@/lib/reservation/demo-store";
import { resetDemoTableStore } from "@/lib/table/demo-store";
import {
  buildHarbourKitchenAnalyticsEvents,
  buildHarbourKitchenCustomers,
  buildHarbourKitchenInsights,
  buildHarbourKitchenOrders,
  buildHarbourKitchenQrScans,
  buildHarbourKitchenReservations,
} from "./transactions";

/** Reset and populate in-memory demo stores with Harbour Kitchen synthetic data. */
export function seedHarbourKitchenInMemoryStores(): void {
  resetDemoOrderStore();
  resetDemoReservationStore();
  resetDemoCustomerStore();
  resetDemoAnalyticsStore();
  resetDemoIntelligenceStore();
  resetDemoAnalyticsQrScans();
  resetDemoTableStore();

  loadDemoOrders(buildHarbourKitchenOrders());
  loadDemoReservations(buildHarbourKitchenReservations());
  loadDemoCustomers(buildHarbourKitchenCustomers());
  loadDemoAnalyticsEvents(buildHarbourKitchenAnalyticsEvents());
  loadDemoInsights(buildHarbourKitchenInsights());
  loadDemoAnalyticsQrScans(buildHarbourKitchenQrScans());
}

export {
  buildHarbourKitchenRestaurant,
} from "./restaurant";
export {
  buildHarbourKitchenFullMenu,
  buildHarbourKitchenMenus,
} from "./menu";
export {
  buildHarbourKitchenLocation,
  buildHarbourKitchenTables,
  buildHarbourKitchenQrTokens,
} from "./tables";
export {
  HARBOUR_KITCHEN_SLUG,
  HARBOUR_KITCHEN_NAME,
  HARBOUR_RESTAURANT_ID,
  LEGACY_DEMO_SLUG,
} from "./constants";
