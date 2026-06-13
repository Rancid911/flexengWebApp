import { renderProgressHistoryRoute } from "@/features/progress/server/progress-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function ProgressHistoryPage() {
  await requireWorkspaceRouteAccess("progress");
  return renderProgressHistoryRoute();
}
