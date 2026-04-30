"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";

import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { CrmBoardColumns, CrmLeadDrawerContent, CrmSettingsDrawerContent, CrmStats, CrmToolbar } from "@/app/(workspace)/(staff-zone)/crm/crm-board-components";
import { replaceLead, toLeadCard, useCrmLeadDrawerActions } from "@/app/(workspace)/(staff-zone)/crm/use-crm-lead-drawer-actions";
import { useCrmSettingsState } from "@/app/(workspace)/(staff-zone)/crm/use-crm-settings-state";
import { type CrmLeadStatus } from "@/lib/crm/stages";
import type { CrmBoardDto, CrmLeadCardDto, CrmLeadDetailDto, CrmSettingsDto } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

type CrmBoardClientProps = {
  initialBoard: CrmBoardDto;
  initialSettings?: CrmSettingsDto;
};

const CRM_UNREAD_SUMMARY_EVENT = "crm:unread-summary-change";
const CRM_BOARD_REFRESH_INTERVAL_MS = 60_000;

async function notifyCrmUnreadSummaryChanged() {
  try {
    const response = await fetch("/api/crm/unread-summary", { cache: "no-store" });
    if (!response.ok) {
      window.dispatchEvent(new CustomEvent(CRM_UNREAD_SUMMARY_EVENT));
      return;
    }
    const payload = (await response.json()) as { unreadCount?: number };
    window.dispatchEvent(new CustomEvent(CRM_UNREAD_SUMMARY_EVENT, { detail: { unreadCount: payload.unreadCount ?? 0 } }));
  } catch {
    window.dispatchEvent(new CustomEvent(CRM_UNREAD_SUMMARY_EVENT));
  }
}

function leadSearchText(lead: CrmLeadCardDto) {
  return [lead.name, lead.phone, lead.email, lead.source, lead.form_type, lead.comment].filter(Boolean).join(" ").toLowerCase();
}

function findLead(board: CrmBoardDto, leadId: string) {
  for (const stage of board.stages) {
    const lead = stage.leads.find((item) => item.id === leadId);
    if (lead) return lead;
  }
  return null;
}

