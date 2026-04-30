"use client";

import { useCallback, useEffect, useState } from "react";

import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import type {
  ScheduleFilterCatalogResponse,
  ScheduleStudentOptionDto,
  ScheduleTeacherOptionDto,
  StaffScheduleLessonDto,
  StaffSchedulePageData
} from "@/lib/schedule/types";
import { useLessonFollowupState } from "./use-lesson-followup-state";

import { parseScheduleApiResponse, useStaffScheduleQueryState } from "./use-staff-schedule-query-state";
import { useStaffScheduleUiState } from "./use-staff-schedule-ui-state";

export type LessonFormState = {
  id: string | null;
  studentId: string;
  teacherId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  comment: string;
  status: "scheduled" | "completed" | "canceled";
};

type CreateLessonDefaultsOptions = {
  teacherLocked: boolean;
};

type LessonFormSubmitMode = "create" | "edit";

function toLocalDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function composeIsoDateTime(date: string, time: string) {
  if (!date || !time) return "";
  const localDate = new Date(`${date}T${time}:00`);
  return Number.isNaN(localDate.getTime()) ? "" : localDate.toISOString();
}

export function buildLessonFormState(
  lesson: StaffScheduleLessonDto | null,
  students: ScheduleStudentOptionDto[],
  teachers: ScheduleTeacherOptionDto[],
  options: CreateLessonDefaultsOptions
): LessonFormState {
  if (lesson) {
    return {
      id: lesson.id,
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      title: lesson.title,
      date: toLocalDateInput(lesson.startsAt),
      startTime: toLocalTimeInput(lesson.startsAt),
      endTime: toLocalTimeInput(lesson.endsAt),
      meetingUrl: lesson.meetingUrl ?? "",
      comment: lesson.comment ?? "",
      status: lesson.status
    };
  }

  return {
    id: null,
    studentId: resolveCreateStudentId(students),
    teacherId: resolveCreateTeacherId(teachers, options),
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingUrl: "",
    comment: "",
    status: "scheduled"
  };
}

export function canSubmitLessonForm(args: {
  formState: LessonFormState;
  saving: boolean;
  createCatalogLoading: boolean;
  createCatalogReady: boolean;
  mode: LessonFormSubmitMode;
}) {
  const { formState, saving, createCatalogLoading, createCatalogReady, mode } = args;
  const hasRequiredIds = formState.studentId.trim() !== "" && formState.teacherId.trim() !== "";
  const hasRequiredScheduleFields =
    formState.title.trim() !== "" &&
    formState.date.trim() !== "" &&
    formState.startTime.trim() !== "" &&
    formState.endTime.trim() !== "";

  if (saving) return false;
  if (mode === "create" && createCatalogLoading) return false;
  if (!hasRequiredIds || !hasRequiredScheduleFields) return false;
  if (mode === "create" && !createCatalogReady) return false;

  return true;
}

function resolveCreateStudentId(students: ScheduleStudentOptionDto[]) {
  return students.length === 1 ? students[0]?.id ?? "" : "";
}

function resolveCreateTeacherId(teachers: ScheduleTeacherOptionDto[], options: CreateLessonDefaultsOptions) {
  if (options.teacherLocked) {
    return teachers[0]?.id ?? "";
  }

  return teachers.length === 1 ? teachers[0]?.id ?? "" : "";
}

function resolveCreateFormState(
  current: LessonFormState,
  students: ScheduleStudentOptionDto[],
  teachers: ScheduleTeacherOptionDto[],
  options: CreateLessonDefaultsOptions
) {
  if (current.id) return current;

  const studentExists = current.studentId !== "" && students.some((student) => student.id === current.studentId);
  const teacherExists = current.teacherId !== "" && teachers.some((teacher) => teacher.id === current.teacherId);

  return {
    ...current,
    studentId: studentExists ? current.studentId : resolveCreateStudentId(students),
    teacherId: teacherExists ? current.teacherId : resolveCreateTeacherId(teachers, options)
  };
}

