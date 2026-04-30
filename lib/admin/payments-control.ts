import { measureServerTiming } from "@/lib/server/timing";
import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHttpError, paginated, parsePagination } from "@/lib/admin/http";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type {
  AdminActor,
  AdminPaymentControlDto,
  AdminPaymentControlFilter,
  AdminPaymentControlResponse,
  AdminPaymentControlStatsDto,
  AdminPaymentReminderSettingsDto
} from "@/lib/admin/types";
import type { StudentBillingMode, StudentPaymentReminderStatus } from "@/lib/billing/types";
import { formatBillingBalance, formatBillingDebt } from "@/lib/billing/utils";
import {
  loadStudentPaymentReminderState,
  resolveStudentPaymentReminderStatus,
  shouldSendReminderNotificationToday,
  upsertStudentPaymentReminderState
} from "@/lib/billing/reminders";
import { getBillingSummaryByStudentId } from "@/lib/billing/server";
import type { AccessMode } from "@/lib/supabase/access";

export const ADMIN_PAYMENTS_CONTROL_ACCESS_MODE: AccessMode = "privileged";

export const ADMIN_PAYMENT_CONTROL_SUMMARY_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "admin-payment-control-summary-list",
  owner: "@/lib/admin/payments-control#listAdminPaymentControl",
  accessMode: ADMIN_PAYMENTS_CONTROL_ACCESS_MODE,
  loadLevel: "page",
  shape: "list",
  issues: [],
  notes: ["RPC-backed paginated summary list. Keep row detail out of this path."]
});

export const ADMIN_PAYMENT_CONTROL_SETTINGS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "admin-payment-control-settings",
  owner: "@/lib/admin/payments-control#getAdminPaymentReminderSettings",
  accessMode: ADMIN_PAYMENTS_CONTROL_ACCESS_MODE,
  loadLevel: "page",
  shape: "summary",
  issues: []
});

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type PaymentControlRpcRow = {
  student_id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  billing_mode: StudentBillingMode | null;
  available_lesson_count: number | string | null;
  debt_lesson_count: number | string | null;
  debt_money_amount: number | string | null;
  money_remainder_amount: number | string | null;
  lesson_price_amount: number | string | null;
  effective_lesson_price_amount: number | string | null;
  billing_currency: string | null;
  billing_not_configured: boolean | null;
  requires_attention: boolean | null;
  billing_is_negative: boolean | null;
  total_count?: number | string | null;
};

type PaymentControlStatsRow = {
  total_students: number | string | null;
  attention_students: number | string | null;
  debt_students: number | string | null;
  one_lesson_left_students: number | string | null;
  unconfigured_students: number | string | null;
};

function toInt(value: number | string | null | undefined) {
  if (value == null || value === "") return 0;
  return Number(value);
}

function toMoney(value: number | string | null | undefined) {
  if (value == null || value === "") return 0;
  return Number(value);
}

function buildPaymentControlSummary(row: Pick<
  PaymentControlRpcRow,
  | "student_id"
  | "billing_mode"
  | "billing_currency"
  | "lesson_price_amount"
  | "effective_lesson_price_amount"
  | "available_lesson_count"
  | "money_remainder_amount"
  | "debt_lesson_count"
  | "debt_money_amount"
  | "billing_is_negative"
  | "billing_not_configured"
>) {
  return {
    studentId: row.student_id,
    account: null,
    currentMode: row.billing_mode,
    currency: row.billing_currency ?? "RUB",
    lessonPriceAmount: row.lesson_price_amount == null ? null : Number(row.lesson_price_amount),
    effectiveLessonPriceAmount: row.effective_lesson_price_amount == null ? null : Number(row.effective_lesson_price_amount),
    effectiveLessonPriceCurrency: row.billing_currency ?? "RUB",
    availableLessonCount: toInt(row.available_lesson_count),
    moneyRemainderAmount: toMoney(row.money_remainder_amount),
    debtLessonCount: toInt(row.debt_lesson_count),
    remainingLessonUnits: 0,
    remainingMoneyAmount: 0,
    debtLessonUnits: toInt(row.debt_lesson_count),
    debtMoneyAmount: toMoney(row.debt_money_amount),
    isNegative: Boolean(row.billing_is_negative),
    hasAccount: !row.billing_not_configured,
    recentEntries: []
  };
}

