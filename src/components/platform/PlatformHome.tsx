import Link from "next/link";
import { ArrowRight, Globe, MenuSquare, Sparkles } from "lucide-react";

export function PlatformHome() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-pine-950 text-white">
      <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[600px] w-[600px] rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-[400px] w-[400px] rounded-full bg-pine-500/20 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 font-bold text-pine-950">
              K
            </div>
            <div>
              <span className="font-display text-xl">Kāti</span>
              <span className="ml-2 hidden text-xs uppercase tracking-[0.2em] text-pine-400 sm:inline">
                Aotearoa NZ
              </span>
            </div>
          </Link>
          <Link href="/dashboard/menus" className="btn-accent text-sm">
            Open dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="max-w-3xl animate-slide-up">
          <p className="eyebrow text-gold-400">Built for New Zealand hospitality</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your restaurant, beautifully online
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-pine-200 sm:text-xl">
            Premium websites, live menus, and guest-ready pages — all powered by
            your data. Designed for the pace and polish of Aotearoa dining.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/dashboard/menus" className="btn-accent px-6 py-3 text-base">
              <MenuSquare className="h-5 w-5" aria-hidden="true" />
              Manage menus
            </Link>
            <Link
              href="/dashboard/website"
              className="btn border border-white/15 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10"
            >
              <Globe className="h-5 w-5" aria-hidden="true" />
              Website settings
            </Link>
            <Link
              href="/r/harbour-kitchen"
              className="btn-ghost px-6 py-3 text-base text-pine-200 hover:bg-white/5 hover:text-white"
            >
              View demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Premium public sites",
              body: "Branded pages for every restaurant — home, menu, gallery, contact, and more.",
            },
            {
              icon: MenuSquare,
              title: "Live menu sync",
              body: "Update once in the dashboard. Changes appear instantly on your public menu.",
            },
            {
              icon: Globe,
              title: "SEO & domains ready",
              body: "Metadata, sitemaps, and architecture ready for custom NZ domains.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/8 bg-white/5 p-6 backdrop-blur-sm transition hover:border-gold-500/30 hover:bg-white/8"
            >
              <Icon className="h-5 w-5 text-gold-400" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-pine-300">{body}</p>
            </article>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-pine-500">
        © {new Date().getFullYear()} Kāti · Crafted for Aotearoa New Zealand
      </footer>
    </div>
  );
}
