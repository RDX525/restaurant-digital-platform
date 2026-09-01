import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

export const DEFAULT_PHONE_REGION: CountryCode = "NZ";

const COUNTRY_NAME_TO_REGION: Record<string, CountryCode> = {
  "new zealand": "NZ",
  nz: "NZ",
  australia: "AU",
  au: "AU",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "united kingdom": "GB",
  "great britain": "GB",
  england: "GB",
  uk: "GB",
  canada: "CA",
};

export const EMAIL_REQUIRED_MESSAGE = "Enter your email address";
export const EMAIL_INVALID_MESSAGE = "Enter a valid email address";
export const PHONE_REQUIRED_MESSAGE = "Enter your phone number";
export const PHONE_INVALID_MESSAGE =
  "Enter a valid phone number. NZ numbers can start with 0; otherwise include a country code.";

export function phoneRegionFromCountry(country?: string | null): CountryCode {
  if (!country?.trim()) return DEFAULT_PHONE_REGION;
  const trimmed = country.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase() as CountryCode;
  }
  return COUNTRY_NAME_TO_REGION[trimmed.toLowerCase()] ?? DEFAULT_PHONE_REGION;
}

export function normalizeGuestEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function toE164Phone(
  value: string,
  country?: string | null,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parsePhoneNumberFromString(trimmed, phoneRegionFromCountry(country));
  if (!parsed?.isValid()) return null;
  return parsed.format("E.164");
}

export const guestEmailSchema = z
  .string()
  .trim()
  .min(1, EMAIL_REQUIRED_MESSAGE)
  .email(EMAIL_INVALID_MESSAGE)
  .transform((value) => value.toLowerCase());

export const guestPhoneInputSchema = z
  .string()
  .trim()
  .min(1, PHONE_REQUIRED_MESSAGE)
  .max(40, PHONE_INVALID_MESSAGE);

export function guestPhoneSchema(country?: string | null) {
  return guestPhoneInputSchema.transform((value, ctx) => {
    const e164 = toE164Phone(value, country);
    if (!e164) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_INVALID_MESSAGE });
      return z.NEVER;
    }
    return e164;
  });
}

export type GuestContactErrors = {
  email?: string;
  phone?: string;
};

export type GuestContactParseResult =
  | { ok: true; email: string; phone: string }
  | { ok: false; errors: GuestContactErrors };

export function parseGuestContact(
  input: { email: string; phone: string },
  country?: string | null,
): GuestContactParseResult {
  const emailResult = guestEmailSchema.safeParse(input.email);
  const phoneResult = guestPhoneSchema(country).safeParse(input.phone);
  const errors: GuestContactErrors = {};

  if (!emailResult.success) {
    errors.email = emailResult.error.issues[0]?.message ?? EMAIL_INVALID_MESSAGE;
  }
  if (!phoneResult.success) {
    errors.phone = phoneResult.error.issues[0]?.message ?? PHONE_INVALID_MESSAGE;
  }

  if (errors.email || errors.phone || !emailResult.success || !phoneResult.success) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    email: emailResult.data,
    phone: phoneResult.data,
  };
}

export function guestContactErrorMessage(errors: GuestContactErrors): string {
  return errors.email ?? errors.phone ?? "Please check your contact details.";
}
