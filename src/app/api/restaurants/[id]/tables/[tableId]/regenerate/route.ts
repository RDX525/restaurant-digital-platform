import { regenerateTableToken, listTablesWithStats } from "@/lib/table/data";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string; tableId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await guardRestaurantRoute(id);
    const tables = await listTablesWithStats(id);
    if (!tables.some((table) => table.id === tableId)) {
      return jsonError(new Error("Table not found"), 404);
    }
    const token = await regenerateTableToken(tableId);
    return jsonOk({ token: token.token });
  } catch (error) {
    return jsonError(error, 500);
  }
}
