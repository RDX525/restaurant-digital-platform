export function sanitizeInternalRedirectPath(next: string | null | undefined): string {
  const fallback = "/dashboard/menus";
  if (!next) return fallback;

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  if (!next.startsWith("/dashboard")) {
    return fallback;
  }

  return next;
}
