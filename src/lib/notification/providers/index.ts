import type { EmailProvider, SmsProvider } from "../types";
import {
  DemoEmailProvider,
  DemoSmsProvider,
  RecordingDemoEmailProvider,
  RecordingDemoSmsProvider,
} from "./demo";
import { ResendEmailProvider } from "./resend";
import { TwilioSmsProvider } from "./twilio";
import { getEmailProviderName, getSmsProviderName } from "../config";

let emailProvider: EmailProvider | null = null;
let smsProvider: SmsProvider | null = null;
let useRecordingProviders = false;

export function setUseRecordingNotificationProviders(value: boolean): void {
  useRecordingProviders = value;
  emailProvider = null;
  smsProvider = null;
}

export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;

  const name = getEmailProviderName();
  switch (name) {
    case "demo":
      emailProvider = useRecordingProviders
        ? new RecordingDemoEmailProvider()
        : new DemoEmailProvider();
      return emailProvider;
    case "resend":
      emailProvider = new ResendEmailProvider();
      return emailProvider;
    default:
      throw new Error(`Unsupported email notification provider: ${name}`);
  }
}

export function getSmsProvider(): SmsProvider {
  if (smsProvider) return smsProvider;

  const name = getSmsProviderName();
  switch (name) {
    case "demo":
      smsProvider = useRecordingProviders
        ? new RecordingDemoSmsProvider()
        : new DemoSmsProvider();
      return smsProvider;
    case "twilio":
      smsProvider = new TwilioSmsProvider();
      return smsProvider;
    default:
      throw new Error(`Unsupported SMS notification provider: ${name}`);
  }
}
