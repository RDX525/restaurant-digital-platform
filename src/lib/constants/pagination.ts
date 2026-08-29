/** Default list limits for dashboard and API responses (Phase 1). */
export const DASHBOARD_ORDERS_LIMIT = 100;
export const DASHBOARD_RESERVATIONS_LIMIT = 200;
export const DASHBOARD_CUSTOMERS_LIMIT = 100;
export const ANALYTICS_ORDERS_LOOKBACK_DAYS = 90;

export interface ListOptions {
  limit?: number;
}
