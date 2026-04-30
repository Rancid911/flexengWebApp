import { getStudentDashboardPaymentReminder } from "@/lib/dashboard/student-dashboard";

import { StudentPaymentReminderPanel } from "./student-payment-reminder-panel";

export default async function StudentPaymentReminderSlot() {
  const popup = await getStudentDashboardPaymentReminder();

  if (!popup) {
    return null;
  }

  return <StudentPaymentReminderPanel popup={popup} />;
}
