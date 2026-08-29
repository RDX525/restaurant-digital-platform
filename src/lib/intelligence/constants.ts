export const INTELLIGENCE_TOOL_NAMES = [
  "get_sales_summary",
  "get_order_summary",
  "get_menu_performance",
  "get_customer_summary",
  "get_reservation_summary",
  "get_sales_trends",
  "get_top_items",
  "get_slow_items",
] as const;

export type IntelligenceToolName = (typeof INTELLIGENCE_TOOL_NAMES)[number];

export const INSIGHT_TYPES = [
  "daily_brief",
  "trend_detection",
  "menu_insight",
  "customer_opportunity",
  "recommendation",
  "ask_restaurant",
  "menu_description_draft",
] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

export const MAX_TOOL_ITERATIONS = 5;
export const MAX_INACTIVE_CUSTOMER_SAMPLES = 10;
export const TREND_LOOKBACK_WEEKS = 4;
export const DEFAULT_TOP_ITEMS_LIMIT = 5;
export const DEFAULT_SLOW_ITEMS_LIMIT = 5;
