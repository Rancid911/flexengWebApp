import type { UserRole } from "@/lib/auth/get-user-role";

export const permissions = [
  "admin.users.read",
  "admin.users.create",
  "admin.users.update",
  "admin.users.delete",
  "admin.dashboard.read",
  "admin.teachers.read",
  "admin.teachers.update",
  "crm.leads.read",
  "crm.leads.update",
  "crm.leads.delete",
  "crm.settings.read",
  "crm.settings.update",
  "students.notes.read",
  "students.notes.write",
  "billing.admin.read",
  "billing.adjustments.create",
  "billing.reminders.manage",
  "billing.settings.update",
  "billing.summary.read",
  "homework.assign",
  "learning.content.manage",
  "learning.placement.assign",
  "learning.tests.manage",
  "notifications.admin.read",
  "notifications.admin.manage",
  "notifications.user.read",
  "notifications.user.manage",
  "payments.checkout.create",
  "payments.history.read",
  "payments.status.read",
  "practice.attempts.submit",
  "schedule.followups.read",
  "schedule.followups.manage",
  "schedule.lessons.read",
  "schedule.lessons.manage",
  "settings.profile.read",
  "settings.profile.update",
  "content.posts.manage",
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
  "payments.history.read",
  "payments.status.read",
  "practice.attempts.submit",
  "words.sessions.complete"
]);

const staffAdminPermissions = new Set<Permission>(permissions.filter((permission) => !studentRuntimePermissions.has(permission)));

const teacherPermissions = new Set<Permission>([
  "students.notes.read",
  "students.notes.write",
  "billing.adjustments.create",
  "billing.summary.read",
  "homework.assign",
  "learning.placement.assign",
  "schedule.followups.read",
  "schedule.followups.manage",
  "schedule.lessons.read",
  "schedule.lessons.manage",
  "notifications.user.read",
  "notifications.user.manage"
]);

const studentPermissions = new Set<Permission>([
  "billing.summary.read",
  "notifications.user.read",
  "notifications.user.manage",
  "payments.checkout.create",
  "payments.history.read",
  "payments.status.read",
  "practice.attempts.submit",
  "schedule.lessons.read",
  "words.sessions.complete"
]);

function actorHasRole(actor: PermissionActor, role: UserRole) {
  return actor.role === role || actor.profileRole === role;
}

function isStaffAdminActor(actor: PermissionActor) {
  return Boolean(actor.isStaffAdmin) || actorHasRole(actor, "admin") || actorHasRole(actor, "manager");
}

function isTeacherActor(actor: PermissionActor) {
  return Boolean(actor.isTeacher) || actorHasRole(actor, "teacher");
}

function isStudentActor(actor: PermissionActor) {
  return Boolean(actor.isStudent) || actorHasRole(actor, "student");
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

export function can(actor: PermissionActor | null | undefined, permission: Permission, resource: PermissionResource = {}) {
  if (!actor) return false;

  if (permission === "settings.profile.read" || permission === "settings.profile.update") {
    return Boolean(actor.userId && resource.ownerUserId && actor.userId === resource.ownerUserId);
  }

  if (isStaffAdminActor(actor)) {
    return staffAdminPermissions.has(permission);
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
    if (permission === "billing.summary.read") {
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
