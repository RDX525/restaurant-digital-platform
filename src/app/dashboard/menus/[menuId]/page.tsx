import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/platform/DashboardShell";
import { MenuEditor } from "@/components/menu/MenuEditor";
import { resolveRestaurantIdForMenu } from "@/lib/menu/authorization";
import { publicRestaurantMenuPath } from "@/lib/cache/public-site";
import { loadRestaurantById } from "@/lib/restaurant/data";

type PageProps = {
  params: Promise<{ menuId: string }>;
};

export default async function MenuEditorPage({ params }: PageProps) {
  const { menuId } = await params;
  const restaurantId = await resolveRestaurantIdForMenu(menuId);
  const restaurant = await loadRestaurantById(restaurantId, { galleryLimit: 0 });
  const liveHref = restaurant
    ? publicRestaurantMenuPath(restaurant.slug)
    : `/menu/${menuId}`;

  return (
    <DashboardShell
      backHref="/dashboard/menus"
      backLabel="All menus"
      action={
        <Link
          href={liveHref}
          target="_blank"
          className="btn-secondary"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Live menu
        </Link>
      }
    >
      <MenuEditor menuId={menuId} />
    </DashboardShell>
  );
}
