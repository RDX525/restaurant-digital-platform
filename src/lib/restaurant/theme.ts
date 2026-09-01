import type { CSSProperties } from "react";
import type { PublicRestaurant, Restaurant, SocialLinks } from "./types";

const DEFAULT_PRIMARY = "26 60 52";
const DEFAULT_SECONDARY = "45 90 74";
const DEFAULT_ACCENT = "201 162 39";

export type ThemeRgb = {
  channels: string;
  on: string;
};

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;

  let value = match[1].toLowerCase();
  if (value.length === 3) {
    value = value
      .split("")
      .map((part) => part + part)
      .join("");
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function hexToRgbChannels(hex: string, fallback: string): ThemeRgb {
  const parsed = parseHexColor(hex);
  if (!parsed) {
    return { channels: fallback, on: "#ffffff" };
  }

  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  return {
    channels: `${parsed.r} ${parsed.g} ${parsed.b}`,
    on: luminance < 0.58 ? "#ffffff" : "#14201c",
  };
}

export function restaurantThemeStyle(
  restaurant: Pick<Restaurant, "primary_color" | "secondary_color" | "accent_color">,
): CSSProperties {
  const primary = hexToRgbChannels(restaurant.primary_color, DEFAULT_PRIMARY);
  const secondary = hexToRgbChannels(restaurant.secondary_color, DEFAULT_SECONDARY);
  const accent = hexToRgbChannels(restaurant.accent_color, DEFAULT_ACCENT);

  return {
    "--rs-primary": primary.channels,
    "--rs-on-primary": primary.on,
    "--rs-secondary": secondary.channels,
    "--rs-on-secondary": secondary.on,
    "--rs-accent": accent.channels,
    "--rs-on-accent": accent.on,
  } as CSSProperties;
}

export function formatRestaurantLocation(
  restaurant: Pick<Restaurant, "city" | "region" | "country">,
): string | null {
  const city = restaurant.city?.trim() || null;
  const region = restaurant.region?.trim() || null;
  const country = restaurant.country?.trim() || null;
  const parts: string[] = [];

  if (city) parts.push(city);
  if (region && region !== city) parts.push(region);
  if (country && country !== region && country !== city) parts.push(country);

  return parts.length > 0 ? parts.join(", ") : null;
}

export function absoluteSocialHref(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function restaurantSocialEntries(
  links: SocialLinks,
): { network: keyof SocialLinks; label: string; href: string }[] {
  const entries: { network: keyof SocialLinks; label: string; href: string }[] = [];
  if (links.instagram) {
    entries.push({ network: "instagram", label: "Instagram", href: absoluteSocialHref(links.instagram) });
  }
  if (links.facebook) {
    entries.push({ network: "facebook", label: "Facebook", href: absoluteSocialHref(links.facebook) });
  }
  if (links.twitter) {
    entries.push({ network: "twitter", label: "X", href: absoluteSocialHref(links.twitter) });
  }
  if (links.tiktok) {
    entries.push({ network: "tiktok", label: "TikTok", href: absoluteSocialHref(links.tiktok) });
  }
  if (links.website) {
    entries.push({ network: "website", label: "Website", href: absoluteSocialHref(links.website) });
  }
  return entries;
}

export function restaurantStoryExcerpt(aboutText: string, limit = 320): string {
  const text = aboutText.trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

export function restaurantCoverImage(restaurant: PublicRestaurant): string | null {
  return restaurant.hero_image_url ?? restaurant.gallery[0]?.image_url ?? null;
}

function imageIdentity(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

export function restaurantAboutImage(restaurant: PublicRestaurant): string | null {
  const heroId = restaurant.hero_image_url ? imageIdentity(restaurant.hero_image_url) : null;
  const distinct = restaurant.gallery.find((image) => {
    if (!image.image_url) return false;
    if (!heroId) return true;
    return imageIdentity(image.image_url) !== heroId;
  });
  return distinct?.image_url ?? restaurantCoverImage(restaurant);
}
