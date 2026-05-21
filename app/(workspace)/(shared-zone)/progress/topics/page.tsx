import { renderProgressTopicsRoute } from "@/features/progress/server/progress-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function ProgressTopicsPage() {
  await requireWorkspaceRouteAccess("progress");
  return renderProgressTopicsRoute();
}
