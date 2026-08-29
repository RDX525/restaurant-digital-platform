import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { RestaurantShell } from "@/components/restaurant/RestaurantShell";
import { PreviewBanner } from "@/components/restaurant/PreviewBanner";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { isCustomDomainHost } from "@/lib/restaurant/routing";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: { template: "%s", default: "Restaurant" } };
}

export default async function RestaurantLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const preview = headerStore.get("x-restaurant-preview") === "1";

  const host = headerStore.get("host")?.split(":")[0] ?? "";
  const useRootPaths = isCustomDomainHost(host);

  const restaurant = await loadRestaurantBySlug(slug, preview);

  if (!restaurant) notFound();

  return (
    <>
      <StructuredData restaurant={restaurant} />
      <Suspense fallback={null}>
        <PreviewBanner />
      </Suspense>
      <RestaurantShell restaurant={restaurant} useRootPaths={useRootPaths}>
        {children}
      </RestaurantShell>
    </>
  );
}
