import { isProductionRuntime } from "./runtime";

const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function isProductionServerRuntime(): boolean {
  return isProductionRuntime() && process.env.NEXT_PHASE !== "phase-production-build";
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configured) {
    if (isProductionServerRuntime() && LOCALHOST_PATTERN.test(configured)) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be a public HTTPS URL in production (not localhost).",
      );
    }
    return configured;
  }

  if (isProductionServerRuntime()) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  }

  return "http://localhost:3000";
}

export function getPlatformHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    if (isProductionRuntime()) throw new Error("NEXT_PUBLIC_SITE_URL is invalid.");
    return "localhost:3000";
  }
}
