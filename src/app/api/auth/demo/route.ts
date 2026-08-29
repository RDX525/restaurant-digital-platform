import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoAuthEnabled } from "@/lib/auth/demo";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  remember: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    scope: "auth-demo",
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { error: "Demo sign-in is disabled. Use your Kāti account credentials." },
      { status: 403 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: parsed.data.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
  });

  return response;
}
