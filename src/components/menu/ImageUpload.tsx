"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadItemImage } from "@/lib/menu/client-api";
import { getErrorMessage } from "@/lib/utils";

interface ImageUploadProps {
  itemId: string;
  photoUrl: string | null;
  onUploaded: (photoUrl: string) => void;
}

export function ImageUpload({ itemId, photoUrl, onUploaded }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const result = await uploadItemImage(itemId, file);
      onUploaded(result.photo_url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-pine-900/10 bg-cream-100">
          {photoUrl ? (
            <Image src={photoUrl} alt="Menu item" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-pine-400">
              No photo
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
