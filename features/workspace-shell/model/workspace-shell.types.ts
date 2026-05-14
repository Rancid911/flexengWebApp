export type WorkspaceShellVariant = "student" | "teacher" | "staff" | "shared";
export type WorkspaceUtilityMode = "none" | "lazy";

export type WorkspaceUtilitySlots = {
  search?: WorkspaceUtilityMode;
  notifications?: WorkspaceUtilityMode;
};

export type WorkspaceNavMatchMode = "exact" | "section";

export type WorkspaceNavItem = {
  id: string;
  label: string;
  href: string;
  match: WorkspaceNavMatchMode;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
};

export type WorkspaceNavConfig = {
  primary: WorkspaceNavItem[];
  secondary: WorkspaceNavItem[];
  mobileMore: WorkspaceNavItem[];
  showBottomProfileLink: boolean;
};

export type WorkspaceChromeProps = {
  shellVariant: WorkspaceShellVariant;
  utilitySlots?: WorkspaceUtilitySlots;
  crmBackgroundImageUrl?: string | null;
};
