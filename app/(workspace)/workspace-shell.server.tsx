import { cache } from "react";
import { cookies } from "next/headers";

import { requireLayoutActor, resolveDefaultWorkspace } from "@/lib/auth/request-context";
import { parseSidebarCollapsedCookie, SIDEBAR_COLLAPSED_PERSISTENCE_KEY } from "@/lib/dashboard/sidebar-persistence";

import { WorkspaceShellClient } from "./workspace-shell-client";
import type { WorkspaceChromeProps } from "./workspace-shell.types";

const getWorkspaceShellState = cache(async () => {
  const cookieStore = await cookies();
  const actor = await requireLayoutActor();
  const persistedSidebarCookie = cookieStore.get(SIDEBAR_COLLAPSED_PERSISTENCE_KEY)?.value;

  return {
    initialSidebarCollapsed: parseSidebarCollapsedCookie(persistedSidebarCookie),
    initialProfile: {
      userId: actor.userId,
      displayName: actor.displayName,
      email: actor.email,
      avatarUrl: actor.avatarUrl,
      role: resolveDefaultWorkspace(actor)
    }
  };
});

export async function ensureWorkspaceActor() {
  await getWorkspaceShellState();
}

export async function WorkspaceShell({
  children,
  shellVariant,
  utilitySlots,
  crmBackgroundImageUrl
}: React.PropsWithChildren<WorkspaceChromeProps>) {
  const shellState = await getWorkspaceShellState();

  return (
    <WorkspaceShellClient
      initialSidebarCollapsed={shellState.initialSidebarCollapsed}
      initialProfile={shellState.initialProfile}
      shellVariant={shellVariant}
      utilitySlots={utilitySlots}
      crmBackgroundImageUrl={crmBackgroundImageUrl}
    >
      {children}
    </WorkspaceShellClient>
  );
}
