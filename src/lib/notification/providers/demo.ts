import type { EmailProvider, EmailSendInput, EmailSendResult, SmsProvider, SmsSendInput, SmsSendResult } from "../types";
import { shouldSimulateNotificationFailure } from "../config";

export class DemoEmailProvider implements EmailProvider {
  readonly name = "demo";

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    if (shouldSimulateNotificationFailure()) {
      throw new Error("Simulated email delivery failure");
    }

    return {
      messageId: `demo_email_${crypto.randomUUID().slice(0, 8)}`,
    };
  }
}

export class DemoSmsProvider implements SmsProvider {
  readonly name = "demo";

  async send(input: SmsSendInput): Promise<SmsSendResult> {
    if (shouldSimulateNotificationFailure()) {
      throw new Error("Simulated SMS delivery failure");
    }

    return {
      messageId: `demo_sms_${crypto.randomUUID().slice(0, 8)}`,
    };
  }
}

export const demoSentMessages: { channel: "email" | "sms"; recipient: string; body: string; subject?: string }[] = [];

export function resetDemoSentMessages(): void {
  demoSentMessages.length = 0;
}

export class RecordingDemoEmailProvider extends DemoEmailProvider {
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const result = await super.send(input);
    demoSentMessages.push({
      channel: "email",
      recipient: input.to,
      subject: input.subject,
      body: input.body,
    });
    return result;
  }
}

export class RecordingDemoSmsProvider extends DemoSmsProvider {
  async send(input: SmsSendInput): Promise<SmsSendResult> {
    const result = await super.send(input);
    demoSentMessages.push({
      channel: "sms",
      recipient: input.to,
      body: input.body,
    });
    return result;
  }
}
