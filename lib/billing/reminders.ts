import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import type {
  StudentBillingSummary,
  StudentPaymentReminderPopup,
  StudentPaymentReminderStatus
} from "@/lib/billing/types";
import { createBillingLedgerRepository } from "@/lib/billing/ledger.repository";
import { normalizeAccount, normalizeLedger, type BillingAccountRow, type BillingLedgerRow } from "@/lib/billing/mappers";
import { buildStudentBillingSummary, formatBillingDebt, formatBillingMoneyAmount } from "@/lib/billing/utils";
import { formatRuLongDateTime, getMoscowDayKey } from "@/lib/dates/format-ru-date";

type AdminClient = ReturnType<typeof createAdminClient>;
type UserClient = Awaited<ReturnType<typeof createClient>>;
type PaymentReminderClient = AdminClient | UserClient;

type DashboardPaymentReminderInputsRow = {
  settings_enabled: boolean | null;
  threshold_lessons: number | string | null;
  billing_account: BillingAccountRow | null;
  billing_ledger: BillingLedgerRow[] | null;
  next_scheduled_lesson_at: string | null;
};

type ReminderStateRow = {
  student_id: string;
  current_status: StudentPaymentReminderStatus;
  last_status_changed_at: string | null;
  last_notification_sent_at: string | null;
  last_popup_shown_at: string | null;
  last_threshold_lessons: number | null;
  updated_at: string | null;
};

export type StudentPaymentReminderState = {
  studentId: string;
  currentStatus: StudentPaymentReminderStatus;
  lastStatusChangedAt: string | null;
  lastNotificationSentAt: string | null;
  lastPopupShownAt: string | null;
  lastThresholdLessons: number | null;
  updatedAt: string | null;
};

export type StudentPaymentReminderResolution = {
  summary: StudentBillingSummary;
  status: StudentPaymentReminderStatus;
  title: string | null;
  body: string | null;
  nextScheduledLessonAt: string | null;
  shouldShowPopup: boolean;
};

export type PaymentReminderSettings = {
  enabled: boolean;
  thresholdLessons: number;
};

function normalizeState(row: ReminderStateRow | null): StudentPaymentReminderState | null {
  if (!row) return null;
  return {
    studentId: row.student_id,
    currentStatus: row.current_status ?? "none",
    lastStatusChangedAt: row.last_status_changed_at,
    lastNotificationSentAt: row.last_notification_sent_at,
    lastPopupShownAt: row.last_popup_shown_at,
    lastThresholdLessons: row.last_threshold_lessons == null ? null : Number(row.last_threshold_lessons),
    updatedAt: row.updated_at
  };
}

function dayKey(value: string | Date | null | undefined) {
  const key = getMoscowDayKey(value);
  return key || null;
}

