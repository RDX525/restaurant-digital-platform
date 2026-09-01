"use client";

import { useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";

export function PreviewBanner() {
  const searchParams = useSearchParams();
  const preview =
    searchParams.get("preview") === "1" ||
    searchParams.get("preview") === "true";

  if (!preview) return null;

  return (
    <div
      className="bg-brand-surface relative overflow-hidden border-b border-gold-500/20 px-4 py-3 text-center text-sm font-medium text-gold-300 sm:px-6"
      role="status"
    >
      <div className="grain pointer-events-none absolute inset-0 z-[1] opacity-20" aria-hidden="true" />
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Eye className="h-4 w-4 text-gold-400" aria-hidden="true" />
        Preview mode — unpublished changes are visible only to you
      </div>
    </div>
  );
}
