import { beforeEach, describe, expect, it, vi } from "vitest";

import WordsDifficultPage from "@/app/(workspace)/(shared-zone)/words/difficult/page";
import WordsNewPage from "@/app/(workspace)/(shared-zone)/words/new/page";
import WordsReviewPage from "@/app/(workspace)/(shared-zone)/words/review/page";

const getDifficultWordsMock = vi.fn();
const getNewWordsMock = vi.fn();
const getWordsForReviewMock = vi.fn();
const requireLayoutActorMock = vi.fn();

vi.mock("@/lib/words/words.service", () => ({
  getDifficultWords: (...args: unknown[]) => getDifficultWordsMock(...args),
  getNewWords: (...args: unknown[]) => getNewWordsMock(...args),
  getWordsForReview: (...args: unknown[]) => getWordsForReviewMock(...args)
}));

vi.mock("@/features/words/components/words-list-page", () => ({
  WordsListPage: (props: unknown) => <div data-testid="words-list-page-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => requireLayoutActorMock()
}));

vi.mock("@/lib/auth/rbac-route-guard", () => ({
  requireWorkspaceRouteAccess: vi.fn()
}));

describe("words list pages", () => {
  beforeEach(() => {
    getDifficultWordsMock.mockReset();
    getNewWordsMock.mockReset();
    getWordsForReviewMock.mockReset();
    requireLayoutActorMock.mockReset();
    requireLayoutActorMock.mockResolvedValue({ rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} });
  });

  it("assembles the review page with current copy and conditional action", async () => {
    const words = [{ id: "word-1", term: "revise" }];
    getWordsForReviewMock.mockResolvedValue(words);

    const result = await WordsReviewPage();

    expect(getWordsForReviewMock).toHaveBeenCalledTimes(1);
    expect(result.props.words).toBe(words);
    expect(result.props.active).toBe("review");
    expect(result.props.title).toBe("Повторить сегодня");
    expect(result.props.description).toBe("Слова, которые система считает нужным повторить сейчас.");
    expect(result.props.action).toEqual({ href: "/words/train?mode=review&limit=10", label: "Начать повторение" });
    expect(result.props.emptyTitle).toBe("Сегодня нет слов для повторения");
    expect(result.props.emptyDescription).toBe("Можно изучить новые слова.");
    expect(result.props.showStatus).toBe(true);
  });

  it("assembles the new words page with the always-visible training action", async () => {
    const words = [{ id: "word-2", term: "learn" }];
    getNewWordsMock.mockResolvedValue(words);

    const result = await WordsNewPage();

    expect(getNewWordsMock).toHaveBeenCalledTimes(1);
    expect(result.props.words).toBe(words);
    expect(result.props.active).toBe("new");
    expect(result.props.title).toBe("Новые слова");
    expect(result.props.description).toBe("Слова из встроенных тем, которые вы ещё не закрепляли.");
    expect(result.props.action).toEqual({ href: "/words/train?mode=new&limit=5", label: "Изучить новые" });
    expect(result.props.emptyTitle).toBe("Новых слов пока нет");
    expect(result.props.emptyDescription).toBe("Выберите тему на экране карточек или повторите уже добавленные слова.");
  });

  it("assembles the difficult words page with amber topic tone and no action when empty", async () => {
    getDifficultWordsMock.mockResolvedValue([]);

    const result = await WordsDifficultPage();

    expect(getDifficultWordsMock).toHaveBeenCalledTimes(1);
    expect(result.props.words).toEqual([]);
    expect(result.props.active).toBe("difficult");
    expect(result.props.title).toBe("Сложные слова");
    expect(result.props.description).toBe("Слова, которые вы отметили сложными или не смогли вспомнить.");
    expect(result.props.action).toBeNull();
    expect(result.props.emptyTitle).toBe("Сложных слов пока нет");
    expect(result.props.emptyDescription).toBe("Если слово не вспомнится на тренировке, оно появится здесь.");
    expect(result.props.topicTone).toBe("amber");
    expect(result.props.showStatus).toBe(true);
  });
});