function isSameMoscowDay(left: string | null, right: string | Date) {
  const leftKey = dayKey(left);
  const rightKey = dayKey(right);
  return leftKey != null && leftKey === rightKey;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildReminderCopy(summary: StudentBillingSummary, status: StudentPaymentReminderStatus, nextScheduledLessonAt: string | null) {
  if (status === "debt") {
    const debtLabel = formatBillingDebt(summary) ?? "есть задолженность по оплате уроков";
    const lessonHint = nextScheduledLessonAt ? " Чтобы не потерять ближайший урок, пополните оплату заранее." : "";
    return {
      title: "У вас долг по оплате уроков",
      body: `Сейчас по обучению ${debtLabel}.${lessonHint}`.trim()
    };
  }

  if (status === "low_balance") {
    const lessonLabel = summary.availableLessonCount === 1 ? "1 оплаченный урок" : `${summary.availableLessonCount} оплаченных урока`;
    const nextLessonLabel = formatRuLongDateTime(nextScheduledLessonAt);
    const lessonDateHint = nextLessonLabel ? ` Ближайший урок: ${nextLessonLabel}.` : "";
    const remainder =
      summary.currentMode === "per_lesson_price" && summary.moneyRemainderAmount > 0
        ? ` Остаток на балансе: ${formatBillingMoneyAmount(summary.moneyRemainderAmount, summary.currency)}.`
        : "";
    return {
      title: summary.availableLessonCount <= 1 ? "У вас остался 1 оплаченный урок" : "Оплаченных уроков осталось мало",
      body: `Сейчас доступно ${lessonLabel}.${lessonDateHint}${remainder} Рекомендуем пополнить оплату заранее.`
    };
  }

  return { title: null, body: null };
}

export function resolveStudentPaymentReminderStatus(summary: StudentBillingSummary, thresholdLessons: number): StudentPaymentReminderStatus {
  if (summary.isNegative) return "debt";
  if (summary.hasAccount && summary.availableLessonCount <= thresholdLessons) return "low_balance";
  return "none";
}

export async function loadStudentPaymentReminderState(client: PaymentReminderClient, studentId: string) {
  const response = await client
    .from("student_payment_reminder_state")
    .select("student_id, current_status, last_status_changed_at, last_notification_sent_at, last_popup_shown_at, last_threshold_lessons, updated_at")
    .eq("student_id", studentId)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Failed to load payment reminder state: ${response.error.message}`);
  }

  return normalizeState((response.data ?? null) as ReminderStateRow | null);
}

export async function getPaymentReminderSettings(adminClient: AdminClient): Promise<PaymentReminderSettings> {
  const response = await adminClient
    .from("admin_payment_reminder_settings")
    .select("enabled, threshold_lessons")
    .eq("id", true)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Failed to load payment reminder settings: ${response.error.message}`);
  }

  return {
    enabled: response.data?.enabled ?? true,
    thresholdLessons: Number(response.data?.threshold_lessons ?? 1)
  };
}

export async function loadStudentBillingSummaryForReminder(adminClient: AdminClient, studentId: string) {
  const repository = createBillingLedgerRepository(adminClient);
  const [accountResponse, ledgerResponse] = await Promise.all([
    repository.loadBillingAccount(studentId),
    repository.loadFullBillingLedger(studentId)
  ]);

  if (accountResponse.error) {
    throw new Error(`Failed to load billing account: ${accountResponse.error.message}`);
  }
  if (ledgerResponse.error) {
    throw new Error(`Failed to load billing ledger: ${ledgerResponse.error.message}`);
  }

  return buildStudentBillingSummary(
    studentId,
    normalizeAccount((accountResponse.data ?? null) as BillingAccountRow | null),
    normalizeLedger((ledgerResponse.data ?? []) as BillingLedgerRow[])
  );
}

export async function findNextScheduledLessonAt(adminClient: AdminClient, studentId: string, withinDays: number) {
  const now = new Date();
  const horizon = addDays(now, withinDays).toISOString();
  const response = await adminClient
    .from("student_schedule_lessons")
    .select("starts_at")
    .eq("student_id", studentId)
    .eq("status", "scheduled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Failed to load next scheduled lesson: ${response.error.message}`);
  }

  return response.data?.starts_at ?? null;
}

export async function resolveStudentPaymentReminderForDashboard(adminClient: AdminClient, studentId: string, thresholdLessons: number) {
  const [summary, nextScheduledLessonAt] = await Promise.all([
    loadStudentBillingSummaryForReminder(adminClient, studentId),
    findNextScheduledLessonAt(adminClient, studentId, 7)
  ]);
  const status = resolveStudentPaymentReminderStatus(summary, thresholdLessons);
  const copy = buildReminderCopy(summary, status, nextScheduledLessonAt);
  const hasScheduledUnpaidLesson = Boolean(nextScheduledLessonAt) && summary.availableLessonCount === 0;

  return {
    summary,
    status,
    title: copy.title,
    body: copy.body,
    nextScheduledLessonAt,
    shouldShowPopup: status === "debt" || (status === "low_balance" && hasScheduledUnpaidLesson)
  } satisfies StudentPaymentReminderResolution;
}

