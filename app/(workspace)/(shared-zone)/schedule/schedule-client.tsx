"use client";

import { StudentScheduleView } from "@/app/(workspace)/(shared-zone)/schedule/schedule-components";
import { FollowupDrawer, LessonFormDrawer, ScheduleAgendaPanel, StaffScheduleHero } from "@/app/(workspace)/(shared-zone)/schedule/schedule-staff-sections";
import { canSubmitLessonForm, useStaffScheduleState } from "@/app/(workspace)/(shared-zone)/schedule/use-staff-schedule-state";
import type { SchedulePageData, StaffSchedulePageData } from "@/lib/schedule/types";
import { getScheduleStatusTone } from "@/lib/schedule/utils";

type ScheduleClientProps = {
  initialData: SchedulePageData;
};

export function getStatusBadgeClass(tone: ReturnType<typeof getScheduleStatusTone>) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "rose":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }
}

export function ScheduleClient({ initialData }: ScheduleClientProps) {
  if (initialData.role === "student") {
    return <StudentScheduleView data={initialData} />;
  }

  return <StaffScheduleView key={JSON.stringify(initialData.filters)} initialData={initialData} />;
}

function StaffScheduleView({ initialData }: { initialData: StaffSchedulePageData }) {
  const scheduleState = useStaffScheduleState(initialData);
  const isEditMode = Boolean(scheduleState.formState.id);
  const canSubmit = canSubmitLessonForm({
    formState: scheduleState.formState,
    saving: scheduleState.saving,
    createCatalogLoading: scheduleState.createCatalogLoading,
    createCatalogReady: scheduleState.createCatalogReady,
    mode: isEditMode ? "edit" : "create"
  });

  return (
    <div className="space-y-5 pb-8">
      <StaffScheduleHero lessonCount={scheduleState.lessons.length} scheduledCount={scheduleState.scheduledCount} />

      <ScheduleAgendaPanel
        actionError={scheduleState.actionError}
        filters={scheduleState.filters}
        groupedLessons={scheduleState.groupedLessons}
        isLoading={scheduleState.isLoading}
        referenceNow={scheduleState.referenceNow}
        saving={scheduleState.saving}
        students={scheduleState.students}
        teacherLocked={initialData.teacherLocked}
        teachers={scheduleState.teachers}
        ensureStudentCatalogLoaded={scheduleState.ensureStudentCatalogLoaded}
        ensureTeacherCatalogLoaded={scheduleState.ensureTeacherCatalogLoaded}
        handleStatusAction={scheduleState.handleStatusAction}
        openCreateDrawer={scheduleState.openCreateDrawer}
        openEditDrawer={scheduleState.openEditDrawer}
        openFollowupDrawer={scheduleState.openFollowupDrawer}
        setFilters={scheduleState.setFilters}
      />

      <LessonFormDrawer
        actionError={scheduleState.actionError}
        canSubmit={canSubmit}
        createCatalogError={scheduleState.createCatalogError}
        createCatalogLoading={scheduleState.createCatalogLoading}
        drawerOpen={scheduleState.drawerOpen}
        formState={scheduleState.formState}
        saving={scheduleState.saving}
        students={scheduleState.students}
        teacherLocked={initialData.teacherLocked}
        teachers={scheduleState.teachers}
        ensureStudentCatalogLoaded={scheduleState.ensureStudentCatalogLoaded}
        ensureTeacherCatalogLoaded={scheduleState.ensureTeacherCatalogLoaded}
        handleSubmit={scheduleState.handleSubmit}
        setDrawerOpen={scheduleState.setDrawerOpen}
        setFormState={scheduleState.setFormState}
      />

      <FollowupDrawer
        actionError={scheduleState.actionError}
        activeFollowupLesson={scheduleState.activeFollowupLesson}
        followupDrawerOpen={scheduleState.followupDrawerOpen}
        followupSnapshot={scheduleState.followupSnapshot}
        followupState={scheduleState.followupState}
        homeworkTestOptions={scheduleState.homeworkTestOptions}
        homeworkTestOptionsLoading={scheduleState.homeworkTestOptionsLoading}
        referenceNow={scheduleState.referenceNow}
        saving={scheduleState.saving}
        showAllHomeworkLevels={scheduleState.showAllHomeworkLevels}
        handleFollowupSubmit={scheduleState.handleFollowupSubmit}
        loadHomeworkTestOptions={scheduleState.loadHomeworkTestOptions}
        setActiveFollowupLesson={scheduleState.setActiveFollowupLesson}
        setFollowupDrawerOpen={scheduleState.setFollowupDrawerOpen}
        setFollowupState={scheduleState.setFollowupState}
        setShowAllHomeworkLevels={scheduleState.setShowAllHomeworkLevels}
      />
    </div>
  );
}
