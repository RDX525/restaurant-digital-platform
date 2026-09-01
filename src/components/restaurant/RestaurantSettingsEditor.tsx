"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, Save, Trash2 } from "lucide-react";
import { OpeningHoursEditor } from "@/components/restaurant/OpeningHoursEditor";
import type { PublicRestaurant, GalleryImage, SocialLinks } from "@/lib/restaurant/types";
import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";
import { postFormDataWithProgress } from "@/lib/upload/form-progress";
import { getErrorMessage } from "@/lib/utils";
import { getRestaurantBasePath } from "@/lib/restaurant/seo";

type BrandingAssetType = "logo" | "hero";

interface BrandingUploadState {
  type: BrandingAssetType;
  fileName: string;
  progress: number;
  phase: "uploading" | "saving" | "done" | "error";
  error?: string;
}

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
  delete (rest as Partial<PublicRestaurant>).logo_url;
  delete (rest as Partial<PublicRestaurant>).hero_image_url;

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
  const [showGalleryLink, setShowGalleryLink] = useState(false);
  const [galleryUpload, setGalleryUpload] = useState<Omit<BrandingUploadState, "type"> | null>(
    null,
  );
  const [brandingUploads, setBrandingUploads] = useState<
    Partial<Record<BrandingAssetType, BrandingUploadState>>
  >({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`, {
          cache: "no-store",
        });
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

  function setBrandingUpload(
    assetType: BrandingAssetType,
    next: BrandingUploadState,
  ) {
    setBrandingUploads((current) => ({ ...current, [assetType]: next }));
  }

  async function uploadAsset(assetType: BrandingAssetType, file: File) {
    setError(null);
    setMessage(null);
    setBrandingUpload(assetType, {
      type: assetType,
      fileName: file.name,
      progress: 1,
      phase: "uploading",
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurantId", restaurantId);
    formData.append("assetType", assetType);

    try {
      const { status, body } = await postFormDataWithProgress(
        "/api/restaurants/upload",
        formData,
        (percent) => {
          setBrandingUpload(assetType, {
            type: assetType,
            fileName: file.name,
            progress: percent,
            phase: percent >= 90 ? "saving" : "uploading",
          });
        },
      );

      const data = body as {
        error?: string;
        url?: string;
        restaurant?: PublicRestaurant;
      };

      if (status < 200 || status >= 300 || !data.url) {
        throw new Error(data.error ?? "Upload failed");
      }

      setRestaurant((current) => {
        const base = data.restaurant ?? current;
        if (!base) return current;
        return {
          ...current,
          ...base,
          opening_hours: normalizeOpeningHours(base.opening_hours),
          social_links: base.social_links ?? {},
          gallery: current?.gallery ?? base.gallery ?? [],
          logo_url: assetType === "logo" ? data.url : (current?.logo_url ?? base.logo_url),
          hero_image_url:
            assetType === "hero" ? data.url : (current?.hero_image_url ?? base.hero_image_url),
        };
      });
      setBrandingUpload(assetType, {
        type: assetType,
        fileName: file.name,
        progress: 100,
        phase: "done",
      });
      setMessage(
        assetType === "logo"
          ? "Logo uploaded and saved."
          : "Hero image uploaded and saved.",
      );
    } catch (err) {
      const messageText = getErrorMessage(err);
      setBrandingUpload(assetType, {
        type: assetType,
        fileName: file.name,
        progress: 0,
        phase: "error",
        error: messageText,
      });
      setError(messageText);
    }
  }

  async function uploadGalleryFile(file: File) {
    setError(null);
    setMessage(null);
    setGalleryUpload({
      fileName: file.name,
      progress: 1,
      phase: "uploading",
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", galleryCaption.trim());
    formData.append("sortOrder", String(restaurant?.gallery.length ?? 0));

    try {
      const { status, body } = await postFormDataWithProgress(
        `/api/restaurants/${restaurantId}/gallery/upload`,
        formData,
        (percent) => {
          setGalleryUpload({
            fileName: file.name,
            progress: percent,
            phase: percent >= 90 ? "saving" : "uploading",
          });
        },
      );

      const data = body as GalleryImage & { error?: string };
      if (status < 200 || status >= 300 || !data.id) {
        throw new Error(data.error ?? "Upload failed");
      }

      setRestaurant((current) =>
        current ? { ...current, gallery: [...current.gallery, data] } : current,
      );
      setGalleryCaption("");
      setGalleryUpload({
        fileName: file.name,
        progress: 100,
        phase: "done",
      });
      setMessage("Gallery photo uploaded and saved.");
    } catch (err) {
      const messageText = getErrorMessage(err);
      setGalleryUpload({
        fileName: file.name,
        progress: 0,
        phase: "error",
        error: messageText,
      });
      setError(messageText);
    }
  }

  async function addGalleryImageFromUrl() {
    if (!galleryUrl.trim()) return;
    setError(null);
    setMessage(null);
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
    setMessage("Gallery photo added from link.");
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
        <p className="text-sm text-pine-600">
          JPEG, PNG, WebP, or SVG up to 5MB. You will see upload progress until the file is saved.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <BrandingAssetCard
            label="Logo"
            imageUrl={restaurant.logo_url}
            upload={brandingUploads.logo}
            busy={Boolean(
              brandingUploads.logo &&
                (brandingUploads.logo.phase === "uploading" ||
                  brandingUploads.logo.phase === "saving"),
            )}
            onFile={(file) => void uploadAsset("logo", file)}
          />
          <BrandingAssetCard
            label="Hero image"
            imageUrl={restaurant.hero_image_url}
            upload={brandingUploads.hero}
            busy={Boolean(
              brandingUploads.hero &&
                (brandingUploads.hero.phase === "uploading" ||
                  brandingUploads.hero.phase === "saving"),
            )}
            onFile={(file) => void uploadAsset("hero", file)}
          />
        </div>
      </div>

      <div className="card-elevated space-y-4 p-6">
        <h2 className="font-display text-lg text-pine-900">Gallery</h2>
        <p className="text-sm text-pine-600">
          Upload photos from your computer. JPEG, PNG, or WebP up to 5MB.
        </p>
        <input
          className="input"
          placeholder="Caption (optional)"
          value={galleryCaption}
          onChange={(event) => setGalleryCaption(event.target.value)}
        />
        <label
          className={`btn-primary w-full cursor-pointer justify-center sm:w-auto ${
            galleryUpload?.phase === "uploading" || galleryUpload?.phase === "saving"
              ? "pointer-events-none opacity-60"
              : ""
          }`}
        >
          {galleryUpload?.phase === "uploading" || galleryUpload?.phase === "saving"
            ? "Uploading…"
            : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={
              galleryUpload?.phase === "uploading" || galleryUpload?.phase === "saving"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadGalleryFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {galleryUpload ? (
          <div className="space-y-2" aria-live="polite">
            {galleryUpload.phase === "uploading" || galleryUpload.phase === "saving" ? (
              <div
                className="h-2 overflow-hidden rounded-full bg-pine-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={galleryUpload.progress}
                aria-label="Gallery upload progress"
              >
                <div
                  className="h-full rounded-full bg-pine-700 transition-[width] duration-200"
                  style={{ width: `${galleryUpload.progress}%` }}
                />
              </div>
            ) : null}
            <p
              className={`text-xs ${
                galleryUpload.phase === "error"
                  ? "text-red-700"
                  : galleryUpload.phase === "done"
                    ? "text-pine-700"
                    : "text-pine-500"
              }`}
            >
              {brandingStatusLabel(galleryUpload)}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          className="text-sm font-medium text-pine-600 underline-offset-2 hover:underline"
          onClick={() => setShowGalleryLink((current) => !current)}
        >
          {showGalleryLink ? "Hide web link" : "Add from a web link instead"}
        </button>
        {showGalleryLink ? (
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="input"
              placeholder="https://example.com/photo.jpg"
              value={galleryUrl}
              onChange={(event) => setGalleryUrl(event.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                void addGalleryImageFromUrl().catch((err) => setError(getErrorMessage(err)))
              }
            >
              Add link
            </button>
          </div>
        ) : null}

        {restaurant.gallery.length === 0 ? (
          <p className="text-sm text-pine-400">No gallery photos yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {restaurant.gallery.map((image: GalleryImage) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-2xl border border-pine-900/10 bg-cream-50"
              >
                <img
                  src={image.image_url}
                  alt={image.caption ?? "Gallery photo"}
                  className="h-36 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-pine-700">
                  <span className="truncate">{image.caption ?? "No caption"}</span>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2 py-1 text-red-600"
                    onClick={() =>
                      void deleteGalleryImage(image.id).catch((err) =>
                        setError(getErrorMessage(err)),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function brandingStatusLabel(upload: Omit<BrandingUploadState, "type">): string {
  if (upload.phase === "uploading") {
    return `Uploading ${upload.fileName}… ${upload.progress}%`;
  }
  if (upload.phase === "saving") {
    return `Saving ${upload.fileName} on the server…`;
  }
  if (upload.phase === "done") {
    return `${upload.fileName} uploaded.`;
  }
  return upload.error ?? "Upload failed.";
}

function BrandingAssetCard({
  label,
  imageUrl,
  upload,
  busy,
  onFile,
}: {
  label: string;
  imageUrl: string | null;
  upload?: BrandingUploadState;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewFailed(false);
  }, [imageUrl]);

  return (
    <div className="rounded-2xl border border-pine-900/10 bg-cream-50 p-4">
      <p className="text-sm font-semibold text-pine-800">{label}</p>
      <div className="mt-3 overflow-hidden rounded-xl border border-pine-900/10 bg-white">
        {imageUrl && !previewFailed ? (
          <img
            src={imageUrl}
            alt={`${label} preview`}
            className="h-32 w-full object-contain"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="flex h-32 items-center justify-center px-3 text-center text-sm text-pine-400">
            {imageUrl
              ? "Uploaded — preview could not be displayed"
              : "Not uploaded yet"}
          </div>
        )}
      </div>
      <label
        className={`btn-secondary mt-3 w-full cursor-pointer justify-center ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        {busy ? "Uploading…" : imageUrl ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />
      </label>
      {upload ? (
        <div className="mt-3 space-y-2" aria-live="polite">
          {upload.phase === "uploading" || upload.phase === "saving" ? (
            <div
              className="h-2 overflow-hidden rounded-full bg-pine-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={upload.progress}
              aria-label={`${label} upload progress`}
            >
              <div
                className="h-full rounded-full bg-pine-700 transition-[width] duration-200"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          ) : null}
          <p
            className={`text-xs ${
              upload.phase === "error"
                ? "text-red-700"
                : upload.phase === "done"
                  ? "text-pine-700"
                  : "text-pine-500"
            }`}
          >
            {brandingStatusLabel(upload)}
          </p>
        </div>
      ) : imageUrl ? (
        <p className="mt-3 text-xs text-pine-500">Saved on your website.</p>
      ) : null}
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
