import { AdminHttpError } from "@/lib/admin/http";
import { createAdminClient } from "@/lib/supabase/admin";

import type { AdminUserDto, AdminUserRole, TeacherOptionDto } from "@/lib/admin/types";
import type { StudentBillingMode } from "@/lib/billing/types";

export type AdminUserRow = Record<string, unknown>;

export function toUserDto(row: AdminUserRow): AdminUserDto {
  return {
    id: String(row.id ?? ""),
    student_id: row.student_id == null ? null : String(row.student_id),
    assigned_teacher_id: row.assigned_teacher_id == null ? null : String(row.assigned_teacher_id),
    assigned_teacher_name: row.assigned_teacher_name == null ? null : String(row.assigned_teacher_name),
    role: String(row.role ?? "student") as AdminUserRole,
    first_name: row.first_name == null ? null : String(row.first_name),
    last_name: row.last_name == null ? null : String(row.last_name),
    email: row.email == null ? null : String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    birth_date: row.birth_date == null ? null : String(row.birth_date),
    english_level: row.english_level == null ? null : String(row.english_level),
    target_level: row.target_level == null ? null : String(row.target_level),
    learning_goal: row.learning_goal == null ? null : String(row.learning_goal),
    notes: row.notes == null ? null : String(row.notes),
    billing_mode:
      row.billing_mode === "package_lessons" || row.billing_mode === "per_lesson_price"
        ? (row.billing_mode as StudentBillingMode)
        : null,
    lesson_price_amount: row.lesson_price_amount == null ? null : Number(row.lesson_price_amount),
    billing_currency: row.billing_currency == null ? null : String(row.billing_currency),
    billing_balance_label: row.billing_balance_label == null ? null : String(row.billing_balance_label),
    billing_debt_label: row.billing_debt_label == null ? null : String(row.billing_debt_label),
    billing_is_negative: Boolean(row.billing_is_negative),
    created_at: row.created_at == null ? null : String(row.created_at)
  };
}

