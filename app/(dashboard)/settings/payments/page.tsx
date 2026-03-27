import { getAvailablePaymentPlans, getStudentPayments, getStudentPaymentStatusContext } from "@/lib/payments/queries";

import { PaymentsClient } from "../payments-client";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const paymentId = typeof params.payment === "string" ? params.payment.trim() : "";
  const [initialPayments, initialPlans, paymentStatusContext] = await Promise.all([
    getStudentPayments(),
    getAvailablePaymentPlans(),
    paymentId ? getStudentPaymentStatusContext(paymentId) : Promise.resolve(null)
  ]);

  return (
    <PaymentsClient
      initialPayments={initialPayments}
      initialPlans={initialPlans}
      paymentStatusContext={paymentStatusContext}
    />
  );
}
