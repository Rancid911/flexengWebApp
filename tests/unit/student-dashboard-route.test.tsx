import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderStudentDashboardRoute } from "@/app/(workspace)/_components/student-dashboard-route";

const getStudentDashboardInitialDataMock = vi.fn();
const getStudentDashboardSecondaryDataMock = vi.fn();

vi.mock("@/lib/dashboard/student-dashboard", () => ({
  getStudentDashboardInitialData: (...args: unknown[]) => getStudentDashboardInitialDataMock(...args),
  getStudentDashboardSecondaryData: (...args: unknown[]) => getStudentDashboardSecondaryDataMock(...args)
}));

vi.mock("@/app/(workspace)/(shared-zone)/dashboard/student-dashboard-view", () => ({
  default: ({ data }: { data: unknown }) => <div data-testid="student-dashboard-view">{JSON.stringify(data)}</div>,
  StudentDashboardRecommendationsSection: () => <div data-testid="student-dashboard-recommendations-section" />,
  StudentDashboardScheduleSection: () => <div data-testid="student-dashboard-schedule-section" />,
  StudentDashboardSummaryStatsSection: () => <div data-testid="student-dashboard-summary-stats-section" />
}));

vi.mock("@/app/(workspace)/(shared-zone)/dashboard/student-payment-reminder-slot", () => ({
  default: () => <div data-testid="student-payment-reminder-slot" />
}));

describe("renderStudentDashboardRoute", () => {
  beforeEach(() => {
    getStudentDashboardInitialDataMock.mockReset();
    getStudentDashboardSecondaryDataMock.mockReset();
  });

  it("uses the canonical core-plus-reminder assembly", async () => {
    getStudentDashboardInitialDataMock.mockResolvedValue({
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
    });
    getStudentDashboardSecondaryDataMock.mockResolvedValue({
      recommendationCards: [],
      summaryStats: [],
      nextScheduledLesson: null,
      upcomingScheduleLessons: []
    });

    const result = await renderStudentDashboardRoute();

    expect(getStudentDashboardInitialDataMock).toHaveBeenCalledTimes(1);
    expect(getStudentDashboardSecondaryDataMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });
});
