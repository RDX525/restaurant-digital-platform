import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/env/site-url";

export function getAuthCallbackUrl(next = "/dashboard/menus"): string {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getPasswordResetUrl(): string {
  return `${getSiteUrl()}/auth/reset-password`;
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" as const };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(
      error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message,
    );
  }

  return { mode: "supabase" as const };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  restaurantName?: string;
}) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      message:
        "Demo mode is active. You can explore the dashboard now. Connect Supabase to create real accounts.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        restaurant_name: input.restaurantName ?? null,
      },
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) throw new Error(error.message);

  if (data.session) {
    return {
      mode: "supabase" as const,
      message: "Your account is ready. Welcome to Kāti.",
    };
  }

  return {
    mode: "supabase" as const,
    message: "Check your email to confirm your account, then sign in.",
  };
}

export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      message:
        "Password reset requires Supabase Auth. In demo mode, sign in with any email and password.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetUrl(),
  });

  if (error) throw new Error(error.message);

  return {
    mode: "supabase" as const,
    message: "If an account exists for that email, we sent a password reset link.",
  };
}

export async function updatePassword(password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Password reset is unavailable in demo mode.");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) throw new Error(error.message);
}

export async function createDemoSession(email: string, remember: boolean) {
  const response = await fetch("/api/auth/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, remember }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Unable to sign in. Please try again.");
  }
}
