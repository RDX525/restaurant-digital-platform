"use client";

import { useEffect } from "react";
import { trackPageEvent } from "@/lib/analytics/client";

export function MenuPageTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackPageEvent(slug, "MENU_VIEW", "/menu");
  }, [slug]);

  return null;
}
