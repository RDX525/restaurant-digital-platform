import { getDemoRestaurantId } from "@/lib/utils";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();

interface DemoQrScan {
  restaurant_id: string;
  table_id: string;
  scanned_at: string;
}

let scans: DemoQrScan[] = [];

export function resetDemoAnalyticsQrScans(): void {
  scans = [];
}

export function loadDemoAnalyticsQrScans(
  records: { restaurant_id: string; table_id: string; scanned_at: string }[],
): void {
  scans = [...records];
}

export function recordDemoAnalyticsQrScan(input: DemoQrScan): void {
  if (input.restaurant_id !== DEMO_RESTAURANT_ID) return;
  scans.push(input);
}

export function getDemoAnalyticsQrScans(restaurantId: string): DemoQrScan[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];
  return [...scans];
}
