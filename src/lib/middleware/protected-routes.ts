export function isCronApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/cron/");
}

export function isProtectedApiPath(pathname: string, method: string): boolean {
  if (isCronApiPath(pathname)) {
    return false;
  }

  const isPublicReadApi =
    method === "GET" &&
    (pathname.startsWith("/api/restaurants/by-slug/") ||
      /^\/api\/menus(\/[^/]+)?$/.test(pathname));

  const isPublicOrderApi =
    method === "POST" && pathname === "/api/orders";

  const isPublicOrderHistoryApi =
    method === "GET" && pathname === "/api/orders";

  const isPublicTableSessionApi =
    method === "GET" && pathname === "/api/table-session";

  const isPublicPaymentWebhookApi =
    method === "POST" && pathname.startsWith("/api/webhooks/payments/");

  const isPublicPaymentSessionReadApi =
    method === "GET" && /^\/api\/payments\/sessions\/[^/]+$/.test(pathname);

  const isPublicPaymentPayApi =
    method === "POST" && /^\/api\/payments\/sessions\/[^/]+\/pay$/.test(pathname);

  const isPublicReservationApi =
    method === "POST" && pathname === "/api/reservations";

  const isPublicReservationAvailabilityApi =
    method === "GET" && pathname === "/api/reservations/availability";

  const isPublicAnalyticsEventsApi =
    method === "POST" && pathname === "/api/analytics/events";

  if (
    isPublicReadApi ||
    isPublicOrderApi ||
    isPublicOrderHistoryApi ||
    isPublicTableSessionApi ||
    isPublicPaymentWebhookApi ||
    isPublicPaymentSessionReadApi ||
    isPublicPaymentPayApi ||
    isPublicReservationApi ||
    isPublicReservationAvailabilityApi ||
    isPublicAnalyticsEventsApi
  ) {
    return false;
  }

  return (
    pathname.startsWith("/api/menus") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/items") ||
    pathname.startsWith("/api/modifier-groups") ||
    pathname.startsWith("/api/modifiers") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/invites") ||
    (pathname.startsWith("/api/restaurants") &&
      !pathname.startsWith("/api/restaurants/by-slug") &&
      !pathname.startsWith("/api/auth"))
  );
}

export function isPublicPlatformPath(pathname: string): boolean {
  return (
    pathname.startsWith("/r/") ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/qr/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/auth/")
  );
}
