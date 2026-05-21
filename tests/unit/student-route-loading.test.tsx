import { beforeEach, describe, expect, it, vi } from "vitest";

import HomeworkPage from "@/app/(workspace)/(shared-zone)/homework/page";
import PracticePage from "@/app/(workspace)/(shared-zone)/practice/page";
import WordsMyPage from "@/app/(workspace)/(shared-zone)/words/my/page";
import WordTopicPage from "@/app/(workspace)/(shared-zone)/words/topics/[topicSlug]/page";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

const getHomeworkOverviewSummaryMock = vi.fn();
const getHomeworkAssignmentsMock = vi.fn();
const getPracticeOverviewSummaryMock = vi.fn();
const getPracticeRecommendedMock = vi.fn();
const getPracticeTopicsMock = vi.fn();
const getWordsOverviewSummaryMock = vi.fn();
const getStudentWordsMock = vi.fn();
const getWordsForReviewMock = vi.fn();
const getNewWordsMock = vi.fn();
const getWordTopicSummariesMock = vi.fn();
const getWordTopicDetailMock = vi.fn();
const requireLayoutActorMock = vi.fn();

vi.mock("@/lib/homework/queries", () => ({
  getHomeworkOverviewSummary: (...args: unknown[]) => getHomeworkOverviewSummaryMock(...args),
  getHomeworkAssignments: (...args: unknown[]) => getHomeworkAssignmentsMock(...args)
}));

vi.mock("@/features/homework/components/homework-overview", () => ({
  HomeworkOverview: ({ summary, items }: { summary: unknown; items: unknown }) => (
    <div data-testid="homework-overview">
      {JSON.stringify({ summary, items })}
    </div>
  ),
  HomeworkFilteredListPage: ({ items }: { items: unknown }) => <div data-testid="homework-filtered-list">{JSON.stringify(items)}</div>
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeOverviewSummary: (...args: unknown[]) => getPracticeOverviewSummaryMock(...args),
  getPracticeRecommended: (...args: unknown[]) => getPracticeRecommendedMock(...args),
  getPracticeTopics: (...args: unknown[]) => getPracticeTopicsMock(...args)
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => requireLayoutActorMock()
}));

vi.mock("@/features/words/components/words-overview", () => ({
  WordsOverview: (props: unknown) => <div data-testid="words-overview-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/words/components/word-topic-detail", () => ({
  WordTopicDetail: (props: unknown) => <div data-testid="word-topic-detail-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/words/queries", () => ({
  getWordsOverviewSummary: (...args: unknown[]) => getWordsOverviewSummaryMock(...args),
  getStudentWords: (...args: unknown[]) => getStudentWordsMock(...args),
  getWordsForReview: (...args: unknown[]) => getWordsForReviewMock(...args),
  getNewWords: (...args: unknown[]) => getNewWordsMock(...args),
  getWordTopicSummaries: (...args: unknown[]) => getWordTopicSummariesMock(...args),
  getWordTopicDetail: (...args: unknown[]) => getWordTopicDetailMock(...args)
}));

describe("student route loading", () => {
  beforeEach(() => {
    getHomeworkOverviewSummaryMock.mockReset();
    getHomeworkAssignmentsMock.mockReset();
    getPracticeOverviewSummaryMock.mockReset();
    getPracticeRecommendedMock.mockReset();
    getPracticeTopicsMock.mockReset();
    getWordsOverviewSummaryMock.mockReset();
    getStudentWordsMock.mockReset();
    getWordsForReviewMock.mockReset();
    getNewWordsMock.mockReset();
    getWordTopicSummariesMock.mockReset();
    getWordTopicDetailMock.mockReset();
    requireLayoutActorMock.mockReset();
    requireLayoutActorMock.mockResolvedValue({ rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} });
    navigationMocks.notFound.mockClear();
  });

  it("assembles homework page from summary and list loaders", async () => {
    getHomeworkOverviewSummaryMock.mockResolvedValue({
      activeCount: 2,
      overdueCount: 1,
      nearestDueAt: "2026-04-10T10:00:00.000Z",
      nearestDueTitle: "Homework"
    });
    getHomeworkAssignmentsMock.mockResolvedValue([]);

    const result = await HomeworkPage();

    expect(getHomeworkOverviewSummaryMock).toHaveBeenCalledTimes(1);
    expect(getHomeworkAssignmentsMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it("assembles practice page from summary, recommendations and topics loaders", async () => {
    getPracticeOverviewSummaryMock.mockResolvedValue({
      doNowId: "lesson_1",
      continueTopicSlug: "speaking",
      weakSpotId: "module_2"
    });
    getPracticeRecommendedMock.mockResolvedValue([
      { id: "lesson_1", title: "Continue", reason: "reason" },
      { id: "module_2", title: "Weak", reason: "mistakes" }
    ]);
    getPracticeTopicsMock.mockResolvedValue([
      { id: "topic-1", slug: "speaking", title: "Speaking", description: null, moduleCount: 3, progressPercent: 40 }
    ]);

    const result = await PracticePage();

    expect(getPracticeOverviewSummaryMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it("assembles words page from summary plus list loaders", async () => {
    getWordsOverviewSummaryMock.mockResolvedValue({
      totalWords: 6,
      reviewCount: 2,
      newCount: 1,
      activeCount: 4,
      difficultCount: 1,
      masteredCount: 2
    });
    getWordTopicSummariesMock.mockResolvedValue([
      { slug: "travel", title: "Путешествия", description: "Travel", availableCount: 3, difficultCount: 1 }
    ]);

    const result = await WordsMyPage();

    expect(getWordsOverviewSummaryMock).toHaveBeenCalledTimes(1);
    expect(getWordTopicSummariesMock).toHaveBeenCalledTimes(1);
    expect(result.props.summary).toEqual({
      totalWords: 6,
      reviewCount: 2,
      newCount: 1,
      activeCount: 4,
      difficultCount: 1,
      masteredCount: 2
    });
    expect(result.props.topics).toEqual([{ slug: "travel", title: "Путешествия", description: "Travel", availableCount: 3, difficultCount: 1 }]);
  });

  it("assembles word topic page from topic detail loader", async () => {
    getWordTopicDetailMock.mockResolvedValue({
      topic: { slug: "food", title: "Еда", description: "Food" },
      availableCount: 10,
      difficultCount: 1,
      masteredCount: 2,
      sets: [
        {
          slug: "food-cafe",
          topicSlug: "food",
          title: "Кафе и ресторан",
          description: "Cafe",
          availableCount: 5,
          difficultCount: 0,
          masteredCount: 0,
          previewWords: [{ term: "menu", translation: "меню" }]
        }
      ]
    });

    const result = await WordTopicPage({ params: Promise.resolve({ topicSlug: "food" }) });

    expect(getWordTopicDetailMock).toHaveBeenCalledWith("food");
    expect(result.props.detail.topic.slug).toBe("food");
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });

  it("renders not found when the word topic detail is missing", async () => {
    getWordTopicDetailMock.mockResolvedValue(null);

    await expect(WordTopicPage({ params: Promise.resolve({ topicSlug: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getWordTopicDetailMock).toHaveBeenCalledWith("missing");
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1);
  });
});
