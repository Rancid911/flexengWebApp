import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminPaymentsControlState } from "@/app/(workspace)/(staff-zone)/admin/payments/use-admin-payments-control-state";
import type { AdminPaymentControlResponse, AdminPaymentReminderSettingsDto } from "@/lib/admin/types";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

const initialData: AdminPaymentControlResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 5,
  stats: {
    total_students: 0,
    attention_students: 0,
    debt_students: 0,
    one_lesson_left_students: 0,
    unconfigured_students: 0
  }
};

const initialSettings: AdminPaymentReminderSettingsDto = {
  enabled: true,
  threshold_lessons: 1,
  updated_at: null
};

describe("useAdminPaymentsControlState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => initialData
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not refetch immediately on initial render with default filters", async () => {
    renderHook(() => useAdminPaymentsControlState({ initialData, initialSettings }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches after query changes and debounce expires", async () => {
    const { result } = renderHook(() => useAdminPaymentsControlState({ initialData, initialSettings }));

    act(() => {
      result.current.setQuery("ivan");
    });

    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/admin/payments-control?");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("pageSize=5");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("q=ivan");
  });
});
