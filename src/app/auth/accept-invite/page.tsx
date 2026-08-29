"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AcceptInviteClient } from "./AcceptInviteClient";

function AcceptInviteFallback() {
  return (
    <div className="platform-page flex min-h-screen items-center justify-center px-4 py-16">
      <div className="platform-card flex items-center gap-3 p-8">
        <Loader2 className="h-5 w-5 animate-spin text-pine-500" />
        <p className="text-sm text-pine-600">Loading invite…</p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInviteClient />
    </Suspense>
  );
}
