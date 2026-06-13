import { renderProgressWeakPointsRoute } from "@/features/progress/server/progress-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function ProgressWeakPointsPage() {
  await requireWorkspaceRouteAccess("progress");
  return renderProgressWeakPointsRoute();
}
