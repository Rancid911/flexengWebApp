import { getAvailablePaymentPlans, getStudentPaymentStatusContext, getStudentPayments } from "@/lib/payments/queries";
import { measureServerTiming } from "@/lib/server/timing";

import { PaymentsClient } from "../payments-client";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  const paymentsPromise = measureServerTiming("payments-route-context", () =>
    measureServerTiming("payments-route-payments", () => getStudentPayments())
  );
  const plansPromise = measureServerTiming("payments-route-plans", () => getAvailablePaymentPlans());

  const params = (await searchParams) ?? {};
  const paymentId = typeof params.payment === "string" ? params.payment.trim() : "";
  const paymentStatusContextPromise = paymentId
    ? measureServerTiming("payments-route-status-context", () => getStudentPaymentStatusContext(paymentId))
    : Promise.resolve(null);

  const [payments, initialPlans, paymentStatusContext] = await Promise.all([
    paymentsPromise,
    plansPromise,
    paymentStatusContextPromise
  ]);

  return (
    <PaymentsClient
      initialPayments={payments}
      initialBillingSummary={null}
      initialPlans={initialPlans}
      paymentStatusContext={paymentStatusContext}
    />
  );
}
