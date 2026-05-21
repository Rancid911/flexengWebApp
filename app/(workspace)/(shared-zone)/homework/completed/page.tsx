import { renderHomeworkCompletedRoute } from "@/features/homework/server/homework-routes";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function HomeworkCompletedPage() {
  await requireWorkspaceRouteAccess("homework");
  return renderHomeworkCompletedRoute();
}
