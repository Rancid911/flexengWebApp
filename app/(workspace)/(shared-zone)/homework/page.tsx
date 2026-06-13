import { renderHomeworkOverviewRoute } from "@/features/homework/server/homework-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function HomeworkPage() {
  await requireWorkspaceRouteAccess("homework");
  return renderHomeworkOverviewRoute();
}
