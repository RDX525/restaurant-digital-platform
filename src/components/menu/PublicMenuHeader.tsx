import { PlatformBrand } from "@/components/platform/PlatformBrand";

export function PublicMenuHeader() {
  return (
    <header className="platform-header-bar sticky top-0 z-40">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <PlatformBrand href="/" size="sm" />
        <span className="badge-live">Live menu</span>
      </div>
    </header>
  );
}
