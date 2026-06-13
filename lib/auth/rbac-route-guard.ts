import { notFound } from "next/navigation";

import { canUseAnyRbacPermission, type RbacPermissionRule } from "@/lib/auth/rbac-compat";
import { requireLayoutActor } from "@/lib/auth/request-context";

const workspaceRouteAccessRules = {
  schedule: [{ permission: "schedule.view", scopes: ["own", "assigned", "all"] }],
  students: [{ permission: "students.view", scopes: ["assigned", "all"] }],
  homework: [{ permission: "homework.view", scopes: ["own", "assigned", "all"] }],
  progress: [{ permission: "student_progress.view", scopes: ["own", "assigned", "all"] }],
  words: [
    { permission: "word_cards.train", scopes: ["own"] },
    { permission: "word_cards.demo_train", scopes: ["own_demo"] }
  ],
  payments: [{ permission: "billing.view", scopes: ["own", "assigned", "all"] }]
} satisfies Record<string, RbacPermissionRule[]>;

export type WorkspaceRouteAccessKey = keyof typeof workspaceRouteAccessRules;

export async function requireWorkspaceRouteAccess(key: WorkspaceRouteAccessKey) {
  const actor = await requireLayoutActor();
  if (!canUseAnyRbacPermission(actor, workspaceRouteAccessRules[key])) {
    notFound();
  }

  return actor;
}
