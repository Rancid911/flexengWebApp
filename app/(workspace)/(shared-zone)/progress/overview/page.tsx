import { renderProgressOverviewRoute } from "@/features/progress/server/progress-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function ProgressOverviewPage() {
  await requireWorkspaceRouteAccess("progress");
  return renderProgressOverviewRoute();
}