export function mapAdminPaymentControlRow(row: PaymentControlRpcRow): AdminPaymentControlDto {
  const summary = buildPaymentControlSummary(row);

  return {
    student_id: row.student_id,
    profile_id: row.profile_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    billing_mode: row.billing_mode,
    available_lesson_count: toInt(row.available_lesson_count),
    debt_lesson_count: toInt(row.debt_lesson_count),
    debt_money_amount: toMoney(row.debt_money_amount),
    money_remainder_amount: toMoney(row.money_remainder_amount),
    lesson_price_amount: row.lesson_price_amount == null ? null : Number(row.lesson_price_amount),
    effective_lesson_price_amount: row.effective_lesson_price_amount == null ? null : Number(row.effective_lesson_price_amount),
    billing_currency: row.billing_currency ?? "RUB",
    billing_not_configured: Boolean(row.billing_not_configured),
    requires_attention: Boolean(row.requires_attention),
    billing_is_negative: Boolean(row.billing_is_negative),
    balance_label: summary.hasAccount ? formatBillingBalance(summary) : "Не настроено",
    debt_label: formatBillingDebt(summary)
  };
}

export function compareAdminPaymentControlItems(left: AdminPaymentControlDto, right: AdminPaymentControlDto) {
  const leftPriority =
    left.billing_is_negative ? 0 : left.billing_not_configured ? 1 : left.available_lesson_count <= 1 ? 2 : 3;
  const rightPriority =
    right.billing_is_negative ? 0 : right.billing_not_configured ? 1 : right.available_lesson_count <= 1 ? 2 : 3;

  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  if (left.available_lesson_count !== right.available_lesson_count) return left.available_lesson_count - right.available_lesson_count;
  return buildStudentName({
    id: left.profile_id,
    first_name: left.first_name,
    last_name: left.last_name,
    email: left.email,
    phone: left.phone
  }).localeCompare(
    buildStudentName({
      id: right.profile_id,
      first_name: right.first_name,
      last_name: right.last_name,
      email: right.email,
      phone: right.phone
    }),
    "ru"
  );
}

function buildStudentName(profile: ProfileRow) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email || "Студент";
}

function buildManualReminderBody(studentName: string, item: AdminPaymentControlDto) {
  if (item.billing_is_negative) {
    return `${studentName}, у вас закончились оплаченные уроки. Сейчас по обучению есть задолженность: ${item.debt_label ?? "требуется проверка оплаты"}. Пожалуйста, пополните баланс, чтобы продолжить занятия без паузы.`;
  }

  if (item.billing_not_configured) {
    return `${studentName}, по вашему обучению пока не настроен способ оплаты. Свяжитесь с администратором, чтобы проверить остаток оплаченных уроков и продолжить занятия.`;
  }

  return `${studentName}, у вас осталось ${item.balance_label ?? "мало оплаченных уроков"}. Рекомендуем заранее пополнить оплату, чтобы сохранить удобное расписание.`;
}

async function insertTargetedReminderNotification(supabase: ReturnType<typeof createAdminClient>, payload: {
  profileId: string;
  actorUserId: string;
  title: string;
  body: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    title: payload.title,
    body: payload.body,
    type: "update",
    is_active: true,
    target_roles: ["student"],
    target_user_ids: [payload.profileId],
    published_at: new Date().toISOString(),
    created_by: payload.actorUserId
  });

  if (error) {
    throw new AdminHttpError(500, "PAYMENT_REMINDER_SEND_FAILED", "Failed to send payment reminder", error.message);
  }
}

function normalizeFilter(value: string | null | undefined): AdminPaymentControlFilter {
  const filter = (value ?? "all").trim().toLowerCase();
  return filter === "attention" || filter === "debt" || filter === "one_lesson" || filter === "unconfigured" ? filter : "all";
}

function mapPaymentControlStats(row: PaymentControlStatsRow | null | undefined): AdminPaymentControlStatsDto {
  return {
    total_students: toInt(row?.total_students),
    attention_students: toInt(row?.attention_students),
    debt_students: toInt(row?.debt_students),
    one_lesson_left_students: toInt(row?.one_lesson_left_students),
    unconfigured_students: toInt(row?.unconfigured_students)
  };
}