export async function resolveStudentPaymentReminderForDashboardRpc(client: UserClient, studentId: string) {
  const response = await client.rpc("get_student_dashboard_payment_reminder_inputs", { p_student_id: studentId });

  if (response.error) {
    throw new Error(`Failed to load payment reminder inputs: ${response.error.message}`);
  }

  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  const row = (data ?? null) as DashboardPaymentReminderInputsRow | null;
  if (!row || row.settings_enabled === false) return null;

  const thresholdLessons = Number(row.threshold_lessons ?? 1);
  const summary = buildStudentBillingSummary(
    studentId,
    normalizeAccount(row.billing_account),
    normalizeLedger(row.billing_ledger ?? [])
  );
  const status = resolveStudentPaymentReminderStatus(summary, thresholdLessons);
  const copy = buildReminderCopy(summary, status, row.next_scheduled_lesson_at);
  const hasScheduledUnpaidLesson = Boolean(row.next_scheduled_lesson_at) && summary.availableLessonCount === 0;

  return {
    summary,
    status,
    title: copy.title,
    body: copy.body,
    nextScheduledLessonAt: row.next_scheduled_lesson_at,
    shouldShowPopup: status === "debt" || (status === "low_balance" && hasScheduledUnpaidLesson)
  } satisfies StudentPaymentReminderResolution;
}

export async function upsertStudentPaymentReminderState(
  client: PaymentReminderClient,
  studentId: string,
  payload: {
    status: StudentPaymentReminderStatus;
    thresholdLessons: number;
    notificationSentAt?: string | null;
    popupShownAt?: string | null;
    preserveExistingTimestamps?: boolean;
  }
) {
  const previous = await loadStudentPaymentReminderState(client, studentId);
  const nowIso = new Date().toISOString();
  const statusChanged = previous?.currentStatus !== payload.status;

  const response = await client
    .from("student_payment_reminder_state")
    .upsert(
      {
        student_id: studentId,
        current_status: payload.status,
        last_status_changed_at: statusChanged ? nowIso : previous?.lastStatusChangedAt ?? null,
        last_notification_sent_at:
          payload.notificationSentAt ??
          (payload.preserveExistingTimestamps ? previous?.lastNotificationSentAt ?? null : previous?.lastNotificationSentAt ?? null),
        last_popup_shown_at:
          payload.popupShownAt ??
          (payload.preserveExistingTimestamps ? previous?.lastPopupShownAt ?? null : previous?.lastPopupShownAt ?? null),
        last_threshold_lessons: payload.thresholdLessons
      },
      { onConflict: "student_id" }
    )
    .select("student_id, current_status, last_status_changed_at, last_notification_sent_at, last_popup_shown_at, last_threshold_lessons, updated_at")
    .single();

  if (response.error) {
    throw new Error(`Failed to save payment reminder state: ${response.error.message}`);
  }

  return normalizeState(response.data as ReminderStateRow)!;
}

export function shouldSendReminderNotificationToday(
  state: StudentPaymentReminderState | null,
  status: StudentPaymentReminderStatus,
  now = new Date()
) {
  if (status === "none") return false;
  if (!state) return true;
  if (state.currentStatus !== status) return true;
  return !isSameMoscowDay(state.lastNotificationSentAt, now);
}

export function shouldShowReminderPopupToday(
  state: StudentPaymentReminderState | null,
  status: StudentPaymentReminderStatus,
  now = new Date()
) {
  if (status === "none") return false;
  if (!state) return true;
  if (state.currentStatus !== status) return true;
  return !isSameMoscowDay(state.lastPopupShownAt, now);
}

export function createStudentPaymentReminderPopup(
  resolution: StudentPaymentReminderResolution
): StudentPaymentReminderPopup | null {
  if (resolution.status === "none" || !resolution.title || !resolution.body || !resolution.shouldShowPopup) return null;

  return {
    status: resolution.status,
    title: resolution.title,
    body: resolution.body,
    availableLessonCount: resolution.summary.availableLessonCount,
    debtLessonCount: resolution.summary.debtLessonCount,
    debtMoneyAmount: resolution.summary.debtMoneyAmount,
    nextScheduledLessonAt: resolution.nextScheduledLessonAt
  };
}
