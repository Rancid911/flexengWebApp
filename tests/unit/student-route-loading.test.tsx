import { beforeEach, describe, expect, it, vi } from "vitest";

import HomeworkPage from "@/app/(workspace)/(shared-zone)/homework/page";
import PracticePage from "@/app/(workspace)/(shared-zone)/practice/page";
import WordsMyPage from "@/app/(workspace)/(shared-zone)/words/my/page";
import WordTopicPage from "@/app/(workspace)/(shared-zone)/words/topics/[topicSlug]/page";

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

vi.mock("@/lib/homework/queries", () => ({
  getHomeworkOverviewSummary: (...args: unknown[]) => getHomeworkOverviewSummaryMock(...args),
  getHomeworkAssignments: (...args: unknown[]) => getHomeworkAssignmentsMock(...args)
}));

vi.mock("@/app/(workspace)/(shared-zone)/homework/render-homework-list", () => ({
  renderHomeworkList: (items: unknown) => <div data-testid="homework-list">{JSON.stringify(items)}</div>
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeOverviewSummary: (...args: unknown[]) => getPracticeOverviewSummaryMock(...args),
  getPracticeRecommended: (...args: unknown[]) => getPracticeRecommendedMock(...args),
  getPracticeTopics: (...args: unknown[]) => getPracticeTopicsMock(...args)
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
    expect(result).toBeTruthy();
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
    expect(result).toBeTruthy();
  });
});
