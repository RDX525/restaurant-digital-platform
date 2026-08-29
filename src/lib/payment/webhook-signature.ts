import { createHmac, timingSafeEqual } from "crypto";
import { getPaymentDemoWebhookSecret } from "./config";

export function signWebhookPayload(rawBody: string, secret = getPaymentDemoWebhookSecret()): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = signWebhookPayload(rawBody, secret);
  const provided = signature.replace(/^sha256=/, "");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

export function buildWebhookSignatureHeader(rawBody: string, secret?: string): string {
  return `sha256=${signWebhookPayload(rawBody, secret)}`;
}
