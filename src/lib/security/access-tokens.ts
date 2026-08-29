import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getAccessTokenSecret(): string {
  const secret =
    process.env.ACCESS_TOKEN_SECRET?.trim() ||
    process.env.PAYMENT_DEMO_WEBHOOK_SECRET?.trim();

  if (!secret || secret === "demo-webhook-secret-change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ACCESS_TOKEN_SECRET must be configured in production.");
    }
    return "dev-access-token-secret";
  }

  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getAccessTokenSecret()).update(payload).digest("base64url");
}

export function createScopedAccessToken(input: {
  scope: string;
  subject: string;
  ttlMs?: number;
}): string {
  const expiresAt = Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS);
  const payload = `${input.scope}:${input.subject}:${expiresAt}`;
  return `${Buffer.from(payload).toString("base64url")}.${signPayload(payload)}`;
}

export function verifyScopedAccessToken(
  token: string,
  scope: string,
  subject: string,
): boolean {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expected = signPayload(payload);

  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(provided, expectedBuffer)) return false;

  const [tokenScope, tokenSubject, expiresAtRaw] = payload.split(":");
  if (tokenScope !== scope || tokenSubject !== subject) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function createOrderHistoryAccessToken(email: string, restaurantSlug: string): string {
  return createScopedAccessToken({
    scope: "order_history",
    subject: `${email.trim().toLowerCase()}:${restaurantSlug.trim().toLowerCase()}`,
  });
}

export function verifyOrderHistoryAccessToken(
  token: string,
  email: string,
  restaurantSlug: string,
): boolean {
  return verifyScopedAccessToken(
    token,
    "order_history",
    `${email.trim().toLowerCase()}:${restaurantSlug.trim().toLowerCase()}`,
  );
}

export function createPaymentSessionAccessToken(sessionId: string): string {
  return createScopedAccessToken({
    scope: "payment_session",
    subject: sessionId,
    ttlMs: 1000 * 60 * 60 * 2,
  });
}

export function verifyPaymentSessionAccessToken(token: string, sessionId: string): boolean {
  return verifyScopedAccessToken(token, "payment_session", sessionId);
}
