import type { AccessMode } from "@/lib/supabase/access";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";

export const STUDENT_DASHBOARD_CORE_ACCESS_MODE: AccessMode = "user_scoped";
export const STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE: AccessMode = "privileged";

export const STUDENT_DASHBOARD_CORE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-dashboard-core",
  owner: "@/lib/dashboard/student-dashboard#getStudentDashboardCoreData",
  accessMode: STUDENT_DASHBOARD_CORE_ACCESS_MODE,
  loadLevel: "page",
  shape: "summary",
  issues: ["overfetch"],
  notes: ["Counts and recommendations are still composed in one broad summary path."]
});

export const STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-dashboard-payment-reminder",
  owner: "@/lib/dashboard/student-dashboard#getStudentDashboardPaymentReminder",
  accessMode: STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE,
  loadLevel: "section",
  shape: "detail",
  issues: [],
  notes: [
    "Intentionally isolated from the core dashboard payload.",
    "Temporary privileged exception until billing reminder state can be backed by a user-scoped summary path."
  ]
});
