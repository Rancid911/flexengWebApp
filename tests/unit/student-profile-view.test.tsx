import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { StudentProfileView } from "@/app/(workspace)/_components/student-profile/student-profile-view";
import type { TeacherStudentProfileSections } from "@/lib/teacher-workspace/sections";

vi.mock("@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-client", () => ({
  TeacherStudentProfileClient: (props: {
    detailBasePath: string;
    lessonsSlot?: ReactNode;
    homeworkMistakesSlot?: ReactNode;
    canManageBilling: boolean;
    canAssignPlacement: boolean;
    canAssignHomework: boolean;
    canWriteNotes: boolean;
  }) => (
    <section data-testid="profile-client-probe" data-detail-base-path={props.detailBasePath}>
      <div data-testid="student-profile-left-column">
        {props.lessonsSlot}
        {props.canManageBilling ? <h2>Оплата и списания</h2> : null}
      </div>
      <div data-testid="student-profile-right-column">
        {props.canAssignPlacement ? <h2>Placement test</h2> : null}
        {props.canAssignHomework ? (
          <>
            <h2>Домашнее задание</h2>
            <a href={`${props.detailBasePath}/homework`}>Все домашние задания</a>
          </>
        ) : null}
        {props.canWriteNotes ? (
          <>
            <h2>Заметки преподавателя</h2>
            <a href={`${props.detailBasePath}/notes`}>Все заметки</a>
          </>
        ) : null}
        {props.homeworkMistakesSlot}
      </div>
    </section>
  )
}));

function makeLesson(id: string, title: string) {
  return {
    id,
    studentId: "student-1",
    studentName: "Student One",
    teacherId: "teacher-1",
    teacherName: "Teacher One",
    title,
    startsAt: "2026-04-21T10:00:00.000Z",
    endsAt: "2026-04-21T11:00:00.000Z",
    meetingUrl: null,
    comment: null,
    status: "scheduled" as const,
    createdAt: null,
    updatedAt: null,
    attendanceStatus: null,
    hasOutcome: false,
    studentVisibleOutcome: null
  };
}

function makeSections(): TeacherStudentProfileSections {
  return {
    header: {
      studentId: "student-1",
      studentName: "Student One",
      englishLevel: "A2",
      targetLevel: "B1",
      learningGoal: null
    },
    notes: [],
    upcomingLessons: [makeLesson("upcoming-1", "Future 1"), makeLesson("upcoming-2", "Future 2"), makeLesson("upcoming-3", "Future 3")],
    recentLessons: [makeLesson("recent-1", "Past 1"), makeLesson("recent-2", "Past 2"), makeLesson("recent-3", "Past 3")],
    recentHomework: [],
    standaloneHomework: [],
    placementSummary: null,
    recentMistakes: [
      { id: "mistake-1", count: 3, lastMistakeAt: null, testTitle: "Mistake 1", moduleTitle: null },
      { id: "mistake-2", count: 2, lastMistakeAt: null, testTitle: "Mistake 2", moduleTitle: null },
      { id: "mistake-3", count: 1, lastMistakeAt: null, testTitle: "Mistake 3", moduleTitle: null }
    ],
    billingSnapshot: null,
    billingSummaryDeferred: false
  };
}

describe("StudentProfileView", () => {
  it("keeps profile sections compact and builds admin detail links", () => {
    render(
      <StudentProfileView
        sections={makeSections()}
        canWriteNotes={false}
        canManageBilling={false}
        canAssignPlacement={false}
        canAssignHomework={false}
        backLink={{ href: "/admin/students", label: "Назад" }}
        profileBasePath="/admin/students/student-1"
      />
    );

    expect(screen.getByText("Future 1")).toBeInTheDocument();
    expect(screen.getByText("Future 2")).toBeInTheDocument();
    expect(screen.queryByText("Future 3")).not.toBeInTheDocument();
    expect(screen.getByText("Past 1")).toBeInTheDocument();
    expect(screen.getByText("Past 2")).toBeInTheDocument();
    expect(screen.queryByText("Past 3")).not.toBeInTheDocument();
    expect(screen.getByText("Mistake 1")).toBeInTheDocument();
    expect(screen.getByText("Mistake 2")).toBeInTheDocument();
    expect(screen.queryByText("Mistake 3")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть расписание" })).toHaveAttribute("href", "/admin/students/student-1/schedule");
    expect(screen.getByRole("link", { name: "Все homework" })).toHaveAttribute("href", "/admin/students/student-1/homework");
    expect(screen.getByRole("link", { name: "Все ошибки" })).toHaveAttribute("href", "/admin/students/student-1/mistakes");
    expect(screen.getByTestId("profile-client-probe")).toHaveAttribute("data-detail-base-path", "/admin/students/student-1");
  });

  it("places lessons and billing in the left column and profile work blocks in the right column", () => {
    render(
      <StudentProfileView
        sections={makeSections()}
        canWriteNotes
        canManageBilling
        canAssignPlacement
        canAssignHomework
        backLink={{ href: "/admin/students", label: "Назад" }}
        profileBasePath="/admin/students/student-1"
      />
    );

    const leftColumn = screen.getByTestId("student-profile-left-column");
    const rightColumn = screen.getByTestId("student-profile-right-column");

    expect(within(leftColumn).getByRole("heading", { name: "Уроки" })).toBeInTheDocument();
    expect(within(leftColumn).getByRole("heading", { name: "Оплата и списания" })).toBeInTheDocument();
    expect(within(rightColumn).getByRole("heading", { name: "Placement test" })).toBeInTheDocument();
    expect(within(rightColumn).getByRole("heading", { name: "Домашнее задание" })).toBeInTheDocument();
    expect(within(rightColumn).getByRole("heading", { name: "Заметки преподавателя" })).toBeInTheDocument();
    expect(within(rightColumn).getByRole("heading", { name: "Homework и ошибки" })).toBeInTheDocument();
    expect(within(rightColumn).getByRole("link", { name: "Все домашние задания" })).toHaveAttribute("href", "/admin/students/student-1/homework");
    expect(within(rightColumn).getByRole("link", { name: "Все заметки" })).toHaveAttribute("href", "/admin/students/student-1/notes");
    expect(within(rightColumn).getByRole("link", { name: "Все homework" })).toHaveAttribute("href", "/admin/students/student-1/homework");
    expect(within(rightColumn).getByRole("link", { name: "Все ошибки" })).toHaveAttribute("href", "/admin/students/student-1/mistakes");
  });
});
