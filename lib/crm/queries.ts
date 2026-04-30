import { CRM_DEFAULT_STATUS, CRM_STAGES, getCrmStageTitle, isCrmLeadStatus, type CrmLeadStatus } from "@/lib/crm/stages";
import type { AdminActor } from "@/lib/admin/types";
import {
  createCrmLeadCommentRow,
  createCrmLeadStatusHistoryRow,
  countUnreadNewCrmLeadRows,
  deleteCrmLeadRow,
  loadCrmActorNameRows,
  loadCrmLeadDetailRow,
  loadCrmLeadExistsRow,
  loadCrmLeadRows,
  loadCrmLeadStatusRow,
  loadCrmLeadViewedState,
  markCrmLeadViewedRow,
  updateCrmLeadStatusRow
} from "@/lib/crm/leads.repository";
import { loadCrmSettingsRow, upsertCrmSettingsRow } from "@/lib/crm/settings.repository";
import type { CrmBoardDto, CrmLeadCardDto, CrmLeadCommentDto, CrmLeadDetailDto, CrmLeadHistoryDto, CrmSettingsDto } from "@/lib/crm/types";

const DEFAULT_CRM_SETTINGS: CrmSettingsDto = {
  background_image_url: null,
  updated_at: null
};

export function toCrmLeadCardDto(row: Record<string, unknown>): CrmLeadCardDto {
  const status = isCrmLeadStatus(row.status) ? row.status : CRM_DEFAULT_STATUS;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    source: row.source == null ? null : String(row.source),
    form_type: String(row.form_type ?? ""),
    page_url: row.page_url == null ? null : String(row.page_url),
    comment: row.comment == null ? null : String(row.comment),
    status,
    viewed_at: row.viewed_at == null ? null : String(row.viewed_at),
    viewed_by: row.viewed_by == null ? null : String(row.viewed_by),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  };
}

function mapProfileNames(rows: Array<{ id?: unknown; display_name?: unknown; first_name?: unknown; last_name?: unknown; email?: unknown }>) {
  const names = new Map<string, string>();
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : null;
    if (!id) continue;
    const displayName = typeof row.display_name === "string" ? row.display_name : "";
    const fullName = [row.first_name, row.last_name].filter((value) => typeof value === "string" && value.trim()).join(" ");
    const email = typeof row.email === "string" ? row.email : "";
    names.set(id, displayName || fullName || email || "Сотрудник");
  }
  return names;
}

async function loadActorNames(userIds: string[]) {
  const { data, error } = await loadCrmActorNameRows(userIds);
  if (error) return new Map<string, string>();
  return mapProfileNames((data ?? []) as Array<{ id?: unknown; display_name?: unknown; first_name?: unknown; last_name?: unknown; email?: unknown }>);
}

function toHistoryDto(row: Record<string, unknown>, names: Map<string, string>): CrmLeadHistoryDto {
  const changedBy = row.changed_by == null ? null : String(row.changed_by);
  const toStatus = isCrmLeadStatus(row.to_status) ? row.to_status : CRM_DEFAULT_STATUS;
  return {
    id: String(row.id ?? ""),
    from_status: isCrmLeadStatus(row.from_status) ? row.from_status : null,
    to_status: toStatus,
    changed_by: changedBy,
    changed_by_name: changedBy ? names.get(changedBy) ?? null : null,
    created_at: String(row.created_at ?? "")
  };
}

function toCommentDto(row: Record<string, unknown>, names: Map<string, string>): CrmLeadCommentDto {
  const authorId = row.author_id == null ? null : String(row.author_id);
  return {
    id: String(row.id ?? ""),
    body: String(row.body ?? ""),
    author_id: authorId,
    author_name: authorId ? names.get(authorId) ?? null : null,
    created_at: String(row.created_at ?? "")
  };
}

export function buildCrmBoard(leads: CrmLeadCardDto[]): CrmBoardDto {
  return {
    stages: CRM_STAGES.map((stage) => ({
      slug: stage.slug,
      title: stage.title,
      leads: leads.filter((lead) => lead.status === stage.slug)
    }))
  };
}

