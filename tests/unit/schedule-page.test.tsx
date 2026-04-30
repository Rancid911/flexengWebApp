import { describe, expect, it, vi } from "vitest";

import SchedulePage from "@/app/(workspace)/(shared-zone)/schedule/page";

const getSchedulePageDataInternalMock = vi.fn();
const requireSchedulePageMock = vi.fn();
const scheduleClientMock = vi.fn(({ initialData }: { initialData: unknown }) => <div data-testid="schedule-page-probe">{JSON.stringify(initialData)}</div>);

vi.mock("@/lib/schedule/queries", () => ({
  getSchedulePageDataInternal: (...args: unknown[]) => getSchedulePageDataInternalMock(...args)
}));

vi.mock("@/lib/schedule/server", () => ({
  requireSchedulePage: () => requireSchedulePageMock()
}));

vi.mock("@/app/(workspace)/(shared-zone)/schedule/schedule-client", () => ({
  ScheduleClient: (props: { initialData: unknown }) => scheduleClientMock(props)
}));

describe("SchedulePage", () => {
  it("forwards validated search params into schedule page data query", async () => {
    const actor = { role: "teacher", userId: "user-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    getSchedulePageDataInternalMock.mockResolvedValue({ role: "teacher", lessons: [] });

    await SchedulePage({
      searchParams: Promise.resolve({
        status: "completed",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-31"
      })
    });

    expect(getSchedulePageDataInternalMock).toHaveBeenCalledWith(
      actor,
      {
        studentId: null,
        teacherId: null,
        status: "completed",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-31"
      },
      { includeFollowup: false }
    );
  });

  it("falls back to empty filters when search params are invalid", async () => {
    const actor = { role: "teacher", userId: "user-1" };
    requireSchedulePageMock.mockResolvedValue(actor);
    getSchedulePageDataInternalMock.mockResolvedValue({ role: "teacher", lessons: [] });

    await SchedulePage({
      searchParams: Promise.resolve({
        status: "not-a-status",
        dateFrom: "03/01/2026"
      })
    });

    expect(getSchedulePageDataInternalMock).toHaveBeenCalledWith(actor, {}, { includeFollowup: false });
  });
});
