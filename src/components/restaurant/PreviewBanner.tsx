import { headers } from "next/headers";
import { Eye } from "lucide-react";

export async function PreviewBanner() {
  const headerStore = await headers();
  const preview = headerStore.get("x-restaurant-preview") === "1";

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
