import { describe, expect, it } from "vitest";
import {
  guestEmailSchema,
  parseGuestContact,
  phoneRegionFromCountry,
  toE164Phone,
} from "@/lib/validation/guest-contact";

describe("guest contact validation", () => {
  it("normalizes email to lowercase", () => {
    expect(guestEmailSchema.parse("  Alex@Example.COM ")).toBe("alex@example.com");
  });

  it("rejects invalid emails", () => {
    expect(guestEmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(guestEmailSchema.safeParse("").success).toBe(false);
  });

  it("maps restaurant country names to phone regions", () => {
    expect(phoneRegionFromCountry("New Zealand")).toBe("NZ");
    expect(phoneRegionFromCountry("au")).toBe("AU");
    expect(phoneRegionFromCountry(null)).toBe("NZ");
  });

  it("normalizes NZ local and international phones to E.164", () => {
    expect(toE164Phone("021 123 4567", "New Zealand")).toBe("+64211234567");
    expect(toE164Phone("+64 21 000 0000", "New Zealand")).toBe("+64210000000");
    expect(toE164Phone("+1 202 555 0100")).toBe("+12025550100");
  });

  it("rejects junk phone numbers", () => {
    expect(toE164Phone("hello")).toBeNull();
    expect(toE164Phone("123")).toBeNull();
  });

  it("parses guest contact together", () => {
    const result = parseGuestContact(
      { email: "Guest@Example.com", phone: "021 555 0101" },
      "New Zealand",
    );
    expect(result).toEqual({
      ok: true,
      email: "guest@example.com",
      phone: "+64215550101",
    });
  });

  it("returns field errors when both email and phone are invalid", () => {
    const result = parseGuestContact({ email: "nope", phone: "abc" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toMatch(/valid email/i);
    expect(result.errors.phone).toMatch(/valid phone/i);
  });
});
