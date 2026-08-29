import type { EmailProvider, EmailSendInput, EmailSendResult } from "../types";

function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY must be set when using the Resend notification provider.");
  }
  return key;
}

function getResendFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL must be set when using the Resend notification provider.");
  }
  return from;
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getResendApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getResendFromAddress(),
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });

    const payload = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      throw new Error(payload.message ?? `Resend API error (${response.status})`);
    }

    if (!payload.id) {
      throw new Error("Resend API did not return a message id.");
    }

    return { messageId: payload.id };
  }
}
