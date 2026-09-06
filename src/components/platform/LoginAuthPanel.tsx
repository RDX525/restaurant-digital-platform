"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { parseAuthMode } from "@/components/platform/auth-mode";

const AuthPanel = dynamic(
  () => import("@/components/platform/AuthPanel").then((mod) => mod.AuthPanel),
  {
    loading: () => (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-pine-900/5 bg-white px-5 py-8 shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin text-pine-500" aria-hidden="true" />
        <p className="text-sm text-pine-600">Loading sign in…</p>
      </div>
    ),
  },
);

export function LoginAuthPanel() {
  const searchParams = useSearchParams();
  const initialMode = parseAuthMode(searchParams.get("mode"));

  return <AuthPanel initialMode={initialMode} />;
}
