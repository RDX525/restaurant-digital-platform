import { headers } from "next/headers";
import { getRestaurantNavBase } from "./routing";

export async function getRequestRestaurantNav(slug: string): Promise<{
  useRootPaths: boolean;
  base: string;
}> {
  const headerStore = await headers();
  const useRootPaths = Boolean(headerStore.get("x-restaurant-domain"));
  return {
    useRootPaths,
    base: getRestaurantNavBase(slug, useRootPaths),
  };
}
