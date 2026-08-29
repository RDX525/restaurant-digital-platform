import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { PlatformBrand } from "@/components/platform/PlatformBrand";

export default function NotFound() {
  return (
    <div className="platform-page flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="landing-auth-card max-w-md text-center animate-slide-up">
        <PlatformBrand href="/" size="sm" className="mb-6 justify-center" />
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl text-pine-900">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-pine-600">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" />
            Back to sign in
          </Link>
          <Link href="/r/demo-restaurant" className="btn-secondary">
            View demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
