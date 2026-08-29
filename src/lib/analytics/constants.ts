export const ANALYTICS_EVENT_TYPES = [
  "WEBSITE_VISIT",
  "MENU_VIEW",
  "QR_SCAN",
  "ITEM_VIEW",
  "ADD_TO_CART",
  "CHECKOUT_STARTED",
  "ORDER_COMPLETED",
  "RESERVATION_STARTED",
  "RESERVATION_COMPLETED",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const DATE_RANGE_PRESETS = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "custom",
] as const;

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export const DEFAULT_ANALYTICS_TIMEZONE = "Pacific/Auckland";

export const SLOW_MOVING_ITEM_LIMIT = 5;
export const BEST_SELLING_ITEM_LIMIT = 5;
