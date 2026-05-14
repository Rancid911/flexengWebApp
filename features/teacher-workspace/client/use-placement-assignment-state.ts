"use client";

import { useState } from "react";

import type { TeacherStudentPlacementSummaryDto } from "@/lib/teacher-workspace/types";

type UsePlacementAssignmentStateArgs = {
  studentId: string;
  initialPlacementSummary: TeacherStudentPlacementSummaryDto | null;
};

export function usePlacementAssignmentState({ studentId, initialPlacementSummary }: UsePlacementAssignmentStateArgs) {
  const [placementSummary, setPlacementSummary] = useState<TeacherStudentPlacementSummaryDto | null>(initialPlacementSummary);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);

  async function togglePlacementTest() {
    const placementStatus = placementSummary?.status ?? "not_assigned";
    const placementAssigned = placementStatus === "not_started" || placementStatus === "in_progress" || placementStatus === "overdue";
    setPlacementLoading(true);
    setPlacementError(null);
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/placement-assignment`, {
        method: placementAssigned ? "DELETE" : "POST"
      });
      const data = (await response.json()) as TeacherStudentPlacementSummaryDto | { message?: string };
      if (!response.ok) {
        throw new Error(
          "message" in data && typeof data.message === "string"
            ? data.message
            : placementAssigned
              ? "Не удалось отменить placement test"
              : "Не удалось назначить placement test"
        );
      }
      setPlacementSummary(data as TeacherStudentPlacementSummaryDto);
    } catch (error) {
      setPlacementError(error instanceof Error ? error.message : placementAssigned ? "Не удалось отменить placement test" : "Не удалось назначить placement test");
    } finally {
      setPlacementLoading(false);
    }
  }

  return {
    placementError,
    placementLoading,
    placementSummary,
    togglePlacementTest
  };
}
