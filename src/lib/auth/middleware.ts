import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { isDemoAuthEnabled } from "@/lib/auth/demo";
import { DEMO_SESSION_COOKIE, isDemoSession } from "./session";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("-auth-token") ||
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("supabase"),
    );
}

export async function getAuthState(request: NextRequest) {
  const demoSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const hasDemoSession =
    isDemoAuthEnabled() && isDemoSession(demoSession);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { isAuthenticated: hasDemoSession, hasDemoSession, user: null };
  }

  // Skip network auth lookup when the browser has no session cookies (landing TTFB).
  if (!hasDemoSession && !hasSupabaseAuthCookie(request)) {
    return { isAuthenticated: false, hasDemoSession: false, user: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    isAuthenticated: Boolean(user) || hasDemoSession,
    hasDemoSession,
    user,
  };
}
