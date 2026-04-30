"use client";

import { ChangeEvent, FormEvent, RefObject } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CRM_STAGES, getCrmStageTitle, isCrmLeadStatus, type CrmLeadStatus } from "@/lib/crm/stages";
import type { CrmBoardDto, CrmLeadCardDto, CrmLeadDetailDto } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

const CRM_STAGE_HEADER_STYLES: Record<CrmLeadStatus, { className: string; wedgeClassName: string }> = {
  new_request: {
    className: "bg-[#00f018] text-black",
    wedgeClassName: "border-l-[#00f018]"
  },
  not_reached: {
    className: "bg-[#16c8ff] text-white",
    wedgeClassName: "border-l-[#16c8ff]"
  },
  contact_established: {
    className: "bg-[#fff200] text-black",
    wedgeClassName: "border-l-[#fff200]"
  },
  not_fit: {
    className: "bg-[#22d3ee] text-black",
    wedgeClassName: "border-l-[#22d3ee]"
  },
  consultation_scheduled: {
    className: "bg-[#c8c2f0] text-black",
    wedgeClassName: "border-l-[#c8c2f0]"
  },
  consultation_no_show: {
    className: "bg-[#8e5bb3] text-white",
    wedgeClassName: "border-l-[#8e5bb3]"
  },
  consultation_done: {
    className: "bg-[#00a65a] text-white",
    wedgeClassName: "border-l-[#00a65a]"
  },
  thinking: {
    className: "bg-[#b45ab4] text-white",
    wedgeClassName: "border-l-[#b45ab4]"
  },
  contract_sent: {
    className: "bg-[#ffa500] text-black",
    wedgeClassName: "border-l-[#ffa500]"
  },
  contract_signed: {
    className: "bg-[#ff5f8f] text-black",
    wedgeClassName: "border-l-[#ff5f8f]"
  },
  awaiting_payment: {
    className: "bg-[#006b3a] text-white",
    wedgeClassName: "border-l-[#006b3a]"
  }
};

export function formatCrmDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function CrmStats({ totalLeads, newLeads }: { totalLeads: number; newLeads: number }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <div data-testid="crm-stat-card-total" className="rounded-lg bg-white/5 px-4 py-3 text-white shadow-[0_10px_28px_rgba(15,23,42,0.1)] backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">Всего заявок</p>
        <p className="mt-1 text-2xl font-semibold text-white">{totalLeads}</p>
      </div>
      <div data-testid="crm-stat-card-new" className="rounded-lg bg-white/5 px-4 py-3 text-white shadow-[0_10px_28px_rgba(15,23,42,0.1)] backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">Новые</p>
        <p className="mt-1 text-2xl font-semibold text-white">{newLeads}</p>
      </div>
      <div data-testid="crm-stat-card-columns" className="rounded-lg bg-white/5 px-4 py-3 text-white shadow-[0_10px_28px_rgba(15,23,42,0.1)] backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">Колонок</p>
        <p className="mt-1 text-2xl font-semibold text-white">{CRM_STAGES.length}</p>
      </div>
    </div>
  );
}

type CrmToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  settingsIcon: React.ReactNode;
};

export function CrmToolbar({ query, onQueryChange, onRefresh, onOpenSettings, settingsIcon }: CrmToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Поиск по имени, телефону, email"
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/15 sm:w-80"
      />
      <Button type="button" variant="secondary" onClick={onRefresh}>
        Обновить
      </Button>
      <Button type="button" variant="secondary" size="icon" onClick={onOpenSettings} aria-label="Настройки CRM">
        {settingsIcon}
      </Button>
    </div>
  );
}

type CrmBoardColumnsProps = {
  board: CrmBoardDto;
  draggedLeadId: string | null;
  loadingLeadId: string | null;
  onDragStart: (leadId: string) => void;
  onDragEnd: () => void;
  onDropLead: (leadId: string, status: CrmLeadStatus) => void;
  onOpenLead: (leadId: string) => void;
};

