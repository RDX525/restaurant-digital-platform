import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { GalleryGrid } from "@/components/restaurant/GalleryGrid";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Gallery | ${restaurant.name}`,
    description: `Photos from ${restaurant.name}.`,
    path: "gallery",
  });
}

export default async function GalleryPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, { galleryLimit: 50 });

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "Gallery", path: "gallery" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="Gallery"
        title="A look inside"
        description={`The atmosphere, food, and people that make ${restaurant.name} special.`}
      />
      <div className="rs-page rs-page-body">
        <GalleryGrid images={restaurant.gallery} restaurantName={restaurant.name} />
      </div>
    </>
  );
}
