"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthPanel, parseAuthMode } from "@/components/platform/AuthPanel";

function LoginAuthFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="flex items-center gap-3 rounded-2xl border border-pine-900/5 bg-white px-5 py-4 shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin text-pine-500" aria-hidden="true" />
        <p className="text-sm text-pine-600">Loading sign in…</p>
      </div>
    </div>
  );
}

function LoginAuthContent() {
  const searchParams = useSearchParams();
  const initialMode = parseAuthMode(searchParams.get("mode"));

  return <AuthPanel initialMode={initialMode} />;
}

export function LoginAuthSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-mesh-light lg:border-l lg:border-pine-900/5">
      <AuthPanelBackground />
      <header className="relative z-10 flex items-center justify-between px-5 py-4 lg:justify-end lg:px-6 lg:py-5">
        <Link href="/r/demo-restaurant" className="landing-demo-pill lg:hidden">
          View demo
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link href="/r/demo-restaurant" className="landing-demo-pill hidden lg:inline-flex">
          Explore live demo
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-start justify-center px-5 py-4 sm:px-6 lg:items-center lg:px-8 lg:py-6">
        <div className="w-full max-w-sm animate-slide-up opacity-0 xl:max-w-md">
          <Suspense fallback={<LoginAuthFallback />}>
            <LoginAuthContent />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function AuthPanelBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-pine-500/8 blur-3xl"
        aria-hidden="true"
      />
    </>
  );
}
