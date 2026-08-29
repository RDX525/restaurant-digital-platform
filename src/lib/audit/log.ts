import type { ApiAuthContext } from "@/lib/auth/api-auth";
import { recordAuditEvent } from "./data";

export async function auditFromAuth(
  auth: ApiAuthContext,
  input: Omit<Parameters<typeof recordAuditEvent>[0], "actorUserId" | "actorEmail">,
): Promise<void> {
  await recordAuditEvent({
    ...input,
    actorUserId: auth.userId,
    actorEmail: auth.email,
  });
}
