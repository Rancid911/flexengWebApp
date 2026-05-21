import type { UserRole } from "@/lib/auth/get-user-role";

export const permissions = [
  "admin.users.read",
  "admin.users.create",
  "admin.users.update",
  "admin.users.delete",
  "admin.dashboard.read",
  "admin.teachers.read",
  "admin.teachers.update",
  "users.view",
  "users.manage",
  "roles.view",
  "roles.manage",
  "teachers.view",
  "teachers.manage",
  "crm.leads.read",
  "crm.leads.update",
  "crm.leads.delete",
  "crm.leads.view",
  "crm.leads.manage",
  "crm.settings.read",
  "crm.settings.update",
  "students.view",
  "students.manage",
  "students.notes.read",
  "students.notes.write",
  "billing.adjust",
  "billing.admin.read",
  "billing.adjustments.create",
  "billing.reminders.manage",
  "billing.settings.update",
  "billing.view",
  "billing.summary.read",
  "homework.assign",
  "learning.content.manage",
  "learning.placement.assign",
  "learning.tests.manage",
  "content.manage",
  "notifications.admin.read",
  "notifications.admin.manage",
  "notifications.manage",
  "notifications.user.read",
  "notifications.user.manage",
  "payments.checkout.create",
  "payments.view",
  "payments.manage",
  "payments.history.read",
  "payments.status.read",
  "profile.view",
  "profile.update",
  "practice.attempts.submit",
  "schedule.followups.read",
  "schedule.followups.manage",
  "schedule.view",
  "schedule.manage",
  "schedule.lessons.read",
  "schedule.lessons.manage",
  "settings.profile.read",
  "settings.profile.update",
  "content.posts.manage",
  "word_cards.manage",
  "word_cards.train",
  "word_cards.demo_train",
  "words.cardSets.manage",
  "words.sessions.complete"
] as const;

export type Permission = (typeof permissions)[number];

export type PermissionActor = {
  userId?: string;
  role?: UserRole | null;
  profileRole?: UserRole | null;
  isStudent?: boolean;
  isTeacher?: boolean;
  isStaffAdmin?: boolean;
  studentId?: string | null;
  teacherId?: string | null;
  accessibleStudentIds?: string[] | null;
  rbacRoles?: string[] | null;
  rbacPermissions?: string[] | null;
  rbacPermissionScopes?: Record<string, string[]> | null;
};

export type PermissionResource = {
  studentId?: string | null;
  ownerUserId?: string | null;
};

export class PermissionError extends Error {
  status = 403;
  code = "FORBIDDEN";
  exposeDetails = true;

  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
  }
}

const studentRuntimePermissions = new Set<Permission>([
  "payments.checkout.create",
  "payments.view",
  "payments.history.read",
  "payments.status.read",
  "practice.attempts.submit",
  "word_cards.train",
  "words.sessions.complete"
]);

const adminPermissions = new Set<Permission>([
  ...permissions.filter((permission) => !studentRuntimePermissions.has(permission)),
  "payments.view"
]);

const managerPermissions = new Set<Permission>([
  "admin.users.read",
  "admin.teachers.read",
  "admin.teachers.update",
  "users.view",
  "teachers.view",
  "teachers.manage",
  "students.view",
  "students.manage",
  "crm.leads.read",
  "crm.leads.update",
  "crm.leads.delete",
  "crm.leads.view",
  "crm.leads.manage",
  "crm.settings.read",
  "crm.settings.update",
  "billing.adjust",
  "billing.admin.read",
  "billing.adjustments.create",
  "billing.reminders.manage",
  "billing.settings.update",
  "billing.view",
  "billing.summary.read",
  "homework.assign",
  "learning.content.manage",
  "learning.placement.assign",
  "learning.tests.manage",
  "content.manage",
  "notifications.admin.read",
  "notifications.admin.manage",
  "notifications.manage",
  "notifications.user.read",
  "notifications.user.manage",
  "payments.view",
  "payments.manage",
  "schedule.followups.read",
  "schedule.followups.manage",
  "schedule.view",
  "schedule.manage",
  "schedule.lessons.read",
  "schedule.lessons.manage",
  "content.posts.manage",
  "word_cards.manage",
  "words.cardSets.manage"
]);

const teacherPermissions = new Set<Permission>([
  "students.notes.read",
  "students.notes.write",
  "billing.view",
  "billing.summary.read",
  "homework.assign",
  "learning.placement.assign",
  "schedule.followups.read",
  "schedule.followups.manage",
  "schedule.view",
  "schedule.manage",
  "schedule.lessons.read",
  "schedule.lessons.manage",
  "notifications.user.read",
  "notifications.user.manage"
]);

const studentPermissions = new Set<Permission>([
  "billing.view",
  "billing.summary.read",
  "notifications.user.read",
  "notifications.user.manage",
  "payments.checkout.create",
  "payments.view",
  "payments.history.read",
  "payments.status.read",
  "practice.attempts.submit",
  "schedule.view",
  "schedule.lessons.read",
  "word_cards.train",
  "words.sessions.complete"
]);

