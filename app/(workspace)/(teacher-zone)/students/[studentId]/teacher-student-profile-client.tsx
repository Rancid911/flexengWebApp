"use client";

import type { ReactNode } from "react";
import { StudentNotesPanel } from "@/app/(workspace)/_components/student-profile/student-notes-panel";
import { TeacherStudentBillingCard, TeacherStudentPlacementCard, TeacherStudentStandaloneHomeworkCard } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-components";
import { usePlacementAssignmentState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-placement-assignment-state";
import { useStandaloneHomeworkState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-standalone-homework-state";
import { useStudentBillingSettingsState } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/use-student-billing-settings-state";
import type { TeacherStudentHomeworkDto, TeacherStudentNoteDto, TeacherStudentPlacementSummaryDto } from "@/lib/teacher-workspace/types";
import type { StudentBillingSummary } from "@/lib/billing/types";

type Props = {
  studentId: string;
  initialNotes: TeacherStudentNoteDto[];
  initialPlacementSummary: TeacherStudentPlacementSummaryDto | null;
  initialStandaloneHomework: TeacherStudentHomeworkDto[];
  initialBillingSummary: StudentBillingSummary | null;
  billingSummaryDeferred: boolean;
  canWriteNotes: boolean;
  canManageBilling: boolean;
  canAssignPlacement: boolean;
  canAssignHomework: boolean;
  detailBasePath: string;
  lessonsSlot?: ReactNode;
  homeworkMistakesSlot?: ReactNode;
};

export function TeacherStudentProfileClient({
  studentId,
  initialNotes,
  initialPlacementSummary,
  initialStandaloneHomework,
  initialBillingSummary,
  billingSummaryDeferred,
  canWriteNotes,
  canManageBilling,
  canAssignPlacement,
  canAssignHomework,
  detailBasePath,
  lessonsSlot,
  homeworkMistakesSlot
}: Props) {
  const placementState = usePlacementAssignmentState({ studentId, initialPlacementSummary });
  const homeworkState = useStandaloneHomeworkState({ studentId, initialStandaloneHomework });
  const billingState = useStudentBillingSettingsState({
    studentId,
    initialBillingSummary,
    loadOnMount: billingSummaryDeferred
  });

  const placementCard = canAssignPlacement ? (
    <TeacherStudentPlacementCard
      placementSummary={placementState.placementSummary}
      loading={placementState.placementLoading}
      error={placementState.placementError}
      onToggle={placementState.togglePlacementTest}
    />
  ) : null;
  const standaloneHomeworkCard = canAssignHomework ? (
    <TeacherStudentStandaloneHomeworkCard
      assignments={homeworkState.standaloneHomework}
      loading={homeworkState.homeworkLoading}
      error={homeworkState.homeworkError}
      drawerOpen={homeworkState.homeworkDrawerOpen}
      optionsLoading={homeworkState.homeworkOptionsLoading}
      options={homeworkState.filteredHomeworkOptions}
      searchValue={homeworkState.homeworkSearch}
      titleValue={homeworkState.homeworkTitle}
      descriptionValue={homeworkState.homeworkDescription}
      dueAtValue={homeworkState.homeworkDueAt}
      selectedActivityIds={homeworkState.selectedHomeworkActivityIds}
      onOpen={homeworkState.openHomeworkDrawer}
      onClose={() => homeworkState.setHomeworkDrawerOpen(false)}
      onSearchChange={homeworkState.setHomeworkSearch}
      onTitleChange={homeworkState.setHomeworkTitle}
      onDescriptionChange={homeworkState.setHomeworkDescription}
      onDueAtChange={homeworkState.setHomeworkDueAt}
      onToggleActivity={(activityId, checked) =>
        homeworkState.setSelectedHomeworkActivityIds((current) => (checked ? [...current, activityId] : current.filter((item) => item !== activityId)))
      }
      onSubmit={() => void homeworkState.assignStandaloneHomework()}
      detailHref={`${detailBasePath}/homework`}
    />
  ) : null;
  const billingCard = canManageBilling ? (
    <TeacherStudentBillingCard
      canManageBilling={canManageBilling}
      billingState={billingState}
      billingSummary={billingState.billingSummary ?? initialBillingSummary}
    />
  ) : null;
  const notesCard = (
    <StudentNotesPanel
      studentId={studentId}
      initialNotes={initialNotes}
      canWriteNotes={canWriteNotes}
      detailHref={`${detailBasePath}/notes`}
      mode="compact"
    />
  );

  if (lessonsSlot || homeworkMistakesSlot) {
    return (
      <section className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div data-testid="student-profile-left-column" className="space-y-5">
          {lessonsSlot}
          {billingCard}
        </div>
        <div data-testid="student-profile-right-column" className="space-y-5">
          {placementCard}
          {standaloneHomeworkCard}
          {notesCard}
          {homeworkMistakesSlot}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {placementCard}
      {standaloneHomeworkCard}
      {billingCard}
      {notesCard}
    </div>
  );
}
