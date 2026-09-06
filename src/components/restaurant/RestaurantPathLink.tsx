import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { getRequestRestaurantNav } from "@/lib/restaurant/request-nav";
import { getRestaurantNavHref, resolveRestaurantPath } from "@/lib/restaurant/routing";
import { cn } from "@/lib/utils";

export async function RestaurantPathLink({
  restaurant,
  path,
  className,
  children,
  prefetch,
  style,
}: {
  restaurant: PublicRestaurant;
  path: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  style?: CSSProperties;
}) {
  const { useRootPaths } = await getRequestRestaurantNav(restaurant.slug);
  const href =
    path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")
      ? resolveRestaurantPath(restaurant, path, useRootPaths)
      : getRestaurantNavHref(restaurant.slug, path, useRootPaths);

  return (
    <Link href={href} className={cn("touch-manipulation", className)} prefetch={prefetch} style={style}>
      {children}
    </Link>
  );
}