function buildDisplayName(profile: { display_name?: unknown; first_name?: unknown; last_name?: unknown; email?: unknown } | null | undefined, fallback: string) {
  if (!profile) return fallback;
  const displayName = typeof profile.display_name === "string" ? profile.display_name.trim() : "";
  if (displayName) return displayName;
  const firstName = typeof profile.first_name === "string" ? profile.first_name.trim() : "";
  const lastName = typeof profile.last_name === "string" ? profile.last_name.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  const email = typeof profile.email === "string" ? profile.email.trim() : "";
  return email || fallback;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

function pluralizeLesson(value: number) {
  const absValue = Math.abs(value);
  const mod10 = absValue % 10;
  const mod100 = absValue % 100;

  if (mod10 === 1 && mod100 !== 11) return "";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "а";
  return "ов";
}

function buildBillingLabels(input: {
  billingMode: StudentBillingMode | null;
  lessonBalance: number;
  moneyBalance: number;
  lessonPriceAmount: number | null;
  currency: string;
}) {
  if (!input.billingMode) {
    return {
      balanceLabel: "Не настроено",
      debtLabel: null,
      isNegative: false
    };
  }

  if (input.billingMode === "package_lessons") {
    const availableLessonCount = Math.max(input.lessonBalance, 0);
    const debtLessonCount = input.lessonBalance < 0 ? Math.abs(input.lessonBalance) : 0;
    const balanceLabel = `${availableLessonCount} урок${pluralizeLesson(availableLessonCount)}`;
    return {
      balanceLabel,
      debtLabel: debtLessonCount > 0 ? `${debtLessonCount} урок${pluralizeLesson(debtLessonCount)} в минусе` : null,
      isNegative: input.lessonBalance < 0
    };
  }

  if (!input.lessonPriceAmount || input.lessonPriceAmount <= 0) {
    return {
      balanceLabel: "Цена урока не настроена",
      debtLabel: null,
      isNegative: false
    };
  }

  const positiveMoneyBalance = Math.max(input.moneyBalance, 0);
  const availableLessonCount = Math.floor(positiveMoneyBalance / input.lessonPriceAmount);
  const moneyRemainderAmount = positiveMoneyBalance - availableLessonCount * input.lessonPriceAmount;
  const debtMoneyAmount = input.moneyBalance < 0 ? Math.abs(input.moneyBalance) : 0;
  const debtLessonCount = debtMoneyAmount > 0 ? Math.ceil(debtMoneyAmount / input.lessonPriceAmount) : 0;
  const balanceLabel =
    moneyRemainderAmount > 0
      ? `${availableLessonCount} урок${pluralizeLesson(availableLessonCount)} · хвост ${formatCurrency(moneyRemainderAmount, input.currency)}`
      : `${availableLessonCount} урок${pluralizeLesson(availableLessonCount)}`;
  return {
    balanceLabel,
    debtLabel:
      debtMoneyAmount > 0
        ? `${debtLessonCount} урок${pluralizeLesson(debtLessonCount)} в минусе · ${formatCurrency(debtMoneyAmount, input.currency)}`
        : null,
    isNegative: input.moneyBalance < 0
  };
}

export async function hydrateUsersWithStudentDetails(
  supabase: ReturnType<typeof createAdminClient>,
  profiles: AdminUserRow[],
  errorCode: string
) {
  const profileIds = profiles.map((row) => String(row.id ?? "")).filter(Boolean);
  if (profileIds.length === 0) return profiles;

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, profile_id, primary_teacher_id, birth_date, english_level, target_level, learning_goal, notes")
    .in("profile_id", profileIds);
  if (studentsError) {
    throw new AdminHttpError(500, errorCode, "Failed to fetch student details", studentsError.message);
  }

  const studentIds = (students ?? [])
    .map((row: AdminUserRow) => String(row.id ?? ""))
    .filter(Boolean);
  let accountsByStudentId = new Map<string, AdminUserRow>();
  const billingBalanceByStudentId = new Map<string, { lessonBalance: number; moneyBalance: number }>();
  const assignedTeacherByStudentId = new Map<string, { assignedTeacherId: string | null; assignedTeacherName: string | null }>();
  if (studentIds.length > 0) {
    const primaryTeacherIds = Array.from(
      new Set(
        (students ?? [])
          .map((row: AdminUserRow) => (row.primary_teacher_id == null ? null : String(row.primary_teacher_id)))
          .filter((value): value is string => Boolean(value))
      )
    );

    const { data: accounts, error: accountsError } = await supabase
      .from("student_billing_accounts")
      .select("student_id, billing_mode, lesson_price_amount, currency")
      .in("student_id", studentIds);
    if (accountsError) {
      throw new AdminHttpError(500, errorCode, "Failed to fetch billing details", accountsError.message);
    }
    accountsByStudentId = new Map<string, AdminUserRow>((accounts ?? []).map((row: AdminUserRow) => [String(row.student_id), row]));

    const { data: ledgerRows, error: ledgerError } = await supabase
      .from("student_billing_ledger")
      .select("student_id, entry_direction, unit_type, lesson_units, money_amount")
      .in("student_id", studentIds);
    if (ledgerError) {
      throw new AdminHttpError(500, errorCode, "Failed to fetch billing ledger", ledgerError.message);
    }

    for (const row of (ledgerRows ?? []) as AdminUserRow[]) {
      const studentId = String(row.student_id ?? "");
      if (!studentId) continue;
      const current = billingBalanceByStudentId.get(studentId) ?? { lessonBalance: 0, moneyBalance: 0 };
      const direction = row.entry_direction === "debit" ? -1 : 1;
      if (row.unit_type === "lesson") {
        current.lessonBalance += direction * Number(row.lesson_units ?? 0);
      } else if (row.unit_type === "money") {
        current.moneyBalance += direction * Number(row.money_amount ?? 0);
      }
      billingBalanceByStudentId.set(studentId, current);
    }

    const teacherLabelsById = new Map<string, string>();
    if (primaryTeacherIds.length > 0) {
      const teachersResponse = await supabase
        .from("teachers")
        .select("id, profiles!inner(display_name, first_name, last_name, email)")
        .in("id", primaryTeacherIds);
      if (teachersResponse.error) {
        throw new AdminHttpError(500, errorCode, "Failed to fetch teacher labels", teachersResponse.error.message);
      }

      for (const row of (teachersResponse.data ?? []) as Array<{
        id: string;
        profiles:
          | { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }
          | Array<{ display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }>
          | null;
      }>) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles ?? null;
        teacherLabelsById.set(String(row.id), buildDisplayName(profile, "Преподаватель"));
      }
    }

    const primaryTeacherByStudentId = new Map<string, string | null>(
      ((students ?? []) as AdminUserRow[]).map((row) => [String(row.id ?? ""), row.primary_teacher_id == null ? null : String(row.primary_teacher_id)])
    );

    for (const studentId of studentIds) {
      const primaryTeacherId = primaryTeacherByStudentId.get(studentId) ?? null;
      assignedTeacherByStudentId.set(studentId, {
        assignedTeacherId: primaryTeacherId,
        assignedTeacherName: primaryTeacherId ? (teacherLabelsById.get(primaryTeacherId) ?? "Преподаватель") : null
      });
    }
  }

  const studentByProfileId = new Map<string, AdminUserRow>((students ?? []).map((row: AdminUserRow) => [String(row.profile_id), row]));
  return profiles.map((profile) => {
    const student = studentByProfileId.get(String(profile.id ?? ""));
    const account = student?.id ? accountsByStudentId.get(String(student.id)) : null;
    const totals = student?.id ? billingBalanceByStudentId.get(String(student.id)) : null;
    const billingLabels = buildBillingLabels({
      billingMode:
        account?.billing_mode === "package_lessons" || account?.billing_mode === "per_lesson_price"
          ? (account.billing_mode as StudentBillingMode)
          : null,
      lessonBalance: totals?.lessonBalance ?? 0,
      moneyBalance: totals?.moneyBalance ?? 0,
      lessonPriceAmount: account?.lesson_price_amount == null ? null : Number(account.lesson_price_amount),
      currency: typeof account?.currency === "string" ? account.currency : "RUB"
    });
    const teacherAssignment = student?.id ? assignedTeacherByStudentId.get(String(student.id)) : null;
    return {
      ...profile,
      student_id: student?.id ?? null,
      assigned_teacher_id: teacherAssignment?.assignedTeacherId ?? null,
      assigned_teacher_name: teacherAssignment?.assignedTeacherName ?? null,
      birth_date: student?.birth_date ?? null,
      english_level: student?.english_level ?? null,
      target_level: student?.target_level ?? null,
      learning_goal: student?.learning_goal ?? null,
      notes: student?.notes ?? null,
      billing_mode: account?.billing_mode ?? null,
      lesson_price_amount: account?.lesson_price_amount ?? null,
      billing_currency: account?.currency ?? null,
      billing_balance_label: billingLabels.balanceLabel,
      billing_debt_label: billingLabels.debtLabel,
      billing_is_negative: billingLabels.isNegative
    };
  });
}

