export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface OpeningHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

export type OpeningHours = Partial<Record<DayOfWeek, OpeningHoursDay>>;

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  about_text: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  opening_hours: OpeningHours;
  social_links: SocialLinks;
  order_url: string | null;
  reservation_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  restaurant_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface RestaurantDomain {
  id: string;
  restaurant_id: string;
  domain: string;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface PublicRestaurant extends Restaurant {
  gallery: GalleryImage[];
}

export const PUBLIC_PAGES = [
  "",
  "about",
  "menu",
  "gallery",
  "contact",
  "reservations",
  "order",
] as const;

export type PublicPage = (typeof PUBLIC_PAGES)[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DAYS_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
