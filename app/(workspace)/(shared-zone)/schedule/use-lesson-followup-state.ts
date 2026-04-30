"use client";

import { useState, type FormEvent } from "react";

import type { TeacherAssignableTestOptionDto, TeacherLessonFollowupDto } from "@/lib/teacher-workspace/types";
import type { StaffScheduleLessonDto, LessonAttendanceStatus } from "@/lib/schedule/types";
import { hasLessonEnded } from "@/lib/schedule/utils";

import { parseScheduleApiResponse } from "./use-staff-schedule-query-state";

export type LessonFollowupFormState = {
  lessonId: string | null;
  attendanceStatus: LessonAttendanceStatus;
  summary: string;
  coveredTopics: string;
  mistakesSummary: string;
  nextSteps: string;
  visibleToStudent: boolean;
  homeworkTitle: string;
  homeworkDescription: string;
  homeworkDueAt: string;
  homeworkTestIds: string[];
};

export function buildFollowupState(lesson: StaffScheduleLessonDto, followup?: TeacherLessonFollowupDto | null): LessonFollowupFormState {
  const defaultAttendanceStatus =
    followup?.attendance?.status ?? lesson.attendanceStatus ?? (hasLessonEnded(lesson.endsAt) ? "completed" : "scheduled");

  return {
    lessonId: lesson.id,
    attendanceStatus: defaultAttendanceStatus,
    summary: followup?.outcome?.summary ?? "",
    coveredTopics: followup?.outcome?.coveredTopics ?? "",
    mistakesSummary: followup?.outcome?.mistakesSummary ?? "",
    nextSteps: followup?.outcome?.nextSteps ?? "",
    visibleToStudent: followup?.outcome?.visibleToStudent ?? true,
    homeworkTitle: followup?.homeworkAssignment?.title ?? "",
    homeworkDescription: followup?.homeworkAssignment?.description ?? "",
    homeworkDueAt: followup?.homeworkAssignment?.dueAt ?? "",
    homeworkTestIds: followup?.homeworkAssignment?.testIds ?? []
  };
}

type UseLessonFollowupStateParams = {
  clearActionError: () => void;
  runMutation: <T>(options: {
    onStart?: () => void;
    onError?: (error: unknown) => void;
    action: () => Promise<T>;
    onSuccess?: (result: T) => void | Promise<void>;
  }) => Promise<T | null>;
  setActionError: (message: string) => void;
  refreshLessons: () => Promise<void>;
  referenceNow: Date;
};

export function useLessonFollowupState({
  clearActionError,
  runMutation,
  setActionError,
  refreshLessons,
  referenceNow
}: UseLessonFollowupStateParams) {
  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [activeFollowupLesson, setActiveFollowupLesson] = useState<StaffScheduleLessonDto | null>(null);
  const [followupSnapshot, setFollowupSnapshot] = useState<TeacherLessonFollowupDto | null>(null);
  const [homeworkTestOptions, setHomeworkTestOptions] = useState<TeacherAssignableTestOptionDto[]>([]);
  const [homeworkTestOptionsLoading, setHomeworkTestOptionsLoading] = useState(false);
  const [showAllHomeworkLevels, setShowAllHomeworkLevels] = useState(false);
  const [followupState, setFollowupState] = useState<LessonFollowupFormState>({
    lessonId: null,
    attendanceStatus: "completed",
    summary: "",
    coveredTopics: "",
    mistakesSummary: "",
    nextSteps: "",
    visibleToStudent: true,
    homeworkTitle: "",
    homeworkDescription: "",
    homeworkDueAt: "",
    homeworkTestIds: []
  });

  const loadHomeworkTestOptions = async (lesson: StaffScheduleLessonDto, includeAllLevels = false) => {
    setHomeworkTestOptionsLoading(true);
    try {
      const response = await fetch(
        `/api/schedule/followup-test-options?studentId=${encodeURIComponent(lesson.studentId)}&includeAllLevels=${includeAllLevels ? "1" : "0"}`,
        { cache: "no-store" }
      );
      const payload = await parseScheduleApiResponse<TeacherAssignableTestOptionDto[]>(response);
      setHomeworkTestOptions(Array.isArray(payload) ? payload : []);
    } finally {
      setHomeworkTestOptionsLoading(false);
    }
  };

  const openFollowupDrawer = async (lesson: StaffScheduleLessonDto) => {
    await runMutation({
      onStart: clearActionError,
      onError: (error) => {
        setActionError(error instanceof Error ? error.message : "Не удалось загрузить форму итогов урока");
      },
      action: async () => {
        const response = await fetch(`/api/schedule/${lesson.id}/outcome`, { cache: "no-store" });
        return parseScheduleApiResponse<TeacherLessonFollowupDto>(response);
      },
      onSuccess: (payload) => {
        setActiveFollowupLesson(lesson);
        setFollowupSnapshot(payload);
        setShowAllHomeworkLevels(false);
        setFollowupState(buildFollowupState(lesson, payload));
        setFollowupDrawerOpen(true);
        void loadHomeworkTestOptions(lesson, false);
      }
    });
  };

  const handleFollowupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!followupState.lessonId) return;

    if (activeFollowupLesson && followupState.attendanceStatus === "completed" && !hasLessonEnded(activeFollowupLesson.endsAt, referenceNow)) {
      setActionError("Урок можно отметить проведённым только после его окончания. Измените время урока, если он прошёл раньше.");
      return;
    }

    await runMutation({
      onStart: clearActionError,
      onError: (error) => {
        setActionError(error instanceof Error ? error.message : "Не удалось сохранить итоги урока");
      },
      action: async () => {
        const response = await fetch(`/api/schedule/${followupState.lessonId}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceStatus: followupState.attendanceStatus,
            summary: followupState.summary,
            coveredTopics: followupState.coveredTopics || null,
            mistakesSummary: followupState.mistakesSummary || null,
            nextSteps: followupState.nextSteps || null,
            visibleToStudent: followupState.visibleToStudent,
            homeworkTitle: followupState.homeworkTitle || null,
            homeworkDescription: followupState.homeworkDescription || null,
            homeworkDueAt: followupState.homeworkDueAt || null,
            homeworkTestIds: followupState.homeworkTestIds
          })
        });

        return parseScheduleApiResponse<TeacherLessonFollowupDto>(response);
      },
      onSuccess: async (payload) => {
        setFollowupSnapshot(payload);
        if (activeFollowupLesson) {
          setFollowupState(buildFollowupState(activeFollowupLesson, payload));
        }
        setFollowupDrawerOpen(false);
        await refreshLessons();
      }
    });
  };

  return {
    activeFollowupLesson,
    followupDrawerOpen,
    followupSnapshot,
    followupState,
    homeworkTestOptions,
    homeworkTestOptionsLoading,
    openFollowupDrawer,
    handleFollowupSubmit,
    loadHomeworkTestOptions,
    showAllHomeworkLevels,
    setActiveFollowupLesson,
    setFollowupDrawerOpen,
    setFollowupSnapshot,
    setFollowupState,
    setShowAllHomeworkLevels
  };
}
