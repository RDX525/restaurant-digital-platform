import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import {
  listRestaurantMembers,
  removeRestaurantMember,
  updateRestaurantMemberRole,
} from "@/lib/auth/membership";
import {
  canManageMemberRole,
  type RestaurantRole,
} from "@/lib/auth/roles";
import { AuthorizationError } from "@/lib/auth/errors";
import { auditFromAuth } from "@/lib/audit/log";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id, "team.manage");
    const members = await listRestaurantMembers(id);
    return jsonOk(members);
  } catch (error) {
    return jsonError(error, 500);
  }
}

const updateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["manager", "staff"]),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await guardRestaurantRoute(id, "team.manage");
    const body = await request.json();
    const parsed = updateMemberSchema.parse(body);

    if (!canManageMemberRole(auth.role, parsed.role)) {
      throw new AuthorizationError("You cannot assign this role.");
    }

    const member = await updateRestaurantMemberRole({
      restaurantId: id,
      userId: parsed.userId,
      role: parsed.role as RestaurantRole,
    });

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "member.role_updated",
      entityType: "restaurant_member",
      entityId: parsed.userId,
      metadata: { role: parsed.role },
    });

    return jsonOk(member);
  } catch (error) {
    return jsonError(error, 400);
  }
}

const removeMemberSchema = z.object({
  userId: z.string().uuid(),
});

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await guardRestaurantRoute(id, "team.manage");
    const body = await request.json();
    const parsed = removeMemberSchema.parse(body);

    if (auth.userId === parsed.userId) {
      throw new AuthorizationError("You cannot remove yourself.");
    }

    const members = await listRestaurantMembers(id);
    const target = members.find((member) => member.userId === parsed.userId);
    if (!target) {
      return jsonError(new Error("Member not found"), 404);
    }
    if (!canManageMemberRole(auth.role, target.role)) {
      throw new AuthorizationError("You cannot remove this member.");
    }

    await removeRestaurantMember({ restaurantId: id, userId: parsed.userId });

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "member.removed",
      entityType: "restaurant_member",
      entityId: parsed.userId,
      metadata: { role: target.role, email: target.email },
    });

    return jsonOk({ removed: true });
  } catch (error) {
    return jsonError(error, 400);
  }
}
