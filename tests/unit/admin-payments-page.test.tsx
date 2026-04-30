import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPaymentsPage from "@/app/(workspace)/(staff-zone)/admin/payments/page";

const requireStaffAdminPageMock = vi.fn();
const listAdminPaymentControlMock = vi.fn();
const getAdminPaymentReminderSettingsMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminPage: () => requireStaffAdminPageMock()
}));

vi.mock("@/lib/admin/payments-control", () => ({
  listAdminPaymentControl: (url: URL) => listAdminPaymentControlMock(url),
  getAdminPaymentReminderSettings: () => getAdminPaymentReminderSettingsMock()
}));

vi.mock("@/app/(workspace)/(staff-zone)/admin/payments/payments-control-client", () => ({
  AdminPaymentsControlClient: (props: { initialData: unknown; initialSettings: unknown }) => (
    <div data-testid="admin-payments-control-probe">{JSON.stringify(props)}</div>
  )
}));

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    requireStaffAdminPageMock.mockReset();
    listAdminPaymentControlMock.mockReset();
    getAdminPaymentReminderSettingsMock.mockReset();
    requireStaffAdminPageMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    listAdminPaymentControlMock.mockResolvedValue({
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
    });
    getAdminPaymentReminderSettingsMock.mockResolvedValue({
      enabled: true,
      threshold_lessons: 1,
      updated_at: null
    });
  });

  it("loads the initial payment-control page with five cards per page", async () => {
    await AdminPaymentsPage();

    expect(requireStaffAdminPageMock).toHaveBeenCalledTimes(1);
    expect(listAdminPaymentControlMock).toHaveBeenCalledTimes(1);
    const initialUrl = listAdminPaymentControlMock.mock.calls[0]?.[0] as URL;
    expect(initialUrl.searchParams.get("page")).toBe("1");
    expect(initialUrl.searchParams.get("pageSize")).toBe("5");
    expect(getAdminPaymentReminderSettingsMock).toHaveBeenCalledTimes(1);
  });
});