export async function listAdminPaymentControl(requestUrl: URL): Promise<AdminPaymentControlResponse> {
  return measureServerTiming("admin-payments-total", async () => {
    const { page, pageSize, q } = parsePagination(requestUrl);
    const filter = normalizeFilter(requestUrl.searchParams.get("filter"));
    const settings = await measureServerTiming("admin-payments-settings", async () => getAdminPaymentReminderSettings());
    const cacheKey = JSON.stringify({
      threshold: settings.threshold_lessons,
      q,
      filter,
      page,
      pageSize
    });
    const loadPageData = unstable_cache(
      async () => {
        const cacheClient = createAdminClient();
        const [pageResponse, statsResponse] = await Promise.all([
          measureServerTiming("admin-payments-page-ids", async () =>
            cacheClient.rpc("admin_list_payment_control", {
              p_threshold_lessons: settings.threshold_lessons,
              p_query: q,
              p_filter: filter,
              p_page: page,
              p_page_size: pageSize
            })
          ),
          measureServerTiming("admin-payments-stats", async () =>
            cacheClient.rpc("admin_payment_control_stats", {
              p_threshold_lessons: settings.threshold_lessons,
              p_query: q,
              p_filter: filter
            })
          )
        ]);

        return { pageResponse, statsResponse };
      },
      ["admin-payment-control-page", cacheKey],
      {
        revalidate: 30,
        tags: ["admin-payment-control-page", "admin-payment-reminder-settings"]
      }
    );

    const { pageResponse, statsResponse } = await loadPageData();

    if (pageResponse.error) {
      throw new AdminHttpError(500, "PAYMENT_CONTROL_FETCH_FAILED", "Failed to fetch payment control page", pageResponse.error.message);
    }
    if (statsResponse.error) {
      throw new AdminHttpError(500, "PAYMENT_CONTROL_FETCH_FAILED", "Failed to fetch payment control stats", statsResponse.error.message);
    }

    const rows = await measureServerTiming("admin-payments-summary-batch", async () =>
      ((pageResponse.data ?? []) as PaymentControlRpcRow[]).map(mapAdminPaymentControlRow)
    );
    const stats = mapPaymentControlStats(((statsResponse.data ?? []) as PaymentControlStatsRow[])[0]);
    const total = toInt(((pageResponse.data ?? []) as PaymentControlRpcRow[])[0]?.total_count) || stats.total_students;

    return {
      ...paginated(rows, total, page, pageSize),
      stats
    };
  });
}

export async function getAdminPaymentReminderSettings(): Promise<AdminPaymentReminderSettingsDto> {
  const loadSettings = unstable_cache(
    async (): Promise<AdminPaymentReminderSettingsDto> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("admin_payment_reminder_settings")
        .select("enabled, threshold_lessons, updated_at")
        .eq("id", true)
        .maybeSingle();

      if (error) {
        throw new AdminHttpError(500, "PAYMENT_REMINDER_SETTINGS_FETCH_FAILED", "Failed to fetch payment reminder settings", error.message);
      }

      return {
        enabled: data?.enabled ?? true,
        threshold_lessons: Number(data?.threshold_lessons ?? 1),
        updated_at: data?.updated_at ?? null
      };
    },
    ["admin-payment-reminder-settings"],
    { revalidate: 60, tags: ["admin-payment-reminder-settings"] }
  );

  return loadSettings();
}

export async function updateAdminPaymentReminderSettings(actor: AdminActor, payload: {
  enabled: boolean;
  threshold_lessons: number;
}): Promise<AdminPaymentReminderSettingsDto> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_payment_reminder_settings")
    .upsert(
      {
        id: true,
        enabled: payload.enabled,
        threshold_lessons: payload.threshold_lessons,
        updated_by_profile_id: actor.userId
      },
      { onConflict: "id" }
    )
    .select("enabled, threshold_lessons, updated_at")
    .single();

  if (error) {
    throw new AdminHttpError(500, "PAYMENT_REMINDER_SETTINGS_SAVE_FAILED", "Failed to save payment reminder settings", error.message);
  }

  revalidateTag("admin-payment-reminder-settings", "max");

  return {
    enabled: data.enabled,
    threshold_lessons: Number(data.threshold_lessons ?? 1),
    updated_at: data.updated_at ?? null
  };
}

