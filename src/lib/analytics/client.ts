"use client";

import type { AnalyticsEventType } from "./constants";
import type { ClientAnalyticsEventInput } from "./types";

const trackedOnceKeys = new Set<string>();

function getAnalyticsSessionId(restaurantSlug: string): string {
  const key = `kati-analytics-session:${restaurantSlug}`;
  if (typeof window === "undefined") return "server";

  let sessionId = window.sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export function trackAnalyticsEvent(input: ClientAnalyticsEventInput): void {
  if (typeof window === "undefined") return;

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      restaurantSlug: input.restaurantSlug,
      eventType: input.eventType,
      sessionId: input.sessionId ?? getAnalyticsSessionId(input.restaurantSlug),
      path: input.path ?? window.location.pathname,
      menuItemId: input.menuItemId,
      metadata: input.metadata,
    }),
  });
}

export function trackAnalyticsEventOnce(
  dedupeKey: string,
  input: ClientAnalyticsEventInput,
): void {
  if (trackedOnceKeys.has(dedupeKey)) return;
  trackedOnceKeys.add(dedupeKey);
  trackAnalyticsEvent(input);
}

export function trackPageEvent(
  restaurantSlug: string,
  eventType: AnalyticsEventType,
  path?: string,
): void {
  trackAnalyticsEventOnce(`${restaurantSlug}:${eventType}:${path ?? "default"}`, {
    restaurantSlug,
    eventType,
    path,
  });
}
