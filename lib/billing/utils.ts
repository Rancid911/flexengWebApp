import type {
  StudentBillingAccount,
  StudentBillingLedgerEntry,
  StudentBillingReason,
  StudentBillingSummary,
  StudentBillingMode
} from "@/lib/billing/types";

function signedValue(direction: "credit" | "debit", value: number) {
  return direction === "credit" ? value : -value;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function pluralizeLesson(value: number) {
  const absValue = Math.abs(value);
  const mod10 = absValue % 10;
  const mod100 = absValue % 100;

  if (mod10 === 1 && mod100 !== 11) return "";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "а";
  return "ов";
}

export function formatLessonCount(value: number) {
  return `${value} урок${pluralizeLesson(value)}`;
}

export function formatBillingMoneyAmount(amount: number, currency = "RUB") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getBillingDisplayLessonPrice(summary: StudentBillingSummary) {
  return summary.effectiveLessonPriceAmount ?? summary.lessonPriceAmount ?? null;
}

export function buildStudentBillingSummary(
  studentId: string,
  account: StudentBillingAccount | null,
  ledgerEntries: StudentBillingLedgerEntry[],
  recentEntriesLimit = 8,
  recentEntriesOverride?: StudentBillingLedgerEntry[]
): StudentBillingSummary {
  const sortedEntries = [...ledgerEntries].sort(
    (left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()
  );
  let remainingLessonUnits = 0;
  let remainingMoneyAmount = 0;
  let effectiveLessonPriceAmount: number | null = null;
  let effectiveLessonPriceCurrency: string | null = null;

  for (const entry of sortedEntries) {
    if (effectiveLessonPriceAmount == null && typeof entry.effectiveLessonPriceAmount === "number" && entry.effectiveLessonPriceAmount > 0) {
      effectiveLessonPriceAmount = entry.effectiveLessonPriceAmount;
      effectiveLessonPriceCurrency = entry.effectiveLessonPriceCurrency ?? account?.currency ?? "RUB";
    }

    if (entry.unitType === "lesson" && typeof entry.lessonUnits === "number") {
      remainingLessonUnits += signedValue(entry.entryDirection, entry.lessonUnits);
    }

    if (entry.unitType === "money" && typeof entry.moneyAmount === "number") {
      remainingMoneyAmount = roundMoney(remainingMoneyAmount + signedValue(entry.entryDirection, entry.moneyAmount));
    }
  }

  const currentMode = account?.billingMode ?? null;
  const lessonPriceAmount = account?.lessonPriceAmount ?? effectiveLessonPriceAmount ?? null;
  const currency = account?.currency ?? effectiveLessonPriceCurrency ?? "RUB";
  const positiveMoneyBalance = Math.max(remainingMoneyAmount, 0);
  const availableLessonCount =
    currentMode === "package_lessons"
      ? Math.max(remainingLessonUnits, 0)
      : currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
        ? Math.floor(positiveMoneyBalance / lessonPriceAmount)
        : 0;
  const moneyRemainderAmount =
    currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
      ? roundMoney(positiveMoneyBalance - availableLessonCount * lessonPriceAmount)
      : 0;
  const debtLessonUnits = remainingLessonUnits < 0 ? Math.abs(remainingLessonUnits) : 0;
  const debtMoneyAmount = remainingMoneyAmount < 0 ? Math.abs(remainingMoneyAmount) : 0;
  const debtLessonCount =
    currentMode === "package_lessons"
      ? debtLessonUnits
      : currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
        ? Math.ceil(debtMoneyAmount / lessonPriceAmount)
        : 0;
  const isNegative =
    (currentMode === "package_lessons" && remainingLessonUnits < 0) ||
    (currentMode === "per_lesson_price" && remainingMoneyAmount < 0);

  return {
    studentId,
    account,
    currentMode,
    currency,
    lessonPriceAmount,
    effectiveLessonPriceAmount,
    effectiveLessonPriceCurrency,
    availableLessonCount,
    moneyRemainderAmount,
    debtLessonCount,
    remainingLessonUnits,
    remainingMoneyAmount,
    debtLessonUnits,
    debtMoneyAmount,
    isNegative,
    hasAccount: Boolean(account),
    recentEntries: recentEntriesOverride ?? sortedEntries.slice(0, recentEntriesLimit)
  };
}

export function buildStudentBillingSummaryFromAggregates(
  studentId: string,
  account: StudentBillingAccount | null,
  aggregates: {
    remainingLessonUnits: number;
    remainingMoneyAmount: number;
    effectiveLessonPriceAmount: number | null;
    effectiveLessonPriceCurrency: string | null;
  },
  recentEntries: StudentBillingLedgerEntry[]
): StudentBillingSummary {
  const currentMode = account?.billingMode ?? null;
  const lessonPriceAmount = account?.lessonPriceAmount ?? aggregates.effectiveLessonPriceAmount ?? null;
  const currency = account?.currency ?? aggregates.effectiveLessonPriceCurrency ?? "RUB";
  const positiveMoneyBalance = Math.max(aggregates.remainingMoneyAmount, 0);
  const availableLessonCount =
    currentMode === "package_lessons"
      ? Math.max(aggregates.remainingLessonUnits, 0)
      : currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
        ? Math.floor(positiveMoneyBalance / lessonPriceAmount)
        : 0;
  const moneyRemainderAmount =
    currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
      ? roundMoney(positiveMoneyBalance - availableLessonCount * lessonPriceAmount)
      : 0;
  const debtLessonUnits = aggregates.remainingLessonUnits < 0 ? Math.abs(aggregates.remainingLessonUnits) : 0;
  const debtMoneyAmount = aggregates.remainingMoneyAmount < 0 ? Math.abs(aggregates.remainingMoneyAmount) : 0;
  const debtLessonCount =
    currentMode === "package_lessons"
      ? debtLessonUnits
      : currentMode === "per_lesson_price" && lessonPriceAmount && lessonPriceAmount > 0
        ? Math.ceil(debtMoneyAmount / lessonPriceAmount)
        : 0;
  const isNegative =
    (currentMode === "package_lessons" && aggregates.remainingLessonUnits < 0) ||
    (currentMode === "per_lesson_price" && aggregates.remainingMoneyAmount < 0);

  return {
    studentId,
    account,
    currentMode,
    currency,
    lessonPriceAmount,
    effectiveLessonPriceAmount: aggregates.effectiveLessonPriceAmount,
    effectiveLessonPriceCurrency: aggregates.effectiveLessonPriceCurrency,
    availableLessonCount,
    moneyRemainderAmount,
    debtLessonCount,
    remainingLessonUnits: aggregates.remainingLessonUnits,
    remainingMoneyAmount: aggregates.remainingMoneyAmount,
    debtLessonUnits,
    debtMoneyAmount,
    isNegative,
    hasAccount: Boolean(account),
    recentEntries
  };
}

export function getStudentBillingModeLabel(mode: StudentBillingMode | null) {
  switch (mode) {
    case "package_lessons":
      return "Пакет уроков";
    case "per_lesson_price":
      return "Списание по цене урока";
    default:
      return "Не настроено";
  }
}

export function getStudentBillingReasonLabel(reason: StudentBillingReason) {
  switch (reason) {
    case "payment":
      return "Оплата";
    case "lesson_charge":
      return "Списание за урок";
    case "manual_adjustment":
      return "Ручная корректировка";
    case "refund":
      return "Возврат";
    default:
      return reason;
  }
}

export function getStudentBillingDirectionLabel(direction: "credit" | "debit") {
  return direction === "credit" ? "Начисление" : "Списание";
}

export function formatBillingBalance(summary: StudentBillingSummary) {
  if (!summary.hasAccount) return "Не настроено";
  return formatLessonCount(summary.availableLessonCount);
}

export function formatBillingDebt(summary: StudentBillingSummary) {
  if (!summary.isNegative) return null;

  if (summary.currentMode === "package_lessons") {
    return `${formatLessonCount(summary.debtLessonCount)} в минусе`;
  }

  if (summary.currentMode === "per_lesson_price") {
    const money = formatBillingMoneyAmount(summary.debtMoneyAmount, summary.currency);
    if (summary.debtLessonCount > 0) {
      return `${formatLessonCount(summary.debtLessonCount)} в минусе · ${money}`;
    }
    return `${money} в минусе`;
  }

  return null;
}

export function formatBillingEntryValue(entry: StudentBillingLedgerEntry, currency = "RUB") {
  const prefix = entry.entryDirection === "credit" ? "+" : "-";
  if (entry.unitType === "lesson") {
    const units = entry.lessonUnits ?? 0;
    return `${prefix}${formatLessonCount(units)}`;
  }

  const moneyLabel = formatBillingMoneyAmount(entry.moneyAmount ?? 0, currency);
  const lessonPrice = entry.effectiveLessonPriceAmount ?? null;
  if (lessonPrice && lessonPrice > 0) {
    const equivalentLessons = Math.floor((entry.moneyAmount ?? 0) / lessonPrice);
    if (equivalentLessons >= 1) {
      return `${prefix}${moneyLabel} (${formatLessonCount(equivalentLessons)})`;
    }
  }
  return `${prefix}${moneyLabel}`;
}

export function formatBillingMoneyRemainder(summary: StudentBillingSummary) {
  if (summary.currentMode !== "per_lesson_price" || summary.moneyRemainderAmount <= 0) return null;
  return formatBillingMoneyAmount(summary.moneyRemainderAmount, summary.currency);
}

export function formatBillingRemainingMoney(summary: StudentBillingSummary) {
  if (!summary.hasAccount) return null;
  return formatBillingMoneyAmount(summary.remainingMoneyAmount, summary.currency);
}

export function formatBillingLessonPrice(summary: StudentBillingSummary) {
  const lessonPrice = getBillingDisplayLessonPrice(summary);
  if (lessonPrice == null || lessonPrice <= 0) return null;
  return formatBillingMoneyAmount(lessonPrice, summary.effectiveLessonPriceCurrency ?? summary.currency);
}

export function formatBillingEntryDetails(entry: StudentBillingLedgerEntry, currency = "RUB") {
  const lessonPrice = entry.effectiveLessonPriceAmount ?? null;
  if (lessonPrice == null || lessonPrice <= 0) return null;
  return `Цена урока ${formatBillingMoneyAmount(lessonPrice, entry.effectiveLessonPriceCurrency ?? currency)}`;
}
