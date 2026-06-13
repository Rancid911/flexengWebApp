import { CRM_DEFAULT_STATUS, type CrmLeadStatus } from "@/lib/crm/stages";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

export const CRM_LEAD_SELECT = "id, name, phone, email, source, form_type, page_url, comment, metadata, status, viewed_at, viewed_by, created_at, updated_at";
export const CRM_LEAD_DETAIL_SELECT =
  "id, name, phone, email, source, form_type, page_url, comment, metadata, status, viewed_at, viewed_by, created_at, updated_at, crm_lead_status_history(id, from_status, to_status, changed_by, created_at), crm_lead_comments(id, body, author_id, created_at)";

export type CrmRepositoryClient = ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>;
export type CrmLeadRow = Record<string, unknown>;
export type CrmActorNameRow = { id?: unknown; display_name?: unknown; first_name?: unknown; last_name?: unknown; email?: unknown };

export async function createCrmLeadRow(
  supabase: CrmRepositoryClient,
  input: {
    name: string;
    phone: string;
    email: string;
    comment?: string | null;
    source?: string | null;
    form_type: string;
    page_url?: string | null;
    metadata?: unknown;
  }
) {
  const { data, error } = await supabase
    .from("crm_leads")
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email,
      comment: input.comment ?? null,
      source: input.source ?? null,
      form_type: input.form_type,
      page_url: input.page_url ?? null,
      metadata: input.metadata ?? {},
      status: CRM_DEFAULT_STATUS
    })
    .select("id")
    .single();

  return { data, error };
}

export async function createCrmLeadStatusHistoryRow(
  supabase: CrmRepositoryClient,
  input: {
    leadId: string;
    fromStatus: CrmLeadStatus | null;
    toStatus: CrmLeadStatus;
    changedBy: string | null;
  }
) {
  return await supabase.from("crm_lead_status_history").insert({
    lead_id: input.leadId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    changed_by: input.changedBy
  });
}

export async function loadCrmLeadRows(supabase: CrmRepositoryClient) {
  return await supabase.from("crm_leads").select(CRM_LEAD_SELECT).order("created_at", { ascending: false });
}

export async function loadCrmLeadDetailRow(supabase: CrmRepositoryClient, leadId: string) {
  return await supabase.from("crm_leads").select(CRM_LEAD_DETAIL_SELECT).eq("id", leadId).single();
}

export async function loadCrmActorNameRows(supabase: CrmRepositoryClient, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return { data: [] as CrmActorNameRow[], error: null };

  return await supabase.from("profiles").select("id, display_name, first_name, last_name, email").in("id", uniqueIds);
}

export async function loadCrmLeadViewedState(supabase: CrmRepositoryClient, leadId: string) {
  return await supabase.from("crm_leads").select("id, viewed_at").eq("id", leadId).single();
}

export async function markCrmLeadViewedRow(supabase: CrmRepositoryClient, leadId: string, actorUserId: string) {
  return await supabase.from("crm_leads").update({ viewed_at: new Date().toISOString(), viewed_by: actorUserId }).eq("id", leadId);
}

export async function countUnreadNewCrmLeadRows(supabase: CrmRepositoryClient) {
  return await supabase.from("crm_leads").select("id", { count: "exact", head: true }).eq("status", CRM_DEFAULT_STATUS).is("viewed_at", null);
}

export async function loadCrmLeadStatusRow(supabase: CrmRepositoryClient, leadId: string) {
  return await supabase.from("crm_leads").select("id, status").eq("id", leadId).single();
}

export async function updateCrmLeadStatusRow(supabase: CrmRepositoryClient, leadId: string, status: CrmLeadStatus) {
  return await supabase.from("crm_leads").update({ status }).eq("id", leadId);
}

export async function createCrmLeadCommentRow(supabase: CrmRepositoryClient, input: { leadId: string; body: string; actorUserId: string }) {
  return await supabase.from("crm_lead_comments").insert({
    lead_id: input.leadId,
    body: input.body,
    author_id: input.actorUserId
  });
}

export async function loadCrmLeadExistsRow(supabase: CrmRepositoryClient, leadId: string) {
  return await supabase.from("crm_leads").select("id").eq("id", leadId).maybeSingle();
}

export async function deleteCrmLeadRow(supabase: CrmRepositoryClient, leadId: string) {
  return await supabase.from("crm_leads").delete().eq("id", leadId);
}
