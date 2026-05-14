"use client";

import { useStudentBillingSettingsState } from "@/features/teacher-workspace/client/use-student-billing-settings-state";
import { useTeacherNotesState } from "@/features/teacher-workspace/client/use-teacher-notes-state";
import type { TeacherStudentProfileData } from "@/lib/teacher-workspace/types";

export function useTeacherStudentProfileState(initialData: TeacherStudentProfileData) {
  const notesState = useTeacherNotesState({
    studentId: initialData.studentId,
    initialNotes: initialData.notes
  });
  const billingState = useStudentBillingSettingsState({
    studentId: initialData.studentId,
    initialBillingSummary: initialData.billingSummary,
    loadOnMount: initialData.billingSummaryDeferred
  });

  return {
    ...notesState,
    ...billingState
  };
}
