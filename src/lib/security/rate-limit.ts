type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= input.limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
