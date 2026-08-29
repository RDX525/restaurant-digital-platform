import type { Metadata } from "next";
import { LandingHero } from "@/components/platform/LandingHero";
import { LoginAuthSection } from "@/components/platform/LoginAuthSection";

export const metadata: Metadata = {
  title: "Kāti — Restaurant platform for Aotearoa",
  description:
    "Premium restaurant websites, live menus, online ordering, and reservations — built for New Zealand hospitality.",
};

export default function HomePage() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <LandingHero />
      <LoginAuthSection />
    </div>
  );
}
