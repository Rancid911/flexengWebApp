import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardView from "@/app/(workspace)/(shared-zone)/dashboard/student-dashboard-view";
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
      { label: "В изучении", value: "26" }
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
    activeHomeworkCount: 1,
    placementTest: null,
    recommendationCards: [
      {
        id: "rec-1",
        title: "Present Perfect",
        subtitle: "Последняя активность: Present Perfect Drill",
        href: "/practice/topics/grammar-foundations/module-present-perfect"
      }
    ],
    nextBestAction: {
      label: "Важно",
      title: "Сделайте домашнее задание",
      description: "Homework 1 уже ждёт вас. Начните с него, чтобы не копить хвосты.",
      primaryLabel: "Сделать домашнее задание",
      primaryHref: "/homework",
      secondaryLabel: "Открыть практику",
      secondaryHref: "/practice"
    },
    summaryStats: [
      { label: "Онлайн-уроки", value: "3", chip: "за 7 дней", icon: "book", href: "/schedule" },
      { label: "Сделано тестов", value: "4", chip: "за 7 дней", icon: "clipboardCheck", href: "/practice" },
      { label: "Слов в повторении", value: "12", chip: "карточки", icon: "brain", href: "/words/review" }
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
      updatedAt: null,
      attendanceStatus: null,
      hasOutcome: false,
      studentVisibleOutcome: null
    },
    upcomingScheduleLessons: [],
    paymentReminderPopup: null,
    ...overrides
  };
}

describe("StudentDashboardView", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders next-best-action, homework, recommendations and compact next lesson", () => {
    render(<StudentDashboardView data={makeData()} />);

    expect(screen.getByRole("heading", { name: "Следующий шаг" })).toBeInTheDocument();
    expect(screen.getByText("Сделайте домашнее задание")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сделать домашнее задание" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Открыть практику" })).toHaveLength(2);
    expect(screen.queryByText("Что делать дальше")).not.toBeInTheDocument();
    expect(screen.queryByText("Сначала выполните приоритетный шаг")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Домашние задания" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Продолжить обучение" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ближайшие уроки" })).toBeInTheDocument();
    expect(screen.getByText("Онлайн-уроки")).toBeInTheDocument();
    expect(screen.getAllByText("за 7 дней")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Онлайн-уроки/i }));
    expect(pushMock).toHaveBeenCalledWith("/schedule");
    fireEvent.click(screen.getByRole("button", { name: /Сделано тестов/i }));
    expect(pushMock).toHaveBeenCalledWith("/practice");
    fireEvent.click(screen.getByRole("button", { name: /Слов в повторении/i }));
    expect(pushMock).toHaveBeenCalledWith("/words/review");
    expect(screen.queryByRole("heading", { name: "Placement Test" })).not.toBeInTheDocument();
    expect(screen.getByText("Speaking warm-up")).toBeInTheDocument();
    expect(screen.getByText("Время: 13:00 - 13:45")).toBeInTheDocument();
    expect(screen.getByText("Учитель: Мария Петрова")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Подключиться" })).toHaveAttribute("href", "https://example.com/meeting");
    expect(screen.queryByRole("link", { name: "Открыть" })).not.toBeInTheDocument();
    expect(screen.queryByText("Small talk and fluency drills.")).not.toBeInTheDocument();
    expect(screen.queryByText("Все уроки")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Все домашние задания" })).not.toBeInTheDocument();
  });

  it("opens the concrete subtopic when continue-learning card is clicked", () => {
    render(<StudentDashboardView data={makeData()} />);

    fireEvent.click(screen.getByRole("button", { name: /Present Perfect/i }));

    expect(pushMock).toHaveBeenCalledWith("/practice/topics/grammar-foundations/module-present-perfect");
  });

  it("shows compact empty state when next lesson is unavailable", () => {
    render(<StudentDashboardView data={makeData({ nextScheduledLesson: null })} />);

    expect(screen.getByText("Пока уроки не назначены.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Открыть расписание" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "К оплате" })).not.toBeInTheDocument();
  });

  it("shows only two homework cards and CTA to full homework list when more assignments exist", () => {
    render(
      <StudentDashboardView
        data={makeData({
          homeworkCards: [
            {
              id: "hw-1",
              title: "Homework 1",
              subtitle: "Срок: 29 марта",
              status: "В процессе",
              statusTone: "muted"
            },
            {
              id: "hw-2",
              title: "Homework 2",
              subtitle: "Срок: 30 марта",
              status: "Не начато",
              statusTone: "muted"
            }
          ],
          activeHomeworkCount: 3
        })}
      />
    );

    expect(screen.getByText("Homework 1")).toBeInTheDocument();
    expect(screen.getByText("Homework 2")).toBeInTheDocument();
    expect(screen.queryByText("Homework 3")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Все домашние задания" })).toBeInTheDocument();
    expect(screen.getByText("3 активных")).toBeInTheDocument();
  });

  it("shows compact payment reminder slide-up message when reminder data is present", () => {
    render(
      <StudentDashboardView
        data={makeData({
          paymentReminderPopup: {
            status: "debt",
            title: "У вас долг по оплате уроков",
            body: "Сейчас по обучению есть задолженность.",
            availableLessonCount: 0,
            debtLessonCount: 1,
            debtMoneyAmount: 1800,
            nextScheduledLessonAt: "2026-03-28T10:00:00.000Z"
          }
        })}
      />
    );

    expect(screen.getByText("Напоминание")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Есть задолженность" })).toBeInTheDocument();
    expect(screen.getByText(/Задолженность:\s*1 урок\s*·\s*1\s?800\s?₽/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "К оплате" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Закрыть напоминание" })).toBeInTheDocument();
  });

  it("does not render a dedicated placement card when placement test is assigned", () => {
    render(
      <StudentDashboardView
        data={makeData({
          nextBestAction: {
            label: "Важно",
            title: "Пройдите тест на уровень",
            description: "Преподаватель назначил диагностический тест.",
            primaryLabel: "Пройти тест на уровень",
            primaryHref: "/practice/activity/test_placement"
          },
          homeworkCards: [],
          activeHomeworkCount: 0,
          placementTest: {
            assigned: true,
            completed: false,
            title: "Placement Test",
            subtitle: "Диагностический тест уровня назначен отдельно от домашнего задания.",
            href: "/practice/activity/test_placement",
            status: "Назначен",
            statusTone: "muted"
          }
        })}
      />
    );

    expect(screen.queryByRole("heading", { name: "Placement Test" })).not.toBeInTheDocument();
    expect(screen.queryByText("Диагностический тест уровня назначен отдельно от домашнего задания.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Пройти тест на уровень" })).toBeInTheDocument();
    expect(screen.getByText("Активных домашних заданий пока нет.")).toBeInTheDocument();
  });
});
