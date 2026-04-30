import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminTestsActions } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-actions";
import { createDefaultTestsForm, type TestQuestionForm, type TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminTestDetailDto, AdminTestDto } from "@/lib/admin/types";

const fetchMock = vi.fn();

function makeEditingTest(): AdminTestDto {
  return {
    id: "test-1",
    lesson_id: null,
    module_id: "11111111-1111-4111-8111-111111111111",
    activity_type: "trainer",
    assessment_kind: "regular",
    title: "Grammar trainer",
    description: null,
    cefr_level: "A1",
    drill_topic_key: "grammar-trainer",
    drill_kind: "grammar",
    scoring_profile: null,
    lesson_reinforcement: false,
    sort_order: 0,
    passing_score: 70,
    time_limit_minutes: 15,
    is_published: false,
    created_at: "2026-04-21T10:00:00.000Z",
    updated_at: "2026-04-21T10:00:00.000Z"
  };
}

function makeDetail(overrides: Partial<AdminTestDetailDto> = {}): AdminTestDetailDto {
  return {
    ...makeEditingTest(),
    has_attempts: false,
    questions: [],
    ...overrides
  };
}

function makeForm(overrides: Partial<TestsForm> = {}): TestsForm {
  return {
    ...createDefaultTestsForm(),
    title: "Grammar trainer",
    module_id: "11111111-1111-4111-8111-111111111111",
    cefr_level: "A1",
    drill_topic_key: "grammar-trainer",
    drill_kind: "grammar",
    time_limit_minutes: " 25 ",
    sort_order: "0",
    questions: [],
    ...overrides
  };
}

function makeQuestion(overrides: Partial<TestQuestionForm> = {}): TestQuestionForm {
  return {
    clientId: "question-client-1",
    id: "question-1",
    prompt: "Choose the correct answer",
    explanation: "",
    placementBand: "",
    options: [
      { clientId: "option-client-1", id: "option-1", optionText: "A", isCorrect: true },
      { clientId: "option-client-2", id: "option-2", optionText: "B", isCorrect: false },
      { clientId: "option-client-3", id: "option-3", optionText: "C", isCorrect: false },
      { clientId: "option-client-4", id: "option-4", optionText: "D", isCorrect: false }
    ],
    ...overrides
  };
}

async function openEdit(hook: ReturnType<typeof makeHook>["hook"], detail: AdminTestDetailDto = makeDetail()) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => detail
  });

  await act(async () => {
    await hook.result.current.startEditingTest(makeEditingTest());
  });
}

function makeHook(editingTest: AdminTestDto | null = makeEditingTest()) {
  const deps = {
    refresh: {
      prefetchNeighbors: vi.fn(),
      testsPage: 1,
      testsPageCount: 1,
      testsQuery: ""
    },
    data: {
      invalidateCacheForQuery: vi.fn(),
      loadTestsPageData: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })
    },
    setActionError: vi.fn(),
    setEditingTest: vi.fn(),
    setTestsDrawerOpen: vi.fn(),
    setTestsForm: vi.fn()
  };
  const hook = renderHook(() =>
    useAdminTestsActions({
      editingTest,
      ...deps
    })
  );

  return { hook, deps };
}

function makeSubmitEvent() {
  return {
    preventDefault: vi.fn()
  } as unknown as React.FormEvent;
}

describe("useAdminTestsActions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits trimmed time limit when editing a training material", async () => {
    const { hook } = makeHook();
    await openEdit(hook);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm());
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/tests/test-1",
      expect.objectContaining({
        method: "PATCH"
      })
    );
    const payload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(payload).toEqual({ time_limit_minutes: 25 });
  });

  it("normalizes blank time limit to null", async () => {
    const { hook } = makeHook();
    await openEdit(hook);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm({ time_limit_minutes: "   " }));
    });

    const payload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(payload).toEqual({ time_limit_minutes: null });
  });

  it("submits only changed title when title is the only changed field", async () => {
    const { hook } = makeHook();
    await openEdit(hook);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm({ title: "Updated trainer", time_limit_minutes: "15" }));
    });

    const payload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(payload).toEqual({ title: "Updated trainer" });
  });

  it("does not call save api when edit form has no changes", async () => {
    const { hook } = makeHook();
    await openEdit(hook);

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm({ time_limit_minutes: "15" }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("includes questions only when question content changed", async () => {
    const question = makeQuestion();
    const { hook } = makeHook();
    await openEdit(hook, makeDetail({
      questions: [
        {
          id: "question-1",
          prompt: "Choose the correct answer",
          explanation: null,
          question_type: "single_choice",
          placement_band: null,
          sort_order: 0,
          options: [
            { id: "option-1", option_text: "A", is_correct: true, sort_order: 0 },
            { id: "option-2", option_text: "B", is_correct: false, sort_order: 1 },
            { id: "option-3", option_text: "C", is_correct: false, sort_order: 2 },
            { id: "option-4", option_text: "D", is_correct: false, sort_order: 3 }
          ]
        }
      ]
    }));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm({
        time_limit_minutes: "15",
        questions: [makeQuestion({ ...question, prompt: "Updated question" })]
      }));
    });

    const payload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(payload).toEqual({
      questions: [
        expect.objectContaining({
          id: "question-1",
          prompt: "Updated question"
        })
      ]
    });
  });

  it("keeps full payload for create mode", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });
    const { hook } = makeHook(null);

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm());
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/tests",
      expect.objectContaining({
        method: "POST"
      })
    );
    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(payload).toEqual(expect.objectContaining({
      activity_type: "trainer",
      title: "Grammar trainer",
      time_limit_minutes: 25,
      questions: []
    }));
  });

  it("ignores a second submit while save is pending", async () => {
    const { hook } = makeHook();
    await openEdit(hook);
    let resolveFetch: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    void act(() => {
      void hook.result.current.submitTest(makeSubmitEvent(), makeForm());
    });

    await waitFor(() => expect(hook.result.current.submittingTest).toBe(true));

    await act(async () => {
      await hook.result.current.submitTest(makeSubmitEvent(), makeForm({ time_limit_minutes: "30" }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ ok: true })
      });
    });
  });
});
