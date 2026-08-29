import { describe, expect, it } from "vitest";
import { resolveDateRange, isWithinRange } from "./date-range";

describe("analytics date ranges", () => {
  const timezone = "Pacific/Auckland";
  const now = new Date("2026-08-25T02:00:00.000Z");

  it("resolves today using the restaurant timezone", () => {
    const range = resolveDateRange("today", timezone, undefined, undefined, now);

    expect(range.startDate).toBe("2026-08-25");
    expect(range.endDate).toBe("2026-08-25");
    expect(range.timezone).toBe(timezone);
    expect(isWithinRange("2026-08-25T10:00:00.000Z", range)).toBe(true);
    expect(isWithinRange("2026-08-24T10:00:00.000Z", range)).toBe(false);
  });

  it("resolves yesterday relative to restaurant-local today", () => {
    const range = resolveDateRange("yesterday", timezone, undefined, undefined, now);

    expect(range.startDate).toBe("2026-08-24");
    expect(range.endDate).toBe("2026-08-24");
    expect(isWithinRange("2026-08-24T06:00:00.000Z", range)).toBe(true);
    expect(isWithinRange("2026-08-25T10:00:00.000Z", range)).toBe(false);
  });

  it("resolves rolling 7-day and 30-day windows inclusively", () => {
    const sevenDay = resolveDateRange("7d", timezone, undefined, undefined, now);
    const thirtyDay = resolveDateRange("30d", timezone, undefined, undefined, now);

    expect(sevenDay.startDate).toBe("2026-08-19");
    expect(sevenDay.endDate).toBe("2026-08-25");
    expect(thirtyDay.startDate).toBe("2026-07-27");
    expect(thirtyDay.endDate).toBe("2026-08-25");
    expect(isWithinRange("2026-08-19T06:00:00.000Z", sevenDay)).toBe(true);
    expect(isWithinRange("2026-08-18T06:00:00.000Z", sevenDay)).toBe(false);
  });

  it("normalizes custom ranges and swaps inverted dates", () => {
    const range = resolveDateRange("custom", timezone, "2026-08-28", "2026-08-26", now);

    expect(range.startDate).toBe("2026-08-26");
    expect(range.endDate).toBe("2026-08-28");
    expect(isWithinRange("2026-08-27T06:00:00.000Z", range)).toBe(true);
    expect(isWithinRange("2026-08-25T06:00:00.000Z", range)).toBe(false);
  });
});
