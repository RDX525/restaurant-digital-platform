export function getPaymentProviderName(): string {
  return process.env.PAYMENT_PROVIDER ?? "demo";
}

export function getPaymentDemoWebhookSecret(): string {
  const secret = process.env.PAYMENT_DEMO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PAYMENT_DEMO_WEBHOOK_SECRET must be set in production.");
    }
    return "demo-webhook-secret-change-me";
  }
  if (process.env.NODE_ENV === "production" && secret === "demo-webhook-secret-change-me") {
    throw new Error("PAYMENT_DEMO_WEBHOOK_SECRET must not use the default value in production.");
  }
  return secret;
}

export function getPaymentWebhookSecrets(provider: string): string | null {
  const key = `PAYMENT_${provider.toUpperCase()}_WEBHOOK_SECRET`;
  return process.env[key] ?? null;
}

export function isDemoPaymentProvider(): boolean {
  return getPaymentProviderName() === "demo";
}
