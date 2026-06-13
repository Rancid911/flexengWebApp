"use client";

import { useState } from "react";

import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import type { TeacherStudentNoteDto } from "@/lib/teacher-workspace/types";

async function parseApiResponse(response: Response) {
  if (response.ok) return response.json();
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(payload?.message || "Не удалось выполнить запрос");
}

export function useTeacherNotesState({
  studentId,
  initialNotes
}: {
  studentId: string;
  initialNotes: TeacherStudentNoteDto[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [noteBody, setNoteBody] = useState("");
  const { error, setErrorMessage, clearError } = useAsyncFeedback();
  const { pending: saving, run: runNoteAction } = useAsyncAction();

  const createNote = async () => {
    if (!noteBody.trim()) return;
    await runNoteAction({
      onStart: clearError,
      onError: (requestError) => {
        setErrorMessage(requestError instanceof Error ? requestError.message : "Не удалось сохранить заметку");
      },
      action: async () => {
        const response = await fetch(`/api/students/${studentId}/teacher-notes`, {
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
  };

  return {
    notes,
    noteBody,
    saving,
    error,
    setNoteBody,
    createNote
  };
}
