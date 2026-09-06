"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageEvent } from "@/lib/analytics/client";

/** Tiny island so analytics does not enlarge the header module graph. */
export function WebsiteVisitTracker({ slug }: { slug: string }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageEvent(slug, "WEBSITE_VISIT", pathname);
  }, [slug, pathname]);

  return null;
}
