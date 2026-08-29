import { describe, expect, it } from "vitest";
import {
  generateQrTokenValue,
  generateSessionTokenValue,
  isValidQrTokenFormat,
  buildQrScanUrl,
} from "@/lib/table/tokens";

describe("QR token utilities", () => {
  it("generates tokens with the required prefix and length", () => {
    const token = generateQrTokenValue();
    expect(token.startsWith("qrt_")).toBe(true);
    expect(isValidQrTokenFormat(token)).toBe(true);
  });

  it("generates unique session tokens", () => {
    const a = generateSessionTokenValue();
    const b = generateSessionTokenValue();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("rejects malformed QR token formats", () => {
    expect(isValidQrTokenFormat("demo-t1-qrt-000000000001")).toBe(false);
    expect(isValidQrTokenFormat("qrt_short")).toBe(false);
    expect(isValidQrTokenFormat("")).toBe(false);
  });

  it("builds scan URLs from token values", () => {
    const url = buildQrScanUrl("qrt_abc123def456", "https://example.com");
    expect(url).toBe("https://example.com/q/qrt_abc123def456");
  });
});
