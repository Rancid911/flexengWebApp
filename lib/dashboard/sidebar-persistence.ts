export const SIDEBAR_COLLAPSED_PERSISTENCE_KEY = "flexengSidebarCollapsed";

export function parseSidebarCollapsedCookie(value: string | undefined): boolean | null {
  if (value === "1") return true;
  if (value === "0") return false;
  return null;
}

export function serializeSidebarCollapsed(value: boolean): "0" | "1" {
  return value ? "1" : "0";
}
