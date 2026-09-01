import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { PublicMenuHeader } from "@/components/menu/PublicMenuView";
import { publicRestaurantMenuPath } from "@/lib/cache/public-site";
import { loadPublicMenuById } from "@/lib/menu/data";
import { loadRestaurantById } from "@/lib/restaurant/data";

type PageProps = {
  params: Promise<{ menuId: string }>;
};

export const dynamic = "force-dynamic";

export default async function PublicMenuPage({ params }: PageProps) {
  const { menuId } = await params;
  const menu = await loadPublicMenuById(menuId);

  if (!menu) notFound();

  const restaurant = await loadRestaurantById(menu.restaurant_id, { galleryLimit: 0 });
  const liveMenuHref = restaurant ? publicRestaurantMenuPath(restaurant.slug) : null;

  if (!menu.is_active) {
    return (
      <div className="platform-page">
        <PublicMenuHeader />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="empty-state">
            <p>{menu.name} is a draft. Only the restaurant&apos;s live menu is shown to guests.</p>
            {liveMenuHref ? (
              <p className="mt-4">
                <Link href={liveMenuHref} className="btn-primary">
                  View live menu
                </Link>
              </p>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="platform-page">
      <PublicMenuHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {menu.categories.length > 0 ? (
          <MenuPreview menu={menu} publicView />
        ) : (
          <div className="empty-state">
            Our menu is being updated. Please check back soon or contact us directly.
          </div>
        )}
      </main>
    </div>
  );
}
