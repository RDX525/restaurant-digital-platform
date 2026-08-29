import type { PublicRestaurant } from "@/lib/restaurant/types";
import {
  DEMO_EMAIL_DOMAIN,
  HARBOUR_KITCHEN_NAME,
  HARBOUR_KITCHEN_SLUG,
  HARBOUR_RESTAURANT_ID,
  SEED_TIMESTAMP,
} from "./constants";

export function buildHarbourKitchenRestaurant(): PublicRestaurant {
  const id = HARBOUR_RESTAURANT_ID;

  return {
    id,
    name: HARBOUR_KITCHEN_NAME,
    slug: HARBOUR_KITCHEN_SLUG,
    tagline: "Modern Kiwi dining on the Viaduct",
    about_text:
      "Harbour Kitchen celebrates Aotearoa's coastline and pasture — think line-caught snapper, Central Otago lamb, and produce from the Waitākere markets. Our open kitchen looks out over Wynyard Quarter, where locals gather for long brunches, business lunches, and harbour sunsets with a glass of Marlborough sauvignon blanc. All demo data is synthetic for product demonstrations.",
    logo_url: null,
    hero_image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600",
    primary_color: "#0c4a6e",
    secondary_color: "#164e63",
    accent_color: "#f59e0b",
    phone: "+64 9 555 0142",
    email: `hello@${DEMO_EMAIL_DOMAIN}`,
    address_line1: "17 Halsey Street",
    address_line2: "Wynyard Quarter",
    city: "Auckland",
    region: "Auckland",
    postal_code: "1010",
    country: "New Zealand",
    latitude: -36.8422,
    longitude: 174.7572,
    google_maps_url: "https://maps.google.com/?q=-36.8422,174.7572",
    opening_hours: {
      monday: { open: "07:00", close: "22:00", closed: false },
      tuesday: { open: "07:00", close: "22:00", closed: false },
      wednesday: { open: "07:00", close: "22:00", closed: false },
      thursday: { open: "07:00", close: "22:00", closed: false },
      friday: { open: "07:00", close: "23:00", closed: false },
      saturday: { open: "08:00", close: "23:00", closed: false },
      sunday: { open: "08:00", close: "21:00", closed: false },
    },
    social_links: {
      instagram: "https://instagram.com/harbourkitchen.demo",
      facebook: "https://facebook.com/harbourkitchen.demo",
    },
    order_url: `/r/${HARBOUR_KITCHEN_SLUG}/order`,
    reservation_url: `/r/${HARBOUR_KITCHEN_SLUG}/reservations`,
    meta_title: "Harbour Kitchen | Wynyard Quarter, Auckland",
    meta_description:
      "Waterfront dining in Auckland's Wynyard Quarter. Breakfast, lunch, dinner, and NZ wines at Harbour Kitchen. Demo site — synthetic data.",
    is_published: true,
    custom_domain: null,
    created_at: SEED_TIMESTAMP,
    updated_at: SEED_TIMESTAMP,
    gallery: [
      {
        id: "00000000-0000-4000-8000-000000000211",
        restaurant_id: id,
        image_url:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
        caption: "Harbour-side dining room",
        sort_order: 0,
        created_at: SEED_TIMESTAMP,
      },
      {
        id: "00000000-0000-4000-8000-000000000212",
        restaurant_id: id,
        image_url:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
        caption: "Open kitchen pass",
        sort_order: 1,
        created_at: SEED_TIMESTAMP,
      },
      {
        id: "00000000-0000-4000-8000-000000000213",
        restaurant_id: id,
        image_url:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
        caption: "Seasonal seafood",
        sort_order: 2,
        created_at: SEED_TIMESTAMP,
      },
    ],
  };
}
