import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StudentDashboardView from "@/app/(dashboard)/dashboard/student-dashboard-view";
import type { StudentDashboardData } from "@/lib/dashboard/student-dashboard";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

function makeData(overrides: Partial<StudentDashboardData> = {}): StudentDashboardData {
  return {
    lessonOfTheDay: {
      title: "Grammar Foundations",
      description: "Описание урока дня",
      duration: "25 минут",
      progress: 40,
      sectionsCount: 3
    },
    progress: {
      value: 65,
      label: "Прогресс по теме"
    },
    heroStats: [
      { label: "Точность", value: "91%" },
      { label: "Попыток", value: "8" },
      { label: "Слов", value: "26" }
    ],
    homeworkCards: [
      {
        id: "hw-1",
        title: "Homework 1",
        subtitle: "Срок: 29 марта",
        status: "В процессе",
        statusTone: "muted"
      }
    ],
    recommendationCards: [
      {
        id: "rec-1",
        title: "Повторить Present Perfect",
        subtitle: "Найдено ошибок: 3"
      }
    ],
    summaryStats: [
      { label: "Сегодня", value: "18 мин", chip: "активность", icon: "sparkles" },
      { label: "Сделано тестов", value: "4", chip: "за всё время", icon: "book" },
      { label: "Слов в повторении", value: "12", chip: "карточки", icon: "brain" }
    ],
    nextScheduledLesson: {
      id: "lesson-1",
      studentId: "student-1",
      studentName: "Анна Иванова",
      teacherId: "teacher-1",
      teacherName: "Мария Петрова",
      title: "Speaking warm-up",
      startsAt: "2026-03-28T10:00:00.000Z",
      endsAt: "2026-03-28T10:45:00.000Z",
      meetingUrl: "https://example.com/meeting",
      comment: "Small talk and fluency drills.",
      status: "scheduled",
      createdAt: null,
      updatedAt: null
    },
    upcomingScheduleLessons: [],
    ...overrides
  };
}

describe("StudentDashboardView", () => {
  it("renders homework, recommendations and compact next lesson in one dashboard row", () => {
    render(<StudentDashboardView data={makeData()} />);

    expect(screen.getByRole("heading", { name: "Домашние задания" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Рекомендовано" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ближайшие уроки" })).toBeInTheDocument();
    expect(screen.getByText("Speaking warm-up")).toBeInTheDocument();
    expect(screen.getByText("Учитель: Мария Петрова")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Подключиться" })).toHaveAttribute("href", "https://example.com/meeting");
    expect(screen.queryByRole("link", { name: "Открыть" })).not.toBeInTheDocument();
    expect(screen.queryByText("13:00 - 13:45")).not.toBeInTheDocument();
    expect(screen.queryByText("Small talk and fluency drills.")).not.toBeInTheDocument();
    expect(screen.queryByText("Все уроки")).not.toBeInTheDocument();
  });

  it("shows compact empty state when next lesson is unavailable", () => {
    render(<StudentDashboardView data={makeData({ nextScheduledLesson: null })} />);

    expect(screen.getByText("Пока уроки не назначены.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Открыть расписание" })).not.toBeInTheDocument();
  });
});
