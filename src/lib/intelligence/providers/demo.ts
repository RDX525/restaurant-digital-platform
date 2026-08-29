import type {
  IntelligenceCompletionRequest,
  IntelligenceCompletionResponse,
  IntelligenceProvider,
  IntelligenceToolCall,
} from "../types";
import type { IntelligenceToolName } from "../constants";
import { isApprovedToolName } from "../tools";

export class IntelligenceProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceProviderError";
  }
}

function inferToolsFromQuestion(question: string): IntelligenceToolCall[] {
  const normalized = question.toLowerCase();
  const calls: IntelligenceToolCall[] = [];
  const add = (name: IntelligenceToolName, args: Record<string, unknown> = {}) => {
    calls.push({ id: crypto.randomUUID(), name, arguments: args });
  };

  if (/(revenue|sales|how much|average order|aov)/.test(normalized)) {
    add("get_sales_summary", { preset: normalized.includes("last week") ? "7d" : "7d" });
  }
  if (/(best.?sell|top item|top dish)/.test(normalized)) {
    add("get_top_items", { preset: "7d", limit: 5 });
  }
  if (/(slow|underperform)/.test(normalized)) {
    add("get_slow_items", { preset: "7d", limit: 5 });
  }
  if (/(returning|new customer|inactive|customer)/.test(normalized)) {
    add("get_customer_summary", { preset: "30d" });
  }
  if (/(reservation|no.?show|cancel)/.test(normalized)) {
    add("get_reservation_summary", { preset: "30d" });
  }
  if (/(weakest|trend|tuesday|weekday|yesterday|brief)/.test(normalized)) {
    add("get_sales_trends", { weeks: 4 });
    add("get_sales_summary", { preset: "yesterday" });
  }
  if (/(order type|pickup|delivery|dine)/.test(normalized)) {
    add("get_order_summary", { preset: "7d" });
  }
  if (/(menu performance|menu item)/.test(normalized)) {
    add("get_menu_performance", { preset: "7d" });
  }

  if (calls.length === 0) {
    add("get_sales_summary", { preset: "7d" });
  }

  const unique = new Map<IntelligenceToolName, IntelligenceToolCall>();
  for (const call of calls) unique.set(call.name, call);
  return Array.from(unique.values());
}

function buildExplanationFromMetrics(
  question: string,
  metrics: Record<string, unknown>,
): string {
  const sales = metrics.get_sales_summary as
    | { revenue?: number; orders?: number; averageOrderValue?: number }
    | undefined;
  const trends = metrics.get_sales_trends as
    | {
        yesterday?: { revenue?: number; deltaPercent?: number; weekday?: string };
        weakestDay?: { date?: string; revenue?: number } | null;
      }
    | undefined;
  const topItems = metrics.get_top_items as
    | { items?: Array<{ name?: string; revenue?: number; quantity?: number }> }
    | undefined;
  const customers = metrics.get_customer_summary as
    | { inactiveCustomers?: number; returningCustomers?: number; newCustomers?: number }
    | undefined;

  if (/(best.?sell|top dish|top item)/i.test(question) && topItems?.items?.length) {
    const top = topItems.items[0];
    return `${top.name} generated the most revenue in the verified period (${top.quantity ?? 0} sold, NZ$${top.revenue ?? 0}).`;
  }

  if (trends?.yesterday && /(yesterday|brief|daily)/i.test(question)) {
    const delta = trends.yesterday.deltaPercent ?? 0;
    const direction = delta >= 0 ? "above" : "below";
    return `Yesterday revenue was NZ$${trends.yesterday.revenue ?? 0}, ${Math.abs(delta)}% ${direction} your recent ${trends.yesterday.weekday ?? "weekday"} average.`;
  }

  if (trends?.weakestDay && /(weakest|worst day)/i.test(question)) {
    return `Your weakest recent day was ${trends.weakestDay.date} with NZ$${trends.weakestDay.revenue ?? 0} in verified paid-order revenue.`;
  }

  if (customers && /(inactive|returning|customer)/i.test(question)) {
    return `${customers.inactiveCustomers ?? 0} customers have not returned within their typical visit interval. You also had ${customers.returningCustomers ?? 0} returning and ${customers.newCustomers ?? 0} new customers in the verified range.`;
  }

  if (sales) {
    return `Verified sales for the selected period: NZ$${sales.revenue ?? 0} revenue from ${sales.orders ?? 0} paid orders (average order value NZ$${sales.averageOrderValue ?? 0}).`;
  }

  return "I could not find verified restaurant metrics for that question.";
}

