import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeInternalRedirectPath } from "@/lib/security/safe-redirect";
import { provisionRestaurantForUser } from "@/lib/auth/provision-restaurant";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeInternalRedirectPath(searchParams.get("next"));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/?mode=sign-in`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await provisionRestaurantForUser({
          id: user.id,
          email: user.email,
          userMetadata: user.user_metadata as Record<string, unknown>,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  } catch {
    // Fall through to login redirect.
  }

  return NextResponse.redirect(`${origin}/?mode=sign-in`);
}
