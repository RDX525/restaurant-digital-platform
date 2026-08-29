import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPaymentProviderName } from "@/lib/payment/config";
import {
  getEmailProviderName,
  getSmsProviderName,
} from "@/lib/notification/config";
import { getSiteUrl } from "./site-url";
import { isProductionRuntime } from "./runtime";

export type ProductionValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function isPlaceholderSecret(value: string | undefined, placeholders: string[]): boolean {
  if (!value?.trim()) return true;
  const normalized = value.trim().toLowerCase();
  return placeholders.some((placeholder) => normalized === placeholder.toLowerCase());
}

export function validateProductionEnvironment(): ProductionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isProductionRuntime()) {
    return { ok: true, errors, warnings };
  }

  if (!isSupabaseConfigured()) {
    errors.push(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (isPlaceholderSecret(process.env.SUPABASE_SERVICE_ROLE_KEY, ["your-service-role-key"])) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY must be set to the service role key.");
  }

  try {
    getSiteUrl();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid NEXT_PUBLIC_SITE_URL.");
  }

  if (isPlaceholderSecret(process.env.ACCESS_TOKEN_SECRET, ["demo-webhook-secret-change-me"])) {
    errors.push(
      "ACCESS_TOKEN_SECRET must be set to a unique random string (32+ characters recommended).",
    );
  }

  if (getPaymentProviderName() === "demo") {
    errors.push("PAYMENT_PROVIDER must not be 'demo' in production.");
  } else if (getPaymentProviderName() === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      errors.push("STRIPE_SECRET_KEY must be set when PAYMENT_PROVIDER=stripe.");
    }
    if (!process.env.PAYMENT_STRIPE_WEBHOOK_SECRET?.trim()) {
      errors.push("PAYMENT_STRIPE_WEBHOOK_SECRET must be set when PAYMENT_PROVIDER=stripe.");
    }
  }

  const emailProvider = getEmailProviderName();
  const smsProvider = getSmsProviderName();

  if (emailProvider === "demo" && smsProvider === "demo") {
    warnings.push(
      "Notification providers are 'demo'. Email and SMS will be logged only, not delivered.",
    );
  } else {
    if (emailProvider === "resend") {
      if (!process.env.RESEND_API_KEY?.trim()) {
        errors.push("RESEND_API_KEY must be set when email provider is resend.");
      }
      if (!process.env.RESEND_FROM_EMAIL?.trim()) {
        errors.push("RESEND_FROM_EMAIL must be set when email provider is resend.");
      }
    }
    if (smsProvider === "twilio") {
      if (!process.env.TWILIO_ACCOUNT_SID?.trim()) {
        errors.push("TWILIO_ACCOUNT_SID must be set when SMS provider is twilio.");
      }
      if (!process.env.TWILIO_AUTH_TOKEN?.trim()) {
        errors.push("TWILIO_AUTH_TOKEN must be set when SMS provider is twilio.");
      }
      if (!process.env.TWILIO_FROM_NUMBER?.trim()) {
        errors.push("TWILIO_FROM_NUMBER must be set when SMS provider is twilio.");
      }
    }
  }

  if (!process.env.CRON_SECRET?.trim()) {
    warnings.push(
      "CRON_SECRET is not set. Scheduled cron routes (/api/cron/*) will reject requests.",
    );
  }

  const intelligenceProvider = process.env.INTELLIGENCE_PROVIDER ?? "demo";
  if (intelligenceProvider === "openai") {
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey || openAiKey === "your-openai-api-key") {
      errors.push("OPENAI_API_KEY must be set when INTELLIGENCE_PROVIDER=openai.");
    }
  }

  if (process.env.ENABLE_DEMO_AUTH === "true") {
    errors.push("ENABLE_DEMO_AUTH must not be enabled in production.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertProductionEnvironment(): void {
  const result = validateProductionEnvironment();
  if (!result.ok) {
    throw new Error(`Production environment invalid:\n- ${result.errors.join("\n- ")}`);
  }
}
