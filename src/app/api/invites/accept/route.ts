import { jsonError, jsonOk } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth/api-auth";
import { acceptRestaurantInvite } from "@/lib/auth/invites";
import { auditFromAuth } from "@/lib/audit/log";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(16),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    const body = await request.json();
    const parsed = acceptSchema.parse(body);

    const userId = auth.userId ?? (auth.isDemoSession ? "demo-owner" : null);
    if (!userId) {
      return jsonError(new Error("Sign in required to accept an invite."), 401);
    }

    const result = await acceptRestaurantInvite({
      token: parsed.token,
      userId,
      userEmail: auth.email,
    });

    await auditFromAuth(auth, {
      restaurantId: result.restaurantId,
      action: "invite.accepted",
      entityType: "restaurant_invite",
      metadata: { role: result.role },
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
