import type { WorkspaceChromeProps, WorkspaceShellVariant, WorkspaceUtilitySlots } from "./workspace-shell.types";

type ResolveWorkspaceShellOptionsArgs = {
  shellVariant: WorkspaceShellVariant;
  pathname?: string;
};

const baseUtilitySlotsByVariant: Record<WorkspaceShellVariant, WorkspaceUtilitySlots> = {
  shared: {
    search: "lazy",
    notifications: "lazy"
  },
  staff: {
    search: "lazy",
    notifications: "lazy"
  },
  teacher: {
    search: "none",
    notifications: "lazy"
  },
  student: {
    search: "none",
    notifications: "lazy"
  }
};

export function resolveWorkspaceShellOptions({
  shellVariant,
  pathname
}: ResolveWorkspaceShellOptionsArgs): WorkspaceChromeProps {
  const utilitySlots = {
    ...baseUtilitySlotsByVariant[shellVariant]
  };

  if (pathname === "/search") {
    utilitySlots.search = "none";
  }

  return {
    shellVariant,
    utilitySlots
  };
}
