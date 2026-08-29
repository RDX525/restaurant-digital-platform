import { updateTableSchema } from "@/lib/table/schemas";
import { listTablesWithStats, updateTable } from "@/lib/table/data";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string; tableId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = updateTableSchema.parse(body);
    const table = await updateTable(id, tableId, parsed);
    if (!table) {
      return jsonError(new Error("Table not found"), 404);
    }
    return jsonOk(table);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await guardRestaurantRoute(id);
    const tables = await listTablesWithStats(id);
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) {
      return jsonError(new Error("Table not found"), 404);
    }
    return jsonOk(table);
  } catch (error) {
    return jsonError(error, 500);
  }
}
