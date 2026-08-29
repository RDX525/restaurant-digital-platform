export function getNotificationProviderName(): string {
  return process.env.NOTIFICATION_PROVIDER ?? "demo";
}

export function getEmailProviderName(): string {
  return (
    process.env.NOTIFICATION_EMAIL_PROVIDER?.trim() ||
    (getNotificationProviderName() === "resend" ? "resend" : getNotificationProviderName())
  );
}

export function getSmsProviderName(): string {
  if (process.env.NOTIFICATION_SMS_PROVIDER?.trim()) {
    return process.env.NOTIFICATION_SMS_PROVIDER.trim();
  }
  if (getNotificationProviderName() === "twilio") {
    return "twilio";
  }
  return "demo";
}

export function isDemoNotificationProvider(): boolean {
  return getEmailProviderName() === "demo" && getSmsProviderName() === "demo";
}

export function shouldSimulateNotificationFailure(): boolean {
  return process.env.NOTIFICATION_DEMO_SIMULATE_FAILURE === "true";
}
