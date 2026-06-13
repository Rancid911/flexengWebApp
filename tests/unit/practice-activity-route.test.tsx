import { beforeEach, describe, expect, it, vi } from "vitest";

import PracticeActivityPage from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/page";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

const getPracticeActivityDetailMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/features/practice/components/practice-activity-content", () => ({
  PracticeActivityContent: (props: unknown) => <div data-testid="practice-activity-content-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeActivityDetail: (...args: unknown[]) => getPracticeActivityDetailMock(...args)
}));

describe("practice activity route", () => {
  beforeEach(() => {
    getPracticeActivityDetailMock.mockReset();
    navigationMocks.notFound.mockClear();
  });

  it("loads activity detail from route params and renders activity content", async () => {
    const payload = { activity: { id: "activity-1", title: "Have got Practice" } };
    getPracticeActivityDetailMock.mockResolvedValue(payload);

    const result = await PracticeActivityPage({ params: Promise.resolve({ activityId: "activity-1" }) });

    expect(getPracticeActivityDetailMock).toHaveBeenCalledWith("activity-1");
    expect(result.props.payload).toBe(payload);
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });

  it("renders not found when activity detail is missing", async () => {
    getPracticeActivityDetailMock.mockResolvedValue(null);

    await expect(PracticeActivityPage({ params: Promise.resolve({ activityId: "missing-activity" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getPracticeActivityDetailMock).toHaveBeenCalledWith("missing-activity");
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1);
  });
});
