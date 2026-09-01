import type { Metadata } from "next";
import { LandingHero } from "@/components/platform/LandingHero";
import { LoginAuthSection } from "@/components/platform/LoginAuthSection";

export const metadata: Metadata = {
  title: "Sign in — Kāti",
  description:
    "Sign in to Kāti to manage your restaurant website, menus, orders, and reservations.",
};

export default function LoginPage() {
  return (
    <>
      <a
        href="#sign-in"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to sign in
      </a>
      <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <LandingHero />
        <LoginAuthSection />
      </div>
    </>
  );
}
