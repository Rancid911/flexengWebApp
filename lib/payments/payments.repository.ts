import { createClient } from "@/lib/supabase/server";

export type PaymentsRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type PaymentPlanRow = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  amount?: unknown;
  currency?: unknown;
  badge?: unknown;
  yookassa_product_label?: unknown;
  sort_order?: unknown;
  billing_credit_type?: unknown;
  credit_lesson_units?: unknown;
  credit_money_amount?: unknown;
};

export type StudentPaymentTransactionRow = {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  paid_at?: unknown;
  created_at?: unknown;
  description?: unknown;
  raw_status?: unknown;
  confirmation_url?: unknown;
  provider_payment_id?: unknown;
  plan_id?: unknown;
  payment_plans?: { title?: unknown } | Array<{ title?: unknown }> | null;
};

export type StudentPaymentStatusRow = {
  id?: unknown;
  status?: unknown;
  created_at?: unknown;
};

export function createPaymentsRepository(client: PaymentsRepositoryClient) {
  return {
    loadAvailablePaymentPlans() {
      return client
        .from("payment_plans")
        .select(
          "id, title, description, amount, currency, badge, yookassa_product_label, sort_order, billing_credit_type, credit_lesson_units, credit_money_amount"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
    },

    loadStudentPayments(studentId: string) {
      return client
        .from("payment_transactions")
        .select(
          "id, amount, currency, status, paid_at, created_at, description, raw_status, confirmation_url, provider_payment_id, plan_id, payment_plans(title)"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
    },

    loadStudentPaymentStatus(studentId: string, transactionId: string) {
      return client
        .from("payment_transactions")
        .select("id, status, created_at")
        .eq("student_id", studentId)
        .eq("id", transactionId)
        .maybeSingle();
    }
  };
}

export async function createUserScopedPaymentsRepository() {
  return createPaymentsRepository(await createClient());
}
