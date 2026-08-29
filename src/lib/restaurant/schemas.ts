import { z } from "zod";

const openingHoursDaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

export const openingHoursSchema = z.record(openingHoursDaySchema).default({});

export const socialLinksSchema = z
  .object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    website: z.string().url().optional(),
  })
  .default({});

export const restaurantWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  tagline: z.string().trim().max(200).optional().nullable(),
  about_text: z.string().trim().max(5000).optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
  hero_image_url: z.string().url().optional().nullable().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address_line1: z.string().trim().max(200).optional().nullable(),
  address_line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  postal_code: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  google_maps_url: z.string().url().optional().nullable().or(z.literal("")),
  opening_hours: openingHoursSchema,
  social_links: socialLinksSchema,
  order_url: z.string().trim().max(500).optional().nullable(),
  reservation_url: z.string().trim().max(500).optional().nullable(),
  meta_title: z.string().trim().max(120).optional().nullable(),
  meta_description: z.string().trim().max(320).optional().nullable(),
  is_published: z.boolean().default(false),
  custom_domain: z.string().trim().max(253).optional().nullable(),
});

export const galleryImageSchema = z.object({
  image_url: z.string().url(),
  caption: z.string().trim().max(200).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export type RestaurantWebsiteInput = z.infer<typeof restaurantWebsiteSchema>;
export type GalleryImageInput = z.infer<typeof galleryImageSchema>;
