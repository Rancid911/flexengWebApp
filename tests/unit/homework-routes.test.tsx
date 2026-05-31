import { beforeEach, describe, expect, it, vi } from "vitest";

import HomeworkDetailPage from "@/app/(workspace)/(shared-zone)/homework/[id]/page";
import HomeworkActivePage from "@/app/(workspace)/(shared-zone)/homework/active/page";
import HomeworkCompletedPage from "@/app/(workspace)/(shared-zone)/homework/completed/page";
import HomeworkOverduePage from "@/app/(workspace)/(shared-zone)/homework/overdue/page";
import HomeworkPage from "@/app/(workspace)/(shared-zone)/homework/page";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

const getHomeworkAssignmentDetailMock = vi.fn();
const getHomeworkAssignmentsMock = vi.fn();
const getHomeworkOverviewSummaryMock = vi.fn();
const requireLayoutActorMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/features/homework/components/homework-detail", () => ({
  HomeworkDetail: (props: unknown) => <div data-testid="homework-detail-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/features/homework/components/homework-overview", () => ({
  HomeworkFilteredListPage: (props: unknown) => <div data-testid="homework-filtered-list-probe">{JSON.stringify(props)}</div>,
  HomeworkOverview: (props: unknown) => <div data-testid="homework-overview-probe">{JSON.stringify(props)}</div>
}));

vi.mock("@/lib/homework/queries", () => ({
  getHomeworkAssignmentDetail: (...args: unknown[]) => getHomeworkAssignmentDetailMock(...args),
  getHomeworkAssignments: (...args: unknown[]) => getHomeworkAssignmentsMock(...args),
  getHomeworkOverviewSummary: (...args: unknown[]) => getHomeworkOverviewSummaryMock(...args)
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => requireLayoutActorMock()
}));

vi.mock("@/lib/auth/rbac-route-guard", () => ({
  requireWorkspaceRouteAccess: vi.fn()
}));

describe("homework routes", () => {
  beforeEach(() => {
    getHomeworkAssignmentDetailMock.mockReset();
    getHomeworkAssignmentsMock.mockReset();
    getHomeworkOverviewSummaryMock.mockReset();
    requireLayoutActorMock.mockReset();
    requireLayoutActorMock.mockResolvedValue({ rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} });
    navigationMocks.notFound.mockClear();
  });

  it("assembles overview from summary and assignment loaders", async () => {
    const summary = { activeCount: 2, overdueCount: 1, nearestDueAt: null, nearestDueTitle: null };
    const items = [{ id: "homework-1" }];
    getHomeworkOverviewSummaryMock.mockResolvedValue(summary);
    getHomeworkAssignmentsMock.mockResolvedValue(items);

    const result = await HomeworkPage();

    expect(getHomeworkOverviewSummaryMock).toHaveBeenCalledTimes(1);
    expect(getHomeworkAssignmentsMock).toHaveBeenCalledWith();
    expect(result.props.summary).toBe(summary);
    expect(result.props.items).toBe(items);
  });

  it("assembles detail from route id", async () => {
    const assignment = { id: "homework-1", title: "Homework" };
    getHomeworkAssignmentDetailMock.mockResolvedValue(assignment);

    const result = await HomeworkDetailPage({ params: Promise.resolve({ id: "homework-1" }) });

    expect(getHomeworkAssignmentDetailMock).toHaveBeenCalledWith("homework-1");
    expect(result.props.assignment).toBe(assignment);
    expect(navigationMocks.notFound).not.toHaveBeenCalled();
  });

  it("renders not found when detail is missing", async () => {
    getHomeworkAssignmentDetailMock.mockResolvedValue(null);

    await expect(HomeworkDetailPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getHomeworkAssignmentDetailMock).toHaveBeenCalledWith("missing");
    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("assembles active, completed and overdue filtered routes with current copy", async () => {
    const activeItems = [{ id: "active-1" }];
    const completedItems = [{ id: "completed-1" }];
    const overdueItems = [{ id: "overdue-1" }];
    getHomeworkAssignmentsMock.mockResolvedValueOnce(activeItems).mockResolvedValueOnce(completedItems).mockResolvedValueOnce(overdueItems);

    const activeResult = await HomeworkActivePage();
    const completedResult = await HomeworkCompletedPage();
    const overdueResult = await HomeworkOverduePage();

    expect(getHomeworkAssignmentsMock).toHaveBeenNthCalledWith(1, "active");
    expect(getHomeworkAssignmentsMock).toHaveBeenNthCalledWith(2, "completed");
    expect(getHomeworkAssignmentsMock).toHaveBeenNthCalledWith(3, "overdue");
    expect(activeResult.props).toMatchObject({
      title: "Активные задания",
      description: "Домашние задания, которые ещё не завершены.",
      activeHref: "/homework/active",
      items: activeItems
    });
    expect(completedResult.props).toMatchObject({
      title: "Завершённые задания",
      description: "Домашние задания, которые уже закрыты и сданы.",
      activeHref: "/homework/completed",
      items: completedItems
    });
    expect(overdueResult.props).toMatchObject({
      title: "Просроченные задания",
      description: "Задания, по которым дедлайн уже прошёл.",
      activeHref: "/homework/overdue",
      items: overdueItems
    });
  });
});
