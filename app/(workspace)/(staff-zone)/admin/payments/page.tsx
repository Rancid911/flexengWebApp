import { requireStaffAdminPage } from "@/lib/admin/auth";
import { listAdminPaymentControl, getAdminPaymentReminderSettings } from "@/lib/admin/payments-control";

import { AdminPaymentsControlClient } from "./payments-control-client";

export default async function AdminPaymentsPage() {
  await requireStaffAdminPage();
  const initialUrl = new URL("http://local/admin/payments");
  initialUrl.searchParams.set("page", "1");
  initialUrl.searchParams.set("pageSize", "5");

  const [initialData, initialSettings] = await Promise.all([
    listAdminPaymentControl(initialUrl),
    getAdminPaymentReminderSettings()
  ]);

  return <AdminPaymentsControlClient initialData={initialData} initialSettings={initialSettings} />;
}
