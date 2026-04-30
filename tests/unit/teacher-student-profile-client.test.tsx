import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TeacherStudentProfileClient } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-client";
import type { TeacherStudentHomeworkDto, TeacherStudentNoteDto, TeacherStudentPlacementSummaryDto } from "@/lib/teacher-workspace/types";
import type { StudentBillingSummary } from "@/lib/billing/types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeBillingSummary(overrides: Partial<StudentBillingSummary> = {}): StudentBillingSummary {
  return {
    studentId: "student-1",
    account: null,
    currentMode: null,
    currency: "RUB",
    lessonPriceAmount: null,
    effectiveLessonPriceAmount: null,
    effectiveLessonPriceCurrency: null,
    availableLessonCount: 0,
    moneyRemainderAmount: 0,
    debtLessonCount: 0,
    remainingLessonUnits: 0,
    remainingMoneyAmount: 0,
    debtLessonUnits: 0,
    debtMoneyAmount: 0,
    isNegative: false,
    hasAccount: false,
    recentEntries: [],
    ...overrides
  };
}

function makePlacementSummary(overrides: Partial<TeacherStudentPlacementSummaryDto> = {}): TeacherStudentPlacementSummaryDto {
  return {
    assignmentId: "assignment-1",
    status: "completed",
    testId: "test-1",
    title: "Placement Test",
    attemptId: "attempt-1",
    score: 78,
    recommendedLevel: "B1",
    recommendedBandLabel: "Upper Intermediate",
    submittedAt: "2026-04-11T10:00:00.000Z",
    ...overrides
  };
}

function makeStandaloneHomework(overrides: Partial<TeacherStudentHomeworkDto> = {}): TeacherStudentHomeworkDto {
  return {
    id: "homework-1",
    title: "Modal Verbs Homework",
    description: "Повторить модальные глаголы и пройти drill.",
    status: "not_started",
    dueAt: "2026-04-12T10:00:00.000Z",
    completedAt: null,
    createdAt: "2026-04-11T10:00:00.000Z",
    linkedLessonId: null,
    requiredCount: 1,
    completedRequiredCount: 0,
    items: [
      {
        id: "item-1",
        sourceType: "test",
        sourceId: "test-1",
        title: "Modal Verbs Drill",
        activityType: "trainer",
        assessmentKind: "regular",
        status: "not_started",
        required: true,
        lastScore: null,
        lastSubmittedAt: null,
        recommendedLevel: null,
        recommendedBandLabel: null,
        placementSummary: null
      }
    ],
    ...overrides
  };
}

