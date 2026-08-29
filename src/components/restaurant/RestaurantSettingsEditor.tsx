"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, Save, Trash2 } from "lucide-react";
import { OpeningHoursEditor } from "@/components/restaurant/OpeningHoursEditor";
import type { PublicRestaurant, GalleryImage, SocialLinks } from "@/lib/restaurant/types";
import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";
import { getErrorMessage } from "@/lib/utils";
import { getRestaurantBasePath } from "@/lib/restaurant/seo";

interface RestaurantSettingsEditorProps {
  restaurantId: string;
}

function preparePayload(restaurant: PublicRestaurant) {
  const socialLinks = Object.fromEntries(
    Object.entries(restaurant.social_links ?? {}).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0,
    ),
  ) as SocialLinks;

  const rest = { ...restaurant };
  delete (rest as Partial<PublicRestaurant>).gallery;

  return {
    ...rest,
    social_links: socialLinks,
    email: restaurant.email?.trim() || null,
    tagline: restaurant.tagline?.trim() || null,
    about_text: restaurant.about_text?.trim() || null,
    phone: restaurant.phone?.trim() || null,
    custom_domain: restaurant.custom_domain?.trim() || null,
    google_maps_url: restaurant.google_maps_url?.trim() || null,
    order_url: restaurant.order_url?.trim() || null,
    reservation_url: restaurant.reservation_url?.trim() || null,
    meta_title: restaurant.meta_title?.trim() || null,
    meta_description: restaurant.meta_description?.trim() || null,
  };
}

