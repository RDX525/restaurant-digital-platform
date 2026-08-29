import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import type { AuditLogRecord, RecordAuditInput } from "./types";

const demoAuditLogs: AuditLogRecord[] = [];

export function resetDemoAuditLogsForTests(): void {
  demoAuditLogs.length = 0;
}

function mapRow(row: Record<string, unknown>): AuditLogRecord {
  return {
    id: row.id as string,
    restaurantId: row.restaurant_id as string,
    actorUserId: (row.actor_user_id as string | null) ?? null,
    actorEmail: (row.actor_email as string | null) ?? null,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: (row.entity_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

export async function recordAuditEvent(input: RecordAuditInput): Promise<AuditLogRecord> {
  const payload = {
    restaurant_id: input.restaurantId,
    actor_user_id: input.actorUserId ?? null,
    actor_email: input.actorEmail ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  };

  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    const record: AuditLogRecord = {
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };
    demoAuditLogs.unshift(record);
    return record;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("audit_logs").insert(payload).select("*").single();
  if (error) throw error;
  return mapRow(data);
}

export async function listAuditLogsForRestaurant(
  restaurantId: string,
  limit = 100,
): Promise<AuditLogRecord[]> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(restaurantId)) {
    return demoAuditLogs.filter((log) => log.restaurantId === restaurantId).slice(0, limit);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapRow);
}
