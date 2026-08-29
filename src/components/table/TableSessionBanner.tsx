"use client";

import { QrCode } from "lucide-react";
import { useTableSession } from "@/components/table/TableSessionProvider";

export function TableSessionBanner() {
  const { session, loading } = useTableSession();

  if (loading || !session) return null;

  return (
    <div className="border-b border-gold-500/20 bg-gold-50/80 px-4 py-2.5">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-sm text-pine-800">
        <QrCode className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
        <span className="min-w-0 text-center">
          Dine-in at <strong>{session.tableLabel}</strong>
          <span className="text-pine-500"> · {session.locationName}</span>
        </span>
      </div>
    </div>
  );
}
