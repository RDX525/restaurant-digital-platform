import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { resetDemoIntelligenceStore, storeDemoInsight } from "./demo-store";
import { listAiInsights } from "./data";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";

describe("intelligence authorization", () => {
  beforeEach(() => {
    resetDemoIntelligenceStore();
  });

  it("scopes stored insights to the restaurant tenant", async () => {
    storeDemoInsight({
      restaurantId: RESTAURANT_ID,
      insightType: "daily_brief",
      sourceMetrics: { revenue: 100 },
      generatedText: "Verified brief",
    });

    expect(await listAiInsights(RESTAURANT_ID)).toHaveLength(1);
    expect(await listAiInsights(OTHER_RESTAURANT_ID)).toHaveLength(0);
  });

  it("rejects insight storage for unauthorized restaurants", () => {
    expect(() =>
      storeDemoInsight({
        restaurantId: OTHER_RESTAURANT_ID,
        insightType: "ask_restaurant",
        sourceMetrics: {},
        generatedText: "Should fail",
      }),
    ).toThrow("Restaurant not found");
  });
});
