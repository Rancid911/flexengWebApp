import type { UserRole } from "@/lib/auth/get-user-role";
import {
  permissions,
  rbacAuthoritativePermissionAliases
} from "@/lib/permissions/registry";

export { permissions };

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
  rbacStatus?: "loaded" | "empty" | "error" | null;
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

const rbacAuthoritativePilotPermissions = new Map<Permission, Permission>(rbacAuthoritativePermissionAliases);

const rbacAuthoritativePilotScopes = new Map<Permission, string[]>([
  ["roles.view", ["all"]],
  ["roles.manage", ["all"]],
  ["profile.view", ["all", "own"]],
  ["profile.update", ["all", "own"]],
  ["students.view", ["all", "assigned"]],
  ["teacher_scope.view_assigned", ["all", "assigned"]],
  ["student_progress.view", ["all", "assigned", "own"]],
  ["learning.preview_as_student", ["own_demo"]],
  ["homework.view", ["all", "assigned", "own"]],
  ["homework.assign", ["all", "assigned"]],
  ["homework.submit", ["own"]],
  ["billing.view", ["all", "assigned", "own"]],
  ["billing.adjust", ["all"]],
  ["payments.view", ["all", "own"]],
  ["payments.manage", ["all"]],
  ["crm.access", ["all"]],
  ["schedule.view", ["all", "assigned", "own"]],
  ["schedule.manage", ["all", "assigned"]],
  ["notifications.view", ["all", "own"]],
  ["search.ui", ["all", "assigned", "own"]],
  ["word_cards.train", ["own"]],
  ["word_cards.demo_train", ["own_demo"]]
]);

function isTeacherActor(actor: PermissionActor) {
  return Boolean(actor.isTeacher || actor.teacherId);
}

function isStudentActor(actor: PermissionActor) {
  return Boolean(actor.isStudent || actor.studentId);
}