const rbacAuthoritativePilotPermissions = new Map<Permission, Permission>([
  ["notifications.manage", "notifications.manage"],
  ["notifications.admin.read", "notifications.manage"],
  ["notifications.admin.manage", "notifications.manage"]
]);

function actorHasRole(actor: PermissionActor, role: UserRole) {
  return actor.role === role || actor.profileRole === role;
}

function isAdminActor(actor: PermissionActor) {
  return actorHasRole(actor, "admin");
}

function isManagerActor(actor: PermissionActor) {
  return actorHasRole(actor, "manager") && !isAdminActor(actor);
}

function isStaffAdminActor(actor: PermissionActor) {
  return Boolean(actor.isStaffAdmin) || isAdminActor(actor) || isManagerActor(actor);
}

function isTeacherActor(actor: PermissionActor) {
  return Boolean(actor.isTeacher) || actorHasRole(actor, "teacher");
}

function isStudentActor(actor: PermissionActor) {
  return Boolean(actor.isStudent) || actorHasRole(actor, "student");
}

function canUseStudentRuntimePermission(actor: PermissionActor) {
  if (!isStudentActor(actor)) return false;
  if (!isTeacherActor(actor)) return true;
  return Boolean(actor.studentId) && actorHasRole(actor, "student");
}

function isTeacherAllowedForStudent(actor: PermissionActor, studentId: string | null | undefined) {
  if (!studentId) return false;
  if (!isTeacherActor(actor)) return false;
  const accessibleStudentIds = actor.accessibleStudentIds;
  return Array.isArray(accessibleStudentIds) ? accessibleStudentIds.includes(studentId) : false;
}

function isStudentAllowedForStudent(actor: PermissionActor, studentId: string | null | undefined) {
  if (!studentId) return false;
  if (!isStudentActor(actor)) return false;
  return actor.studentId === studentId;
}

function hasLoadedRbacMetadata(actor: PermissionActor) {
  return Boolean(
    (Array.isArray(actor.rbacRoles) && actor.rbacRoles.length > 0) ||
      (Array.isArray(actor.rbacPermissions) && actor.rbacPermissions.length > 0) ||
      (actor.rbacPermissionScopes && Object.keys(actor.rbacPermissionScopes).length > 0)
  );
}

function canUseRbacPermission(
  actor: PermissionActor,
  permission: Permission,
  allowedScopes: string[] = ["all"]
) {
  if (!hasLoadedRbacMetadata(actor)) {
    return null;
  }

  if (!actor.rbacPermissions?.includes(permission)) {
    return false;
  }

  const grantedScopes = actor.rbacPermissionScopes?.[permission] ?? [];
  if (allowedScopes.length === 0) {
    return true;
  }

  return grantedScopes.some((scope) => scope === "all" || allowedScopes.includes(scope));
}

export function can(actor: PermissionActor | null | undefined, permission: Permission, resource: PermissionResource = {}) {
  if (!actor) return false;

  const rbacPilotPermission = rbacAuthoritativePilotPermissions.get(permission);
  if (rbacPilotPermission) {
    const rbacDecision = canUseRbacPermission(actor, rbacPilotPermission, ["all"]);
    if (rbacDecision !== null) {
      return rbacDecision;
    }
  }

  if (permission === "word_cards.demo_train") {
    return false;
  }

  if (permission === "settings.profile.read" || permission === "settings.profile.update" || permission === "profile.view" || permission === "profile.update") {
    return Boolean(actor.userId && resource.ownerUserId && actor.userId === resource.ownerUserId);
  }

  if (studentRuntimePermissions.has(permission) && canUseStudentRuntimePermission(actor)) {
    if (permission === "billing.view" || permission === "billing.summary.read") {
      return isStudentAllowedForStudent(actor, resource.studentId);
    }
    return true;
  }

  if (isAdminActor(actor)) {
    return adminPermissions.has(permission);
  }

  if (isManagerActor(actor)) {
    return managerPermissions.has(permission);
  }

  if (isStaffAdminActor(actor)) {
    return false;
  }

  if (isTeacherActor(actor)) {
    if (!teacherPermissions.has(permission)) return false;
    if (permission.startsWith("students.") && !("studentId" in resource)) {
      return true;
    }
    if (
      permission.startsWith("students.") ||
      permission.startsWith("billing.") ||
      permission === "homework.assign" ||
      permission === "learning.placement.assign"
    ) {
      return isTeacherAllowedForStudent(actor, resource.studentId);
    }
    return true;
  }

  if (isStudentActor(actor)) {
    if (!studentPermissions.has(permission)) return false;
    if (permission === "billing.view" || permission === "billing.summary.read") {
      return isStudentAllowedForStudent(actor, resource.studentId);
    }
    return true;
  }

  return false;
}

export function requirePermission(
  actor: PermissionActor | null | undefined,
  permission: Permission,
  resource?: PermissionResource
): asserts actor is PermissionActor {
  if (!can(actor, permission, resource)) {
    throw new PermissionError("Permission denied");
  }
}
