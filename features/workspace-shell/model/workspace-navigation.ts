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
import { canUseAnyRbacPermission, canUseRbacPermission, type RbacPermissionActor, type RbacPermissionRule } from "@/lib/auth/rbac-compat";

import type { WorkspaceNavConfig, WorkspaceNavItem, WorkspaceShellVariant } from "@/features/workspace-shell/model/workspace-shell.types";

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

function canShowProfileAccess(access?: RbacPermissionActor | null) {
  return canUseRbacPermission(access, "profile.view", ["own", "all"]);
}

function filterProfileNavItems(items: WorkspaceNavItem[], canShowProfile: boolean) {
  if (canShowProfile) return items;
  return items.filter((item) => item.id !== "profile");
}

const navAccessRules: Record<string, RbacPermissionRule[]> = {
  schedule: [{ permission: "schedule.view", scopes: ["own", "assigned", "all"] }],
  "teacher-students": [{ permission: "students.view", scopes: ["assigned", "all"] }],
  homework: [{ permission: "homework.view", scopes: ["own", "assigned", "all"] }],
  progress: [{ permission: "student_progress.view", scopes: ["own", "assigned", "all"] }],
  words: [
    { permission: "word_cards.train", scopes: ["own"] },
    { permission: "word_cards.demo_train", scopes: ["own_demo"] }
  ],
  payments: [{ permission: "billing.view", scopes: ["own", "assigned", "all"] }]
};

function filterRbacNavItems(items: WorkspaceNavItem[], access?: RbacPermissionActor | null) {
  return items.filter((item) => {
    const rules = navAccessRules[item.id];
    return rules ? canUseAnyRbacPermission(access, rules) : true;
  });
}

export function getWorkspaceNavConfig(
  shellVariant: WorkspaceShellVariant,
  currentRole: UserRole | null,
  access?: RbacPermissionActor | null
): WorkspaceNavConfig {
  const workspaceRole = resolveWorkspaceRole(shellVariant, currentRole);
  const isStaffAdmin = workspaceRole === "admin" || workspaceRole === "manager";
  const isTeacher = workspaceRole === "teacher";
  const canShowProfile = canShowProfileAccess(access);

  if (isStaffAdmin) {
    return {
      primary: filterRbacNavItems(adminPrimaryNavItems, access),
      secondary: [],
      mobileMore: filterProfileNavItems([{ id: "profile", label: "Профиль", href: "/settings/profile", match: "exact", icon: Settings }], canShowProfile),
      showBottomProfileLink: canShowProfile
    };
  }

  if (isTeacher) {
    return {
      primary: filterRbacNavItems(teacherPrimaryNavItems, access),
      secondary: [],
      mobileMore: filterProfileNavItems([{ id: "profile", label: "Профиль", href: "/settings/profile", match: "exact", icon: Settings }], canShowProfile),
      showBottomProfileLink: canShowProfile
    };
  }

  return {
    primary: filterRbacNavItems(studentPrimaryNavItems, access),
    secondary: filterRbacNavItems(filterProfileNavItems(studentSecondaryNavItems, canShowProfile), access),
    mobileMore: filterRbacNavItems(filterProfileNavItems(studentSecondaryNavItems, canShowProfile), access),
    showBottomProfileLink: false
  };
}
