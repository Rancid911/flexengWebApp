import { notFound } from "next/navigation";

import { SettingsClient } from "@/features/settings/components/settings-client";
import { canUseRbacPermission } from "@/lib/auth/rbac-compat";
import { requireLayoutActor } from "@/lib/auth/request-context";

export default async function ProfileSettingsPage() {
  const actor = await requireLayoutActor();
  if (!canUseRbacPermission(actor, "profile.view", ["own", "all"])) {
    notFound();
  }

  return <SettingsClient />;
}
