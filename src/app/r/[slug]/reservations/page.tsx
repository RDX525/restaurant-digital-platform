import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { ReservationForm } from "@/components/order/ReservationForm";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export async function generateMetadata({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  return buildRestaurantMetadata(restaurant, {
    title: `Reservations | ${restaurant.name}`,
    description: `Book a table at ${restaurant.name}.`,
    path: "reservations",
  });
}

export default async function ReservationsPage({
  params,
  searchParams,
}: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "Reservations", path: "reservations" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="Reservations"
        title="Book a table"
        description={`Reserve your spot at ${restaurant.name}.`}
      />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <ReservationForm restaurant={restaurant} />
      </div>
    </>
  );
}