export async function loadCrmBoard(): Promise<CrmBoardDto> {
  const { data, error } = await loadCrmLeadRows();
  if (error) throw error;
  return buildCrmBoard((data ?? []).map((row) => toCrmLeadCardDto(row as Record<string, unknown>)));
}

export async function loadCrmSettings(): Promise<CrmSettingsDto> {
  const { data, error } = await loadCrmSettingsRow();

  if (error) throw error;
  if (!data) return DEFAULT_CRM_SETTINGS;

  return {
    background_image_url: data.background_image_url ?? null,
    updated_at: data.updated_at ?? null
  };
}

export async function updateCrmSettings(actor: AdminActor, payload: { background_image_url: string | null }): Promise<CrmSettingsDto> {
  const { data, error } = await upsertCrmSettingsRow({
    backgroundImageUrl: payload.background_image_url,
    updatedByProfileId: actor.userId
  });

  if (error) throw error;

  return {
    background_image_url: data.background_image_url ?? null,
    updated_at: data.updated_at ?? null
  };
}

export async function loadCrmLeadDetail(leadId: string): Promise<CrmLeadDetailDto | null> {
  const { data, error } = await loadCrmLeadDetailRow(leadId);
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const historyRows = Array.isArray(row.crm_lead_status_history) ? row.crm_lead_status_history : [];
  const commentRows = Array.isArray(row.crm_lead_comments) ? row.crm_lead_comments : [];
  const actorIds = [
    ...historyRows.flatMap((item) => {
      const changedBy = (item as Record<string, unknown>).changed_by;
      return typeof changedBy === "string" ? [changedBy] : [];
    }),
    ...commentRows.flatMap((item) => {
      const authorId = (item as Record<string, unknown>).author_id;
      return typeof authorId === "string" ? [authorId] : [];
    })
  ];
  const names = await loadActorNames(actorIds);

  return {
    ...toCrmLeadCardDto(row),
    history: historyRows
      .map((item) => toHistoryDto(item as Record<string, unknown>, names))
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    comments: commentRows
      .map((item) => toCommentDto(item as Record<string, unknown>, names))
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
  };
}

export async function markCrmLeadViewed(leadId: string, actorUserId: string) {
  const { data: current, error: currentError } = await loadCrmLeadViewedState(leadId);
  if (currentError || !current) return false;
  if (current.viewed_at) return false;

  const { error } = await markCrmLeadViewedRow(leadId, actorUserId);
  if (error) throw error;
  return true;
}

export async function getCrmUnreadNewRequestsCount() {
  const { count, error } = await countUnreadNewCrmLeadRows();
  if (error) throw error;
  return Number(count ?? 0);
}

export async function updateCrmLeadStatus(input: { leadId: string; status: CrmLeadStatus; actorUserId: string }) {
  const { data: current, error: currentError } = await loadCrmLeadStatusRow(input.leadId);
  if (currentError || !current) throw currentError ?? new Error("Lead not found");

  const fromStatus = isCrmLeadStatus(current.status) ? current.status : CRM_DEFAULT_STATUS;
  if (fromStatus !== input.status) {
    const { error: updateError } = await updateCrmLeadStatusRow(input.leadId, input.status);
    if (updateError) throw updateError;

    const { error: historyError } = await createCrmLeadStatusHistoryRow({
      leadId: input.leadId,
      fromStatus,
      toStatus: input.status,
      changedBy: input.actorUserId
    });
    if (historyError) throw historyError;
  }

  return await loadCrmLeadDetail(input.leadId);
}

export async function createCrmLeadComment(input: { leadId: string; body: string; actorUserId: string }) {
  const { error } = await createCrmLeadCommentRow(input);
  if (error) throw error;
  return await loadCrmLeadDetail(input.leadId);
}

export async function deleteCrmLead(leadId: string) {
  const { data: existing, error: fetchError } = await loadCrmLeadExistsRow(leadId);
  if (fetchError) throw fetchError;
  if (!existing) return false;

  const { error: deleteError } = await deleteCrmLeadRow(leadId);
  if (deleteError) throw deleteError;
  return true;
}

export function formatCrmStatus(status: CrmLeadStatus) {
  return getCrmStageTitle(status);
}
