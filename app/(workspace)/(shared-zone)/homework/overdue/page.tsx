import { renderHomeworkOverdueRoute } from "@/features/homework/server/homework-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function HomeworkOverduePage() {
  await requireWorkspaceRouteAccess("homework");
  return renderHomeworkOverdueRoute();
}
