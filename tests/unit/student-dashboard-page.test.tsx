import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(workspace)/(student-zone)/student-dashboard/page";

const renderStudentDashboardRouteMock = vi.fn();

vi.mock("@/app/(workspace)/_components/student-dashboard-route", () => ({
  renderStudentDashboardRoute: (...args: unknown[]) => renderStudentDashboardRouteMock(...args)
}));

describe("StudentDashboardPage", () => {
  beforeEach(() => {
    renderStudentDashboardRouteMock.mockReset();
  });

  it("keeps the student dashboard route on the shared dashboard assembly contract", async () => {
    renderStudentDashboardRouteMock.mockResolvedValue(<div data-testid="student-dashboard-route" />);

    const result = await StudentDashboardPage();

    expect(renderStudentDashboardRouteMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });
});
