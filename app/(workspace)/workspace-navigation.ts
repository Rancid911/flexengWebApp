import {
  CalendarRange,
  BriefcaseBusiness,
  ChartColumn,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
  ShieldCheck
} from "lucide-react";

import type { UserRole } from "@/lib/auth/get-user-role";

import type { WorkspaceNavConfig, WorkspaceNavItem, WorkspaceShellVariant } from "./workspace-shell.types";

const teacherPrimaryNavItems: WorkspaceNavItem[] = [
  { id: "dashboard", label: "Рабочий стол", href: "/dashboard", match: "exact", icon: LayoutDashboard },
  { id: "schedule", label: "Расписание", href: "/schedule", match: "section", icon: CalendarRange },
  { id: "teacher-students", label: "Ученики", href: "/students", match: "section", icon: Users },
  { id: "practice", label: "Практика", href: "/practice", match: "section", icon: GraduationCap },
  { id: "homework", label: "Домашнее задание", href: "/homework", match: "section", icon: ClipboardList },
  { id: "words", label: "Слова", href: "/words", match: "section", icon: Layers },
  { id: "progress", label: "Прогресс", href: "/progress", match: "section", icon: ChartColumn }
];

const studentPrimaryNavItems: WorkspaceNavItem[] = [
  { id: "dashboard", label: "Рабочий стол", href: "/dashboard", match: "exact", icon: LayoutDashboard },
  { id: "schedule", label: "Расписание", href: "/schedule", match: "section", icon: CalendarRange },
  { id: "practice", label: "Практика", href: "/practice", match: "section", icon: GraduationCap },
  { id: "homework", label: "Домашнее задание", href: "/homework", match: "section", icon: ClipboardList },
  { id: "words", label: "Слова", href: "/words", match: "section", icon: Layers },
  { id: "progress", label: "Прогресс", href: "/progress", match: "section", icon: ChartColumn }
];

const adminPrimaryNavItems: WorkspaceNavItem[] = [
  { id: "dashboard", label: "Дашборд", href: "/dashboard", match: "exact", icon: LayoutDashboard },
  { id: "schedule", label: "Расписание", href: "/schedule", match: "section", icon: CalendarRange },
  { id: "crm", label: "CRM", href: "/crm", match: "section", icon: BriefcaseBusiness },
  { id: "admin", label: "Управление", href: "/admin", match: "exact", icon: ShieldCheck },
  { id: "admin-students", label: "Ученики", href: "/admin/students", match: "section", icon: Users },
  { id: "admin-teachers", label: "Учителя", href: "/admin/teachers", match: "section", icon: GraduationCap },
  { id: "payments-control", label: "Оплата", href: "/admin/payments", match: "section", icon: CreditCard }
];

const studentSecondaryNavItems: WorkspaceNavItem[] = [
  { id: "profile", label: "Профиль", href: "/settings/profile", match: "exact", icon: Settings },
  { id: "payments", label: "Оплата", href: "/settings/payments", match: "exact", icon: CreditCard }
];

function matchesWorkspaceNavItem(pathname: string, item: WorkspaceNavItem) {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function compareWorkspaceNavItemSpecificity(a: WorkspaceNavItem, b: WorkspaceNavItem) {
  if (a.href.length !== b.href.length) {
    return b.href.length - a.href.length;
  }

  if (a.match !== b.match) {
    return a.match === "exact" ? -1 : 1;
  }

  return 0;
}

export function isWorkspaceNavItemActive(pathname: string, item: WorkspaceNavItem) {
  return matchesWorkspaceNavItem(pathname, item);
}

export function getActiveWorkspaceNavItemId(pathname: string, items: WorkspaceNavItem[]) {
  const matches = items.filter((item) => matchesWorkspaceNavItem(pathname, item)).sort(compareWorkspaceNavItemSpecificity);
  return matches[0]?.id ?? null;
}

function resolveWorkspaceRole(shellVariant: WorkspaceShellVariant, currentRole: UserRole | null): UserRole | null {
  if (shellVariant === "staff") return currentRole === "manager" ? "manager" : "admin";
  if (shellVariant === "teacher") return "teacher";
  if (shellVariant === "student") return "student";
  return currentRole;
}

export function getWorkspaceNavConfig(shellVariant: WorkspaceShellVariant, currentRole: UserRole | null): WorkspaceNavConfig {
  const workspaceRole = resolveWorkspaceRole(shellVariant, currentRole);
  const isStaffAdmin = workspaceRole === "admin" || workspaceRole === "manager";
  const isTeacher = workspaceRole === "teacher";

  if (isStaffAdmin) {
    return {
      primary: adminPrimaryNavItems,
      secondary: [],
      mobileMore: [{ id: "profile", label: "Профиль", href: "/settings/profile", match: "exact", icon: Settings }],
      showBottomProfileLink: true
    };
  }

  if (isTeacher) {
    return {
      primary: teacherPrimaryNavItems,
      secondary: [],
      mobileMore: [{ id: "profile", label: "Профиль", href: "/settings/profile", match: "exact", icon: Settings }],
      showBottomProfileLink: true
    };
  }

  return {
    primary: studentPrimaryNavItems,
    secondary: studentSecondaryNavItems,
    mobileMore: studentSecondaryNavItems,
    showBottomProfileLink: false
  };
}
