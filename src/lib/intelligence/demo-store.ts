import { getDemoRestaurantId } from "@/lib/utils";
import type { AiInsightRecord } from "./types";
import type { InsightType } from "./constants";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();
let insights: AiInsightRecord[] = [];

export function resetDemoIntelligenceStore(): void {
  insights = [];
}

export function loadDemoInsights(records: AiInsightRecord[]): void {
  insights = structuredClone(records);
}

export function storeDemoInsight(input: {
  restaurantId: string;
  insightType: InsightType;
  sourceMetrics: Record<string, unknown>;
  generatedText: string;
}): AiInsightRecord {
  if (input.restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  const record: AiInsightRecord = {
    id: crypto.randomUUID(),
    restaurant_id: input.restaurantId,
    insight_type: input.insightType,
    source_metrics: input.sourceMetrics,
    generated_text: input.generatedText,
    created_at: new Date().toISOString(),
  };

  insights.unshift(record);
  return structuredClone(record);
}

export function listDemoInsightsForRestaurant(
  restaurantId: string,
  options?: { insightType?: InsightType; limit?: number },
): AiInsightRecord[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];

  return insights
    .filter((insight) => insight.restaurant_id === restaurantId)
    .filter((insight) =>
      options?.insightType ? insight.insight_type === options.insightType : true,
    )
    .slice(0, options?.limit ?? 20);
}
