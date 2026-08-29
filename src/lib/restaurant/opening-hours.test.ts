import { describe, expect, it } from "vitest";
import {
  createDefaultOpeningHours,
  normalizeOpeningHours,
  updateOpeningHoursDay,
} from "@/lib/restaurant/opening-hours";

describe("opening hours helpers", () => {
  it("creates defaults for all days", () => {
    const hours = createDefaultOpeningHours();
    expect(Object.keys(hours)).toHaveLength(7);
    expect(hours.monday?.closed).toBe(false);
  });

  it("normalizes partial hours", () => {
    const hours = normalizeOpeningHours({
      monday: { open: "09:00", close: "17:00", closed: false },
    });
    expect(hours.monday?.open).toBe("09:00");
    expect(hours.tuesday?.closed).toBe(true);
  });

  it("updates a single day", () => {
    const hours = createDefaultOpeningHours();
    const updated = updateOpeningHoursDay(hours, "friday", { closed: true });
    expect(updated.friday?.closed).toBe(true);
  });
});
