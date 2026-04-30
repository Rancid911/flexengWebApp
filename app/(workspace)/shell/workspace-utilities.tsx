"use client";

import { usePathname } from "next/navigation";

import { LazyWorkspaceNotifications } from "@/app/(workspace)/shell/lazy-workspace-notifications";
import { LazyWorkspaceSearchTrigger } from "@/app/(workspace)/shell/lazy-workspace-search-trigger";
import type { WorkspaceUtilitySlots } from "@/app/(workspace)/workspace-shell.types";

type WorkspaceUtilitiesProps = {
  currentUserId: string | null;
  utilitySlots?: WorkspaceUtilitySlots;
  crmGlassMode?: boolean;
};

export function WorkspaceUtilities({ currentUserId, utilitySlots, crmGlassMode = false }: WorkspaceUtilitiesProps) {
  const pathname = usePathname();
  const searchMode = utilitySlots?.search ?? "none";
  const notificationsMode = utilitySlots?.notifications ?? "none";
  const hasSearch = searchMode === "lazy";
  const hasNotifications = notificationsMode === "lazy";

  if (!hasSearch && !hasNotifications) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-3 sm:gap-4">
      {hasSearch ? (
        <div className="flex min-w-0 max-w-xl flex-1 items-center gap-3 sm:gap-4">
          <LazyWorkspaceSearchTrigger crmGlassMode={crmGlassMode} />
        </div>
      ) : null}

      {hasNotifications ? (
        <div className="ml-auto flex shrink-0 items-center">
          <LazyWorkspaceNotifications currentUserId={currentUserId} pathname={pathname} crmGlassMode={crmGlassMode} />
        </div>
      ) : null}
    </div>
  );
}
