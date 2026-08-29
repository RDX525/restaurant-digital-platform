import { cookies } from "next/headers";
import { validateTableSession } from "@/lib/table/data";
import { TABLE_SESSION_COOKIE } from "@/lib/table/session";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(TABLE_SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return jsonOk({ active: false });
    }

    const session = await validateTableSession(sessionToken);
    if (!session) {
      return jsonOk({ active: false });
    }

    return jsonOk({
      active: true,
      restaurantId: session.restaurant_id,
      restaurantSlug: session.restaurant_slug,
      restaurantName: session.restaurant_name,
      tableId: session.table.id,
      tableLabel: session.table_label,
      locationId: session.location.id,
      locationName: session.location_name,
      expiresAt: session.session.expires_at,
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
