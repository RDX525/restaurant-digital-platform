import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  createTableSession,
  recordQrScan,
  resolveQrToken,
} from "@/lib/table/data";
import { isValidQrTokenFormat } from "@/lib/table/tokens";
import { TABLE_SESSION_COOKIE, TABLE_SESSION_TTL_MS } from "@/lib/table/session";

type Params = { params: Promise<{ token: string }> };

function isLegacyDemoToken(token: string): boolean {
  return /^demo-t\d+-qrt-/.test(token);
}

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const origin = new URL(request.url).origin;

  if (!token || (!isValidQrTokenFormat(token) && !isLegacyDemoToken(token))) {
    return NextResponse.redirect(new URL("/?error=invalid-qr", origin));
  }

  const resolved = await resolveQrToken(token);
  if (!resolved || !resolved.is_published) {
    return NextResponse.redirect(new URL("/?error=invalid-qr", origin));
  }

  const headerStore = await headers();
  await recordQrScan(resolved, {
    userAgent: headerStore.get("user-agent"),
    referrer: headerStore.get("referer"),
  });

  const session = await createTableSession(resolved);
  const menuUrl = new URL(`/r/${resolved.restaurant_slug}/menu`, origin);
  menuUrl.searchParams.set("table", resolved.table.label);

  const response = NextResponse.redirect(menuUrl);
  response.cookies.set(TABLE_SESSION_COOKIE, session.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TABLE_SESSION_TTL_MS / 1000,
  });

  return response;
}
