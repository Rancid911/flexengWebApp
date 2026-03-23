import { createAdminClient } from "@/lib/supabase/admin";

type AuditAction = "create" | "update" | "delete";

type AuditEntry = {
  actorUserId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
};

export async function writeAudit(entry: AuditEntry) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_user_id: entry.actorUserId,
      entity: entry.entity,
      entity_id: entry.entityId,
      action: entry.action,
      before: entry.before ?? null,
      after: entry.after ?? null
    });

    if (error) {
      console.error("Failed to write audit log:", error.message);
    }
  } catch (error) {
    console.error("Unexpected audit log failure:", error);
  }
}
