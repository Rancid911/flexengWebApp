import { beforeEach, describe, expect, it, vi } from "vitest";

import ProgressHistoryPage from "@/app/(workspace)/(shared-zone)/progress/history/page";
import ProgressOverviewPage from "@/app/(workspace)/(shared-zone)/progress/overview/page";
import ProgressTopicsPage from "@/app/(workspace)/(shared-zone)/progress/topics/page";
import ProgressWeakPointsPage from "@/app/(workspace)/(shared-zone)/progress/weak-points/page";

const getProgressByTopicsMock = vi.fn();
const getProgressHistoryMock = vi.fn();
const getProgressOverviewMock = vi.fn();
const getWeakPointsMock = vi.fn();
const measureServerTimingMock = vi.fn(async (_label: string, callback: () => Promise<unknown>) => callback());

vi.mock("@/features/progress/components/progress-history", () => ({
  ProgressHistory: (props: unknown) => <div data-testid="progress-history-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/progress/components/progress-overview", () => ({
  ProgressOverview: (props: unknown) => <div data-testid="progress-overview-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/progress/components/progress-topics", () => ({
  ProgressTopics: (props: unknown) => <div data-testid="progress-topics-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/progress/components/progress-weak-points", () => ({
  ProgressWeakPoints: (props: unknown) => <div data-testid="progress-weak-points-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/progress/queries", () => ({
  getProgressByTopics: (...args: unknown[]) => getProgressByTopicsMock(...args),
  getProgressHistory: (...args: unknown[]) => getProgressHistoryMock(...args),
  getProgressOverview: (...args: unknown[]) => getProgressOverviewMock(...args),
  getWeakPoints: (...args: unknown[]) => getWeakPointsMock(...args)
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: (...args: [string, () => Promise<unknown>]) => measureServerTimingMock(...args)
}));

describe("progress routes", () => {
  beforeEach(() => {
    getProgressByTopicsMock.mockReset();
    getProgressHistoryMock.mockReset();
    getProgressOverviewMock.mockReset();
    getWeakPointsMock.mockReset();
    measureServerTimingMock.mockClear();
  });

  it("assembles overview through the expected timing label", async () => {
    const overview = { completedLessons: 2, totalAttempts: 4, averageScore: 86, weakPoints: 1 };
    getProgressOverviewMock.mockResolvedValue(overview);

    const result = await ProgressOverviewPage();

    expect(measureServerTimingMock).toHaveBeenCalledWith("progress-overview-route-data", expect.any(Function));
    expect(getProgressOverviewMock).toHaveBeenCalledTimes(1);
    expect(result.props.overview).toBe(overview);
  });

  it("assembles topics through the expected timing label", async () => {
    const topics = [{ id: "topic-1", title: "Grammar", progressPercent: 60 }];
    getProgressByTopicsMock.mockResolvedValue(topics);

    const result = await ProgressTopicsPage();

    expect(measureServerTimingMock).toHaveBeenCalledWith("progress-topics-route-data", expect.any(Function));
    expect(getProgressByTopicsMock).toHaveBeenCalledTimes(1);
    expect(result.props.topics).toBe(topics);
  });

  it("assembles history from the progress history loader", async () => {
    const history = [{ id: "attempt-1", title: "Test" }];
    getProgressHistoryMock.mockResolvedValue(history);

    const result = await ProgressHistoryPage();

    expect(getProgressHistoryMock).toHaveBeenCalledTimes(1);
    expect(result.props.history).toBe(history);
  });

  it("assembles weak points from the weak points loader", async () => {
    const weakPoints = [{ id: "weak-1", title: "Articles", count: 3 }];
    getWeakPointsMock.mockResolvedValue(weakPoints);

    const result = await ProgressWeakPointsPage();

    expect(getWeakPointsMock).toHaveBeenCalledTimes(1);
    expect(result.props.weakPoints).toBe(weakPoints);
  });
});