export function CrmBoardColumns({ board, draggedLeadId, loadingLeadId, onDragStart, onDragEnd, onDropLead, onOpenLead }: CrmBoardColumnsProps) {
  return (
    <section data-testid="crm-board-scroll" className="flex flex-1 overflow-x-auto pb-0">
      <div data-testid="crm-board-row" className="flex flex-1 items-stretch gap-1">
        {board.stages.map((stage) => (
          <div
            key={stage.slug}
            data-testid={`crm-stage-column-${stage.slug}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const leadId = event.dataTransfer.getData("text/plain") || draggedLeadId;
              if (leadId) onDropLead(leadId, stage.slug);
              onDragEnd();
            }}
            className="relative flex min-h-full w-[286px] shrink-0 flex-col self-stretch bg-transparent"
          >
            <span data-testid={`crm-stage-divider-${stage.slug}`} className="pointer-events-none absolute bottom-0 left-0 top-2 border-l border-dashed border-white/45" aria-hidden="true" />
            <div className="py-2 pr-4">
              <div data-testid={`crm-stage-header-${stage.slug}`} className={cn("relative flex h-8 items-center px-3 text-xs font-bold leading-none shadow-[0_2px_8px_rgba(15,23,42,0.18)]", CRM_STAGE_HEADER_STYLES[stage.slug].className)}>
                <h2 className="min-w-0 truncate">
                  {stage.title} ({stage.leads.length})
                </h2>
                <span className={cn("absolute right-[-10px] top-0 h-0 w-0 border-y-[16px] border-l-[10px] border-y-transparent", CRM_STAGE_HEADER_STYLES[stage.slug].wedgeClassName)} aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1 space-y-2 p-2">
              {stage.leads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/45 bg-slate-950/15 px-3 py-6 text-center text-xs font-medium text-white/80 backdrop-blur-[1px]">Нет заявок</div>
              ) : (
                stage.leads.map((lead) => <CrmLeadCard key={lead.id} lead={lead} loading={loadingLeadId === lead.id} onDragStart={onDragStart} onDragEnd={onDragEnd} onOpenLead={onOpenLead} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CrmLeadCard({ lead, loading, onDragStart, onDragEnd, onOpenLead }: { lead: CrmLeadCardDto; loading: boolean; onDragStart: (leadId: string) => void; onDragEnd: () => void; onOpenLead: (leadId: string) => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lead.id);
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpenLead(lead.id)}
      className={cn(
        "w-full rounded-lg border border-white/70 bg-white/90 p-3 text-left shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition hover:border-[#6d5dfc]/40 hover:bg-white hover:shadow-[0_10px_22px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5dfc]",
        loading && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-1 text-sm font-semibold text-slate-950">{lead.name}</p>
        <span data-testid="crm-lead-source-badge" className="rounded-md bg-[#eef2ff] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#4f46e5]">
          {lead.source || "site"}
        </span>
      </div>
      <div className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
        <p>{lead.phone}</p>
        <p className="truncate">{lead.email}</p>
        <p className="truncate">Форма: {lead.form_type}</p>
      </div>
      {lead.comment ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{lead.comment}</p> : null}
      <p className="mt-3 text-[11px] font-medium text-slate-400">{formatCrmDate(lead.created_at)}</p>
    </button>
  );
}

type CrmLeadDrawerContentProps = {
  lead: CrmLeadDetailDto;
  statusDraft: CrmLeadStatus;
  commentDraft: string;
  isSaving: boolean;
  onStatusDraftChange: (status: CrmLeadStatus) => void;
  onCommentDraftChange: (value: string) => void;
  onSaveStatus: () => void;
  onAddComment: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteLead: () => void;
};

export function CrmLeadDrawerContent({ lead, statusDraft, commentDraft, isSaving, onStatusDraftChange, onCommentDraftChange, onSaveStatus, onAddComment, onDeleteLead }: CrmLeadDrawerContentProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-semibold text-slate-950">{lead.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{getCrmStageTitle(lead.status)}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onDeleteLead} disabled={isSaving} className="shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50">
          Удалить заявку
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailItem label="Телефон" value={lead.phone} />
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Источник" value={lead.source || "—"} />
        <DetailItem label="Тип формы" value={lead.form_type} />
        <DetailItem label="Страница" value={lead.page_url || "—"} wide />
        <DetailItem label="Создана" value={formatCrmDate(lead.created_at)} />
        <DetailItem label="Обновлена" value={formatCrmDate(lead.updated_at)} />
      </div>

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Комментарий пользователя</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{lead.comment || "Комментарий не указан."}</p>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Статус</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Select
            value={statusDraft}
            onChange={(event) => {
              if (isCrmLeadStatus(event.target.value)) onStatusDraftChange(event.target.value);
            }}
          >
            {CRM_STAGES.map((stage) => (
              <option key={stage.slug} value={stage.slug}>
                {stage.title}
              </option>
            ))}
          </Select>
          <Button type="button" onClick={onSaveStatus} disabled={isSaving || lead.status === statusDraft}>
            Сохранить статус
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Внутренние комментарии</h3>
        <form className="mt-3 space-y-3" onSubmit={onAddComment}>
          <Textarea value={commentDraft} onChange={(event) => onCommentDraftChange(event.target.value)} placeholder="Добавить комментарий менеджера" />
          <Button type="submit" disabled={isSaving || !commentDraft.trim()}>
            Добавить комментарий
          </Button>
        </form>
        <div className="mt-4 space-y-3">
          {lead.comments.length === 0 ? (
            <p className="text-sm text-slate-500">Комментариев пока нет.</p>
          ) : (
            lead.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {comment.author_name || "Сотрудник"} · {formatCrmDate(comment.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">История изменений</h3>
        <div className="mt-3 space-y-3">
          {lead.history.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-800">
                {item.from_status ? getCrmStageTitle(item.from_status) : "Создание"} → {getCrmStageTitle(item.to_status)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {item.changed_by_name || "Система"} · {formatCrmDate(item.created_at)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type CrmSettingsDrawerContentProps = {
  backgroundImageUrl: string | null;
  draftBackgroundImageUrl: string;
  hasSettingsChanges: boolean;
  isUploadingBackground: boolean;
  isSavingSettings: boolean;
  settingsError: string;
  settingsMessage: string;
  backgroundInputRef: RefObject<HTMLInputElement | null>;
  onBackgroundUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveSettings: () => void;
  onClearBackground: () => void;
};

export function CrmSettingsDrawerContent({
  backgroundImageUrl,
  draftBackgroundImageUrl,
  hasSettingsChanges,
  isUploadingBackground,
  isSavingSettings,
  settingsError,
  settingsMessage,
  backgroundInputRef,
  onBackgroundUpload,
  onSaveSettings,
  onClearBackground
}: CrmSettingsDrawerContentProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Фон CRM</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Загрузите фотографию, которая будет отображаться на фоне доски CRM.</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {draftBackgroundImageUrl ? (
            <div className="h-44 w-full bg-cover bg-center" style={{ backgroundImage: `url("${draftBackgroundImageUrl}")` }} role="img" aria-label="Предпросмотр фона CRM" />
          ) : (
            <div className="flex h-44 items-center justify-center text-sm font-medium text-slate-400">Фон не выбран</div>
          )}
        </div>

        <input ref={backgroundInputRef} type="file" accept="image/*" className="hidden" onChange={onBackgroundUpload} />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => backgroundInputRef.current?.click()} disabled={isUploadingBackground || isSavingSettings}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploadingBackground ? "Загружаем..." : "Загрузить фото"}
          </Button>
          <Button type="button" onClick={onSaveSettings} disabled={isUploadingBackground || isSavingSettings || !hasSettingsChanges}>
            {isSavingSettings ? "Сохраняем..." : "Сохранить"}
          </Button>
          <Button type="button" variant="outline" onClick={onClearBackground} disabled={isUploadingBackground || isSavingSettings || (!draftBackgroundImageUrl && !backgroundImageUrl)} className="border-rose-200 text-rose-700 hover:bg-rose-50">
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить фон
          </Button>
        </div>

        {settingsError ? <p role="alert" className="mt-3 text-sm font-medium text-rose-600">{settingsError}</p> : null}
        {settingsMessage ? <p role="status" className="mt-3 text-sm font-medium text-indigo-600">{settingsMessage}</p> : null}
      </section>
    </div>
  );
}

function DetailItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50 px-3 py-2", wide && "sm:col-span-2")}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
