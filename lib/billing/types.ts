export type StudentBillingMode = "package_lessons" | "per_lesson_price";
export type StudentBillingUnitType = "lesson" | "money";
export type StudentBillingEntryDirection = "credit" | "debit";
export type StudentBillingReason = "payment" | "lesson_charge" | "manual_adjustment" | "refund";
export type StudentPaymentReminderStatus = "none" | "low_balance" | "debt";

export type StudentBillingAccount = {
  id: string;
  studentId: string;
  billingMode: StudentBillingMode;
  lessonPriceAmount: number | null;
  currency: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type StudentBillingLedgerEntry = {
  id: string;
  studentId: string;
  entryDirection: StudentBillingEntryDirection;
  unitType: StudentBillingUnitType;
  lessonUnits: number | null;
  moneyAmount: number | null;
  reason: StudentBillingReason;
  paymentTransactionId: string | null;
  scheduleLessonId: string | null;
  paymentPlanId: string | null;
  effectiveLessonPriceAmount: number | null;
  effectiveLessonPriceCurrency: string | null;
  description: string | null;
  createdAt: string | null;
};

export type StudentBillingSummary = {
  studentId: string;
  account: StudentBillingAccount | null;
  currentMode: StudentBillingMode | null;
  currency: string;
  lessonPriceAmount: number | null;
  effectiveLessonPriceAmount: number | null;
  effectiveLessonPriceCurrency: string | null;
  availableLessonCount: number;
  moneyRemainderAmount: number;
  debtLessonCount: number;
  remainingLessonUnits: number;
  remainingMoneyAmount: number;
  debtLessonUnits: number;
  debtMoneyAmount: number;
  isNegative: boolean;
  hasAccount: boolean;
  recentEntries: StudentBillingLedgerEntry[];
};

export type StudentPaymentReminderPopup = {
  status: Exclude<StudentPaymentReminderStatus, "none">;
  title: string;
  body: string;
  availableLessonCount: number;
  debtLessonCount: number;
  debtMoneyAmount: number;
  nextScheduledLessonAt: string | null;
};
