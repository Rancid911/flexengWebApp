import { renderStudentPaymentsRoute } from "@/features/payments/server/payments-route";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  return renderStudentPaymentsRoute({ searchParams });
}
