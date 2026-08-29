"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Globe,
  LayoutDashboard,
  MenuSquare,
  QrCode,
  ClipboardList,
  CalendarDays,
  Users,
  BarChart3,
  Brain,
  ChevronLeft,
  ExternalLink,
  LogOut,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { PlatformBrand } from "@/components/platform/PlatformBrand";

const NAV = [
  { href: "/dashboard/menus", label: "Menus", icon: MenuSquare, description: "Items & categories", permission: "menu.manage" },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList, description: "Live order queue", permission: "orders.manage" },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays, description: "Bookings & calendar", permission: "reservations.manage" },
  { href: "/dashboard/customers", label: "Customers", icon: Users, description: "Profiles & history", permission: "customers.manage" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, description: "Revenue & funnel", permission: "analytics.view" },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: Brain, description: "Verified AI insights", permission: "intelligence.use" },
  { href: "/dashboard/website", label: "Website", icon: Globe, description: "Brand & content", permission: "website.manage" },
  { href: "/dashboard/qr", label: "QR codes", icon: QrCode, description: "Tables & dine-in", permission: "qr.manage" },
  { href: "/dashboard/team", label: "Team", icon: UserCog, description: "Staff & audit log", permission: "team.manage", anyPermission: ["team.manage", "team.invite", "audit.view"] },
] as const;

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  action,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurantSlug, hasPermission, loading: restaurantLoading } = useActiveRestaurant();

  const visibleNav = NAV.filter((item) => {
    if (restaurantLoading) return true;
    if ("anyPermission" in item && item.anyPermission) {
      return item.anyPermission.some((permission) => hasPermission(permission));
    }
    return hasPermission(item.permission);
  });

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream-100 lg:flex">
      <aside className="bg-brand-surface relative hidden w-[17.5rem] shrink-0 flex-col lg:flex">
        <div className="grain pointer-events-none absolute inset-0 z-[1] opacity-30" aria-hidden="true" />
        <div className="relative z-10 border-b border-white/5 px-6 py-7">
          <PlatformBrand href="/dashboard/menus" variant="dark" size="md" />
        </div>

        <nav className="relative z-10 flex-1 space-y-1 px-3 py-5" aria-label="Dashboard">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-pine-500">
            Workspace
          </p>
          {visibleNav.map(({ href, label, icon: Icon, description }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl px-3 py-3 transition duration-200",
                  active
                    ? "nav-pill-active bg-white/10"
                    : "text-pine-300 hover:bg-white/5 hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition",
                    active ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-pine-400 group-hover:text-pine-200",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs text-pine-500 group-hover:text-pine-400">
                    {description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 space-y-1 border-t border-white/5 p-4">
          {restaurantSlug ? (
            <Link
              href={`/r/${restaurantSlug}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-pine-300 transition hover:bg-white/5 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View site
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-pine-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col dashboard-bg">
        <header className="sticky top-0 z-30 border-b border-pine-900/5 glass lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard/menus" className="font-display text-lg text-pine-900">
              Kāti
            </Link>
            <div className="flex gap-1">
              {visibleNav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    pathname.startsWith(href)
                      ? "nav-gradient-active"
                      : "text-pine-600 hover:bg-white/80",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <div className="platform-header-bar px-4 py-5 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div>
              {backHref ? (
                <Link
                  href={backHref}
                  className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-pine-500 transition hover:text-pine-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {backLabel}
                </Link>
              ) : null}
              {title ? (
                <>
                  <p className="eyebrow">Dashboard</p>
                  <h1 className="mt-1 font-display text-3xl text-pine-900 sm:text-4xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pine-600">
                      {subtitle}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-pine-500">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Dashboard
                </div>
              )}
            </div>
            {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
