import type { WorkspaceShellVariant, WorkspaceUtilitySlots } from "@/features/workspace-shell/model/workspace-shell.types";

export type WorkspaceShellIntent = {
  shellVariant: WorkspaceShellVariant;
  utilitySlots: WorkspaceUtilitySlots;
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

function normalizePathname(pathname: string | null | undefined) {
  if (!pathname) return "/";
  const [withoutQuery] = pathname.split(/[?#]/);
  if (!withoutQuery || withoutQuery === "/") return "/";
  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getWorkspaceUtilitySlots(shellVariant: WorkspaceShellVariant): WorkspaceUtilitySlots {
  return {
    ...baseUtilitySlotsByVariant[shellVariant]
  };
}

export function resolveWorkspaceShellIntent(pathname: string | null | undefined): WorkspaceShellIntent {
  const normalizedPathname = normalizePathname(pathname);

  if (matchesPathPrefix(normalizedPathname, "/admin") || matchesPathPrefix(normalizedPathname, "/crm")) {
    return {
      shellVariant: "staff",
      utilitySlots: getWorkspaceUtilitySlots("staff")
    };
  }

  if (matchesPathPrefix(normalizedPathname, "/students")) {
    return {
      shellVariant: "teacher",
      utilitySlots: getWorkspaceUtilitySlots("teacher")
    };
  }

  if (matchesPathPrefix(normalizedPathname, "/settings/payments")) {
    return {
      shellVariant: "student",
      utilitySlots: getWorkspaceUtilitySlots("student")
    };
  }

  const utilitySlots = getWorkspaceUtilitySlots("shared");
  if (matchesPathPrefix(normalizedPathname, "/search")) {
    utilitySlots.search = "none";
  }

  return {
    shellVariant: "shared",
    utilitySlots
  };
}
