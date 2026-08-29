import { getSiteUrl } from "@/lib/env/site-url";

const TOKEN_PREFIX = "qrt_";

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateQrTokenValue(): string {
  return `${TOKEN_PREFIX}${randomBase64Url(24)}`;
}

export function generateSessionTokenValue(): string {
  return randomBase64Url(32);
}

export function isValidQrTokenFormat(token: string): boolean {
  return /^qrt_[A-Za-z0-9_-]{20,}$/.test(token);
}

export function buildQrScanUrl(token: string, siteUrl?: string): string {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  return `${base}/q/${token}`;
}
