export type AuthMode = "sign-in" | "sign-up" | "forgot-password";

export function parseAuthMode(value: string | null): AuthMode {
  if (value === "signup" || value === "sign-up") return "sign-up";
  if (value === "forgot" || value === "forgot-password") return "forgot-password";
  return "sign-in";
}
