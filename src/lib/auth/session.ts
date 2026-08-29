export const DEMO_SESSION_COOKIE = "kati-demo-session";

export function isDemoSession(value: string | undefined): boolean {
  return value === "1";
}
