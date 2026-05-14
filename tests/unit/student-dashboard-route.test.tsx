import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderStudentDashboardRoute } from "@/features/dashboard/server/student-dashboard-route";

const getStudentDashboardRouteDataMock = vi.fn();

vi.mock("@/lib/dashboard/student-dashboard", () => ({
  getStudentDashboardRouteData: (...args: unknown[]) => getStudentDashboardRouteDataMock(...args)
}));

vi.mock("@/features/dashboard/components/student-dashboard-view", () => ({
  default: ({ data, recommendationsSlot, scheduleSlot, summaryStatsSlot }: { data: unknown; recommendationsSlot?: React.ReactNode; scheduleSlot?: React.ReactNode; summaryStatsSlot?: React.ReactNode }) => (
    <div data-testid="student-dashboard-view">
      {JSON.stringify(data)}
      {recommendationsSlot}
      {scheduleSlot}
      {summaryStatsSlot}
    </div>
  ),
  StudentDashboardRecommendationsSection: ({ recommendationCards }: { recommendationCards?: unknown[] }) => (
    <div data-testid="student-dashboard-recommendations-section">{JSON.stringify(recommendationCards ?? [])}</div>
  ),
  StudentDashboardScheduleSection: ({ nextScheduledLesson }: { nextScheduledLesson?: unknown }) => (
    <div data-testid="student-dashboard-schedule-section">{JSON.stringify(nextScheduledLesson ?? null)}</div>
  ),
  StudentDashboardSummaryStatsSection: ({ summaryStats }: { summaryStats?: unknown[] }) => (
    <div data-testid="student-dashboard-summary-stats-section">{JSON.stringify(summaryStats ?? [])}</div>
  )
}));

vi.mock("@/features/dashboard/components/student-payment-reminder-slot", () => ({
  default: () => <div data-testid="student-payment-reminder-slot" />
}));

describe("renderStudentDashboardRoute", () => {
  beforeEach(() => {
    getStudentDashboardRouteDataMock.mockReset();
  });

  it("uses the canonical core-plus-reminder assembly", async () => {
    const secondaryDataPromise = Promise.resolve({
      recommendationCards: [{ id: "rec-1", title: "Practice", subtitle: "Continue", href: "/practice" }],
      summaryStats: [{ label: "Онлайн-уроки", value: "1", chip: "за 7 дней", icon: "book", href: "/schedule" }],
      nextScheduledLesson: { id: "lesson-1", title: "Lesson" },
      upcomingScheduleLessons: []
    });
    getStudentDashboardRouteDataMock.mockResolvedValue({
      initialData: {
      lessonOfTheDay: { title: "Lesson", description: "Desc", duration: "20 минут", progress: 50, sectionsCount: 3 },
      progress: { value: 60, label: "6 из 10" },
      heroStats: [],
      homeworkCards: [],
      activeHomeworkCount: 0,
      recommendationCards: [],
      nextBestAction: {
        label: "Старт",
        title: "Продолжите обучение",
        description: "Описание",
        primaryLabel: "Открыть практику",
        primaryHref: "/practice"
      },
      summaryStats: [],
      nextScheduledLesson: null,
      upcomingScheduleLessons: []
      },
      secondaryDataPromise
    });

    const result = await renderStudentDashboardRoute();

    expect(getStudentDashboardRouteDataMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });
});
