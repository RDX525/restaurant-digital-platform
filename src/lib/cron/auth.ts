/** Validates scheduled job requests (Vercel Cron, manual ops). */

export class CronAuthorizationError extends Error {
  constructor(message = "Unauthorized cron request") {
    super(message);
    this.name = "CronAuthorizationError";
  }
}

export function assertCronAuthorized(request: Request): void {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    throw new CronAuthorizationError("CRON_SECRET is not configured.");
  }

  const header = request.headers.get("authorization")?.trim();
  if (header !== `Bearer ${secret}`) {
    throw new CronAuthorizationError();
  }
}
