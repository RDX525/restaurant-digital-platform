import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoAuthEnabled } from "@/lib/auth/demo";
import { DEMO_SESSION_COOKIE, isDemoSession } from "@/lib/auth/session";
import { AuthenticationError } from "@/lib/auth/errors";

export interface ApiAuthContext {
  userId: string | null;
  email: string | null;
  isDemoSession: boolean;
}

export async function getApiAuthContext(): Promise<ApiAuthContext | null> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  const hasDemoSession = isDemoAuthEnabled() && isDemoSession(demoCookie);

  if (!isSupabaseConfigured()) {
    if (!hasDemoSession) return null;
    return { userId: null, email: null, isDemoSession: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      userId: user.id,
      email: user.email ?? null,
      isDemoSession: false,
    };
  }

  if (hasDemoSession) {
    return { userId: null, email: null, isDemoSession: true };
  }

  return null;
}

export async function requireApiAuth(): Promise<ApiAuthContext> {
  const auth = await getApiAuthContext();
  if (!auth) {
    throw new AuthenticationError();
  }
  return auth;
}
