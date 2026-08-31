"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageEvent } from "@/lib/analytics/client";

export function MenuPageTracker({ slug }: { slug: string }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageEvent(slug, "MENU_VIEW", pathname);
  }, [slug, pathname]);

  return null;
}
