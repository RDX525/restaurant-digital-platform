import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/r/"],
        disallow: ["/dashboard/", "/api/", "/menu/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
