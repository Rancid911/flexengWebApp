import { describe, expect, it } from "vitest";

import { can, PermissionError, requirePermission } from "@/lib/permissions";

describe("permissions", () => {
  it("separates manager operational permissions from admin-only permissions", () => {
    const manager = { userId: "manager-1", role: "manager" as const };
    const admin = { userId: "admin-1", role: "admin" as const };

    expect(can(manager, "crm.leads.read")).toBe(true);
    expect(can(manager, "crm.leads.update")).toBe(true);
    expect(can(manager, "crm.leads.view")).toBe(true);
    expect(can(manager, "crm.leads.manage")).toBe(true);
    expect(can(manager, "crm.settings.read")).toBe(true);
    expect(can(manager, "crm.settings.update")).toBe(true);
    expect(can(manager, "users.view")).toBe(true);
    expect(can(manager, "users.manage")).toBe(false);
    expect(can(manager, "admin.users.create")).toBe(false);
    expect(can(manager, "admin.users.update")).toBe(false);
    expect(can(manager, "admin.users.delete")).toBe(false);
    expect(can(manager, "admin.dashboard.read")).toBe(false);
    expect(can(manager, "roles.view")).toBe(false);
    expect(can(manager, "roles.manage")).toBe(false);
    expect(can(manager, "teachers.view")).toBe(true);
    expect(can(manager, "teachers.manage")).toBe(true);
    expect(can(manager, "admin.teachers.read")).toBe(true);
    expect(can(manager, "admin.teachers.update")).toBe(true);
    expect(can(manager, "billing.admin.read")).toBe(true);
    expect(can(manager, "billing.view")).toBe(true);
    expect(can(manager, "billing.summary.read")).toBe(true);
    expect(can(manager, "billing.adjust")).toBe(true);
    expect(can(manager, "billing.settings.update")).toBe(true);
    expect(can(manager, "billing.reminders.manage")).toBe(true);
    expect(can(manager, "content.manage")).toBe(true);
    expect(can(manager, "learning.content.manage")).toBe(true);
    expect(can(manager, "learning.placement.assign")).toBe(true);
    expect(can(manager, "learning.tests.manage")).toBe(true);
    expect(can(manager, "notifications.manage")).toBe(true);
    expect(can(manager, "notifications.admin.read")).toBe(true);
    expect(can(manager, "notifications.admin.manage")).toBe(true);
    expect(can(manager, "notifications.user.read")).toBe(true);
    expect(can(manager, "notifications.user.manage")).toBe(true);
    expect(can(manager, "profile.view", { ownerUserId: "manager-1" })).toBe(true);
    expect(can(manager, "profile.update", { ownerUserId: "manager-1" })).toBe(true);
    expect(can(manager, "profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(manager, "settings.profile.read", { ownerUserId: "manager-1" })).toBe(true);
    expect(can(manager, "settings.profile.update", { ownerUserId: "manager-1" })).toBe(true);
    expect(can(manager, "settings.profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(manager, "payments.checkout.create")).toBe(false);
    expect(can(manager, "payments.view")).toBe(true);
    expect(can(manager, "payments.manage")).toBe(true);
    expect(can(manager, "payments.history.read")).toBe(false);
    expect(can(manager, "payments.status.read")).toBe(false);
    expect(can(manager, "practice.attempts.submit")).toBe(false);
    expect(can(manager, "schedule.followups.read")).toBe(true);
    expect(can(manager, "schedule.followups.manage")).toBe(true);
    expect(can(manager, "schedule.view")).toBe(true);
    expect(can(manager, "schedule.manage")).toBe(true);
    expect(can(manager, "schedule.lessons.read")).toBe(true);
    expect(can(manager, "schedule.lessons.manage")).toBe(true);
    expect(can(manager, "word_cards.manage")).toBe(true);
    expect(can(manager, "words.cardSets.manage")).toBe(true);
    expect(can(manager, "word_cards.train")).toBe(false);
    expect(can(manager, "word_cards.demo_train")).toBe(false);
    expect(can(manager, "words.sessions.complete")).toBe(false);

    expect(can(admin, "users.manage")).toBe(true);
    expect(can(admin, "admin.users.create")).toBe(true);
    expect(can(admin, "admin.users.update")).toBe(true);
    expect(can(admin, "admin.users.delete")).toBe(true);
    expect(can(admin, "admin.dashboard.read")).toBe(true);
    expect(can(admin, "roles.view")).toBe(true);
    expect(can(admin, "roles.manage")).toBe(true);
    expect(can(admin, "payments.checkout.create")).toBe(false);
    expect(can(admin, "practice.attempts.submit")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for admin notification management", () => {
    const adminWithGrant = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["notifications.manage"],
      rbacPermissionScopes: {
        "notifications.manage": ["all"]
      }
    };
    const managerWithGrant = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["notifications.manage"],
      rbacPermissionScopes: {
        "notifications.manage": ["all"]
      }
    };
    const adminWithoutGrant = {
      userId: "admin-2",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    };
    const managerWithoutGrant = {
      userId: "manager-2",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["all"]
      }
    };

    expect(can(adminWithGrant, "notifications.manage")).toBe(true);
    expect(can(managerWithGrant, "notifications.manage")).toBe(true);
    expect(can(adminWithGrant, "notifications.admin.read")).toBe(true);
    expect(can(managerWithGrant, "notifications.admin.manage")).toBe(true);

    expect(can(adminWithoutGrant, "notifications.manage")).toBe(false);
    expect(can(managerWithoutGrant, "notifications.manage")).toBe(false);
    expect(can(adminWithoutGrant, "notifications.admin.read")).toBe(false);
    expect(can(managerWithoutGrant, "notifications.admin.manage")).toBe(false);

    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "notifications.manage")).toBe(true);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "notifications.manage")).toBe(true);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "notifications.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.user.read")).toBe(true);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.user.manage")).toBe(true);
  });

  it("allows teachers to manage scoped student work", () => {
    const teacher = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"]
    };

    expect(can(teacher, "students.notes.write", { studentId: "student-1" })).toBe(true);
    expect(can(teacher, "homework.assign", { studentId: "student-1" })).toBe(true);
    expect(can(teacher, "learning.placement.assign", { studentId: "student-1" })).toBe(true);
    expect(can(teacher, "learning.placement.assign", { studentId: "student-2" })).toBe(false);
    expect(can(teacher, "schedule.followups.read")).toBe(true);
    expect(can(teacher, "schedule.followups.manage")).toBe(true);
    expect(can(teacher, "schedule.view")).toBe(true);
    expect(can(teacher, "schedule.manage")).toBe(true);
    expect(can(teacher, "schedule.lessons.read")).toBe(true);
    expect(can(teacher, "schedule.lessons.manage")).toBe(true);
    expect(can(teacher, "billing.view", { studentId: "student-1" })).toBe(true);
    expect(can(teacher, "billing.view", { studentId: "student-2" })).toBe(false);
    expect(can(teacher, "billing.summary.read", { studentId: "student-1" })).toBe(true);
    expect(can(teacher, "billing.summary.read", { studentId: "student-2" })).toBe(false);
    expect(can(teacher, "billing.adjust", { studentId: "student-1" })).toBe(false);
    expect(can(teacher, "billing.adjust", { studentId: "student-2" })).toBe(false);
    expect(can(teacher, "billing.adjustments.create", { studentId: "student-1" })).toBe(false);
    expect(can(teacher, "billing.adjustments.create", { studentId: "student-2" })).toBe(false);
    expect(can(teacher, "notifications.user.read")).toBe(true);
    expect(can(teacher, "notifications.user.manage")).toBe(true);
    expect(can(teacher, "profile.view", { ownerUserId: "teacher-profile-1" })).toBe(true);
    expect(can(teacher, "profile.update", { ownerUserId: "teacher-profile-1" })).toBe(true);
    expect(can(teacher, "profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(teacher, "settings.profile.read", { ownerUserId: "teacher-profile-1" })).toBe(true);
    expect(can(teacher, "settings.profile.update", { ownerUserId: "teacher-profile-1" })).toBe(true);
    expect(can(teacher, "settings.profile.update", { ownerUserId: "other-user" })).toBe(false);
  });

  it("denies teacher student-scoped permissions when scope is missing or invalid", () => {
    const scopedPermissions = [
      "students.notes.write",
      "homework.assign",
      "learning.placement.assign",
      "billing.view",
      "billing.adjust",
      "billing.summary.read",
      "billing.adjustments.create"
    ] as const;
    const teacherWithNullScope = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: null
    };
    const teacherWithMissingScope = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1"
    };
    const teacherWithMalformedScope = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: "student-1"
    } as unknown as Parameters<typeof can>[0];

    for (const permission of scopedPermissions) {
      expect(can(teacherWithNullScope, permission, { studentId: "student-1" })).toBe(false);
      expect(can(teacherWithMissingScope, permission, { studentId: "student-1" })).toBe(false);
      expect(can(teacherWithMalformedScope, permission, { studentId: "student-1" })).toBe(false);
    }

    for (const permission of scopedPermissions.filter((permission) => permission !== "students.notes.write")) {
      expect(can({ ...teacherWithNullScope, accessibleStudentIds: ["student-1"] }, permission)).toBe(false);
    }
    expect(can(teacherWithNullScope, "students.notes.write")).toBe(true);
  });

  it("does not allow teachers to use staff-only permissions", () => {
    const teacher = { userId: "teacher-profile-1", role: "teacher" as const };

    expect(can(teacher, "crm.leads.read")).toBe(false);
    expect(can(teacher, "crm.leads.view")).toBe(false);
    expect(can(teacher, "crm.leads.manage")).toBe(false);
    expect(can(teacher, "crm.settings.update")).toBe(false);
    expect(can(teacher, "billing.admin.read")).toBe(false);
    expect(can(teacher, "billing.settings.update", { studentId: "student-1" })).toBe(false);
    expect(can(teacher, "billing.reminders.manage")).toBe(false);
    expect(can(teacher, "practice.attempts.submit")).toBe(false);
    expect(can(teacher, "content.manage")).toBe(false);
    expect(can(teacher, "learning.content.manage")).toBe(false);
    expect(can(teacher, "learning.tests.manage")).toBe(false);
    expect(can(teacher, "notifications.manage")).toBe(false);
    expect(can(teacher, "notifications.admin.read")).toBe(false);
    expect(can(teacher, "notifications.admin.manage")).toBe(false);
    expect(can(teacher, "payments.checkout.create")).toBe(false);
    expect(can(teacher, "payments.history.read")).toBe(false);
    expect(can(teacher, "payments.manage")).toBe(false);
    expect(can(teacher, "payments.status.read")).toBe(false);
    expect(can(teacher, "word_cards.manage")).toBe(false);
    expect(can(teacher, "words.cardSets.manage")).toBe(false);
    expect(can(teacher, "word_cards.train")).toBe(false);
    expect(can(teacher, "word_cards.demo_train")).toBe(false);
    expect(can(teacher, "words.sessions.complete")).toBe(false);
    expect(can(teacher, "admin.dashboard.read")).toBe(false);
    expect(can(teacher, "users.view")).toBe(false);
    expect(can(teacher, "users.manage")).toBe(false);
    expect(can(teacher, "teachers.view")).toBe(false);
    expect(can(teacher, "teachers.manage")).toBe(false);
    expect(can(teacher, "admin.teachers.read")).toBe(false);
    expect(can(teacher, "admin.teachers.update")).toBe(false);
    expect(can(teacher, "admin.users.delete")).toBe(false);
  });

  it("allows confirmed real dual-role students to use student runtime permissions only", () => {
    const confirmedDualRoleStudent = {
      userId: "student-profile-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-1",
      teacherId: "teacher-1"
    };
    const teacherPreviewWithStudentRow = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1",
      teacherId: "teacher-1"
    };

    expect(can(confirmedDualRoleStudent, "practice.attempts.submit")).toBe(true);
    expect(can(confirmedDualRoleStudent, "word_cards.train")).toBe(true);
    expect(can(confirmedDualRoleStudent, "word_cards.demo_train")).toBe(false);
    expect(can(confirmedDualRoleStudent, "words.sessions.complete")).toBe(true);
    expect(can(confirmedDualRoleStudent, "students.notes.write", { studentId: "student-1" })).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "practice.attempts.submit")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "word_cards.train")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "word_cards.demo_train")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "words.sessions.complete")).toBe(false);
  });

  it("throws a transport-compatible permission error", () => {
    expect(can({ userId: "student-profile-1", role: "student", studentId: "student-1" }, "billing.summary.read", { studentId: "student-1" })).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student", studentId: "student-1" }, "billing.view", { studentId: "student-1" })).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student", studentId: "student-1" }, "billing.view", { studentId: "student-2" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student", studentId: "student-1" }, "billing.summary.read", { studentId: "student-2" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student", studentId: "student-1" }, "billing.settings.update", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "notifications.user.read")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "notifications.user.manage")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "profile.view", { ownerUserId: "student-profile-1" })).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "settings.profile.read", { ownerUserId: "student-profile-1" })).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "settings.profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "payments.checkout.create")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "payments.view")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "payments.manage")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "payments.history.read")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "payments.status.read")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "practice.attempts.submit")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "homework.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.lessons.read")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.view")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.manage")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "schedule.lessons.manage")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "word_cards.train")).toBe(true);
    expect(can({ userId: "student-profile-1", role: "student" }, "word_cards.demo_train")).toBe(false);
    expect(can({ userId: "student-profile-1", role: "student" }, "words.sessions.complete")).toBe(true);

    expect(() => requirePermission({ userId: "student-profile-1", role: "student" }, "admin.users.read")).toThrow(PermissionError);

    try {
      requirePermission({ userId: "student-profile-1", role: "student" }, "admin.users.read");
    } catch (error) {
      expect(error).toMatchObject({
        status: 403,
        code: "FORBIDDEN",
        message: "Permission denied"
      });
    }
  });
});
