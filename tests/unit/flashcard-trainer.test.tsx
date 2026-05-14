import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FlashcardTrainer } from "@/features/words/components/flashcard-trainer";
import type { WordSession } from "@/lib/words/queries";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

function makeSession(): WordSession {
  return {
    mode: "default",
    topicSlug: "food",
    setSlug: "db:set-food",
    topicTitle: "Еда",
    limit: 5,
    words: [
      {
        id: "catalog:word-1",
        progressId: null,
        catalogId: "word-1",
        term: "menu",
        translation: "меню",
        example: "Could we see the menu, please?",
        exampleTranslation: "Можно нам посмотреть меню, пожалуйста?",
        topicSlug: "food",
        topicTitle: "Еда",
        setSlug: "db:set-food",
        setTitle: "Кафе",
        setDescription: "Ресторанная лексика",
        cefrLevel: "A1",
        status: "new",
        nextReviewAt: null
      }
    ]
  };
}

describe("FlashcardTrainer", () => {
  it("runs intro, repeats unknown answers once and shows submit summary", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        totalWords: 1,
        knownCount: 1,
        hardCount: 0,
        unknownCount: 1,
        addedDifficultCount: 0,
        masteredCount: 0
      })
    });

    render(<FlashcardTrainer session={makeSession()} />);

    expect(screen.getByText("Карточка 1 / 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "menu" })).toBeInTheDocument();
    expect(screen.getByText("меню")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Понятно/i }));

    expect(screen.getByText("Проверка вспоминания")).toBeInTheDocument();
    expect(screen.queryByText("меню")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Показать ответ/i }));
    expect(screen.getByText("меню")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Не знал" }));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Показать ответ/i }));
    fireEvent.click(screen.getByRole("button", { name: "Знал" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Результат тренировки" })).toBeInTheDocument());
    expect(screen.getByText("Тренировка завершена")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/words/sessions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [
          { wordId: "catalog:word-1", result: "unknown", markedDifficult: false },
          { wordId: "catalog:word-1", result: "known", markedDifficult: false }
        ]
      })
    });
  });
});
