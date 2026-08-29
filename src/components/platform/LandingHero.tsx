import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Globe,
  MenuSquare,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Premium websites",
    body: "Branded guest pages that feel as polished as your venue.",
  },
  {
    icon: MenuSquare,
    title: "Live menus",
    body: "Update once in the dashboard — publish instantly.",
  },
  {
    icon: ShoppingBag,
    title: "Online ordering",
    body: "Browse, customise, and pay in a seamless NZ flow.",
  },
  {
    icon: CalendarDays,
    title: "Reservations",
    body: "Capture bookings without a third-party tool.",
  },
  {
    icon: Globe,
    title: "SEO & domains",
    body: "Metadata, sitemaps, and custom domain architecture.",
  },
];

const TRUST_STATS = [
  { value: "All-in-one", label: "Website · menu · orders" },
  { value: "Live sync", label: "Dashboard to guest site" },
  { value: "NZ-first", label: "Built for Aotearoa" },
];

export function LandingHero() {
  return (
    <>
      <section className="bg-brand-surface bg-brand-surface--animated relative hidden min-h-dvh overflow-hidden text-white lg:flex lg:flex-col">
        <HeroBackground />
        <div className="relative z-10 flex min-h-dvh flex-col px-8 py-8 xl:px-12 xl:py-10">
          <div className="animate-slide-up opacity-0">
            <BrandMark />
          </div>

          <div className="mt-8 flex flex-1 flex-col gap-10 xl:mt-10 xl:flex-row xl:items-center xl:gap-12">
            <div className="max-w-lg animate-slide-up opacity-0 stagger-1 xl:max-w-xl">
              <LiveBadge />
              <HeroCopy compact={false} />
              <HeroActions />
              <TrustStats />
              <FeaturePills />
            </div>

            <div className="relative flex flex-1 items-center justify-center animate-slide-up opacity-0 stagger-3 xl:justify-end">
              <ProductPreviewMockup />
            </div>
          </div>

          <p className="mt-auto pt-8 text-xs text-pine-500 animate-fade-in opacity-0 stagger-5">
            © {new Date().getFullYear()} Kāti · Crafted for Aotearoa New Zealand
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-pine-950 px-6 py-8 text-white lg:hidden">
        <HeroBackground animated={false} />
        <div className="relative z-10">
          <BrandMark />
          <div className="mt-6">
            <LiveBadge pulse={false} />
            <HeroCopy compact />
            <HeroActions compact />
          </div>
          <div className="mt-8">
            <ProductPreviewMockup compact />
          </div>
        </div>
      </section>
    </>
  );
}

function HeroBackground({ animated = true }: { animated?: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 bg-aurora opacity-90 ${animated ? "animate-aurora" : ""}`}
        aria-hidden="true"
      />
      <div className="grain pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
      <div
        className={`pointer-events-none absolute -right-20 top-10 h-[480px] w-[480px] rounded-full bg-gold-500/15 ${animated ? "blur-3xl animate-glow-pulse" : "blur-xl"}`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-pine-500/25 ${animated ? "blur-3xl" : "blur-xl"}`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,28,24,0.4)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
        aria-hidden="true"
      />
    </>
  );
}

function LiveBadge({ pulse = true }: { pulse?: boolean }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        {pulse ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
        ) : null}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
      </span>
      <span className="max-w-[min(100%,18rem)] text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-gold-300 sm:max-w-none sm:tracking-[0.18em]">
        The platform for modern NZ dining
      </span>
    </div>
  );
}

function BrandMark() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-gold font-bold text-pine-950 shadow-glow transition group-hover:scale-105">
        K
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/20"
          aria-hidden="true"
        />
      </div>
      <div>
        <span className="font-display text-2xl tracking-tight">Kāti</span>
        <span className="ml-2 hidden text-[10px] uppercase tracking-[0.24em] text-pine-400 min-[400px]:inline">
          Aotearoa NZ
        </span>
      </div>
    </Link>
  );
}

function HeroCopy({ compact }: { compact: boolean }) {
  return (
    <>
      <h1
        className={`font-display leading-[1.05] tracking-tight ${
          compact ? "mt-2 text-[2rem]" : "mt-1 text-4xl xl:text-[2.75rem]"
        }`}
      >
        Your restaurant,{" "}
        <span className="text-gradient-gold italic">elevated</span> online
      </h1>
      <p
        className={`mt-4 leading-relaxed text-pine-200/90 ${
          compact ? "text-sm" : "text-base lg:text-lg"
        }`}
      >
        Launch a guest experience that matches your venue — live menus, online ordering,
        reservations, and a dashboard built for the pace of Aotearoa hospitality.
      </p>
    </>
  );
}

function HeroActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${compact ? "mt-5" : "mt-7"}`}>
      <Link
        href="/r/harbour-kitchen"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-pine-950 shadow-glow transition hover:brightness-105 active:scale-[0.98] touch-manipulation"
      >
        Explore live demo
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        href="/?mode=sign-up"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10 touch-manipulation"
      >
        Start free
      </Link>
    </div>
  );
}

function TrustStats() {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
      {TRUST_STATS.map(({ value, label }) => (
        <div key={value}>
          <dt className="font-display text-xl text-gold-400 xl:text-2xl">{value}</dt>
          <dd className="mt-1 text-[11px] leading-snug text-pine-400">{label}</dd>
        </div>
      ))}
    </dl>
  );
}

function FeaturePills() {
  return (
    <ul className="mt-6 hidden flex-wrap gap-2 xl:flex">
      {FEATURES.map(({ icon: Icon, title }) => (
        <li
          key={title}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-pine-200"
        >
          <Icon className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
          {title}
        </li>
      ))}
    </ul>
  );
}

function ProductPreviewMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative ${compact ? "mx-auto w-full max-w-sm" : "w-full max-w-md xl:max-w-lg animate-float"}`}
    >
      <div
        className={`pointer-events-none absolute -inset-4 rounded-[2rem] bg-gold-500/10 ${compact ? "" : "blur-2xl"}`}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-pine-900/80 shadow-elevated ring-1 ring-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 bg-pine-950/60 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="ml-2 flex-1 rounded-lg bg-white/5 px-3 py-1 text-[10px] text-pine-400">
            demo-restaurant.kati.co.nz
          </div>
        </div>

        <div className="p-4">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-pine-800 to-pine-950 p-4 ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">
              Demo Restaurant
            </p>
            <p className="mt-1 font-display text-lg leading-tight">Modern NZ dining</p>
            <p className="mt-2 text-xs leading-relaxed text-pine-300">
              Seasonal plates · local wine · waterfront views
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-2.5 py-1 text-[10px] font-medium text-gold-300">
              <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
              Open for orders & bookings
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { name: "Line-caught snapper", price: "$38" },
              { name: "Lamb rump", price: "$42" },
              { name: "Market greens", price: "$18" },
              { name: "Pavlova", price: "$16" },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-white/10 bg-white/5 p-2.5"
              >
                <p className="text-[11px] font-medium text-white">{item.name}</p>
                <p className="mt-0.5 text-[10px] text-gold-400">{item.price}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-gold-500/15 px-3 py-2.5 ring-1 ring-gold-500/20">
            <div>
              <p className="text-[10px] text-gold-300">Cart ready</p>
              <p className="text-xs font-semibold text-white">3 items · $76.00</p>
            </div>
            <span className="rounded-lg bg-gradient-gold px-2.5 py-1 text-[10px] font-bold text-pine-950">
              Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
