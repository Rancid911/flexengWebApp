import type { WorkspaceChromeProps, WorkspaceShellVariant, WorkspaceUtilitySlots } from "@/features/workspace-shell/model/workspace-shell.types";
import { getWorkspaceUtilitySlots, resolveWorkspaceShellIntent } from "@/features/workspace-shell/model/workspace-shell-intent";

type ResolveWorkspaceShellOptionsArgs = {
  shellVariant?: WorkspaceShellVariant;
  pathname?: string;
};

export function resolveWorkspaceShellOptions({
  shellVariant,
  pathname
}: ResolveWorkspaceShellOptionsArgs): WorkspaceChromeProps {
  const intent = pathname ? resolveWorkspaceShellIntent(pathname) : null;
  const resolvedShellVariant = shellVariant ?? intent?.shellVariant ?? "shared";
  const utilitySlots: WorkspaceUtilitySlots = intent?.utilitySlots ?? getWorkspaceUtilitySlots(resolvedShellVariant);

  return {
    shellVariant: resolvedShellVariant,
    utilitySlots
  };
}