describe("TeacherStudentProfileClient", () => {
  it("hides billing for teacher-facing profile view", () => {
    render(
      <TeacherStudentProfileClient
        studentId="student-1"
        initialNotes={[]}
        initialPlacementSummary={null}
        initialStandaloneHomework={[]}
        initialBillingSummary={makeBillingSummary()}
        billingSummaryDeferred={false}
        canWriteNotes
        canManageBilling={false}
        canAssignPlacement
        canAssignHomework
        detailBasePath="/students/student-1"
      />
    );

    expect(screen.queryByRole("heading", { name: "Оплата и списания" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Заметки преподавателя" })).toBeInTheDocument();
  });

  it("shows full money balance in admin billing summary", () => {
    render(
      <TeacherStudentProfileClient
        studentId="student-1"
        initialNotes={[] satisfies TeacherStudentNoteDto[]}
        initialPlacementSummary={null}
        initialStandaloneHomework={[]}
        initialBillingSummary={makeBillingSummary({
          account: {
            id: "account-1",
            studentId: "student-1",
            billingMode: "per_lesson_price",
            lessonPriceAmount: 1800,
            currency: "RUB",
            createdAt: null,
            updatedAt: null
          },
          currentMode: "per_lesson_price",
          currency: "RUB",
          lessonPriceAmount: 1800,
          effectiveLessonPriceAmount: 1800,
          effectiveLessonPriceCurrency: "RUB",
          availableLessonCount: 5,
          moneyRemainderAmount: 1000,
          remainingLessonUnits: 0,
          remainingMoneyAmount: 10000,
          isNegative: false,
          hasAccount: true
        })}
        billingSummaryDeferred={false}
        canWriteNotes
        canManageBilling
        canAssignPlacement
        canAssignHomework
        detailBasePath="/admin/students/student-1"
      />
    );

    expect(screen.getByText("На балансе: 10 000 ₽")).toBeInTheDocument();
  });

  it("renders placement card in a compact format with inline result summary", () => {
    render(
      <TeacherStudentProfileClient
        studentId="student-1"
        initialNotes={[]}
        initialPlacementSummary={makePlacementSummary()}
        initialStandaloneHomework={[]}
        initialBillingSummary={makeBillingSummary()}
        billingSummaryDeferred={false}
        canWriteNotes
        canManageBilling={false}
        canAssignPlacement
        canAssignHomework
        detailBasePath="/students/student-1"
      />
    );

    expect(screen.getByRole("heading", { name: "Placement test" })).toBeInTheDocument();
    const statusBadge = screen.getByText("Завершён");
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass("bg-[#eef5ff]", "text-[#1f7aff]");
    expect(statusBadge).not.toHaveClass("bg-[#ede9fe]", "text-[#6d28d9]");
    expect(screen.getByText("Результат: 78% · B1 · Upper Intermediate")).toBeInTheDocument();
    const assignButton = screen.getByRole("button", { name: "Назначить placement test" });
    expect(assignButton).toBeInTheDocument();
    expect(assignButton).toHaveClass("bg-[#1f7aff]", "hover:bg-[#1669db]", "disabled:bg-[#bfdbfe]");
    expect(assignButton).not.toHaveClass("bg-[#7c3aed]", "hover:bg-[#6d28d9]", "disabled:bg-[#c4b5fd]");
    expect(screen.queryByText("Диагностический тест уровня, который можно назначить ученику одной кнопкой.")).not.toBeInTheDocument();
  });

  it("lets users cancel an active placement assignment from the same bright action button", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          assignmentId: null,
          status: "not_assigned",
          testId: "test-1",
          title: "Placement Test",
          attemptId: null,
          score: null,
          recommendedLevel: null,
          recommendedBandLabel: null,
          submittedAt: null
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeacherStudentProfileClient
        studentId="student-1"
        initialNotes={[]}
        initialPlacementSummary={makePlacementSummary({
          status: "not_started",
          attemptId: null,
          score: null,
          recommendedLevel: null,
          recommendedBandLabel: null,
          submittedAt: null
        })}
        initialStandaloneHomework={[]}
        initialBillingSummary={makeBillingSummary()}
        billingSummaryDeferred={false}
        canWriteNotes
        canManageBilling={false}
        canAssignPlacement
        canAssignHomework
        detailBasePath="/students/student-1"
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Отменить" });
    expect(cancelButton).toBeEnabled();
    expect(cancelButton).toHaveClass("bg-[#1f7aff]", "hover:bg-[#1669db]");

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/students/student-1/placement-assignment", { method: "DELETE" });
    });
    expect(await screen.findByRole("button", { name: "Назначить placement test" })).toBeInTheDocument();
    expect(screen.getByText("Не назначен")).toBeInTheDocument();
  });

  it("renders standalone homework card with current assignments", () => {
    render(
      <TeacherStudentProfileClient
        studentId="student-1"
        initialNotes={[]}
        initialPlacementSummary={null}
        initialStandaloneHomework={[makeStandaloneHomework()]}
        initialBillingSummary={makeBillingSummary()}
        billingSummaryDeferred={false}
        canWriteNotes
        canManageBilling={false}
        canAssignPlacement
        canAssignHomework
        detailBasePath="/students/student-1"
      />
    );

    expect(screen.getByRole("heading", { name: "Домашнее задание" })).toBeInTheDocument();
    expect(screen.getByText("Modal Verbs Homework")).toBeInTheDocument();
    expect(screen.getByText("Modal Verbs Drill")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Назначить домашнее задание" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все домашние задания" })).toHaveAttribute("href", "/students/student-1/homework");
  });
});