export function CrmBoardClient({ initialBoard, initialSettings = { background_image_url: null, updated_at: null } }: CrmBoardClientProps) {
  const [board, setBoard] = useState(initialBoard);
  const [query, setQuery] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [isMovingLead, setIsMovingLead] = useState(false);
  const isAutoRefreshBlockedRef = useRef(false);
  const settingsState = useCrmSettingsState(initialSettings);
  const leadDrawer = useCrmLeadDrawerActions({
    notifyUnreadSummaryChanged: () => void notifyCrmUnreadSummaryChanged(),
    setActionError,
    setBoard
  });

  const filteredBoard = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return board;

    return {
      stages: board.stages.map((stage) => ({
        ...stage,
        leads: stage.leads.filter((lead) => leadSearchText(lead).includes(normalizedQuery))
      }))
    };
  }, [board, query]);

  const totalLeads = board.stages.reduce((sum, stage) => sum + stage.leads.length, 0);

  const refreshBoard = useCallback(async (options?: { silent?: boolean; refreshUnreadSummary?: boolean }) => {
    try {
      const nextBoard = await fetchJson<CrmBoardDto>("/api/crm/leads");
      setBoard(nextBoard);
      if (options?.refreshUnreadSummary) {
        void notifyCrmUnreadSummaryChanged();
      }
    } catch (error) {
      if (!options?.silent) {
        setActionError(error instanceof Error ? error.message : "Не удалось обновить заявки.");
      }
    }
  }, []);

  useEffect(() => {
    isAutoRefreshBlockedRef.current = isMovingLead || leadDrawer.loadingLeadId !== null || leadDrawer.isSaving;
  }, [isMovingLead, leadDrawer.isSaving, leadDrawer.loadingLeadId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isAutoRefreshBlockedRef.current) {
        return;
      }
      void refreshBoard({ silent: true, refreshUnreadSummary: true });
    }, CRM_BOARD_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshBoard]);

  async function moveLead(leadId: string, status: CrmLeadStatus) {
    const lead = findLead(board, leadId);
    if (!lead || lead.status === status) return;

    setIsMovingLead(true);
    setActionError("");
    const previousBoard = board;
    const optimisticLead = { ...lead, status, updated_at: new Date().toISOString() };
    setBoard((current) => replaceLead(current, optimisticLead));

    try {
      const detail = await fetchJson<CrmLeadDetailDto>(`/api/crm/leads/${leadId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setBoard((current) => replaceLead(current, toLeadCard(detail)));
      if (leadDrawer.selectedLead?.id === leadId) {
        leadDrawer.setSelectedLead(detail);
        leadDrawer.setStatusDraft(detail.status);
      }
    } catch (error) {
      setBoard(previousBoard);
      setActionError(error instanceof Error ? error.message : "Не удалось изменить статус.");
    } finally {
      setIsMovingLead(false);
    }
  }

  return (
    <main
      data-testid="crm-board-root"
      className={cn(
        "relative isolate -mb-6 flex min-h-[calc(100vh-5rem+1.5rem)] flex-col px-4 pb-0 pt-5 text-slate-900 sm:px-6 lg:px-8 xl:-mb-8 xl:min-h-[calc(100vh-5rem+2rem)]",
        settingsState.backgroundImageUrl ? "bg-transparent" : "bg-[#f4f7fb]"
      )}
    >
      <CrmStats totalLeads={totalLeads} newLeads={board.stages.find((stage) => stage.slug === "new_request")?.leads.length ?? 0} />

      <CrmToolbar
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => void refreshBoard({ refreshUnreadSummary: true })}
        onOpenSettings={settingsState.openSettings}
        settingsIcon={<Settings className="h-5 w-5" />}
      />

      {actionError ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</div> : null}

      <CrmBoardColumns
        board={filteredBoard}
        draggedLeadId={draggedLeadId}
        loadingLeadId={leadDrawer.loadingLeadId}
        onDragStart={setDraggedLeadId}
        onDragEnd={() => setDraggedLeadId(null)}
        onDropLead={(leadId, status) => void moveLead(leadId, status)}
        onOpenLead={(leadId) => void leadDrawer.openLead(leadId)}
      />

      <AdminDrawer open={Boolean(leadDrawer.selectedLead)} title="Заявка" onClose={() => leadDrawer.setSelectedLead(null)} widthClass="max-w-2xl">
        {leadDrawer.selectedLead ? (
          <CrmLeadDrawerContent
            lead={leadDrawer.selectedLead}
            statusDraft={leadDrawer.statusDraft}
            commentDraft={leadDrawer.commentDraft}
            isSaving={leadDrawer.isSaving}
            onStatusDraftChange={leadDrawer.setStatusDraft}
            onCommentDraftChange={leadDrawer.setCommentDraft}
            onSaveStatus={() => void leadDrawer.saveStatus()}
            onAddComment={leadDrawer.addComment}
            onDeleteLead={() => void leadDrawer.deleteSelectedLead()}
          />
        ) : null}
      </AdminDrawer>

      <AdminDrawer open={settingsState.settingsOpen} title="Настройки CRM" onClose={() => settingsState.setSettingsOpen(false)}>
        <CrmSettingsDrawerContent
          backgroundImageUrl={settingsState.backgroundImageUrl}
          draftBackgroundImageUrl={settingsState.draftBackgroundImageUrl}
          hasSettingsChanges={settingsState.hasSettingsChanges}
          isUploadingBackground={settingsState.isUploadingBackground}
          isSavingSettings={settingsState.isSavingSettings}
          settingsError={settingsState.settingsError}
          settingsMessage={settingsState.settingsMessage}
          backgroundInputRef={settingsState.backgroundInputRef}
          onBackgroundUpload={settingsState.handleBackgroundUpload}
          onSaveSettings={() => void settingsState.saveCrmSettings()}
          onClearBackground={() => void settingsState.saveCrmSettings("")}
        />
      </AdminDrawer>
    </main>
  );
}
