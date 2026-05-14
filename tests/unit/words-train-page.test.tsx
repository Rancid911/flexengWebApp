import { beforeEach, describe, expect, it, vi } from "vitest";

import WordsTrainPage from "@/app/(workspace)/(shared-zone)/words/train/page";

const buildWordSessionMock = vi.fn();
const flashcardTrainerMock = vi.fn(({ session }: { session: unknown }) => (
  <div data-testid="flashcard-trainer-probe">{JSON.stringify(session)}</div>
));

vi.mock("@/lib/words/queries", () => ({
  buildWordSession: (...args: unknown[]) => buildWordSessionMock(...args)
}));

vi.mock("@/features/words/components/flashcard-trainer", () => ({
  FlashcardTrainer: (props: { session: unknown }) => flashcardTrainerMock(props)
}));

vi.mock("@/features/words/components/words-train-empty-state", () => ({
  WordsTrainEmptyState: () => <div data-testid="words-train-empty-state-probe" />
}));

describe("WordsTrainPage", () => {
  beforeEach(() => {
    buildWordSessionMock.mockReset();
    flashcardTrainerMock.mockClear();
  });

  it("builds a word session from valid query params and renders the trainer", async () => {
    const session = { mode: "difficult", words: [{ id: "word-1" }] };
    buildWordSessionMock.mockResolvedValue(session);

    const result = await WordsTrainPage({
      searchParams: Promise.resolve({
        mode: "difficult",
        topicSlug: "travel",
        setSlug: "travel-airport",
        limit: "10"
      })
    });

    expect(buildWordSessionMock).toHaveBeenCalledWith({
      mode: "difficult",
      topicSlug: "travel",
      setSlug: "travel-airport",
      limit: 10
    });
    expect(result.props.session).toBe(session);
  });

  it("uses the first query value and falls back to the default session when params are invalid", async () => {
    buildWordSessionMock.mockResolvedValue({ mode: "default", words: [{ id: "word-1" }] });

    await WordsTrainPage({
      searchParams: Promise.resolve({
        mode: ["new", "review"],
        limit: "7"
      })
    });

    expect(buildWordSessionMock).toHaveBeenCalledWith({ mode: "default", limit: 5 });
  });

  it("renders the empty state when the session has no words", async () => {
    buildWordSessionMock.mockResolvedValue({ mode: "default", words: [] });

    const result = await WordsTrainPage({
      searchParams: Promise.resolve({})
    });

    expect(result.type.name).toBe("WordsTrainEmptyState");
  });
});
