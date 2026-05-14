import { beforeEach, describe, expect, it, vi } from "vitest";

import PracticeCatalogPage from "@/app/(workspace)/(shared-zone)/practice/catalog/page";
import PracticeFavoritesPage from "@/app/(workspace)/(shared-zone)/practice/favorites/page";
import PracticeMistakesPage from "@/app/(workspace)/(shared-zone)/practice/mistakes/page";
import PracticeRecommendedPage from "@/app/(workspace)/(shared-zone)/practice/recommended/page";
import PracticeSubtopicDetailPage from "@/app/(workspace)/(shared-zone)/practice/topics/[topic]/[subtopic]/page";
import PracticeTopicDetailPage from "@/app/(workspace)/(shared-zone)/practice/topics/[topic]/page";
import PracticeTopicsPage from "@/app/(workspace)/(shared-zone)/practice/topics/page";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

const getPracticeActivityCatalogMock = vi.fn();
const getPracticeFavoritesMock = vi.fn();
const getPracticeMistakesMock = vi.fn();
const getPracticeRecommendedMock = vi.fn();
const getPracticeSubtopicDetailMock = vi.fn();
const getPracticeTopicDetailMock = vi.fn();
const getPracticeTopicsMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/features/practice/components/practice-catalog", () => ({
  practiceCatalogFilters: [
    { value: "all", label: "Все" },
    { value: "trainers", label: "Тренажёры" },
    { value: "tests", label: "Тесты" },
    { value: "assigned", label: "Назначено" }
  ],
  PracticeCatalog: (props: unknown) => <div data-testid="practice-catalog-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/practice/components/practice-empty-list", () => ({
  PracticeFavoritesList: (props: unknown) => <div data-testid="practice-favorites-probe">{JSON.stringify(props)}</div>,
  PracticeMistakesList: (props: unknown) => <div data-testid="practice-mistakes-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/practice/components/practice-recommended", () => ({
  PracticeRecommended: (props: unknown) => <div data-testid="practice-recommended-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/practice/components/practice-subtopic-detail", () => ({
  PracticeSubtopicDetail: (props: unknown) => <div data-testid="practice-subtopic-detail-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/practice/components/practice-topic-detail", () => ({
  PracticeTopicDetail: (props: unknown) => <div data-testid="practice-topic-detail-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/practice/components/practice-topics", () => ({
  PracticeTopics: (props: unknown) => <div data-testid="practice-topics-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeActivityCatalog: (...args: unknown[]) => getPracticeActivityCatalogMock(...args),
  getPracticeFavorites: (...args: unknown[]) => getPracticeFavoritesMock(...args),
  getPracticeMistakes: (...args: unknown[]) => getPracticeMistakesMock(...args),
  getPracticeRecommended: (...args: unknown[]) => getPracticeRecommendedMock(...args),
  getPracticeSubtopicDetail: (...args: unknown[]) => getPracticeSubtopicDetailMock(...args),
  getPracticeTopicDetail: (...args: unknown[]) => getPracticeTopicDetailMock(...args),
  getPracticeTopics: (...args: unknown[]) => getPracticeTopicsMock(...args)
}));

describe("practice library routes", () => {
  beforeEach(() => {
    getPracticeActivityCatalogMock.mockReset();
    getPracticeFavoritesMock.mockReset();
    getPracticeMistakesMock.mockReset();
    getPracticeRecommendedMock.mockReset();
    getPracticeSubtopicDetailMock.mockReset();
    getPracticeTopicDetailMock.mockReset();
    getPracticeTopicsMock.mockReset();
    navigationMocks.notFound.mockClear();
  });

  it("assembles catalog with valid filter and falls back to all for invalid filter", async () => {
    const assignedItems = [{ id: "assigned-activity" }];
    const allItems = [{ id: "all-activity" }];
    getPracticeActivityCatalogMock.mockResolvedValueOnce(assignedItems).mockResolvedValueOnce(allItems);

    const assignedResult = await PracticeCatalogPage({ searchParams: Promise.resolve({ filter: "assigned" }) });
    const fallbackResult = await PracticeCatalogPage({ searchParams: Promise.resolve({ filter: "unknown" }) });

    expect(getPracticeActivityCatalogMock).toHaveBeenNthCalledWith(1, "assigned");
    expect(getPracticeActivityCatalogMock).toHaveBeenNthCalledWith(2, "all");
    expect(assignedResult.props.filter).toBe("assigned");
    expect(assignedResult.props.items).toBe(assignedItems);
    expect(fallbackResult.props.filter).toBe("all");
    expect(fallbackResult.props.items).toBe(allItems);
  });

  it("assembles recommended, topics, mistakes and favorites from their loaders", async () => {
    const recommended = [{ id: "recommended-1" }];
    const topics = [{ slug: "speaking" }];
    const mistakes = [{ id: "mistake-1" }];
    const favorites = [{ id: "favorite-1" }];
    getPracticeRecommendedMock.mockResolvedValue(recommended);
    getPracticeTopicsMock.mockResolvedValue(topics);
    getPracticeMistakesMock.mockResolvedValue(mistakes);
    getPracticeFavoritesMock.mockResolvedValue(favorites);

    const recommendedResult = await PracticeRecommendedPage();
    const topicsResult = await PracticeTopicsPage();
    const mistakesResult = await PracticeMistakesPage();
    const favoritesResult = await PracticeFavoritesPage();

    expect(recommendedResult.props.recommended).toBe(recommended);
    expect(topicsResult.props.topics).toBe(topics);
    expect(mistakesResult.props.mistakes).toBe(mistakes);
    expect(favoritesResult.props.favorites).toBe(favorites);
  });

  it("assembles topic and subtopic detail pages from route params", async () => {
    const topicPayload = { topic: { slug: "grammar" } };
    const subtopicPayload = { topic: { slug: "grammar" }, subtopic: { slug: "articles" } };
    getPracticeTopicDetailMock.mockResolvedValue(topicPayload);
    getPracticeSubtopicDetailMock.mockResolvedValue(subtopicPayload);

    const topicResult = await PracticeTopicDetailPage({ params: Promise.resolve({ topic: "grammar" }) });
    const subtopicResult = await PracticeSubtopicDetailPage({ params: Promise.resolve({ topic: "grammar", subtopic: "articles" }) });

    expect(getPracticeTopicDetailMock).toHaveBeenCalledWith("grammar");
    expect(getPracticeSubtopicDetailMock).toHaveBeenCalledWith("grammar", "articles");
    expect(topicResult.props.payload).toBe(topicPayload);
    expect(subtopicResult.props.payload).toBe(subtopicPayload);
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });

  it("renders not found for missing topic and subtopic payloads", async () => {
    getPracticeTopicDetailMock.mockResolvedValueOnce(null);
    getPracticeSubtopicDetailMock.mockResolvedValueOnce(null);

    await expect(PracticeTopicDetailPage({ params: Promise.resolve({ topic: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(PracticeSubtopicDetailPage({ params: Promise.resolve({ topic: "missing", subtopic: "also-missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getPracticeTopicDetailMock).toHaveBeenCalledWith("missing");
    expect(getPracticeSubtopicDetailMock).toHaveBeenCalledWith("missing", "also-missing");
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(2);
  });
});