export async function loadTeacherOptions(supabase: ReturnType<typeof createAdminClient>): Promise<TeacherOptionDto[]> {
  const response = await supabase
    .from("teachers")
    .select("id, profiles!inner(display_name, first_name, last_name, email)")
    .order("id", { ascending: true });
  if (response.error) {
    throw new AdminHttpError(500, "TEACHERS_FETCH_FAILED", "Failed to fetch teacher options", response.error.message);
  }

  const items = (response.data ?? []) as Array<{
    id: string;
    profiles:
      | { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }
      | Array<{ display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }>
      | null;
  }>;

  return items
    .map((item) => ({
      id: String(item.id),
      label: buildDisplayName(Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles ?? null, "Преподаватель")
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));
}

export async function ensureTeacherRecord(supabase: ReturnType<typeof createAdminClient>, profileId: string) {
  const response = await supabase.from("teachers").upsert({ profile_id: profileId }, { onConflict: "profile_id" });
  if (response.error) {
    throw new AdminHttpError(500, "TEACHER_CREATE_FAILED", "Failed to create teacher details", response.error.message);
  }
}

export async function deleteTeacherRecord(supabase: ReturnType<typeof createAdminClient>, profileId: string) {
  const response = await supabase.from("teachers").delete().eq("profile_id", profileId);
  if (response.error) {
    throw new AdminHttpError(500, "TEACHER_DELETE_FAILED", "Failed to delete teacher details", response.error.message);
  }
}

export async function resolveTeacherProfileId(supabase: ReturnType<typeof createAdminClient>, teacherId: string | null | undefined) {
  if (!teacherId) return null;
  const response = await supabase.from("teachers").select("profile_id").eq("id", teacherId).maybeSingle();
  if (response.error) {
    throw new AdminHttpError(500, "TEACHER_LOOKUP_FAILED", "Failed to resolve teacher profile", response.error.message);
  }
  if (!response.data?.profile_id) {
    throw new AdminHttpError(400, "TEACHER_NOT_FOUND", "Assigned teacher not found");
  }
  return String(response.data.profile_id);
}

export async function assignPrimaryTeacherToStudent(
  supabase: ReturnType<typeof createAdminClient>,
  studentId: string,
  primaryTeacherId: string | null
) {
  const response = await supabase.from("students").update({ primary_teacher_id: primaryTeacherId }).eq("id", studentId);
  if (response.error) {
    throw new AdminHttpError(500, "TEACHER_ASSIGNMENT_FAILED", "Failed to update student primary teacher", response.error.message);
  }
}

export async function readHydratedUserByProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string,
  errorCode: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at")
    .eq("id", profileId)
    .single();
  if (profileError) {
    throw new AdminHttpError(500, errorCode, "Failed to load profile", profileError.message);
  }

  const [hydrated] = await hydrateUsersWithStudentDetails(supabase, [profile as AdminUserRow], errorCode);
  return toUserDto(hydrated);
}
