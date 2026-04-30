"use client";

import { useState } from "react";

import type { ScheduleStudentOptionDto, ScheduleTeacherOptionDto, StaffScheduleLessonDto } from "@/lib/schedule/types";

import { buildLessonFormState } from "./use-staff-schedule-state";

type UseStaffScheduleUiStateParams = {
  students: ScheduleStudentOptionDto[];
  teachers: ScheduleTeacherOptionDto[];
  teacherLocked: boolean;
};

export function useStaffScheduleUiState({ students, teachers, teacherLocked }: UseStaffScheduleUiStateParams) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formState, setFormState] = useState(() => buildLessonFormState(null, students, teachers, { teacherLocked }));

  const openCreateDrawer = (nextState?: ReturnType<typeof buildLessonFormState>) => {
    setFormState(nextState ?? buildLessonFormState(null, students, teachers, { teacherLocked }));
    setDrawerOpen(true);
  };

  const openEditDrawer = (lesson: StaffScheduleLessonDto) => {
    setFormState(buildLessonFormState(lesson, students, teachers, { teacherLocked }));
    setDrawerOpen(true);
  };

  return {
    drawerOpen,
    formState,
    openCreateDrawer,
    openEditDrawer,
    setDrawerOpen,
    setFormState
  };
}
