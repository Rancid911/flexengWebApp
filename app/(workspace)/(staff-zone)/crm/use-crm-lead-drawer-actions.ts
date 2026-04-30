"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import type { CrmLeadStatus } from "@/lib/crm/stages";
import type { CrmBoardDto, CrmLeadCardDto, CrmLeadDetailDto } from "@/lib/crm/types";

type UseCrmLeadDrawerActionsArgs = {
  notifyUnreadSummaryChanged: () => void;
  setActionError: (message: string) => void;
  setBoard: Dispatch<SetStateAction<CrmBoardDto>>;
};

function replaceLead(board: CrmBoardDto, lead: CrmLeadCardDto): CrmBoardDto {
  return {
    stages: board.stages.map((stage) => ({
      ...stage,
      leads: stage.slug === lead.status ? [lead, ...stage.leads.filter((item) => item.id !== lead.id)] : stage.leads.filter((item) => item.id !== lead.id)
    }))
  };
}

function removeLead(board: CrmBoardDto, leadId: string): CrmBoardDto {
  return {
    stages: board.stages.map((stage) => ({
      ...stage,
      leads: stage.leads.filter((lead) => lead.id !== leadId)
    }))
  };
}

function toLeadCard(detail: CrmLeadDetailDto): CrmLeadCardDto {
  return {
    id: detail.id,
    name: detail.name,
    phone: detail.phone,
    email: detail.email,
    source: detail.source,
    form_type: detail.form_type,
    page_url: detail.page_url,
    comment: detail.comment,
    status: detail.status,
    viewed_at: detail.viewed_at,
    viewed_by: detail.viewed_by,
    created_at: detail.created_at,
    updated_at: detail.updated_at
  };
}

export function useCrmLeadDrawerActions({ notifyUnreadSummaryChanged, setActionError, setBoard }: UseCrmLeadDrawerActionsArgs) {
  const [selectedLead, setSelectedLead] = useState<CrmLeadDetailDto | null>(null);
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<CrmLeadStatus>("new_request");
  const [commentDraft, setCommentDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function openLead(leadId: string) {
    setLoadingLeadId(leadId);
    setActionError("");
    try {
      const detail = await fetchJson<CrmLeadDetailDto>(`/api/crm/leads/${leadId}`);
      setSelectedLead(detail);
      setStatusDraft(detail.status);
      setCommentDraft("");
      setBoard((current) => replaceLead(current, toLeadCard(detail)));
      notifyUnreadSummaryChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось открыть заявку.");
    } finally {
      setLoadingLeadId(null);
    }
  }

  async function saveStatus() {
    if (!selectedLead || selectedLead.status === statusDraft) return;
    setIsSaving(true);
    setActionError("");
    try {
      const detail = await fetchJson<CrmLeadDetailDto>(`/api/crm/leads/${selectedLead.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusDraft })
      });
      setSelectedLead(detail);
      setBoard((current) => replaceLead(current, toLeadCard(detail)));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сохранить статус.");
    } finally {
      setIsSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead || !commentDraft.trim()) return;
    setIsSaving(true);
    setActionError("");
    try {
      const detail = await fetchJson<CrmLeadDetailDto>(`/api/crm/leads/${selectedLead.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentDraft })
      });
      setSelectedLead(detail);
      setCommentDraft("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось добавить комментарий.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSelectedLead() {
    if (!selectedLead) return;
    const confirmed = window.confirm("Удалить заявку из базы данных? История изменений и внутренние комментарии также будут удалены.");
    if (!confirmed) return;

    setIsSaving(true);
    setActionError("");
    try {
      await fetchJson<{ ok: true; id: string }>(`/api/crm/leads/${selectedLead.id}`, { method: "DELETE" });
      setBoard((current) => removeLead(current, selectedLead.id));
      setSelectedLead(null);
      setCommentDraft("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось удалить заявку.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    addComment,
    commentDraft,
    deleteSelectedLead,
    isSaving,
    loadingLeadId,
    openLead,
    saveStatus,
    selectedLead,
    setCommentDraft,
    setSelectedLead,
    setStatusDraft,
    statusDraft
  };
}

export { replaceLead, toLeadCard };
