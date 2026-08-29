import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { resetDemoIntelligenceStore } from "./demo-store";
import { setIntelligenceProviderForTests } from "./providers";
import {
  DemoIntelligenceProvider,
  FailingIntelligenceProvider,
} from "./providers/demo";
import { askRestaurant, generateDailyBrief, generateMenuDescriptionDraft } from "./orchestrator";

const RESTAURANT_ID = getDemoRestaurantId();
const NOW = new Date("2026-08-25T02:00:00.000Z");

describe("intelligence orchestrator", () => {
  beforeEach(() => {
    resetDemoIntelligenceStore();
    setIntelligenceProviderForTests(new DemoIntelligenceProvider());
  });

  it("answers metric questions using verified tool data", async () => {
    const result = await askRestaurant({
      restaurantId: RESTAURANT_ID,
      question: "How much revenue did I make last week?",
      now: NOW,
    });

    expect(result.toolsUsed).toContain("get_sales_summary");
    expect(result.answer.toLowerCase()).toMatch(/verified|revenue|nz\$/);
    expect(result.insight.restaurant_id).toBe(RESTAURANT_ID);
  });

  it("handles empty verified data without inventing numbers", async () => {
    const result = await askRestaurant({
      restaurantId: RESTAURANT_ID,
      question: "What were my best-selling dishes?",
      now: NOW,
    });

    expect(result.toolsUsed).toContain("get_top_items");
    expect(result.answer).not.toMatch(/NZ\$[1-9]/);
  });

  it("falls back safely when the provider fails", async () => {
    setIntelligenceProviderForTests(new FailingIntelligenceProvider());

    const result = await generateDailyBrief({
      restaurantId: RESTAURANT_ID,
      now: NOW,
    });

    expect(result.brief).toContain("Verified sales summary");
    expect(Object.keys(result.sourceMetrics).length).toBeGreaterThan(0);
  });

  it("returns a draft menu description without publishing", async () => {
    const result = await generateMenuDescriptionDraft({
      restaurantId: RESTAURANT_ID,
      itemName: "Market Fish",
      ingredients: "line-caught snapper, lemon butter",
      tone: "elegant",
    });

    expect(result.draft.toLowerCase()).toContain("market fish");
    expect(result.insight.insight_type).toBe("menu_description_draft");
  });

  it("survives provider failure for menu description drafts", async () => {
    setIntelligenceProviderForTests(new FailingIntelligenceProvider());

    const result = await generateMenuDescriptionDraft({
      restaurantId: RESTAURANT_ID,
      itemName: "Seasonal Salad",
      ingredients: "greens, citrus vinaigrette",
    });

    expect(result.draft).toContain("Seasonal Salad");
    expect(result.draft.toLowerCase()).toMatch(/draft|review/);
  });
});
