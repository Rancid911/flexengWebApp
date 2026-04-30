"use client";

import Link from "next/link";
import { NotebookPen, Pencil, Save, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardTextareaClassName } from "@/components/ui/control-tokens";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/get-user-role";
import type { TeacherStudentNoteDto } from "@/lib/teacher-workspace/types";

type StudentNotesPanelProps = {
  studentId: string;
  initialNotes: TeacherStudentNoteDto[];
  canWriteNotes: boolean;
  detailHref?: string;
  mode: "compact" | "full";
};

async function parseApiResponse(response: Response) {
  if (response.ok) return response.json();
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(payload?.message || "Не удалось выполнить запрос");
}

function getAuthorRoleLabel(role: UserRole | null) {
  switch (role) {
    case "admin":
      return "Администратор";
    case "manager":
      return "Менеджер";
    case "teacher":
      return "Преподаватель";
    case "student":
      return "Студент";
    default:
      return "Роль не указана";
  }
}

export function StudentNotesPanel({ studentId, initialNotes, canWriteNotes, detailHref, mode }: StudentNotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteActionErrorById, setNoteActionErrorById] = useState<Record<string, string>>({});
  const { error, setErrorMessage, clearError } = useAsyncFeedback();
  const { pending: saving, run: runNoteAction } = useAsyncAction();
  const { pending: editingSaving, run: runEditAction } = useAsyncAction();
  const { pending: deletingSaving, run: runDeleteAction } = useAsyncAction();
  const visibleNotes = mode === "compact" ? notes.slice(0, 2) : notes;

  async function createNote() {
    if (!noteBody.trim()) return;
    await runNoteAction({
      onStart: clearError,
      onError: (requestError) => {
        setErrorMessage(requestError instanceof Error ? requestError.message : "Не удалось сохранить заметку");
      },
      action: async () => {
        const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/teacher-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: noteBody,
            visibility: "private"
          })
        });
        return (await parseApiResponse(response)) as TeacherStudentNoteDto;
      },
      onSuccess: (created) => {
        setNotes((current) => [created, ...current]);
        setNoteBody("");
      }
    });
  }

  function startEditingNote(note: TeacherStudentNoteDto) {
    setDeletingNoteId(null);
    setEditingNoteId(note.id);
    setEditingBody(note.body);
    setNoteActionErrorById((current) => {
      const next = { ...current };
      delete next[note.id];
      return next;
    });
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setEditingBody("");
  }

  async function updateNote(note: TeacherStudentNoteDto) {
    if (!editingBody.trim()) return;
    await runEditAction({
      onStart: () => {
        setNoteActionErrorById((current) => {
          const next = { ...current };
          delete next[note.id];
          return next;
        });
      },
      onError: (requestError) => {
        setNoteActionErrorById((current) => ({
          ...current,
          [note.id]: requestError instanceof Error ? requestError.message : "Не удалось обновить заметку"
        }));
      },
      action: async () => {
        const response = await fetch(`/api/teacher-notes/${encodeURIComponent(note.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: editingBody,
            visibility: note.visibility
          })
        });
        return (await parseApiResponse(response)) as TeacherStudentNoteDto;
      },
      onSuccess: (updated) => {
        setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingNoteId(null);
        setEditingBody("");
      }
    });
  }

  function startDeletingNote(noteId: string) {
    setEditingNoteId(null);
    setEditingBody("");
    setDeletingNoteId(noteId);
    setNoteActionErrorById((current) => {
      const next = { ...current };
      delete next[noteId];
      return next;
    });
  }

  async function deleteNote(noteId: string) {
    await runDeleteAction({
      onStart: () => {
        setNoteActionErrorById((current) => {
          const next = { ...current };
          delete next[noteId];
          return next;
        });
      },
      onError: (requestError) => {
        setNoteActionErrorById((current) => ({
          ...current,
          [noteId]: requestError instanceof Error ? requestError.message : "Не удалось удалить заметку"
        }));
      },
      action: async () => {
        const response = await fetch(`/api/teacher-notes/${encodeURIComponent(noteId)}`, {
          method: "DELETE"
        });
        return await parseApiResponse(response);
      },
      onSuccess: () => {
        setNotes((current) => current.filter((item) => item.id !== noteId));
        setDeletingNoteId(null);
      }
    });
  }

  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1f7aff]">
              <NotebookPen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Заметки преподавателя</h2>
              <p className="text-sm text-slate-600">Внутренние наблюдения по ученику и идеи для следующего урока.</p>
            </div>
          </div>
          {detailHref ? (
            <Link href={detailHref} className="text-sm font-black text-[#1f7aff] hover:text-[#1669db]">
              Все заметки
            </Link>
          ) : null}
        </div>

        {canWriteNotes ? (
          <div className="space-y-3">
            <FormField className="text-sm text-slate-600" label="Новая заметка">
              <Textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                aria-label="Новая заметка"
                rows={3}
                className={cn(dashboardTextareaClassName, "!min-h-[84px]")}
                placeholder="Например: на следующем уроке закрепить speaking prompts и повторить ошибки с present perfect."
              />
            </FormField>
            {error ? <StatusMessage>{error}</StatusMessage> : null}
            <Button type="button" onClick={() => void createNote()} disabled={saving} className="h-11 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]">
              <Save className="mr-2 h-4 w-4" />
              Сохранить заметку
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {visibleNotes.length > 0 ? (
            visibleNotes.map((note) => (
              <StudentNoteItem
                key={note.id}
                note={note}
                canManage={mode === "full" && canWriteNotes}
                isEditing={editingNoteId === note.id}
                editValue={editingBody}
                editPending={editingSaving && editingNoteId === note.id}
                isConfirmingDelete={deletingNoteId === note.id}
                deletePending={deletingSaving && deletingNoteId === note.id}
                actionError={noteActionErrorById[note.id] ?? null}
                onStartEdit={() => startEditingNote(note)}
                onCancelEdit={cancelEditingNote}
                onEditValueChange={setEditingBody}
                onSaveEdit={() => void updateNote(note)}
                onStartDelete={() => startDeletingNote(note.id)}
                onCancelDelete={() => setDeletingNoteId(null)}
                onConfirmDelete={() => void deleteNote(note.id)}
              />
            ))
          ) : (
            <EmptyBlock text="Заметок пока нет." />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentNoteItem({
  note,
  canManage,
  isEditing,
  editValue,
  editPending,
  isConfirmingDelete,
  deletePending,
  actionError,
  onStartEdit,
  onCancelEdit,
  onEditValueChange,
  onSaveEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  note: TeacherStudentNoteDto;
  canManage: boolean;
  isEditing: boolean;
  editValue: string;
  editPending: boolean;
  isConfirmingDelete: boolean;
  deletePending: boolean;
  actionError: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onSaveEdit: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editValue}
            onChange={(event) => onEditValueChange(event.target.value)}
            aria-label={`Редактировать заметку ${note.id}`}
            rows={4}
            className={dashboardTextareaClassName}
          />
          {actionError ? <StatusMessage>{actionError}</StatusMessage> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onSaveEdit} disabled={editPending || !editValue.trim()} className="h-10 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]">
              {editPending ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancelEdit} disabled={editPending} className="h-10 rounded-2xl px-4 font-bold">
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-slate-700">{note.body}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Добавлено: {formatRuLongDateTime(note.createdAt) || "Без даты"} · {note.createdByName ?? "Пользователь"} · {getAuthorRoleLabel(note.createdByRole)}
              </p>
            </div>
            {canManage ? (
              <div data-testid="student-note-actions" className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Button type="button" variant="secondary" onClick={onStartEdit} className="h-9 rounded-2xl px-3 text-sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button type="button" variant="secondary" onClick={onStartDelete} className="h-9 rounded-2xl px-3 text-sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
              </div>
            ) : null}
          </div>
          {actionError ? <div className="mt-3"><StatusMessage>{actionError}</StatusMessage></div> : null}
          {isConfirmingDelete ? (
            <div className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-3">
              <p className="text-sm font-semibold text-rose-700">Удалить заметку?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={onConfirmDelete} disabled={deletePending} className="h-9 rounded-2xl px-3 text-sm">
                  {deletePending ? "Удаляем..." : "Удалить"}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancelDelete} disabled={deletePending} className="h-9 rounded-2xl px-3 text-sm font-bold">
                  Отмена
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-4 py-5 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4" />
        {text}
      </div>
    </div>
  );
}
