import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { ReservationForm } from "@/components/order/ReservationForm";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Reservations | ${restaurant.name}`,
    description: `Book a table at ${restaurant.name}.`,
    path: "reservations",
  });
}

export default async function ReservationsPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);

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
      <div className="rs-page--form rs-page-body">
        <ReservationForm restaurant={restaurant} />
      </div>
    </>
  );
}
