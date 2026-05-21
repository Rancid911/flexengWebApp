import { redirect } from "next/navigation";

import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function ProgressPage() {
  await requireWorkspaceRouteAccess("progress");
  redirect("/progress/overview");
}
