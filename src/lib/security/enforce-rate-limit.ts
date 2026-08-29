import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { checkRateLimit as checkDistributedRateLimit } from "./distributed-rate-limit";

export async function enforceRateLimit(
  request: Request,
  input: {
    scope: string;
    limit: number;
    windowMs: number;
  },
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const key = `${input.scope}:${ip}`;
  const checker =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? checkDistributedRateLimit
      : checkRateLimit;

  const result = await checker({
    key,
    limit: input.limit,
    windowMs: input.windowMs,
  });

  if (result.allowed) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}
