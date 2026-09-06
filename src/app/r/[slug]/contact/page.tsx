import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { ContactCard } from "@/components/restaurant/ContactCard";
import { GoogleMap } from "@/components/restaurant/GoogleMap";
import { OpeningHours } from "@/components/restaurant/OpeningHours";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { MotionReveal } from "@/components/motion/MotionReveal";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Contact | ${restaurant.name}`,
    description: `Contact and visit ${restaurant.name}.`,
    path: "contact",
  });
}

export default async function ContactPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "Contact", path: "contact" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Visit us, call ahead, or send a message."
      />
      <div className="rs-page rs-page-body space-y-12">
        <MotionReveal>
          <ContactCard restaurant={restaurant} />
        </MotionReveal>
        <div className="grid gap-12 lg:grid-cols-2">
          <MotionReveal>
            <OpeningHours restaurant={restaurant} />
          </MotionReveal>
          <MotionReveal delayMs={70} preset="fade-scale">
            <GoogleMap restaurant={restaurant} />
          </MotionReveal>
        </div>
      </div>
    </>
  );
}
