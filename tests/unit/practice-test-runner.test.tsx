import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PracticeTestRunner } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/practice-test-runner";
import type { PracticeTestActivityDetail } from "@/lib/practice/queries";

const fetchMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.stubGlobal("fetch", fetchMock);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function makePayload(overrides: Partial<PracticeTestActivityDetail> = {}): PracticeTestActivityDetail {
  return {
    id: "test_11111111-1111-1111-1111-111111111111",
    sourceType: "test",
    activityType: "trainer",
    assessmentKind: "regular",
    title: "Present Simple Drill",
    description: "Классический тренажёр.",
    cefrLevel: "A1",
    drillTopicKey: "present-simple",
    drillKind: "grammar",
    lessonReinforcement: true,
    assigned: false,
    meta: "Проходной балл 70%, 12 минут",
    passingScore: 70,
    timeLimitMinutes: 12,
    scoringProfile: null,
    isSupported: true,
    unsupportedQuestionTypes: [],
    sectionHref: "/practice/topics/grammar-foundations/modal-verbs-id",
    sectionTitle: "Modal Verbs",
    content: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        prompt: "Choose the correct sentence:",
        explanation: "Present Simple question one",
        questionType: "single_choice",
        sortOrder: 1,
        placementBand: null,
        options: [
          { id: "33333333-3333-3333-3333-333333333333", optionText: "I play tennis every weekend.", sortOrder: 1, isCorrect: true },
          { id: "44444444-4444-4444-4444-444444444444", optionText: "I plays tennis every weekend.", sortOrder: 2, isCorrect: false }
        ]
      },
      {
        id: "55555555-5555-5555-5555-555555555555",
        prompt: "Choose the correct question:",
        explanation: "Present Simple question two",
        questionType: "single_choice",
        sortOrder: 2,
        placementBand: null,
        options: [
          { id: "66666666-6666-6666-6666-666666666666", optionText: "Do they live in Moscow?", sortOrder: 1, isCorrect: true },
          { id: "77777777-7777-7777-7777-777777777777", optionText: "Does they live in Moscow?", sortOrder: 2, isCorrect: false }
        ]
      }
    ],
    ...overrides
  };
}

