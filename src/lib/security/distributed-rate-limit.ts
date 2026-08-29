import { checkRateLimit as checkMemoryRateLimit } from "./rate-limit";

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function upstashCommand<T>(command: unknown[]): Promise<T> {
  const config = getUpstashConfig();
  if (!config) {
    throw new Error("Upstash is not configured");
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const payload = (await response.json()) as { result?: T; error?: string };
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `Upstash error (${response.status})`);
  }

  return payload.result as T;
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterMs: number }> {
  if (!getUpstashConfig()) {
    return checkMemoryRateLimit(input);
  }

  const windowSeconds = Math.max(1, Math.ceil(input.windowMs / 1000));
  const redisKey = `ratelimit:${input.key}`;

  try {
    const count = await upstashCommand<number>(["INCR", redisKey]);
    if (count === 1) {
      await upstashCommand<number>(["EXPIRE", redisKey, windowSeconds]);
    }

    if (count > input.limit) {
      const ttl = await upstashCommand<number>(["TTL", redisKey]);
      const retryAfterMs = Math.max(1000, ttl > 0 ? ttl * 1000 : input.windowMs);
      return { allowed: false, retryAfterMs };
    }

    return { allowed: true, retryAfterMs: 0 };
  } catch {
    return checkMemoryRateLimit(input);
  }
}

export function isDistributedRateLimitEnabled(): boolean {
  return Boolean(getUpstashConfig());
}
