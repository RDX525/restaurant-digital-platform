import { jsonError, jsonOk } from "@/lib/api";
import { getCustomerDetail } from "@/lib/customer/data";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string; customerId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, customerId } = await params;
    await guardRestaurantRoute(id);

    const customer = await getCustomerDetail(id, customerId);
    if (!customer) return jsonError(new Error("Customer not found"), 404);

    return jsonOk(customer);
  } catch (error) {
    return jsonError(error, 500);
  }
}
