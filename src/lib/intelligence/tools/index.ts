import type { DateRangePreset } from "@/lib/analytics/constants";
import type { IntelligenceToolName } from "../constants";
import type { IntelligenceToolDefinition } from "../types";
import {
  loadRestaurantContext,
  loadVerifiedCustomers,
  loadVerifiedOrders,
  loadVerifiedReservations,
} from "../data";
import {
  buildReportForPreset,
  computeInactiveCustomers,
  computeSalesTrends,
  getSlowItemsLimit,
  getTopItemsLimit,
} from "./metrics";
import {
  salesSummaryParamsSchema,
  salesTrendsParamsSchema,
  topItemsParamsSchema,
} from "../schemas";

export const INTELLIGENCE_TOOL_DEFINITIONS: IntelligenceToolDefinition[] = [
  {
    name: "get_sales_summary",
    description: "Get verified revenue, paid order count, and average order value for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string", description: "Custom range start date (YYYY-MM-DD)" },
        to: { type: "string", description: "Custom range end date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "get_order_summary",
    description: "Get paid order counts grouped by order type for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
      },
    },
  },
  {
    name: "get_menu_performance",
    description: "Get menu item quantity and revenue performance for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
      },
    },
  },
  {
    name: "get_customer_summary",
    description: "Get new and returning customer counts plus inactive customer opportunities.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
      },
    },
  },
  {
    name: "get_reservation_summary",
    description: "Get reservation volume, cancellations, and no-shows for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
      },
    },
  },
  {
    name: "get_sales_trends",
    description: "Compare recent sales trends including weekday averages and yesterday performance.",
    parameters: {
      type: "object",
      properties: {
        weeks: { type: "number", description: "Lookback window in weeks (default 4)" },
      },
    },
  },
  {
    name: "get_top_items",
    description: "Get best-selling menu items by quantity for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_slow_items",
    description: "Get slow-moving menu items for a date range.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["today", "yesterday", "7d", "30d", "custom"] },
        from: { type: "string" },
        to: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
];

async function loadData(restaurantId: string) {
  const [context, orders, reservations, customers] = await Promise.all([
    loadRestaurantContext(restaurantId),
    loadVerifiedOrders(restaurantId),
    loadVerifiedReservations(restaurantId),
    loadVerifiedCustomers(restaurantId),
  ]);

  return { context, orders, reservations, customers };
}

function parsePresetArgs(args: Record<string, unknown>) {
  const parsed = salesSummaryParamsSchema.parse({
    preset: args.preset ?? "7d",
    from: args.from,
    to: args.to,
  });
  return parsed;
}

export async function executeIntelligenceTool(input: {
  restaurantId: string;
  tool: IntelligenceToolName;
  arguments: Record<string, unknown>;
  now?: Date;
}): Promise<Record<string, unknown>> {
  const { context, orders, reservations, customers } = await loadData(input.restaurantId);

  switch (input.tool) {
    case "get_sales_summary": {
      const params = parsePresetArgs(input.arguments);
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        revenue: report.revenue,
        orders: report.orders,
        averageOrderValue: report.averageOrderValue,
        range: report.range,
        currency: "NZD",
      };
    }
    case "get_order_summary": {
      const params = parsePresetArgs(input.arguments);
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        ordersByType: report.ordersByType,
        totalPaidOrders: report.orders,
        range: report.range,
      };
    }
    case "get_menu_performance": {
      const params = parsePresetArgs(input.arguments);
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        bestSellingItems: report.bestSellingItems,
        slowMovingItems: report.slowMovingItems,
        range: report.range,
      };
    }
    case "get_customer_summary": {
      const params = parsePresetArgs(input.arguments);
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      const inactive = computeInactiveCustomers({ orders, customers, now: input.now });
      return {
        newCustomers: report.newCustomers,
        returningCustomers: report.returningCustomers,
        inactiveCustomers: inactive.inactiveCount,
        inactiveSamples: inactive.samples,
        range: report.range,
      };
    }
    case "get_reservation_summary": {
      const params = parsePresetArgs(input.arguments);
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        reservations: report.reservations,
        cancellations: report.reservationCancellations,
        noShows: report.reservationNoShows,
        range: report.range,
      };
    }
    case "get_sales_trends": {
      const params = salesTrendsParamsSchema.parse(input.arguments);
      return computeSalesTrends({
        orders,
        timezone: context.timezone,
        weeks: params.weeks,
        now: input.now,
      });
    }
    case "get_top_items": {
      const params = topItemsParamsSchema.parse({
        preset: input.arguments.preset ?? "7d",
        from: input.arguments.from,
        to: input.arguments.to,
        limit: input.arguments.limit,
      });
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        items: report.bestSellingItems.slice(0, getTopItemsLimit(params.limit)),
        range: report.range,
      };
    }
    case "get_slow_items": {
      const params = topItemsParamsSchema.parse({
        preset: input.arguments.preset ?? "7d",
        from: input.arguments.from,
        to: input.arguments.to,
        limit: input.arguments.limit,
      });
      const report = buildReportForPreset({
        orders,
        reservations,
        timezone: context.timezone,
        preset: params.preset as DateRangePreset,
        from: params.from,
        to: params.to,
        now: input.now,
      });
      return {
        items: report.slowMovingItems.slice(0, getSlowItemsLimit(params.limit)),
        range: report.range,
      };
    }
    default:
      throw new Error(`Unsupported intelligence tool: ${String(input.tool)}`);
  }
}

export function isApprovedToolName(name: string): name is IntelligenceToolName {
  return INTELLIGENCE_TOOL_DEFINITIONS.some((tool) => tool.name === name);
}
