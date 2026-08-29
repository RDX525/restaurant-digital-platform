import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAuthState } from "@/lib/auth/middleware";
import { getCachedDomainSlug, setCachedDomainSlug } from "@/lib/middleware/domain-cache";
import {
  isProtectedApiPath,
  isPublicPlatformPath,
} from "@/lib/middleware/protected-routes";
import { isCustomDomainHost } from "@/lib/restaurant/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PUBLIC_PATH_PREFIX = "/r/";

function applyPreviewHeader(request: NextRequest): NextResponse | null {
  const preview = request.nextUrl.searchParams.get("preview");
  if (preview !== "1" && preview !== "true") return null;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-restaurant-preview", "1");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  const cached = getCachedDomainSlug(host);
  if (cached !== undefined) return cached;

  const env = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!env || !key || !isSupabaseConfigured()) {
    setCachedDomainSlug(host, null);
    return null;
  }

  const supabase = createServerClient(env, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data: byDomain } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("custom_domain", host)
    .maybeSingle();

  if (byDomain?.slug) {
    setCachedDomainSlug(host, byDomain.slug);
    return byDomain.slug;
  }

  const { data: domainRow } = await supabase
    .from("restaurant_domains")
    .select("restaurant_id")
    .eq("domain", host)
    .maybeSingle();

  if (!domainRow?.restaurant_id) {
    setCachedDomainSlug(host, null);
    return null;
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", domainRow.restaurant_id)
    .maybeSingle();

  const slug = restaurant?.slug ?? null;
  setCachedDomainSlug(host, slug);
  return slug;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (!isCustomDomainHost(host)) {
    if (isPublicPlatformPath(pathname)) {
      if (pathname.startsWith("/r/")) {
        return applyPreviewHeader(request) ?? NextResponse.next();
      }
      return NextResponse.next();
    }

    const needsAuth =
      pathname.startsWith("/dashboard") ||
      pathname === "/" ||
      isProtectedApiPath(pathname, method);

    if (!needsAuth) {
      return NextResponse.next();
    }

    const { isAuthenticated } = await getAuthState(request);

    if (pathname.startsWith("/dashboard") && !isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isProtectedApiPath(pathname, method) && !isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname === "/" && isAuthenticated) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard/menus";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    if (pathname.startsWith("/dashboard") || isProtectedApiPath(pathname, method)) {
      const { isAuthenticated } = await getAuthState(request);
      if (!isAuthenticated) {
        if (pathname.startsWith("/dashboard")) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/";
          loginUrl.searchParams.set("next", pathname);
          return NextResponse.redirect(loginUrl);
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  const slug = await resolveCustomDomainSlug(host);
  if (!slug) {
    return NextResponse.next();
  }

  const rewritePath =
    pathname === "/"
      ? `${PUBLIC_PATH_PREFIX}${slug}`
      : `${PUBLIC_PATH_PREFIX}${slug}${pathname}`;

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-restaurant-slug", slug);
  requestHeaders.set("x-restaurant-domain", host);

  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/auth/:path*",
    "/api/:path*",
    "/r/:path*",
    "/menu/:path*",
    "/q/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
