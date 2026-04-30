import type { StudentBillingMode } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingLedgerRepositoryClient = ReturnType<typeof createAdminClient>;

const BILLING_ACCOUNT_SELECT = "id, student_id, billing_mode, lesson_price_amount, currency, created_at, updated_at";
const BILLING_LEDGER_SELECT =
  "id, student_id, entry_direction, unit_type, lesson_units, money_amount, reason, payment_transaction_id, schedule_lesson_id, payment_plan_id, effective_lesson_price_amount, effective_lesson_price_currency, description, created_at";

export function createBillingLedgerRepository(client: BillingLedgerRepositoryClient = createAdminClient()) {
  return {
    async loadBillingAccount(studentId: string) {
      return await client.from("student_billing_accounts").select(BILLING_ACCOUNT_SELECT).eq("student_id", studentId).maybeSingle();
    },

    async upsertBillingAccount(
      studentId: string,
      payload: {
        billingMode: StudentBillingMode;
        lessonPriceAmount?: number | null;
        currency?: string;
        updatedByProfileId?: string | null;
      }
    ) {
      return await client
        .from("student_billing_accounts")
        .upsert(
          {
            student_id: studentId,
            billing_mode: payload.billingMode,
            lesson_price_amount: payload.billingMode === "per_lesson_price" ? payload.lessonPriceAmount ?? null : null,
            currency: payload.currency ?? "RUB",
            updated_by_profile_id: payload.updatedByProfileId ?? null
          },
          { onConflict: "student_id" }
        )
        .select(BILLING_ACCOUNT_SELECT)
        .single();
    },

    async deleteBillingAccount(studentId: string) {
      return await client.from("student_billing_accounts").delete().eq("student_id", studentId);
    },

    async loadBillingSummaryAggregates(studentId: string) {
      return await client.rpc("get_student_billing_summary_aggregates", { p_student_id: studentId });
    },

    async loadFullBillingLedger(studentId: string) {
      return await client.from("student_billing_ledger").select(BILLING_LEDGER_SELECT).eq("student_id", studentId).order("created_at", { ascending: false });
    },

    async loadRecentBillingLedger(studentId: string, recentEntriesLimit: number) {
      return await client
        .from("student_billing_ledger")
        .select(BILLING_LEDGER_SELECT)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(Math.max(1, recentEntriesLimit));
    },

    async loadLatestEffectiveLessonPrice(studentId: string) {
      return await client
        .from("student_billing_ledger")
        .select("effective_lesson_price_amount, effective_lesson_price_currency")
        .eq("student_id", studentId)
        .not("effective_lesson_price_amount", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async insertLedgerEntry(payload: Record<string, unknown>) {
      return await client.from("student_billing_ledger").insert(payload);
    },

    async loadBillingCompatibility(studentId: string, planId: string) {
      return await Promise.all([
        client.from("student_billing_accounts").select("billing_mode, lesson_price_amount").eq("student_id", studentId).maybeSingle(),
        client.from("payment_plans").select("billing_credit_type, credit_lesson_units, credit_money_amount").eq("id", planId).maybeSingle()
      ]);
    },

    async loadPaymentTransactionWithPlan(transactionId: string) {
      return await client
        .from("payment_transactions")
        .select("id, student_id, status, plan_id, amount, currency, payment_plans(id, billing_credit_type, credit_lesson_units, credit_money_amount)")
        .eq("id", transactionId)
        .maybeSingle();
    },

    async loadExistingPaymentCreditEntry(transactionId: string) {
      return await client.from("student_billing_ledger").select("id").eq("payment_transaction_id", transactionId).eq("reason", "payment").maybeSingle();
    },

    async loadLessonChargeInputs(lessonId: string) {
      return await Promise.all([
        client.from("student_schedule_lessons").select("id, student_id, teacher_id, title").eq("id", lessonId).maybeSingle(),
        client.from("student_billing_ledger").select("id").eq("schedule_lesson_id", lessonId).eq("reason", "lesson_charge").maybeSingle()
      ]);
    }
  };
}