export async function syncAutomaticPaymentReminders(actor: AdminActor, payload: {
  enabled: boolean;
  threshold_lessons: number;
}) {
  const supabase = createAdminClient();
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, profile_id, profiles!inner(id, first_name, last_name, email, phone)");

  if (studentsError) {
    throw new AdminHttpError(500, "PAYMENT_REMINDER_SYNC_FAILED", "Failed to load students for reminders", studentsError.message);
  }

  for (const student of (students ?? []) as Array<{ id: string; profile_id: string; profiles: ProfileRow | ProfileRow[] }>) {
    const [summary, state] = await Promise.all([
      getBillingSummaryByStudentId(student.id, 0),
      loadStudentPaymentReminderState(supabase, student.id)
    ]);
    const status = resolveStudentPaymentReminderStatus(summary, payload.threshold_lessons);
    const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;

    if (!payload.enabled) {
      await upsertStudentPaymentReminderState(supabase, student.id, {
        status,
        thresholdLessons: payload.threshold_lessons,
        preserveExistingTimestamps: true
      });
      continue;
    }

    const canSend = shouldSendReminderNotificationToday(state, status);
    if (status !== "none" && canSend) {
      const dto = mapAdminPaymentControlRow({
        student_id: student.id,
        profile_id: student.profile_id,
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        billing_mode: summary.currentMode,
        available_lesson_count: summary.availableLessonCount,
        debt_lesson_count: summary.debtLessonCount,
        debt_money_amount: summary.debtMoneyAmount,
        money_remainder_amount: summary.moneyRemainderAmount,
        lesson_price_amount: summary.lessonPriceAmount,
        effective_lesson_price_amount: summary.effectiveLessonPriceAmount,
        billing_currency: summary.currency,
        billing_not_configured: !summary.hasAccount,
        requires_attention: !summary.hasAccount || summary.isNegative || summary.availableLessonCount <= payload.threshold_lessons,
        billing_is_negative: summary.isNegative
      });

      await insertTargetedReminderNotification(supabase, {
        profileId: student.profile_id,
        actorUserId: actor.userId,
        title: status === "debt" ? "Напоминание об оплате" : "Осталось мало уроков",
        body: buildManualReminderBody(
          profile ? buildStudentName(profile) : "Студент",
          dto
        )
      });

      await upsertStudentPaymentReminderState(supabase, student.id, {
        status,
        thresholdLessons: payload.threshold_lessons,
        notificationSentAt: new Date().toISOString()
      });
      continue;
    }

    await upsertStudentPaymentReminderState(supabase, student.id, {
      status,
      thresholdLessons: payload.threshold_lessons,
      preserveExistingTimestamps: true
    });
  }
}

export async function sendStudentPaymentReminder(actor: AdminActor, studentId: string) {
  const supabase = createAdminClient();
  const [profileResponse, settings, state, summary] = await Promise.all([
    supabase
      .from("students")
      .select("id, profile_id, profiles!inner(id, first_name, last_name, email, phone)")
      .eq("id", studentId)
      .single(),
    getAdminPaymentReminderSettings(),
    loadStudentPaymentReminderState(supabase, studentId),
    getBillingSummaryByStudentId(studentId, 0)
  ]);

  if (profileResponse.error || !profileResponse.data) {
    throw new AdminHttpError(404, "STUDENT_NOT_FOUND", "Student not found");
  }

  const row = profileResponse.data as {
    id: string;
    profile_id: string;
    profiles: ProfileRow | ProfileRow[];
  };
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  if (!profile?.id) {
    throw new AdminHttpError(404, "STUDENT_NOT_FOUND", "Student profile not found");
  }

  const reminderStatus = resolveStudentPaymentReminderStatus(summary, settings.threshold_lessons);
  const item = mapAdminPaymentControlRow({
    student_id: studentId,
    profile_id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    billing_mode: summary.currentMode,
    available_lesson_count: summary.availableLessonCount,
    debt_lesson_count: summary.debtLessonCount,
    debt_money_amount: summary.debtMoneyAmount,
    money_remainder_amount: summary.moneyRemainderAmount,
    lesson_price_amount: summary.lessonPriceAmount,
    effective_lesson_price_amount: summary.effectiveLessonPriceAmount,
    billing_currency: summary.currency,
    billing_not_configured: !summary.hasAccount,
    requires_attention: !summary.hasAccount || summary.isNegative || summary.availableLessonCount <= settings.threshold_lessons,
    billing_is_negative: summary.isNegative
  });

  const studentName = buildStudentName(profile);
  const reminderTitle =
    reminderStatus === "debt"
      ? "Напоминание об оплате"
      : reminderStatus === "low_balance"
        ? "Осталось мало уроков"
        : "Проверка оплаты";

  await insertTargetedReminderNotification(supabase, {
    profileId: profile.id,
    actorUserId: actor.userId,
    title: reminderTitle,
    body: buildManualReminderBody(studentName, item)
  });

  await upsertStudentPaymentReminderState(supabase, studentId, {
    status: reminderStatus,
    thresholdLessons: settings.threshold_lessons,
    notificationSentAt: new Date().toISOString(),
    preserveExistingTimestamps: true
  });

  return { ok: true, status: reminderStatus satisfies StudentPaymentReminderStatus, previous_status: state?.currentStatus ?? "none" };
}
