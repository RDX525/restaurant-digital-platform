import type { SmsProvider, SmsSendInput, SmsSendResult } from "../types";

function getTwilioCredentials(): { accountSid: string; authToken: string; from: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER must be set when using Twilio.",
    );
  }

  return { accountSid, authToken, from };
}

export class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  async send(input: SmsSendInput): Promise<SmsSendResult> {
    const { accountSid, authToken, from } = getTwilioCredentials();
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      To: input.to,
      From: from,
      Body: input.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const payload = (await response.json()) as { sid?: string; message?: string };

    if (!response.ok) {
      throw new Error(payload.message ?? `Twilio API error (${response.status})`);
    }

    if (!payload.sid) {
      throw new Error("Twilio API did not return a message sid.");
    }

    return { messageId: payload.sid };
  }
}
