export const TABLE_SESSION_COOKIE = "kati-table-session";
export const TABLE_SESSION_TTL_MS = 4 * 60 * 60 * 1000;

export function browserHasTableSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  const prefix = `${TABLE_SESSION_COOKIE}=`;
  return document.cookie.split(";").some((part) => part.trim().startsWith(prefix));
}

export function getTableSessionExpiry(from = new Date()): string {
  return new Date(from.getTime() + TABLE_SESSION_TTL_MS).toISOString();
}

export function isSessionExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}
