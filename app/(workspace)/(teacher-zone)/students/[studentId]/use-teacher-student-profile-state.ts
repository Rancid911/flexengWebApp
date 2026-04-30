"use client";

import { useStudentBillingSettingsState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-student-billing-settings-state";
import { useTeacherNotesState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-teacher-notes-state";
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