describe("PracticeTestRunner", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    pushMock.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("shows an instant result popup for regular trainers before submit resolves", async () => {
    const submitResponse = createDeferred<Response>();
    fetchMock.mockReturnValue(submitResponse.promise);

    render(<PracticeTestRunner payload={makePayload()} />);

    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByText("Choose the correct question:")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("practice-option-1"));

    expect(screen.getByTestId("practice-result-popup")).toBeInTheDocument();
    expect(screen.getByText("Результат готов")).toBeInTheDocument();
    expect(within(screen.getByTestId("practice-result-popup")).getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2 из 2 правильных ответов.")).toBeInTheDocument();
    expect(screen.queryByText("Правильный ответ:")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Далее" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Назад" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вернуться в раздел" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Посмотреть детали" }));
    expect(screen.getAllByText("Правильный ответ:")).toHaveLength(2);
    expect(screen.getAllByText("I play tennis every weekend.").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "Вернуться в раздел" })).toBeInTheDocument();

    await act(async () => {
      submitResponse.resolve({
        ok: true,
        json: async () => ({
          attemptId: "attempt-1",
          score: 100,
          correctAnswers: 2,
          totalQuestions: 2,
          passed: true,
          passingScore: 70,
          questions: [
            {
              questionId: "22222222-2222-2222-2222-222222222222",
              prompt: "Choose the correct sentence:",
              explanation: "Present Simple question one",
              selectedOptionId: "33333333-3333-3333-3333-333333333333",
              selectedOptionText: "I play tennis every weekend.",
              correctOptionId: "33333333-3333-3333-3333-333333333333",
              correctOptionText: "I play tennis every weekend.",
              isCorrect: true
            },
            {
              questionId: "55555555-5555-5555-5555-555555555555",
              prompt: "Choose the correct question:",
              explanation: "Present Simple question two",
              selectedOptionId: "66666666-6666-6666-6666-666666666666",
              selectedOptionText: "Do they live in Moscow?",
              correctOptionId: "66666666-6666-6666-6666-666666666666",
              correctOptionText: "Do they live in Moscow?",
              isCorrect: true
            }
          ]
        })
      } as Response);
    });
  });

  it("shows the same instant popup for regular tests", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        attemptId: "attempt-1",
        score: 100,
        correctAnswers: 2,
        totalQuestions: 2,
        passed: true,
        passingScore: 70,
        questions: [
          {
            questionId: "22222222-2222-2222-2222-222222222222",
            prompt: "Choose the correct sentence:",
            explanation: "Present Simple question one",
            selectedOptionId: "33333333-3333-3333-3333-333333333333",
            selectedOptionText: "I play tennis every weekend.",
            correctOptionId: "33333333-3333-3333-3333-333333333333",
            correctOptionText: "I play tennis every weekend.",
            isCorrect: true
          },
          {
            questionId: "55555555-5555-5555-5555-555555555555",
            prompt: "Choose the correct question:",
            explanation: "Present Simple question two",
            selectedOptionId: "66666666-6666-6666-6666-666666666666",
            selectedOptionText: "Do they live in Moscow?",
            correctOptionId: "66666666-6666-6666-6666-666666666666",
            correctOptionText: "Do they live in Moscow?",
            isCorrect: true
          }
        ]
      })
    });

    render(<PracticeTestRunner payload={makePayload({ activityType: "test", title: "Present Simple Test" })} />);

    fireEvent.click(screen.getByTestId("practice-option-1"));
    fireEvent.click(screen.getByTestId("practice-option-1"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/attempts",
      expect.objectContaining({
        method: "POST"
      })
    );

    expect(screen.getByTestId("practice-result-popup")).toBeInTheDocument();
    expect(screen.getByText("Результат готов")).toBeInTheDocument();
    expect(within(screen.getByTestId("practice-result-popup")).getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Пройти ещё раз" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Вернуться в раздел" }));
    expect(pushMock).toHaveBeenCalledWith("/practice/topics/grammar-foundations/modal-verbs-id");
  });

  it("shuffles regular answer options once per mounted runner and submits selected option ids", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        attemptId: "attempt-1",
        score: 50,
        correctAnswers: 1,
        totalQuestions: 2,
        passed: false,
        passingScore: 70,
        questions: []
      })
    });

    const { rerender } = render(<PracticeTestRunner payload={makePayload()} />);

    expect(within(screen.getByTestId("practice-option-card-1")).getByText("I plays tennis every weekend.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(within(screen.getByTestId("practice-option-card-1")).getByText("Does they live in Moscow?")).toBeInTheDocument();

    rerender(<PracticeTestRunner payload={makePayload()} />);
    expect(within(screen.getByTestId("practice-option-card-1")).getByText("Does they live in Moscow?")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Do they live in Moscow?"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.answers).toEqual([
      {
        questionId: "22222222-2222-2222-2222-222222222222",
        optionId: "44444444-4444-4444-4444-444444444444"
      },
      {
        questionId: "55555555-5555-5555-5555-555555555555",
        optionId: "66666666-6666-6666-6666-666666666666"
      }
    ]);
  });

  it("keeps placement answer options in source order even when regular shuffle would swap them", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    expect(within(screen.getByTestId("practice-option-card-1")).getByText("I play tennis every weekend.")).toBeInTheDocument();
    expect(within(screen.getByTestId("practice-option-card-2")).getByText("I plays tennis every weekend.")).toBeInTheDocument();
  });

  it("does not reopen a stale result popup after retry while submit is still pending", async () => {
    const submitResponse = createDeferred<Response>();
    fetchMock.mockReturnValue(submitResponse.promise);

    render(<PracticeTestRunner payload={makePayload()} />);

    fireEvent.click(screen.getByTestId("practice-option-1"));
    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByTestId("practice-result-popup")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Пройти ещё раз" }));
    expect(screen.queryByTestId("practice-result-popup")).not.toBeInTheDocument();
    expect(screen.getByText("Choose the correct sentence:")).toBeInTheDocument();

    await act(async () => {
      submitResponse.resolve({
        ok: true,
        json: async () => ({
          attemptId: "attempt-stale",
          score: 100,
          correctAnswers: 2,
          totalQuestions: 2,
          passed: true,
          passingScore: 70,
          questions: []
        })
      } as Response);
    });

    expect(screen.queryByTestId("practice-result-popup")).not.toBeInTheDocument();
    expect(screen.getByText("Choose the correct sentence:")).toBeInTheDocument();
  });

  it("submits only once when the final answer is clicked repeatedly", async () => {
    const submitResponse = createDeferred<Response>();
    fetchMock.mockReturnValue(submitResponse.promise);

    render(<PracticeTestRunner payload={makePayload()} />);

    fireEvent.click(screen.getByTestId("practice-option-1"));
    fireEvent.click(screen.getByTestId("practice-option-1"));
    fireEvent.click(screen.getByTestId("practice-option-1"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId("practice-result-popup")).toHaveLength(1);

    await act(async () => {
      submitResponse.resolve({
        ok: true,
        json: async () => ({
          attemptId: "attempt-1",
          score: 100,
          correctAnswers: 2,
          totalQuestions: 2,
          passed: true,
          passingScore: 70,
          questions: []
        })
      } as Response);
    });
  });

  it("shows blocked state for unsupported question types", () => {
    render(
      <PracticeTestRunner
        payload={makePayload({
          isSupported: false,
          unsupportedQuestionTypes: ["text_input"]
        })}
      />
    );

    expect(screen.getByText(/неподдерживаемые типы вопросов/i)).toBeInTheDocument();
    expect(screen.queryByTestId("practice-submit")).not.toBeInTheDocument();
  });

  it("shows placement checking popup before server result and details after it resolves", async () => {
    const submitResponse = createDeferred<Response>();
    fetchMock.mockReturnValue(submitResponse.promise);

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByText("Choose the correct question:")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Далее" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Назад" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("practice-option-1"));
    fireEvent.click(screen.getByTestId("practice-submit"));

    expect(screen.getByTestId("practice-result-popup")).toBeInTheDocument();
    expect(screen.getByText("Проверяем ответы и рассчитываем уровень...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Готовим детали..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Вернуться в раздел" })).not.toBeInTheDocument();

    await act(async () => {
      submitResponse.resolve({
        ok: true,
        json: async () => ({
          attemptId: "attempt-placement",
          score: 61,
          correctAnswers: 43,
          totalQuestions: 70,
          passed: true,
          passingScore: 0,
          assessmentKind: "placement",
          recommendedLevel: "Upper-Intermediate",
          recommendedBandLabel: "Upper part of Upper-Intermediate",
          sectionScores: [],
          questions: [
            {
              questionId: "22222222-2222-2222-2222-222222222222",
              prompt: "Choose the correct sentence:",
              explanation: "Present Simple question one",
              selectedOptionId: "33333333-3333-3333-3333-333333333333",
              selectedOptionText: "I play tennis every weekend.",
              correctOptionId: "33333333-3333-3333-3333-333333333333",
              correctOptionText: "I play tennis every weekend.",
              isCorrect: true,
              placementBand: null
            }
          ]
        })
      } as Response);
    });

    expect(await screen.findByText("Рекомендованный уровень: Upper-Intermediate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Посмотреть детали" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Посмотреть детали" }));
    expect(screen.getByText("Результат отправлен преподавателю.")).toBeInTheDocument();
    expect(screen.getByText("Преподаватель использует его для рекомендации уровня.")).toBeInTheDocument();
    expect(screen.getByText("Рекомендованный уровень: Upper-Intermediate")).toBeInTheDocument();
  });

  it("keeps placement details unavailable while timeout submit is pending", async () => {
    vi.useFakeTimers();
    const submitResponse = createDeferred<Response>();
    fetchMock.mockReturnValue(submitResponse.promise);

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    fireEvent.click(screen.getByTestId("practice-option-1"));

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("practice-submit"));
      await Promise.resolve();
    });

    expect(screen.getByTestId("practice-result-popup")).toBeInTheDocument();
    expect(screen.getByText("Проверяем ответы и рассчитываем уровень...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Готовим детали..." })).toBeDisabled();

    await act(async () => {
      submitResponse.resolve({
        ok: true,
        json: async () => ({
          attemptId: "attempt-placement-timeout",
          score: 50,
          correctAnswers: 1,
          totalQuestions: 2,
          passed: true,
          passingScore: 0,
          assessmentKind: "placement",
          recommendedLevel: null,
          recommendedBandLabel: null,
          sectionScores: [],
          questions: []
        })
      } as Response);
    });
  });

  it("locks placement test on timeout and keeps manual submit available", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        attemptId: "attempt-placement",
        score: 50,
        correctAnswers: 1,
        totalQuestions: 2,
        passed: true,
        passingScore: 0,
        assessmentKind: "placement",
        recommendedLevel: null,
        recommendedBandLabel: null,
        sectionScores: [],
        questions: []
      })
    });

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByTestId("placement-countdown")).toHaveTextContent("30:00");

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(screen.getByText("Время вышло. Ответы зафиксированы, продолжить тест нельзя.")).toBeInTheDocument();
    expect(screen.getByTestId("placement-countdown")).toHaveTextContent("00:00");
    expect(screen.getByRole("button", { name: "Пройти заново" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отправить результат" })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("practice-submit"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      allowPartial: true,
      answers: [
        {
          questionId: "22222222-2222-2222-2222-222222222222",
          optionId: "33333333-3333-3333-3333-333333333333"
        }
      ]
    });
  });

  it("restarts timed placement flow from a clean state after retry", async () => {
    vi.useFakeTimers();

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    fireEvent.click(screen.getByTestId("practice-option-1"));

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(screen.getByText("Время вышло. Ответы зафиксированы, продолжить тест нельзя.")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Пройти заново" }));
    });

    expect(screen.getByTestId("placement-countdown")).toHaveTextContent("30:00");
    expect(screen.queryByText("Время вышло. Ответы зафиксированы, продолжить тест нельзя.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завершить" })).toBeDisabled();
    expect(screen.getByTestId("practice-option-1")).not.toBeChecked();
  });

  it("allows revisiting previous non-placement questions through question pills", async () => {
    render(<PracticeTestRunner payload={makePayload()} />);

    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByText("Choose the correct question:")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Вопрос 1" }));
    expect(screen.getByText("Choose the correct sentence:")).toBeInTheDocument();
  });

  it("applies stronger hover styling only to non-placement answer cards", () => {
    const { rerender } = render(<PracticeTestRunner payload={makePayload()} />);

    const regularOptionCard = screen.getByTestId("practice-option-card-1");
    expect(regularOptionCard.className).toContain("group");
    expect(regularOptionCard.className).toContain("hover:-translate-y-0.5");
    expect(regularOptionCard.className).toContain("hover:border-indigo-300");
    expect(regularOptionCard.className).toContain("hover:bg-indigo-50/60");

    rerender(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    const placementOptionCard = screen.getByTestId("practice-option-card-1");
    expect(placementOptionCard.className).toContain("group");
    expect(placementOptionCard.className).toContain("hover:-translate-y-0.5");
    expect(placementOptionCard.className).toContain("hover:border-indigo-300");
    expect(placementOptionCard.className).toContain("hover:bg-indigo-50/60");
  });

  it("lets students revisit placement questions through question pills and change the answer before submit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        attemptId: "attempt-placement",
        score: 50,
        correctAnswers: 1,
        totalQuestions: 2,
        passed: true,
        passingScore: 0,
        assessmentKind: "placement",
        recommendedLevel: null,
        recommendedBandLabel: null,
        sectionScores: [],
        questions: []
      })
    });

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByText("Choose the correct question:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завершить" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Вопрос 1" }));
    expect(screen.getByText("Choose the correct sentence:")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("practice-option-2"));
    expect(screen.getByText("Choose the correct question:")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("practice-option-1"));
    expect(screen.getByRole("button", { name: "Завершить" })).toBeEnabled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("practice-submit"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      allowPartial: false,
      answers: [
        {
          questionId: "22222222-2222-2222-2222-222222222222",
          optionId: "44444444-4444-4444-4444-444444444444"
        },
        {
          questionId: "55555555-5555-5555-5555-555555555555",
          optionId: "66666666-6666-6666-6666-666666666666"
        }
      ]
    });
  });

  it("allows explicit exit from an active placement test and clears local progress", () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    expect(window.localStorage.getItem("placement-test-started:test_11111111-1111-1111-1111-111111111111")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));

    expect(confirmMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(window.localStorage.getItem("placement-test-started:test_11111111-1111-1111-1111-111111111111")).toBeNull();
    expect(window.localStorage.getItem("placement-test-timer:test_11111111-1111-1111-1111-111111111111")).toBeNull();

    confirmMock.mockRestore();
  });

  it("registers a beforeunload warning for an active placement test", () => {
    render(
      <PracticeTestRunner
        payload={makePayload({
          activityType: "test",
          assessmentKind: "placement",
          cefrLevel: null,
          drillTopicKey: null,
          drillKind: null,
          timeLimitMinutes: 30,
          meta: "Placement test · 30 минут"
        })}
        placementStarted
      />
    );

    const event = new Event("beforeunload", { cancelable: true });
    Object.defineProperty(event, "returnValue", {
      configurable: true,
      writable: true,
      value: ""
    });

    window.dispatchEvent(event);

    expect((event as Event & { returnValue: string }).returnValue).toBe(
      "Если выйти сейчас, placement test будет прерван, а результаты не засчитаются."
    );
  });
});