export function useStaffScheduleState(initialData: StaffSchedulePageData) {
  const [referenceNow, setReferenceNow] = useState(() => new Date());
  const [students, setStudents] = useState(initialData.students);
  const [teachers, setTeachers] = useState(initialData.teachers);
  const [studentCatalogRequested, setStudentCatalogRequested] = useState(false);
  const [teacherCatalogRequested, setTeacherCatalogRequested] = useState(false);
  const [studentCatalogLoaded, setStudentCatalogLoaded] = useState(!initialData.filterCatalogDeferred);
  const [teacherCatalogLoaded, setTeacherCatalogLoaded] = useState(!initialData.filterCatalogDeferred);
  const [createCatalogLoading, setCreateCatalogLoading] = useState(false);
  const [createCatalogError, setCreateCatalogError] = useState<string | null>(null);
  const [createCatalogReady, setCreateCatalogReady] = useState(!initialData.filterCatalogDeferred);
  const { error: actionError, setErrorMessage: setActionError, clearError: clearActionError } = useAsyncFeedback();
  const { pending: saving, run: runMutation } = useAsyncAction();
  const { filters, groupedLessons, isLoading, lessons, refreshLessons, scheduledCount, setFilters } = useStaffScheduleQueryState({ initialData });
  const {
    drawerOpen,
    formState,
    openCreateDrawer: openCreateDrawerBase,
    openEditDrawer: openEditDrawerBase,
    setDrawerOpen,
    setFormState
  } = useStaffScheduleUiState({
    students,
    teachers,
    teacherLocked: initialData.teacherLocked
  });

  useEffect(() => {
    setStudents(initialData.students);
    setTeachers(initialData.teachers);
    setStudentCatalogRequested(false);
    setTeacherCatalogRequested(false);
    setStudentCatalogLoaded(!initialData.filterCatalogDeferred);
    setTeacherCatalogLoaded(!initialData.filterCatalogDeferred);
    setCreateCatalogReady(!initialData.filterCatalogDeferred);
    setCreateCatalogError(null);
  }, [initialData.filterCatalogDeferred, initialData.students, initialData.teachers]);

  useEffect(() => {
    if (!drawerOpen || formState.id) return;

    setFormState((current) => resolveCreateFormState(current, students, teachers, { teacherLocked: initialData.teacherLocked }));
  }, [drawerOpen, formState.id, initialData.teacherLocked, setFormState, students, teachers]);

  useEffect(() => {
    if (!initialData.filterCatalogDeferred || !studentCatalogRequested) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/schedule/options?entity=students&limit=50", { cache: "no-store" });
        const payload = await parseScheduleApiResponse<ScheduleFilterCatalogResponse>(response);
        if (cancelled) return;

        setStudents((current) => mergeOptions(current, payload.students));
        setStudentCatalogLoaded(true);
      } catch {
        // Scoped SSR options are enough to keep the screen functional.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData.filterCatalogDeferred, studentCatalogRequested]);

  useEffect(() => {
    if (!initialData.filterCatalogDeferred || !teacherCatalogRequested) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/schedule/options?entity=teachers&limit=50", { cache: "no-store" });
        const payload = await parseScheduleApiResponse<ScheduleFilterCatalogResponse>(response);
        if (cancelled) return;

        setTeachers((current) => mergeOptions(current, payload.teachers));
        setTeacherCatalogLoaded(true);
      } catch {
        // Scoped SSR options are enough to keep the screen functional.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData.filterCatalogDeferred, teacherCatalogRequested]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReferenceNow(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const openCreateDrawer = () => {
    clearActionError();
    setCreateCatalogError(null);
    setCreateCatalogReady(!initialData.filterCatalogDeferred);
    openCreateDrawerBase(buildLessonFormState(null, students, teachers, { teacherLocked: initialData.teacherLocked }));
    void ensureCreateCatalogLoaded();
  };

  const openEditDrawer = (lesson: StaffScheduleLessonDto) => {
    clearActionError();
    openEditDrawerBase(lesson);
  };

  const ensureStudentCatalogLoaded = useCallback(() => {
    if (!initialData.filterCatalogDeferred || studentCatalogLoaded) return;
    setStudentCatalogRequested(true);
  }, [initialData.filterCatalogDeferred, studentCatalogLoaded]);

  const ensureTeacherCatalogLoaded = useCallback(() => {
    if (!initialData.filterCatalogDeferred || teacherCatalogLoaded) return;
    setTeacherCatalogRequested(true);
  }, [initialData.filterCatalogDeferred, teacherCatalogLoaded]);

  const ensureCreateCatalogLoaded = useCallback(async () => {
    if (!initialData.filterCatalogDeferred) {
      setCreateCatalogReady(true);
      return;
    }

    setCreateCatalogLoading(true);
    setCreateCatalogError(null);

    const needsStudents = !studentCatalogLoaded;
    const needsTeachers = !teacherCatalogLoaded && (!initialData.teacherLocked || teachers.length === 0);

    try {
      const [studentCatalog, teacherCatalog] = await Promise.all([
        needsStudents
          ? fetch("/api/schedule/options?entity=students&limit=50", { cache: "no-store" }).then((response) =>
              parseScheduleApiResponse<ScheduleFilterCatalogResponse>(response)
            )
          : Promise.resolve<ScheduleFilterCatalogResponse>({ students: [], teachers: [] }),
        needsTeachers
          ? fetch("/api/schedule/options?entity=teachers&limit=50", { cache: "no-store" }).then((response) =>
              parseScheduleApiResponse<ScheduleFilterCatalogResponse>(response)
            )
          : Promise.resolve<ScheduleFilterCatalogResponse>({ students: [], teachers: [] })
      ]);

      if (studentCatalog.students.length > 0) {
        setStudents((current) => mergeOptions(current, studentCatalog.students));
      }
      if (teacherCatalog.teachers.length > 0) {
        setTeachers((current) => mergeOptions(current, teacherCatalog.teachers));
      }
      if (needsStudents) {
        setStudentCatalogRequested(true);
        setStudentCatalogLoaded(true);
      }
      if (needsTeachers) {
        setTeacherCatalogRequested(true);
        setTeacherCatalogLoaded(true);
      }
      setCreateCatalogReady(true);
    } catch (error) {
      setCreateCatalogReady(false);
      setCreateCatalogError(error instanceof Error ? error.message : "Не удалось загрузить список учеников и преподавателей");
    } finally {
      setCreateCatalogLoading(false);
    }
  }, [
    initialData.filterCatalogDeferred,
    initialData.teacherLocked,
    studentCatalogLoaded,
    teacherCatalogLoaded,
    teachers.length
  ]);

  useEffect(() => {
    if (!initialData.filterCatalogDeferred) return;

    void ensureCreateCatalogLoaded();
  }, [ensureCreateCatalogLoaded, initialData.filterCatalogDeferred]);

  const {
    activeFollowupLesson,
    followupDrawerOpen,
    followupSnapshot,
    followupState,
    homeworkTestOptions,
    homeworkTestOptionsLoading,
    handleFollowupSubmit,
    loadHomeworkTestOptions,
    openFollowupDrawer,
    showAllHomeworkLevels,
    setActiveFollowupLesson,
    setFollowupDrawerOpen,
    setFollowupState,
    setShowAllHomeworkLevels
  } = useLessonFollowupState({
    clearActionError,
    runMutation,
    setActionError,
    refreshLessons,
    referenceNow
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runMutation({
      onStart: clearActionError,
      onError: (error) => {
        setActionError(error instanceof Error ? error.message : "Не удалось сохранить урок");
      },
      action: async () => {
        const startsAt = composeIsoDateTime(formState.date, formState.startTime);
        const endsAt = composeIsoDateTime(formState.date, formState.endTime);
        const payload = {
          studentId: formState.studentId,
          teacherId: formState.teacherId,
          title: formState.title,
          startsAt,
          endsAt,
          meetingUrl: formState.meetingUrl || null,
          comment: formState.comment || null,
          status: formState.status
        };

        const response = await fetch(formState.id ? `/api/schedule/${formState.id}` : "/api/schedule", {
          method: formState.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        await parseScheduleApiResponse(response);
      },
      onSuccess: async () => {
        setDrawerOpen(false);
        await refreshLessons();
      }
    });
  };

  const handleStatusAction = async (lesson: StaffScheduleLessonDto, action: "completed" | "canceled") => {
    await runMutation({
      onStart: clearActionError,
      onError: (error) => {
        setActionError(error instanceof Error ? error.message : "Не удалось обновить статус урока");
      },
      action: async () => {
        const response =
          action === "canceled"
            ? await fetch(`/api/schedule/${lesson.id}`, { method: "DELETE" })
            : await fetch(`/api/schedule/${lesson.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" })
              });
        await parseScheduleApiResponse(response);
      },
      onSuccess: async () => {
        await refreshLessons();
      }
    });
  };

  return {
    actionError,
    activeFollowupLesson,
    createCatalogError,
    createCatalogLoading,
    createCatalogReady,
    drawerOpen,
    filters,
    followupDrawerOpen,
    followupSnapshot,
    followupState,
    homeworkTestOptions,
    homeworkTestOptionsLoading,
    formState,
    groupedLessons,
    handleFollowupSubmit,
    loadHomeworkTestOptions,
    handleStatusAction,
    handleSubmit,
    initialData,
    isLoading,
    lessons,
    openCreateDrawer,
    openEditDrawer,
    ensureStudentCatalogLoaded,
    ensureTeacherCatalogLoaded,
    openFollowupDrawer,
    showAllHomeworkLevels,
    referenceNow,
    saving,
    scheduledCount,
    students,
    teachers,
    setActionError,
    setDrawerOpen,
    setFilters,
    setFollowupDrawerOpen,
    setFollowupState,
    setShowAllHomeworkLevels,
    setFormState,
    setActiveFollowupLesson
  };
}

function mergeOptions<T extends { id: string }>(scoped: T[], catalog: T[]) {
  const itemsById = new Map<string, T>();

  for (const item of catalog) {
    itemsById.set(item.id, item);
  }

  for (const item of scoped) {
    itemsById.set(item.id, item);
  }

  return Array.from(itemsById.values());
}
