"use client";

import { useMemo, useState } from "react";

import type { TeacherAssignableTestOptionDto, TeacherStudentHomeworkDto } from "@/lib/teacher-workspace/types";

type UseStandaloneHomeworkStateArgs = {
  initialStandaloneHomework: TeacherStudentHomeworkDto[];
  studentId: string;
};

export function useStandaloneHomeworkState({ initialStandaloneHomework, studentId }: UseStandaloneHomeworkStateArgs) {
  const [standaloneHomework, setStandaloneHomework] = useState<TeacherStudentHomeworkDto[]>(initialStandaloneHomework);
  const [homeworkDrawerOpen, setHomeworkDrawerOpen] = useState(false);
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);
  const [homeworkOptionsLoading, setHomeworkOptionsLoading] = useState(false);
  const [homeworkOptions, setHomeworkOptions] = useState<TeacherAssignableTestOptionDto[]>([]);
  const [homeworkSearch, setHomeworkSearch] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [homeworkDueAt, setHomeworkDueAt] = useState("");
  const [selectedHomeworkActivityIds, setSelectedHomeworkActivityIds] = useState<string[]>([]);

  async function refreshStandaloneHomework() {
    const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/homework-assignments`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as { assignments?: TeacherStudentHomeworkDto[]; message?: string };
    if (!response.ok) {
      throw new Error(typeof payload.message === "string" ? payload.message : "Не удалось загрузить homework assignments");
    }
    setStandaloneHomework(Array.isArray(payload.assignments) ? payload.assignments : []);
  }

  async function openHomeworkDrawer() {
    setHomeworkDrawerOpen(true);
    setHomeworkError(null);
    setHomeworkSearch("");
    setHomeworkTitle("");
    setHomeworkDescription("");
    setHomeworkDueAt("");
    setSelectedHomeworkActivityIds([]);

    if (homeworkOptions.length > 0 || homeworkOptionsLoading) {
      return;
    }

    setHomeworkOptionsLoading(true);
    try {
      const response = await fetch(`/api/schedule/followup-test-options?studentId=${encodeURIComponent(studentId)}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as TeacherAssignableTestOptionDto[] | { message?: string };
      if (!response.ok) {
        throw new Error("message" in payload && typeof payload.message === "string" ? payload.message : "Не удалось загрузить список материалов");
      }
      setHomeworkOptions((Array.isArray(payload) ? payload : []).filter((item) => item.assessmentKind !== "placement"));
    } catch (error) {
      setHomeworkError(error instanceof Error ? error.message : "Не удалось загрузить список материалов");
    } finally {
      setHomeworkOptionsLoading(false);
    }
  }

  async function assignStandaloneHomework() {
    if (selectedHomeworkActivityIds.length === 0) return;

    setHomeworkLoading(true);
    setHomeworkError(null);
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/homework-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: homeworkTitle || null,
          description: homeworkDescription || null,
          dueAt: homeworkDueAt ? new Date(homeworkDueAt).toISOString() : null,
          activityIds: selectedHomeworkActivityIds
        })
      });
      const payload = (await response.json()) as TeacherStudentHomeworkDto | { message?: string };
      if (!response.ok) {
        throw new Error("message" in payload && typeof payload.message === "string" ? payload.message : "Не удалось назначить домашнее задание");
      }
      await refreshStandaloneHomework();
      setHomeworkDrawerOpen(false);
    } catch (error) {
      setHomeworkError(error instanceof Error ? error.message : "Не удалось назначить домашнее задание");
    } finally {
      setHomeworkLoading(false);
    }
  }

  const filteredHomeworkOptions = useMemo(() => {
    const normalizedQuery = homeworkSearch.trim().toLowerCase();
    if (normalizedQuery === "") return homeworkOptions;
    return homeworkOptions.filter((option) => {
      const summary = `${option.title} ${option.cefrLevel ?? ""} ${option.drillTopicKey ?? ""} ${option.drillKind ?? ""}`.toLowerCase();
      return summary.includes(normalizedQuery);
    });
  }, [homeworkOptions, homeworkSearch]);

  return {
    assignStandaloneHomework,
    filteredHomeworkOptions,
    homeworkDescription,
    homeworkDrawerOpen,
    homeworkDueAt,
    homeworkError,
    homeworkLoading,
    homeworkOptionsLoading,
    homeworkSearch,
    homeworkTitle,
    openHomeworkDrawer,
    selectedHomeworkActivityIds,
    setHomeworkDescription,
    setHomeworkDrawerOpen,
    setHomeworkDueAt,
    setHomeworkSearch,
    setHomeworkTitle,
    setSelectedHomeworkActivityIds,
    standaloneHomework
  };
}