function canUseStudentRuntimePermission(actor: PermissionActor) {
  if (!isStudentActor(actor)) return false;
  if (isTeacherActor(actor)) return false;
  return Boolean(actor.studentId);
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

function hasRbacMetadata(actor: PermissionActor) {
  return Boolean(
    (Array.isArray(actor.rbacRoles) && actor.rbacRoles.length > 0) ||
      (Array.isArray(actor.rbacPermissions) && actor.rbacPermissions.length > 0) ||
      (actor.rbacPermissionScopes && Object.keys(actor.rbacPermissionScopes).length > 0)
  );
}

function getRbacStatus(actor: PermissionActor) {
  return actor.rbacStatus ?? (hasRbacMetadata(actor) ? "loaded" : "empty");
}

function hasLoadedRbacMetadata(actor: PermissionActor) {
  return getRbacStatus(actor) === "loaded" && hasRbacMetadata(actor);
}

function canUseRbacPermission(
  actor: PermissionActor,
  permission: Permission,
  allowedScopes: string[] = ["all"]
) {
  if (!hasLoadedRbacMetadata(actor)) return false;

  if (!actor.rbacPermissions?.includes(permission)) {
    return false;
  }

  const grantedScopes = actor.rbacPermissionScopes?.[permission] ?? [];
  if (allowedScopes.length === 0) {
    return true;
  }

  return grantedScopes.some((scope) => scope === "all" || allowedScopes.includes(scope));
}

function hasRbacPermissionScope(actor: PermissionActor, permission: Permission, scope: string) {
  return actor.rbacPermissionScopes?.[permission]?.includes(scope) ?? false;
}

function isOwnProfilePermission(permission: Permission) {
  return permission === "settings.profile.read" || permission === "settings.profile.update" || permission === "profile.view" || permission === "profile.update";
}

function isOwnProfileResource(actor: PermissionActor, resource: PermissionResource) {
  return Boolean(actor.userId && resource.ownerUserId && actor.userId === resource.ownerUserId);
}

function isHomeworkAssignPermission(permission: Permission) {
  return permission === "homework.assign" || permission === "learning.placement.assign";
}

function isHomeworkSubmitPermission(permission: Permission) {
  return permission === "homework.submit";
}

function isPracticeAttemptSubmitPermission(permission: Permission) {
  return permission === "practice.attempts.submit";
}

function isStudentProgressPermission(permission: Permission) {
  return permission === "student_progress.view";
}

function isTeacherScopeViewAssignedPermission(permission: Permission) {
  return permission === "teacher_scope.view_assigned";
}

function isLearningPreviewAsStudentPermission(permission: Permission) {
  return permission === "learning.preview_as_student";
}

function isStudentPaymentSelfServicePermission(permission: Permission) {
  return (
    permission === "payments.checkout.create" ||
    permission === "payments.history.read" ||
    permission === "payments.status.read"
  );
}

function isBillingViewPermission(permission: Permission) {
  return permission === "billing.view" || permission === "billing.summary.read";
}

function isStudentNotesWritePermission(permission: Permission) {
  return permission === "students.notes.write";
}

function isStudentNotesReadPermission(permission: Permission) {
  return permission === "students.notes.read";
}

function isWordCardsTrainPermission(permission: Permission) {
  return permission === "word_cards.train" || permission === "words.sessions.complete";
}

function isWordCardsDemoTrainPermission(permission: Permission) {
  return permission === "word_cards.demo_train";
}

function canUseStudentScopedRbacPermission(actor: PermissionActor, permission: Permission, resource: PermissionResource) {
  if (!resource.studentId) return true;
  return (
    hasRbacPermissionScope(actor, permission, "all") ||
    (hasRbacPermissionScope(actor, permission, "assigned") && isTeacherAllowedForStudent(actor, resource.studentId)) ||
    (hasRbacPermissionScope(actor, permission, "own") && isStudentAllowedForStudent(actor, resource.studentId))
  );
}

function canUseStudentNotesWriteRbacPermission(actor: PermissionActor, resource: PermissionResource) {
  if (!hasLoadedRbacMetadata(actor)) return false;
  if (hasRbacPermissionScope(actor, "students.manage", "all")) return true;

  const hasAssignedTeacherNotesGrant =
    isTeacherActor(actor) &&
    (hasRbacPermissionScope(actor, "students.view", "assigned") ||
      hasRbacPermissionScope(actor, "teacher_scope.view_assigned", "assigned"));

  if (!hasAssignedTeacherNotesGrant) return false;
  if (!resource.studentId) return true;
  return isTeacherAllowedForStudent(actor, resource.studentId);
}

function canUseStudentNotesReadRbacPermission(actor: PermissionActor, resource: PermissionResource) {
  if (!hasLoadedRbacMetadata(actor)) return false;
  if (hasRbacPermissionScope(actor, "students.view", "all")) return true;

  const hasAssignedTeacherNotesGrant =
    isTeacherActor(actor) &&
    (hasRbacPermissionScope(actor, "students.view", "assigned") ||
      hasRbacPermissionScope(actor, "teacher_scope.view_assigned", "assigned"));

  if (!hasAssignedTeacherNotesGrant) return false;
  if (!resource.studentId) return true;
  return isTeacherAllowedForStudent(actor, resource.studentId);
}

export function can(actor: PermissionActor | null | undefined, permission: Permission, resource: PermissionResource = {}) {
  if (!actor) return false;
  if (!hasLoadedRbacMetadata(actor)) return false;

  if (isStudentNotesReadPermission(permission)) {
    return canUseStudentNotesReadRbacPermission(actor, resource);
  }

  if (isStudentNotesWritePermission(permission)) {
    return canUseStudentNotesWriteRbacPermission(actor, resource);
  }

  const rbacPilotPermission = rbacAuthoritativePilotPermissions.get(permission);
  if (rbacPilotPermission) {
    const rbacDecision = canUseRbacPermission(actor, rbacPilotPermission, rbacAuthoritativePilotScopes.get(rbacPilotPermission) ?? ["all"]);
    if (isOwnProfilePermission(permission)) {
      return rbacDecision && isOwnProfileResource(actor, resource);
    }
      if (isStudentProgressPermission(permission)) {
        return rbacDecision && canUseStudentScopedRbacPermission(actor, rbacPilotPermission, resource);
      }
      if (isBillingViewPermission(permission)) {
        return rbacDecision && canUseStudentScopedRbacPermission(actor, rbacPilotPermission, resource);
      }
    if (isTeacherScopeViewAssignedPermission(permission)) {
      return rbacDecision && canUseStudentScopedRbacPermission(actor, rbacPilotPermission, resource);
    }
    if (isLearningPreviewAsStudentPermission(permission)) {
      return rbacDecision && hasRbacPermissionScope(actor, rbacPilotPermission, "own_demo");
    }
    if (isHomeworkAssignPermission(permission)) {
      return (
        rbacDecision &&
        (hasRbacPermissionScope(actor, rbacPilotPermission, "all") ||
          (hasRbacPermissionScope(actor, rbacPilotPermission, "assigned") && isTeacherAllowedForStudent(actor, resource.studentId)))
      );
    }
    if (isHomeworkSubmitPermission(permission)) {
      return rbacDecision && hasRbacPermissionScope(actor, rbacPilotPermission, "own") && canUseStudentRuntimePermission(actor) && isStudentAllowedForStudent(actor, resource.studentId);
    }
    if (isPracticeAttemptSubmitPermission(permission)) {
      return rbacDecision && hasRbacPermissionScope(actor, rbacPilotPermission, "own") && canUseStudentRuntimePermission(actor);
    }
    if (isStudentPaymentSelfServicePermission(permission)) {
      return rbacDecision && canUseStudentRuntimePermission(actor);
    }
    if (isWordCardsTrainPermission(permission)) {
      return rbacDecision && hasRbacPermissionScope(actor, rbacPilotPermission, "own") && canUseStudentRuntimePermission(actor);
    }
    if (isWordCardsDemoTrainPermission(permission)) {
      return rbacDecision && hasRbacPermissionScope(actor, rbacPilotPermission, "own_demo");
    }
    return rbacDecision;
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
