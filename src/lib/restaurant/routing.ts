import type { PublicRestaurant } from "./types";
import { getRestaurantBasePath } from "./seo";
import { getPlatformHost } from "@/lib/env/site-url";

export function resolveRestaurantPath(
  restaurant: PublicRestaurant,
  path: string,
  useRootPaths = false,
): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/r/")) {
    return path;
  }
  const base = getRestaurantNavBase(restaurant.slug, useRootPaths);
  if (path.startsWith("/")) {
    return `${base}${path}`;
  }
  return `${base}/${path}`;
}

export function isPreviewMode(searchParams?: {
  preview?: string | string[];
}): boolean {
  const value = searchParams?.preview;
  return value === "1" || value === "true";
}

export function isCustomDomainHost(host: string): boolean {
  const platformHost = getPlatformHost();
  return host !== platformHost && !host.startsWith("localhost");
}

export function restaurantUsesRootPaths(pathname: string, slug: string): boolean {
  return !pathname.startsWith(`/r/${slug}`);
}

export function getRestaurantNavBase(
  slug: string,
  useRootPaths: boolean,
): string {
  return useRootPaths ? "" : getRestaurantBasePath(slug);
}

export function getRestaurantNavHref(
  slug: string,
  segment: string,
  useRootPaths: boolean,
): string {
  const base = getRestaurantNavBase(slug, useRootPaths);
  if (!segment) return base || "/";
  return `${base}/${segment}`;
}

export function isRestaurantNavActive(
  pathname: string,
  href: string,
  segment: string,
  slug: string,
): boolean {
  const platformBase = getRestaurantBasePath(slug);
  if (segment === "") {
    return pathname === href || pathname === platformBase || pathname === `${platformBase}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
