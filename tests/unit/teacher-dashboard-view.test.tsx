import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TeacherDashboardView from "@/app/(workspace)/(shared-zone)/dashboard/teacher-dashboard-view";
import type { TeacherDashboardData } from "@/lib/teacher-workspace/types";

function makeData(overrides: Partial<TeacherDashboardData> = {}): TeacherDashboardData {
  return {
    todayLessons: [
      {
        id: "lesson-today-1",
        studentId: "student-1",
        studentName: "Анна Иванова",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Speaking warm-up",
        startsAt: "2026-03-27T10:00:00.000Z",
        endsAt: "2026-03-27T10:45:00.000Z",
        meetingUrl: "https://example.com/today-1",
        comment: null,
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      },
      {
        id: "lesson-today-2",
        studentId: "student-2",
        studentName: "Иван Смирнов",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Grammar sprint",
        startsAt: "2026-03-27T12:00:00.000Z",
        endsAt: "2026-03-27T12:45:00.000Z",
        meetingUrl: "https://example.com/today-2",
        comment: null,
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      }
    ],
    weekLessons: [
      {
        id: "lesson-week-1",
        studentId: "student-3",
        studentName: "Ольга Сергеева",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Vocabulary drill",
        startsAt: "2026-03-28T09:00:00.000Z",
        endsAt: "2026-03-28T09:45:00.000Z",
        meetingUrl: "https://example.com/week-1",
        comment: null,
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      },
      {
        id: "lesson-week-2",
        studentId: "student-4",
        studentName: "Дмитрий Орлов",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Interview prep",
        startsAt: "2026-03-29T14:00:00.000Z",
        endsAt: "2026-03-29T14:45:00.000Z",
        meetingUrl: "https://example.com/week-2",
        comment: null,
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      }
    ],
    students: [
      {
        studentId: "student-1",
        studentName: "Анна Иванова",
        englishLevel: "A2",
        targetLevel: "B1",
        nextLessonAt: "2026-03-27T10:00:00.000Z",
        activeHomeworkCount: 2
      }
    ],
    ...overrides
  };
}

describe("TeacherDashboardView", () => {
  it("renders lesson sections together with follow-up attention block", () => {
    render(<TeacherDashboardView data={makeData()} />);

    expect(screen.getByRole("heading", { name: "Нужно заполнить итог" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Сегодня" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Эта неделя" })).toBeInTheDocument();

    const todayGrid = screen.getByTestId("teacher-dashboard-grid-Сегодня");
    const weekGrid = screen.getByTestId("teacher-dashboard-grid-Эта неделя");

    expect(todayGrid.className).toContain("grid");
    expect(todayGrid.className).toContain("lg:grid-cols-2");
    expect(todayGrid.className).toContain("xl:grid-cols-3");
    expect(weekGrid.className).toContain("grid");
    expect(weekGrid.className).toContain("lg:grid-cols-2");
    expect(weekGrid.className).toContain("xl:grid-cols-3");

    expect(screen.getByText("Speaking warm-up")).toBeInTheDocument();
    expect(screen.getByText("Grammar sprint")).toBeInTheDocument();
    expect(screen.getByText("Vocabulary drill")).toBeInTheDocument();
    expect(screen.getByText("Interview prep")).toBeInTheDocument();
  });

  it("shows completed lessons without outcome in the follow-up attention block", () => {
    render(
      <TeacherDashboardView
        data={makeData({
          todayLessons: [
            {
              ...makeData().todayLessons[0],
              id: "completed-needs-followup",
              status: "completed",
              hasOutcome: false
            }
          ],
          weekLessons: []
        })}
      />
    );

    expect(screen.getByText("Нужно действие")).toBeInTheDocument();
    expect(screen.getByText("Завершённый урок без сохранённого follow-up")).toBeInTheDocument();
  });

  it("shows setup warning when teacher profile is not linked", () => {
    render(<TeacherDashboardView data={makeData({ todayLessons: [], weekLessons: [], students: [] })} profileLinked={false} />);

    expect(screen.getByText("Профиль преподавателя ещё не привязан")).toBeInTheDocument();
    expect(screen.getByText(/запись в таблице преподавателей ещё не связана/i)).toBeInTheDocument();
  });
});
