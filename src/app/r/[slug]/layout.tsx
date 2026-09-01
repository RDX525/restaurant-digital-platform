import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantShell } from "@/components/restaurant/RestaurantShell";
import { PreviewBanner } from "@/components/restaurant/PreviewBanner";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { loadGuestRestaurant } from "@/lib/restaurant/page-data";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: { template: "%s", default: "Restaurant" } };
}

export default async function RestaurantLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const restaurant = await loadGuestRestaurant(slug);

  if (!restaurant) notFound();

  return (
    <>
      <StructuredData restaurant={restaurant} />
      <Suspense fallback={null}>
        <PreviewBanner />
      </Suspense>
      <RestaurantShell restaurant={restaurant}>{children}</RestaurantShell>
    </>
  );
}