export function RestaurantSettingsEditor({
  restaurantId,
}: RestaurantSettingsEditorProps) {
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [galleryCaption, setGalleryCaption] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to load");
        setRestaurant({
          ...data,
          opening_hours: normalizeOpeningHours(data.opening_hours),
          social_links: data.social_links ?? {},
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [restaurantId]);

  async function save() {
    if (!restaurant) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparePayload(restaurant)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      setRestaurant({
        ...data,
        opening_hours: normalizeOpeningHours(data.opening_hours),
        social_links: data.social_links ?? {},
      });
      setMessage("Website settings saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(assetType: "logo" | "hero", file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurantId", restaurantId);
    formData.append("assetType", assetType);
    const response = await fetch("/api/restaurants/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Upload failed");
    setRestaurant({
      ...data.restaurant,
      opening_hours: normalizeOpeningHours(data.restaurant.opening_hours),
      social_links: data.restaurant.social_links ?? {},
    });
  }

  async function addGalleryImage() {
    if (!galleryUrl.trim()) return;
    const response = await fetch(`/api/restaurants/${restaurantId}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: galleryUrl.trim(),
        caption: galleryCaption.trim() || null,
        sort_order: restaurant?.gallery.length ?? 0,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Failed to add image");
    setRestaurant((current) =>
      current ? { ...current, gallery: [...current.gallery, data] } : current,
    );
    setGalleryUrl("");
    setGalleryCaption("");
  }

  async function deleteGalleryImage(imageId: string) {
    if (!confirm("Remove this gallery image?")) return;
    const response = await fetch(
      `/api/restaurants/${restaurantId}/gallery/${imageId}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Failed to delete image");
    setRestaurant((current) =>
      current
        ? { ...current, gallery: current.gallery.filter((img) => img.id !== imageId) }
        : current,
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }
  if (error && !restaurant) {
    return <div className="alert-error">{error}</div>;
  }
  if (!restaurant) return null;

  const previewUrl = `${getRestaurantBasePath(restaurant.slug)}?preview=1`;
  const liveUrl = getRestaurantBasePath(restaurant.slug);

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-center justify-end gap-2">
        <Link href={previewUrl} target="_blank" className="btn-secondary">
          <Eye className="h-4 w-4" />
          Preview
        </Link>
        {restaurant.is_published ? (
          <Link href={liveUrl} target="_blank" className="btn-secondary">
            <ExternalLink className="h-4 w-4" />
            Live site
          </Link>
        ) : null}
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {message ? <div className="alert-success">{message}</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Publishing</h2>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-pine-900/5 bg-cream-50 px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-pine-300 text-pine-800 focus:ring-pine-500"
            checked={restaurant.is_published}
            onChange={(e) =>
              setRestaurant({ ...restaurant, is_published: e.target.checked })
            }
          />
          Publish public website
        </label>
      </div>

      <div className="card-elevated grid gap-4 p-6 md:grid-cols-2">
        <p className="eyebrow md:col-span-2">General</p>
        <Field label="Restaurant name" value={restaurant.name} onChange={(v) => setRestaurant({ ...restaurant, name: v })} />
        <Field label="URL slug" value={restaurant.slug} onChange={(v) => setRestaurant({ ...restaurant, slug: v })} />
        <Field label="Tagline" value={restaurant.tagline ?? ""} onChange={(v) => setRestaurant({ ...restaurant, tagline: v })} />
        <Field label="Phone" value={restaurant.phone ?? ""} onChange={(v) => setRestaurant({ ...restaurant, phone: v })} />
        <Field label="Email" value={restaurant.email ?? ""} onChange={(v) => setRestaurant({ ...restaurant, email: v })} type="email" />
        <Field label="Custom domain (future)" value={restaurant.custom_domain ?? ""} onChange={(v) => setRestaurant({ ...restaurant, custom_domain: v })} />
        <div className="md:col-span-2">
          <label className="label">About text</label>
          <textarea
            className="input min-h-32"
            value={restaurant.about_text ?? ""}
            onChange={(e) => setRestaurant({ ...restaurant, about_text: e.target.value })}
          />
        </div>
      </div>

      <div className="card-elevated grid gap-4 p-6 md:grid-cols-3">
        <p className="eyebrow md:col-span-3">Branding & SEO</p>
        <ColorField label="Primary color" value={restaurant.primary_color} onChange={(v) => setRestaurant({ ...restaurant, primary_color: v })} />
        <ColorField label="Secondary color" value={restaurant.secondary_color} onChange={(v) => setRestaurant({ ...restaurant, secondary_color: v })} />
        <ColorField label="Accent color" value={restaurant.accent_color} onChange={(v) => setRestaurant({ ...restaurant, accent_color: v })} />
        <Field label="Meta title" value={restaurant.meta_title ?? ""} onChange={(v) => setRestaurant({ ...restaurant, meta_title: v })} />
        <div className="md:col-span-2">
          <Field label="Meta description" value={restaurant.meta_description ?? ""} onChange={(v) => setRestaurant({ ...restaurant, meta_description: v })} />
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Opening hours</h2>
        <OpeningHoursEditor
          value={restaurant.opening_hours}
          onChange={(opening_hours) => setRestaurant({ ...restaurant, opening_hours })}
        />
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Location</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address line 1" value={restaurant.address_line1 ?? ""} onChange={(v) => setRestaurant({ ...restaurant, address_line1: v })} />
          <Field label="City" value={restaurant.city ?? ""} onChange={(v) => setRestaurant({ ...restaurant, city: v })} />
          <Field label="Region" value={restaurant.region ?? ""} onChange={(v) => setRestaurant({ ...restaurant, region: v })} />
          <Field label="Postal code" value={restaurant.postal_code ?? ""} onChange={(v) => setRestaurant({ ...restaurant, postal_code: v })} />
          <Field label="Google Maps URL" value={restaurant.google_maps_url ?? ""} onChange={(v) => setRestaurant({ ...restaurant, google_maps_url: v })} />
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Social links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Instagram" value={restaurant.social_links.instagram ?? ""} onChange={(v) => setRestaurant({ ...restaurant, social_links: { ...restaurant.social_links, instagram: v } })} />
          <Field label="Facebook" value={restaurant.social_links.facebook ?? ""} onChange={(v) => setRestaurant({ ...restaurant, social_links: { ...restaurant.social_links, facebook: v } })} />
          <Field label="Website" value={restaurant.social_links.website ?? ""} onChange={(v) => setRestaurant({ ...restaurant, social_links: { ...restaurant.social_links, website: v } })} />
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Guest actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Order URL" value={restaurant.order_url ?? ""} onChange={(v) => setRestaurant({ ...restaurant, order_url: v })} />
          <Field label="Reservation URL" value={restaurant.reservation_url ?? ""} onChange={(v) => setRestaurant({ ...restaurant, reservation_url: v })} />
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Branding assets</h2>
        <div className="flex flex-wrap gap-4">
          <label className="btn-secondary cursor-pointer">
            Upload logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAsset("logo", file).catch((err) => setError(getErrorMessage(err)));
              e.target.value = "";
            }} />
          </label>
          <label className="btn-secondary cursor-pointer">
            Upload hero image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAsset("hero", file).catch((err) => setError(getErrorMessage(err)));
              e.target.value = "";
            }} />
          </label>
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Gallery</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input className="input" placeholder="Image URL" value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} />
          <input className="input" placeholder="Caption" value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} />
          <button type="button" className="btn-secondary" onClick={() => void addGalleryImage().catch((err) => setError(getErrorMessage(err)))}>
            Add image
          </button>
        </div>
        <ul className="space-y-2">
          {restaurant.gallery.map((image: GalleryImage) => (
            <li key={image.id} className="flex items-center justify-between gap-3 rounded-xl border border-pine-900/5 bg-cream-50 px-4 py-3 text-sm text-pine-700">
              <span className="truncate">{image.caption ?? image.image_url}</span>
              <button
                type="button"
                className="btn-ghost shrink-0 px-2 py-1 text-red-600"
                onClick={() => void deleteGalleryImage(image.id).catch((err) => setError(getErrorMessage(err)))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          className="h-11 w-14 cursor-pointer rounded-xl border border-pine-900/10 bg-white p-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} picker`}
        />
        <input className="input font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
