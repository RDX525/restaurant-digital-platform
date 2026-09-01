import { describe, expect, it } from "vitest";
import { DEFAULT_DINING_LOCATION_NAME } from "./constants";

describe("table constants", () => {
  it("uses a default dining room name for QR tables", () => {
    expect(DEFAULT_DINING_LOCATION_NAME.length).toBeGreaterThan(0);
  });
});
