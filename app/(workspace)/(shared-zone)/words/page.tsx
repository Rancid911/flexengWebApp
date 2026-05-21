import { redirect } from "next/navigation";

import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function WordsPage() {
  await requireWorkspaceRouteAccess("words");
  redirect("/words/my");
}