function buildMenuDescriptionDraft(prompt: string): string {
  const itemMatch = prompt.match(/for "([^"]+)"/);
  const itemName = itemMatch?.[1] ?? "This dish";
  const ingredientsMatch = prompt.match(/Ingredients: ([^\n]+)/);
  const ingredients = ingredientsMatch?.[1];

  if (ingredients) {
    return `${itemName} highlights ${ingredients.toLowerCase()}. Draft description for staff review before publishing.`;
  }

  return `${itemName} is prepared with care for your menu. Draft description for staff review before publishing.`;
}

export class DemoIntelligenceProvider implements IntelligenceProvider {
  readonly name = "demo";

  async complete(request: IntelligenceCompletionRequest): Promise<IntelligenceCompletionResponse> {
    const userMessage = [...request.messages].reverse().find((message) => message.role === "user");
    const initialQuestion = userMessage?.content ?? "";

    if (
      request.tools.length === 0 &&
      request.systemPrompt.toLowerCase().includes("menu description drafts")
    ) {
      return {
        content: buildMenuDescriptionDraft(initialQuestion),
        toolCalls: [],
        finishReason: "stop",
      };
    }

    if (request.tools.length > 0) {
      return {
        content: null,
        toolCalls: inferToolsFromQuestion(initialQuestion),
        finishReason: "tool_calls",
      };
    }

    const metricsMessage = [...request.messages]
      .reverse()
      .find((message) => message.content.includes("Verified metrics JSON:"));

    let metrics: Record<string, unknown> = {};
    if (metricsMessage) {
      const json = metricsMessage.content.split("Verified metrics JSON:")[1]?.trim();
      const questionSplit = json?.split("\n\nQuestion:");
      const payload = questionSplit?.[0]?.trim() ?? json?.trim();
      if (payload) {
        try {
          metrics = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          metrics = {};
        }
      }
    } else {
      const metricsRaw = [...request.messages]
        .reverse()
        .find((message) => message.role === "tool" && message.content.startsWith("{"));

      if (metricsRaw) {
        try {
          metrics = JSON.parse(metricsRaw.content) as Record<string, unknown>;
        } catch {
          metrics = {};
        }
      }
    }

    const question =
      metricsMessage?.content.split("\n\nQuestion:")[1]?.trim() ??
      initialQuestion;

    return {
      content: buildExplanationFromMetrics(question, metrics),
      toolCalls: [],
      finishReason: "stop",
    };
  }
}

export class FailingIntelligenceProvider implements IntelligenceProvider {
  readonly name = "failing";

  async complete(): Promise<IntelligenceCompletionResponse> {
    throw new IntelligenceProviderError("Intelligence provider unavailable");
  }
}

export class RecordingIntelligenceProvider implements IntelligenceProvider {
  readonly name = "recording";
  requests: IntelligenceCompletionRequest[] = [];
  private readonly delegate: IntelligenceProvider;

  constructor(delegate: IntelligenceProvider = new DemoIntelligenceProvider()) {
    this.delegate = delegate;
  }

  async complete(request: IntelligenceCompletionRequest): Promise<IntelligenceCompletionResponse> {
    this.requests.push(structuredClone(request));
    return this.delegate.complete(request);
  }
}

export function parseOpenAiToolCalls(raw: unknown): IntelligenceToolCall[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((call) => {
    const name = call?.function?.name;
    if (!isApprovedToolName(name)) return [];

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function.arguments ?? "{}") as Record<string, unknown>;
    } catch {
      args = {};
    }

    return [
      {
        id: String(call.id ?? crypto.randomUUID()),
        name,
        arguments: args,
      },
    ];
  });
}
