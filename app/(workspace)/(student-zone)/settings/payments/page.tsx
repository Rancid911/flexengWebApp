import { renderStudentPaymentsRoute } from "@/features/payments/server/payments-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  await requireWorkspaceRouteAccess("payments");
  return renderStudentPaymentsRoute({ searchParams });
}
