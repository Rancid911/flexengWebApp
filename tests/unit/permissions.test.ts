import { describe, expect, it } from "vitest";

import { can, PermissionError, requirePermission, type PermissionActor } from "@/lib/permissions";

describe("permissions", () => {
  it("does not grant manager/admin permissions from profile role alone", () => {
    const manager = { userId: "manager-1", role: "manager" as const, profileRole: "manager" as const };
    const admin = { userId: "admin-1", role: "admin" as const, profileRole: "admin" as const };

    expect(can(manager, "crm.leads.read")).toBe(false);
    expect(can(manager, "crm.leads.update")).toBe(false);
    expect(can(manager, "crm.leads.view")).toBe(false);
    expect(can(manager, "crm.leads.manage")).toBe(false);
    expect(can(manager, "crm.settings.read")).toBe(false);
    expect(can(manager, "crm.settings.update")).toBe(false);
    expect(can(manager, "users.view")).toBe(false);
    expect(can(manager, "users.manage")).toBe(false);
    expect(can(manager, "admin.users.create")).toBe(false);
    expect(can(manager, "admin.users.update")).toBe(false);
    expect(can(manager, "admin.users.delete")).toBe(false);
    expect(can(manager, "admin.dashboard.read")).toBe(false);
    expect(can(manager, "roles.view")).toBe(false);
    expect(can(manager, "roles.manage")).toBe(false);
    expect(can(manager, "teachers.view")).toBe(false);
    expect(can(manager, "teachers.manage")).toBe(false);
    expect(can(manager, "admin.teachers.read")).toBe(false);
    expect(can(manager, "admin.teachers.update")).toBe(false);
    expect(can(manager, "billing.admin.read")).toBe(false);
    expect(can(manager, "billing.view")).toBe(false);
    expect(can(manager, "billing.summary.read")).toBe(false);
    expect(can(manager, "billing.adjust")).toBe(false);
    expect(can(manager, "billing.settings.update")).toBe(false);
    expect(can(manager, "billing.reminders.manage")).toBe(false);
    expect(can(manager, "content.manage")).toBe(false);
    expect(can(manager, "learning.content.manage")).toBe(false);
    expect(can(manager, "learning.placement.assign")).toBe(false);
    expect(can(manager, "learning.tests.manage")).toBe(false);
    expect(can(manager, "notifications.manage")).toBe(false);
    expect(can(manager, "notifications.admin.read")).toBe(false);
    expect(can(manager, "notifications.admin.manage")).toBe(false);
    expect(can(manager, "notifications.user.read")).toBe(false);
    expect(can(manager, "notifications.user.manage")).toBe(false);
    expect(can(manager, "profile.view", { ownerUserId: "manager-1" })).toBe(false);
    expect(can(manager, "profile.update", { ownerUserId: "manager-1" })).toBe(false);
    expect(can(manager, "profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(manager, "settings.profile.read", { ownerUserId: "manager-1" })).toBe(false);
    expect(can(manager, "settings.profile.update", { ownerUserId: "manager-1" })).toBe(false);
    expect(can(manager, "settings.profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(manager, "payments.checkout.create")).toBe(false);
    expect(can(manager, "payments.view")).toBe(false);
    expect(can(manager, "payments.manage")).toBe(false);
    expect(can(manager, "payments.history.read")).toBe(false);
    expect(can(manager, "payments.status.read")).toBe(false);
    expect(can(manager, "practice.attempts.submit")).toBe(false);
    expect(can(manager, "schedule.followups.read")).toBe(false);
    expect(can(manager, "schedule.followups.manage")).toBe(false);
    expect(can(manager, "schedule.view")).toBe(false);
    expect(can(manager, "schedule.manage")).toBe(false);
    expect(can(manager, "schedule.lessons.read")).toBe(false);
    expect(can(manager, "schedule.lessons.manage")).toBe(false);
    expect(can(manager, "search.ui")).toBe(false);
    expect(can(manager, "word_cards.manage")).toBe(false);
    expect(can(manager, "words.cardSets.manage")).toBe(false);
    expect(can(manager, "word_cards.train")).toBe(false);
    expect(can(manager, "word_cards.demo_train")).toBe(false);
    expect(can(manager, "words.sessions.complete")).toBe(false);

    expect(can(admin, "users.manage")).toBe(false);
    expect(can(admin, "admin.users.create")).toBe(false);
    expect(can(admin, "admin.users.update")).toBe(false);
    expect(can(admin, "admin.users.delete")).toBe(false);
    expect(can(admin, "admin.dashboard.read")).toBe(false);
    expect(can(admin, "roles.view")).toBe(false);
    expect(can(admin, "roles.manage")).toBe(false);
    expect(can(admin, "payments.checkout.create")).toBe(false);
    expect(can(admin, "practice.attempts.submit")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for roles permissions", () => {
    const actorWithRolesScope = (permission: "roles.view" | "roles.manage", scope: string) => ({
      userId: `${permission}-${scope}`,
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: [permission],
      rbacPermissionScopes: {
        [permission]: [scope]
      }
    });
    const adminWithoutRoleGrants = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["users.manage"],
      rbacPermissionScopes: {
        "users.manage": ["all"]
      }
    };

    expect(can(actorWithRolesScope("roles.view", "all"), "roles.view")).toBe(true);
    expect(can(actorWithRolesScope("roles.view", "own"), "roles.view")).toBe(false);
    expect(can(actorWithRolesScope("roles.view", "assigned"), "roles.view")).toBe(false);
    expect(can(actorWithRolesScope("roles.manage", "all"), "roles.manage")).toBe(true);
    expect(can(actorWithRolesScope("roles.manage", "own"), "roles.manage")).toBe(false);
    expect(can(actorWithRolesScope("roles.manage", "assigned"), "roles.manage")).toBe(false);
    expect(can(adminWithoutRoleGrants, "roles.view")).toBe(false);
    expect(can(adminWithoutRoleGrants, "roles.manage")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "roles.view")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const }, "roles.manage")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "roles.view")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "roles.manage")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "roles.view")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for canonical metadata permissions", () => {
    const teacherScopeActor = (scope: string) => ({
      userId: `teacher-scope-${scope}`,
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["teacher_scope.view_assigned"],
      rbacPermissionScopes: {
        "teacher_scope.view_assigned": [scope]
      }
    });
    const previewActor = (scope: string) => ({
      userId: `preview-${scope}`,
      role: "teacher" as const,
      teacherId: "teacher-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["learning.preview_as_student"],
      rbacPermissionScopes: {
        "learning.preview_as_student": [scope]
      }
    });
    const crmAccessActor = (scope: string) => ({
      userId: `crm-access-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["crm.access"],
      rbacPermissionScopes: {
        "crm.access": [scope]
      }
    });
    const loadedWithoutMetadataGrants = {
      userId: "legacy-role-no-metadata-grant",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };

    expect(can(teacherScopeActor("assigned"), "teacher_scope.view_assigned", { studentId: "student-1" })).toBe(true);
    expect(can(teacherScopeActor("assigned"), "teacher_scope.view_assigned", { studentId: "student-2" })).toBe(false);
    expect(can(teacherScopeActor("assigned"), "teacher_scope.view_assigned")).toBe(true);
    expect(can(teacherScopeActor("all"), "teacher_scope.view_assigned", { studentId: "student-2" })).toBe(true);
    expect(can(teacherScopeActor("own"), "teacher_scope.view_assigned", { studentId: "student-1" })).toBe(false);
    expect(can(loadedWithoutMetadataGrants, "teacher_scope.view_assigned", { studentId: "student-1" })).toBe(false);

    expect(can(previewActor("own_demo"), "learning.preview_as_student")).toBe(true);
    expect(can(previewActor("own"), "learning.preview_as_student")).toBe(false);
    expect(can(previewActor("assigned"), "learning.preview_as_student")).toBe(false);
    expect(can(previewActor("all"), "learning.preview_as_student")).toBe(false);
    expect(can(loadedWithoutMetadataGrants, "learning.preview_as_student")).toBe(false);

    expect(can(crmAccessActor("all"), "crm.access")).toBe(true);
    expect(can(crmAccessActor("own"), "crm.access")).toBe(false);
    expect(can(crmAccessActor("assigned"), "crm.access")).toBe(false);
    expect(can(loadedWithoutMetadataGrants, "crm.access")).toBe(false);

    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "teacher_scope.view_assigned")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const }, "learning.preview_as_student")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "crm.access")).toBe(false);
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

    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "notifications.manage")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "notifications.manage")).toBe(false);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "notifications.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.view")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.user.read")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "notifications.user.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for user notification read permissions", () => {
    const actorWithNotificationViewScope = (scope: string) => ({
      userId: `notifications-${scope}`,
      role: "student" as const,
      rbacRoles: ["student"],
      rbacPermissions: ["notifications.view"],
      rbacPermissionScopes: {
        "notifications.view": [scope]
      }
    });
    const adminWithoutNotificationView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["notifications.manage"],
      rbacPermissionScopes: {
        "notifications.manage": ["all"]
      }
    };
    const notificationReadAliases = ["notifications.view", "notifications.user.read", "notifications.user.manage"] as const;

    for (const permission of notificationReadAliases) {
      expect(can(actorWithNotificationViewScope("own"), permission)).toBe(true);
      expect(can(actorWithNotificationViewScope("all"), permission)).toBe(true);
      expect(can(actorWithNotificationViewScope("assigned"), permission)).toBe(false);
      expect(can(adminWithoutNotificationView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
    }

    expect(can({ userId: "manager-legacy", role: "manager" as const }, "notifications.view")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "notifications.view")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "notifications.view")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "notifications.user.read")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "notifications.user.read")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "notifications.user.read")).toBe(false);

    expect(can(adminWithoutNotificationView, "notifications.user.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const, rbacRoles: ["student"], rbacPermissions: ["notifications.view"], rbacPermissionScopes: { "notifications.view": ["own"] } }, "notifications.user.manage")).toBe(true);
    expect(can({ userId: "student-legacy", role: "student" as const }, "notifications.user.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for search UI access", () => {
    const actorWithSearchScope = (role: "admin" | "manager" | "teacher" | "student", scope: string) => ({
      userId: `${role}-search-${scope}`,
      role,
      rbacRoles: [role],
      rbacPermissions: ["search.ui"],
      rbacPermissionScopes: {
        "search.ui": [scope]
      }
    });
    const actorsWithoutGrant: PermissionActor[] = [
      { userId: "admin-1", role: "admin" as const, rbacRoles: ["admin"], rbacPermissions: ["profile.view"], rbacPermissionScopes: { "profile.view": ["own"] } },
      { userId: "manager-1", role: "manager" as const, rbacRoles: ["manager"], rbacPermissions: ["crm.leads.view"], rbacPermissionScopes: { "crm.leads.view": ["all"] } },
      { userId: "teacher-1", role: "teacher" as const, rbacRoles: ["teacher"], rbacPermissions: ["students.view"], rbacPermissionScopes: { "students.view": ["assigned"] } },
      { userId: "student-1", role: "student" as const, rbacRoles: ["student"], rbacPermissions: ["profile.view"], rbacPermissionScopes: { "profile.view": ["own"] } }
    ];

    expect(can(actorWithSearchScope("admin", "all"), "search.ui")).toBe(true);
    expect(can(actorWithSearchScope("manager", "all"), "search.ui")).toBe(true);
    expect(can(actorWithSearchScope("teacher", "assigned"), "search.ui")).toBe(true);
    expect(can(actorWithSearchScope("student", "own"), "search.ui")).toBe(true);

    for (const actor of actorsWithoutGrant) {
      expect(can(actor, "search.ui")).toBe(false);
    }

    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "search.ui")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "search.ui")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "search.ui")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "search.ui")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for admin content management", () => {
    const managerWithGrant = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["content.manage"],
      rbacPermissionScopes: {
        "content.manage": ["all"]
      }
    };
    const adminWithoutGrant = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    };
    const contentAliases = ["content.manage", "learning.content.manage", "learning.tests.manage", "content.posts.manage"] as const;

    for (const permission of contentAliases) {
      expect(can(managerWithGrant, permission)).toBe(true);
      expect(can(adminWithoutGrant, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for admin word-card catalog management", () => {
    const adminWithGrant = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["word_cards.manage"],
      rbacPermissionScopes: {
        "word_cards.manage": ["all"]
      }
    };
    const managerWithoutGrant = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["content.manage"],
      rbacPermissionScopes: {
        "content.manage": ["all"]
      }
    };

    expect(can(adminWithGrant, "word_cards.manage")).toBe(true);
    expect(can(adminWithGrant, "words.cardSets.manage")).toBe(true);
    expect(can(managerWithoutGrant, "word_cards.manage")).toBe(false);
    expect(can(managerWithoutGrant, "words.cardSets.manage")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "word_cards.manage")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "words.cardSets.manage")).toBe(false);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "word_cards.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "words.cardSets.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "word_cards.train")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "words.sessions.complete")).toBe(false);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "word_cards.demo_train")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for word-card train and demo permissions", () => {
    const studentWithTrainScope = (scope: string) => ({
      userId: `student-train-${scope}`,
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["word_cards.train"],
      rbacPermissionScopes: {
        "word_cards.train": [scope]
      }
    });
    const teacherWithDemoScope = (scope: string) => ({
      userId: `teacher-demo-${scope}`,
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isTeacher: true,
      teacherId: "teacher-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["word_cards.demo_train"],
      rbacPermissionScopes: {
        "word_cards.demo_train": [scope]
      }
    });
    const studentWithoutTrain = {
      userId: "student-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };
    const teacherPreviewWithTrainGrant = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1",
      teacherId: "teacher-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["word_cards.train"],
      rbacPermissionScopes: {
        "word_cards.train": ["own"]
      }
    };
    const confirmedDualRoleStudentWithTrainGrant = {
      userId: "student-profile-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-1",
      teacherId: "teacher-1",
      rbacRoles: ["student", "teacher"],
      rbacPermissions: ["word_cards.train"],
      rbacPermissionScopes: {
        "word_cards.train": ["own"]
      }
    };

    expect(can(studentWithTrainScope("own"), "word_cards.train")).toBe(true);
    expect(can(studentWithTrainScope("own"), "words.sessions.complete")).toBe(true);
    expect(can(studentWithTrainScope("assigned"), "word_cards.train")).toBe(false);
    expect(can(studentWithTrainScope("assigned"), "words.sessions.complete")).toBe(false);
    expect(can(studentWithTrainScope("all"), "word_cards.train")).toBe(false);
    expect(can(studentWithTrainScope("all"), "words.sessions.complete")).toBe(false);
    expect(can(studentWithoutTrain, "word_cards.train")).toBe(false);
    expect(can(studentWithoutTrain, "words.sessions.complete")).toBe(false);
    expect(can(teacherPreviewWithTrainGrant, "word_cards.train")).toBe(false);
    expect(can(teacherPreviewWithTrainGrant, "words.sessions.complete")).toBe(false);
    expect(can(confirmedDualRoleStudentWithTrainGrant, "word_cards.train")).toBe(false);
    expect(can(confirmedDualRoleStudentWithTrainGrant, "words.sessions.complete")).toBe(false);

    expect(can(teacherWithDemoScope("own_demo"), "word_cards.demo_train")).toBe(true);
    expect(can(teacherWithDemoScope("own"), "word_cards.demo_train")).toBe(false);
    expect(can(teacherWithDemoScope("assigned"), "word_cards.demo_train")).toBe(false);
    expect(can(teacherWithDemoScope("all"), "word_cards.demo_train")).toBe(false);
    expect(can(studentWithoutTrain, "word_cards.demo_train")).toBe(false);

    expect(can({ userId: "student-legacy", role: "student" as const }, "word_cards.train")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "words.sessions.complete")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "word_cards.train")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "words.sessions.complete")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "word_cards.train")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "words.sessions.complete")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const }, "word_cards.train")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const }, "words.sessions.complete")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "word_cards.demo_train")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "word_cards.demo_train")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for protected CRM read permissions", () => {
    const managerWithView = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["crm.leads.view"],
      rbacPermissionScopes: {
        "crm.leads.view": ["all"]
      }
    };
    const adminWithoutView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["content.manage"],
      rbacPermissionScopes: {
        "content.manage": ["all"]
      }
    };
    const crmReadAliases = ["crm.leads.view", "crm.leads.read", "crm.settings.read"] as const;

    for (const permission of crmReadAliases) {
      expect(can(managerWithView, permission)).toBe(true);
      expect(can(adminWithoutView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for protected CRM manage permissions", () => {
    const adminWithManage = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["crm.leads.manage"],
      rbacPermissionScopes: {
        "crm.leads.manage": ["all"]
      }
    };
    const managerWithoutManage = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["crm.leads.view"],
      rbacPermissionScopes: {
        "crm.leads.view": ["all"]
      }
    };
    const crmManageAliases = ["crm.leads.manage", "crm.leads.update", "crm.leads.delete", "crm.settings.update"] as const;

    for (const permission of crmManageAliases) {
      expect(can(adminWithManage, permission)).toBe(true);
      expect(can(managerWithoutManage, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for admin teacher read permissions", () => {
    const managerWithView = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["teachers.view"],
      rbacPermissionScopes: {
        "teachers.view": ["all"]
      }
    };
    const adminWithoutView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["crm.leads.view"],
      rbacPermissionScopes: {
        "crm.leads.view": ["all"]
      }
    };
    const teacherReadAliases = ["teachers.view", "admin.teachers.read"] as const;

    for (const permission of teacherReadAliases) {
      expect(can(managerWithView, permission)).toBe(true);
      expect(can(adminWithoutView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for admin teacher manage permissions", () => {
    const adminWithManage = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["teachers.manage"],
      rbacPermissionScopes: {
        "teachers.manage": ["all"]
      }
    };
    const managerWithoutManage = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["teachers.view"],
      rbacPermissionScopes: {
        "teachers.view": ["all"]
      }
    };
    const teacherManageAliases = ["teachers.manage", "admin.teachers.update"] as const;

    for (const permission of teacherManageAliases) {
      expect(can(adminWithManage, permission)).toBe(true);
      expect(can(managerWithoutManage, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for admin user read permissions", () => {
    const managerWithView = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    };
    const adminWithoutView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["teachers.view"],
      rbacPermissionScopes: {
        "teachers.view": ["all"]
      }
    };
    const userReadAliases = ["users.view", "admin.users.read"] as const;

    for (const permission of userReadAliases) {
      expect(can(managerWithView, permission)).toBe(true);
      expect(can(adminWithoutView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for admin user manage permissions", () => {
    const adminWithManage = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["users.manage"],
      rbacPermissionScopes: {
        "users.manage": ["all"]
      }
    };
    const managerWithoutManage = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    };
    const userManageAliases = ["users.manage", "admin.users.create", "admin.users.update", "admin.users.delete"] as const;

    for (const permission of userManageAliases) {
      expect(can(adminWithManage, permission)).toBe(true);
      expect(can(managerWithoutManage, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const }, permission)).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for own profile read permissions", () => {
    const actorWithProfileViewScope = (scope: string) => ({
      userId: "profile-owner-1",
      role: "student" as const,
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": [scope]
      }
    });
    const studentWithoutProfileView = {
      userId: "profile-owner-1",
      role: "student" as const,
      rbacRoles: ["student"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    };
    const profileReadAliases = ["profile.view", "settings.profile.read"] as const;

    for (const permission of profileReadAliases) {
      expect(can(actorWithProfileViewScope("own"), permission, { ownerUserId: "profile-owner-1" })).toBe(true);
      expect(can(actorWithProfileViewScope("all"), permission, { ownerUserId: "profile-owner-1" })).toBe(true);
      expect(can(actorWithProfileViewScope("assigned"), permission, { ownerUserId: "profile-owner-1" })).toBe(false);
      expect(can(studentWithoutProfileView, permission, { ownerUserId: "profile-owner-1" })).toBe(false);
      expect(can(actorWithProfileViewScope("all"), permission, { ownerUserId: "other-user" })).toBe(false);
      expect(can({ userId: "legacy-owner-1", role: "student" as const }, permission, { ownerUserId: "legacy-owner-1" })).toBe(false);
      expect(can({ userId: "legacy-owner-1", role: "student" as const }, permission, { ownerUserId: "other-user" })).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for own profile update permissions", () => {
    const actorWithProfileUpdateScope = (scope: string) => ({
      userId: "profile-owner-1",
      role: "teacher" as const,
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.update"],
      rbacPermissionScopes: {
        "profile.update": [scope]
      }
    });
    const teacherWithoutProfileUpdate = {
      userId: "profile-owner-1",
      role: "teacher" as const,
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };
    const profileUpdateAliases = ["profile.update", "settings.profile.update"] as const;

    for (const permission of profileUpdateAliases) {
      expect(can(actorWithProfileUpdateScope("own"), permission, { ownerUserId: "profile-owner-1" })).toBe(true);
      expect(can(actorWithProfileUpdateScope("all"), permission, { ownerUserId: "profile-owner-1" })).toBe(true);
      expect(can(actorWithProfileUpdateScope("assigned"), permission, { ownerUserId: "profile-owner-1" })).toBe(false);
      expect(can(teacherWithoutProfileUpdate, permission, { ownerUserId: "profile-owner-1" })).toBe(false);
      expect(can(actorWithProfileUpdateScope("all"), permission, { ownerUserId: "other-user" })).toBe(false);
      expect(can({ userId: "legacy-owner-1", role: "teacher" as const }, permission, { ownerUserId: "legacy-owner-1" })).toBe(false);
      expect(can({ userId: "legacy-owner-1", role: "teacher" as const }, permission, { ownerUserId: "other-user" })).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for student directory read permissions", () => {
    const managerWithAllView = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };
    const teacherWithAssignedView = {
      userId: "teacher-1",
      role: "teacher" as const,
      isTeacher: true,
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    };
    const adminWithoutView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    };

    expect(can(managerWithAllView, "students.view")).toBe(true);
    expect(can(teacherWithAssignedView, "students.view")).toBe(true);
    expect(can(adminWithoutView, "students.view")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "students.view")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "students.view")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "students.view")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "students.view")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for student management permissions", () => {
    const adminWithManage = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["students.manage"],
      rbacPermissionScopes: {
        "students.manage": ["all"]
      }
    };
    const managerWithAssignedManage = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.manage"],
      rbacPermissionScopes: {
        "students.manage": ["assigned"]
      }
    };
    const managerWithoutManage = {
      userId: "manager-2",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };

    expect(can(adminWithManage, "students.manage")).toBe(true);
    expect(can(managerWithAssignedManage, "students.manage")).toBe(false);
    expect(can(managerWithoutManage, "students.manage")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "students.manage")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "students.manage")).toBe(false);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "students.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "students.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for billing read permissions", () => {
    const actorWithBillingViewScope = (scope: string) => ({
      userId: `actor-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: {
        "billing.view": [scope]
      }
    });
    const adminWithoutBillingView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["all"]
      }
    };
    const billingReadAliases = ["billing.view", "billing.summary.read"] as const;

    for (const permission of billingReadAliases) {
      expect(can(actorWithBillingViewScope("own"), permission)).toBe(true);
      expect(can(actorWithBillingViewScope("assigned"), permission)).toBe(true);
      expect(can(actorWithBillingViewScope("all"), permission)).toBe(true);
      expect(can(adminWithoutBillingView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, permission, { studentId: "student-1" })).toBe(false);
      expect(can({ userId: "student-legacy", role: "student" as const, studentId: "student-1" }, permission, { studentId: "student-1" })).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for billing adjustment permissions", () => {
    const actorWithBillingAdjustScope = (scope: string) => ({
      userId: `actor-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["billing.adjust"],
      rbacPermissionScopes: {
        "billing.adjust": [scope]
      }
    });
    const managerWithoutBillingAdjust = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: {
        "billing.view": ["all"]
      }
    };
    const billingAdjustAliases = ["billing.adjust", "billing.adjustments.create", "billing.settings.update"] as const;

    for (const permission of billingAdjustAliases) {
      expect(can(actorWithBillingAdjustScope("all"), permission)).toBe(true);
      expect(can(actorWithBillingAdjustScope("assigned"), permission)).toBe(false);
      expect(can(managerWithoutBillingAdjust, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-1", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, permission, { studentId: "student-1" })).toBe(false);
      expect(can({ userId: "student-1", role: "student" as const, studentId: "student-1" }, permission, { studentId: "student-1" })).toBe(false);
    }
  });

  it("uses loaded RBAC metadata as authority for staff payment read and manage permissions", () => {
    const actorWithPaymentsViewScope = (scope: string) => ({
      userId: `payments-view-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": [scope]
      }
    });
    const actorWithPaymentsManageScope = (scope: string) => ({
      userId: `payments-manage-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["payments.manage"],
      rbacPermissionScopes: {
        "payments.manage": [scope]
      }
    });
    const adminWithoutPaymentGrants = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: {
        "billing.view": ["all"]
      }
    };

    expect(can(actorWithPaymentsViewScope("own"), "payments.view")).toBe(true);
    expect(can(actorWithPaymentsViewScope("all"), "payments.view")).toBe(true);
    expect(can(actorWithPaymentsViewScope("assigned"), "payments.view")).toBe(false);
    expect(can(actorWithPaymentsViewScope("all"), "billing.admin.read")).toBe(true);
    expect(can(adminWithoutPaymentGrants, "payments.view")).toBe(false);
    expect(can(adminWithoutPaymentGrants, "billing.admin.read")).toBe(false);

    expect(can(actorWithPaymentsManageScope("all"), "payments.manage")).toBe(true);
    expect(can(actorWithPaymentsManageScope("all"), "billing.reminders.manage")).toBe(true);
    expect(can(actorWithPaymentsManageScope("own"), "payments.manage")).toBe(false);
    expect(can(actorWithPaymentsManageScope("own"), "billing.reminders.manage")).toBe(false);
    expect(can(adminWithoutPaymentGrants, "payments.manage")).toBe(false);
    expect(can(adminWithoutPaymentGrants, "billing.reminders.manage")).toBe(false);

    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "payments.view")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "payments.manage")).toBe(false);
    expect(can({ userId: "teacher-1", role: "teacher" as const }, "payments.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "payments.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for student payment self-service permissions", () => {
    const student = { userId: "student-profile-1", role: "student" as const, studentId: "student-1" };
    const studentWithLoadedPaymentsViewOnly = {
      ...student,
      rbacRoles: ["student"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    };
    const studentMissingPaymentsView = {
      ...student,
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };
    const adminWithLoadedPaymentsView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["all"]
      }
    };
    const teacherPreviewWithStudentRow = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isTeacher: true,
      isStudent: false,
      studentId: "student-preview-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["payments.view"],
      rbacPermissionScopes: {
        "payments.view": ["own"]
      }
    };

    expect(can(studentWithLoadedPaymentsViewOnly, "payments.checkout.create")).toBe(true);
    expect(can(studentWithLoadedPaymentsViewOnly, "payments.history.read")).toBe(true);
    expect(can(studentWithLoadedPaymentsViewOnly, "payments.status.read")).toBe(true);
    expect(can(studentMissingPaymentsView, "payments.checkout.create")).toBe(false);
    expect(can(studentMissingPaymentsView, "payments.history.read")).toBe(false);
    expect(can(studentMissingPaymentsView, "payments.status.read")).toBe(false);
    expect(can(adminWithLoadedPaymentsView, "payments.checkout.create")).toBe(false);
    expect(can(adminWithLoadedPaymentsView, "payments.history.read")).toBe(false);
    expect(can(adminWithLoadedPaymentsView, "payments.status.read")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "payments.checkout.create")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "payments.history.read")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "payments.status.read")).toBe(false);
    expect(can({ ...student, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "payments.checkout.create")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for student progress read permissions", () => {
    const adminWithAllProgress = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["student_progress.view"],
      rbacPermissionScopes: {
        "student_progress.view": ["all"]
      }
    };
    const teacherWithAssignedProgress = {
      userId: "teacher-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["student_progress.view"],
      rbacPermissionScopes: {
        "student_progress.view": ["assigned"]
      }
    };
    const studentWithOwnProgress = {
      userId: "student-profile-1",
      role: "student" as const,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["student_progress.view"],
      rbacPermissionScopes: {
        "student_progress.view": ["own"]
      }
    };
    const managerWithoutProgress = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };

    expect(can(adminWithAllProgress, "student_progress.view")).toBe(true);
    expect(can(adminWithAllProgress, "student_progress.view", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithAssignedProgress, "student_progress.view")).toBe(true);
    expect(can(teacherWithAssignedProgress, "student_progress.view", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithAssignedProgress, "student_progress.view", { studentId: "student-2" })).toBe(false);
    expect(can(studentWithOwnProgress, "student_progress.view")).toBe(true);
    expect(can(studentWithOwnProgress, "student_progress.view", { studentId: "student-1" })).toBe(true);
    expect(can(studentWithOwnProgress, "student_progress.view", { studentId: "student-2" })).toBe(false);
    expect(can(managerWithoutProgress, "student_progress.view")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "student_progress.view")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "student_progress.view")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "student_progress.view")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "student_progress.view")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for homework view permissions", () => {
    const actorWithHomeworkViewScope = (scope: string) => ({
      userId: `homework-view-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: {
        "homework.view": [scope]
      }
    });
    const adminWithoutHomeworkView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };

    expect(can(actorWithHomeworkViewScope("own"), "homework.view")).toBe(true);
    expect(can(actorWithHomeworkViewScope("assigned"), "homework.view")).toBe(true);
    expect(can(actorWithHomeworkViewScope("all"), "homework.view")).toBe(true);
    expect(can(adminWithoutHomeworkView, "homework.view")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "homework.view")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "homework.view")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for homework assignment permissions", () => {
    const teacherWithAssignedHomework = {
      userId: "teacher-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["assigned"]
      }
    };
    const managerWithAllHomework = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["all"]
      }
    };
    const teacherWithOwnHomework = {
      ...teacherWithAssignedHomework,
      rbacPermissionScopes: {
        "homework.assign": ["own"]
      }
    };
    const adminWithoutHomeworkAssign = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: {
        "homework.view": ["all"]
      }
    };

    expect(can(teacherWithAssignedHomework, "homework.assign", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithAssignedHomework, "homework.assign", { studentId: "student-2" })).toBe(false);
    expect(can(teacherWithAssignedHomework, "homework.assign")).toBe(false);
    expect(can(managerWithAllHomework, "homework.assign")).toBe(true);
    expect(can(managerWithAllHomework, "homework.assign", { studentId: "student-2" })).toBe(true);
    expect(can(teacherWithOwnHomework, "homework.assign", { studentId: "student-1" })).toBe(false);
    expect(can(adminWithoutHomeworkAssign, "homework.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, "homework.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, "homework.assign", { studentId: "student-2" })).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "homework.assign")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const, studentId: "student-1" }, "homework.assign", { studentId: "student-1" })).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for placement assignment alias", () => {
    const teacherWithAssignedHomework = {
      userId: "teacher-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["assigned"]
      }
    };
    const managerWithAllHomework = {
      userId: "manager-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["all"]
      }
    };
    const teacherWithOwnHomework = {
      ...teacherWithAssignedHomework,
      rbacPermissionScopes: {
        "homework.assign": ["own"]
      }
    };
    const teacherWithoutHomeworkAssign = {
      userId: "teacher-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    };

    expect(can(teacherWithAssignedHomework, "learning.placement.assign", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithAssignedHomework, "learning.placement.assign", { studentId: "student-2" })).toBe(false);
    expect(can(teacherWithAssignedHomework, "learning.placement.assign")).toBe(false);
    expect(can(managerWithAllHomework, "learning.placement.assign")).toBe(true);
    expect(can(managerWithAllHomework, "learning.placement.assign", { studentId: "student-2" })).toBe(true);
    expect(can(teacherWithOwnHomework, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
    expect(can(teacherWithoutHomeworkAssign, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "learning.placement.assign")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const, studentId: "student-1" }, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for own homework submit permissions", () => {
    const studentWithHomeworkSubmitScope = (scope: string) => ({
      userId: `student-${scope}`,
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": [scope]
      }
    });
    const studentWithoutHomeworkSubmit = {
      userId: "student-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: {
        "homework.view": ["own"]
      }
    };
    const teacherPreviewWithHomeworkSubmit = {
      userId: "teacher-1",
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": ["own"]
      }
    };

    expect(can(studentWithHomeworkSubmitScope("own"), "homework.submit", { studentId: "student-1" })).toBe(true);
    expect(can(studentWithHomeworkSubmitScope("own"), "homework.submit", { studentId: "student-2" })).toBe(false);
    expect(can(studentWithHomeworkSubmitScope("assigned"), "homework.submit", { studentId: "student-1" })).toBe(false);
    expect(can(studentWithHomeworkSubmitScope("all"), "homework.submit", { studentId: "student-1" })).toBe(false);
    expect(can(studentWithoutHomeworkSubmit, "homework.submit", { studentId: "student-1" })).toBe(false);
    expect(can(teacherPreviewWithHomeworkSubmit, "homework.submit", { studentId: "student-preview-1" })).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const, studentId: "student-1" }, "homework.submit", { studentId: "student-1" })).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for practice attempt submit alias", () => {
    const studentWithHomeworkSubmitScope = (scope: string) => ({
      userId: `student-${scope}`,
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": [scope]
      }
    });
    const studentWithoutHomeworkSubmit = {
      userId: "student-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: {
        "homework.view": ["own"]
      }
    };
    const teacherPreviewWithHomeworkSubmit = {
      userId: "teacher-1",
      role: "teacher" as const,
      profileRole: "teacher" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-preview-1",
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.submit"],
      rbacPermissionScopes: {
        "homework.submit": ["own"]
      }
    };

    expect(can(studentWithHomeworkSubmitScope("own"), "practice.attempts.submit")).toBe(true);
    expect(can(studentWithHomeworkSubmitScope("assigned"), "practice.attempts.submit")).toBe(false);
    expect(can(studentWithHomeworkSubmitScope("all"), "practice.attempts.submit")).toBe(false);
    expect(can(studentWithoutHomeworkSubmit, "practice.attempts.submit")).toBe(false);
    expect(can(teacherPreviewWithHomeworkSubmit, "practice.attempts.submit")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const, studentId: "student-1" }, "practice.attempts.submit")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "practice.attempts.submit")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for schedule read permissions", () => {
    const actorWithScheduleViewScope = (scope: string) => ({
      userId: `actor-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["schedule.view"],
      rbacPermissionScopes: {
        "schedule.view": [scope]
      }
    });
    const adminWithoutView = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };
    const scheduleReadAliases = ["schedule.view", "schedule.lessons.read"] as const;

    for (const permission of scheduleReadAliases) {
      expect(can(actorWithScheduleViewScope("own"), permission)).toBe(true);
      expect(can(actorWithScheduleViewScope("assigned"), permission)).toBe(true);
      expect(can(actorWithScheduleViewScope("all"), permission)).toBe(true);
      expect(can(adminWithoutView, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-legacy", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-legacy", role: "student" as const }, permission)).toBe(false);
    }

    expect(can(actorWithScheduleViewScope("own"), "schedule.followups.read")).toBe(true);
    expect(can(actorWithScheduleViewScope("assigned"), "schedule.followups.read")).toBe(true);
    expect(can(actorWithScheduleViewScope("all"), "schedule.followups.read")).toBe(true);
    expect(can(adminWithoutView, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "schedule.followups.read")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for schedule manage permissions", () => {
    const actorWithScheduleManageScope = (scope: string) => ({
      userId: `actor-${scope}`,
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["schedule.manage"],
      rbacPermissionScopes: {
        "schedule.manage": [scope]
      }
    });
    const adminWithoutManage = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["schedule.view"],
      rbacPermissionScopes: {
        "schedule.view": ["all"]
      }
    };
    const scheduleManageAliases = ["schedule.manage", "schedule.lessons.manage"] as const;

    for (const permission of scheduleManageAliases) {
      expect(can(actorWithScheduleManageScope("assigned"), permission)).toBe(true);
      expect(can(actorWithScheduleManageScope("all"), permission)).toBe(true);
      expect(can(actorWithScheduleManageScope("own"), permission)).toBe(false);
      expect(can(adminWithoutManage, permission)).toBe(false);
      expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, permission)).toBe(false);
      expect(can({ userId: "manager-legacy", role: "manager" as const }, permission)).toBe(false);
      expect(can({ userId: "teacher-legacy", role: "teacher" as const }, permission)).toBe(false);
      expect(can({ userId: "student-legacy", role: "student" as const }, permission)).toBe(false);
    }

    expect(can(actorWithScheduleManageScope("assigned"), "schedule.followups.manage")).toBe(true);
    expect(can(actorWithScheduleManageScope("all"), "schedule.followups.manage")).toBe(true);
    expect(can(actorWithScheduleManageScope("own"), "schedule.followups.manage")).toBe(false);
    expect(can(adminWithoutManage, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "schedule.followups.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for schedule follow-up aliases", () => {
    const adminWithoutFollowupGrant = {
      userId: "admin-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["schedule.view"],
      rbacPermissionScopes: {
        "schedule.view": ["all"]
      }
    };

    expect(can(adminWithoutFollowupGrant, "schedule.followups.read")).toBe(true);
    expect(can(adminWithoutFollowupGrant, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "admin-without-schedule", role: "admin" as const, rbacRoles: ["admin"], rbacPermissions: ["users.view"], rbacPermissionScopes: { "users.view": ["all"] } }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "admin-without-schedule", role: "admin" as const, rbacRoles: ["admin"], rbacPermissions: ["users.view"], rbacPermissionScopes: { "users.view": ["all"] } }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "teacher-assigned", role: "teacher" as const, rbacRoles: ["teacher"], rbacPermissions: ["schedule.manage"], rbacPermissionScopes: { "schedule.manage": ["assigned"] } }, "schedule.followups.manage")).toBe(true);
    expect(can({ userId: "student-own", role: "student" as const, rbacRoles: ["student"], rbacPermissions: ["schedule.manage"], rbacPermissionScopes: { "schedule.manage": ["own"] } }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const }, "schedule.followups.manage")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "schedule.followups.read")).toBe(false);
    expect(can({ userId: "student-1", role: "student" as const }, "schedule.followups.manage")).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for teacher notes write permissions", () => {
    const teacherWithStudentsViewAssigned = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    };
    const teacherWithTeacherScopeAssigned = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["teacher_scope.view_assigned"],
      rbacPermissionScopes: {
        "teacher_scope.view_assigned": ["assigned"]
      }
    };
    const managerWithStudentsManage = {
      userId: "manager-profile-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.manage"],
      rbacPermissionScopes: {
        "students.manage": ["all"]
      }
    };
    const adminWithStudentsViewOnly = {
      userId: "admin-profile-1",
      role: "admin" as const,
      rbacRoles: ["admin"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };
    const teacherWithoutNotesGrant = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };

    expect(can(teacherWithStudentsViewAssigned, "students.notes.write", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithTeacherScopeAssigned, "students.notes.write", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithStudentsViewAssigned, "students.notes.write", { studentId: "student-2" })).toBe(false);
    expect(can(teacherWithStudentsViewAssigned, "students.notes.write")).toBe(true);
    expect(can(managerWithStudentsManage, "students.notes.write")).toBe(true);
    expect(can(managerWithStudentsManage, "students.notes.write", { studentId: "student-2" })).toBe(true);
    expect(can(adminWithStudentsViewOnly, "students.notes.write", { studentId: "student-1" })).toBe(false);
    expect(can(teacherWithoutNotesGrant, "students.notes.write", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, "students.notes.write", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "students.notes.write")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "students.notes.write", { studentId: "student-1" })).toBe(false);
  });

  it("uses loaded RBAC metadata as authority for teacher notes read permissions", () => {
    const teacherWithStudentsViewAssigned = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    };
    const teacherWithTeacherScopeAssigned = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["teacher_scope.view_assigned"],
      rbacPermissionScopes: {
        "teacher_scope.view_assigned": ["assigned"]
      }
    };
    const staffWithStudentsViewAll = {
      userId: "manager-profile-1",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    };
    const staffWithStudentsManageOnly = {
      userId: "manager-profile-2",
      role: "manager" as const,
      rbacRoles: ["manager"],
      rbacPermissions: ["students.manage"],
      rbacPermissionScopes: {
        "students.manage": ["all"]
      }
    };
    const teacherWithoutNotesReadGrant = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };

    expect(can(teacherWithStudentsViewAssigned, "students.notes.read", { studentId: "student-1" })).toBe(true);
    expect(can(teacherWithStudentsViewAssigned, "students.notes.read", { studentId: "student-2" })).toBe(false);
    expect(can(teacherWithStudentsViewAssigned, "students.notes.read")).toBe(true);
    expect(can(teacherWithTeacherScopeAssigned, "students.notes.read", { studentId: "student-1" })).toBe(true);
    expect(can(staffWithStudentsViewAll, "students.notes.read")).toBe(true);
    expect(can(staffWithStudentsViewAll, "students.notes.read", { studentId: "student-2" })).toBe(true);
    expect(can(staffWithStudentsManageOnly, "students.notes.read", { studentId: "student-1" })).toBe(false);
    expect(can(teacherWithoutNotesReadGrant, "students.notes.read", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "teacher-legacy", role: "teacher" as const, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }, "students.notes.read", { studentId: "student-1" })).toBe(false);
    expect(can({ userId: "admin-legacy", role: "admin" as const, rbacRoles: [], rbacPermissions: [], rbacPermissionScopes: {} }, "students.notes.read")).toBe(false);
    expect(can({ userId: "manager-legacy", role: "manager" as const }, "students.notes.read")).toBe(false);
    expect(can({ userId: "student-legacy", role: "student" as const }, "students.notes.read", { studentId: "student-1" })).toBe(false);
  });

  it("allows teachers to manage scoped student work", () => {
    const teacher = {
      userId: "teacher-profile-1",
      role: "teacher" as const,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: [
        "students.view",
        "homework.assign",
        "schedule.view",
        "schedule.manage",
        "billing.view",
        "notifications.view",
        "profile.view",
        "profile.update"
      ],
      rbacPermissionScopes: {
        "students.view": ["assigned"],
        "homework.assign": ["assigned"],
        "schedule.view": ["assigned"],
        "schedule.manage": ["assigned"],
        "billing.view": ["assigned"],
        "notifications.view": ["own"],
        "profile.view": ["own"],
        "profile.update": ["own"]
      }
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
      accessibleStudentIds: null,
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
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

  it("denies dual-role and teacher-preview actors real student runtime permissions", () => {
    const confirmedDualRoleStudent = {
      userId: "student-profile-1",
      role: "student" as const,
      profileRole: "student" as const,
      isStudent: true,
      isTeacher: true,
      studentId: "student-1",
      teacherId: "teacher-1",
      rbacRoles: ["student", "teacher"],
      rbacPermissions: ["homework.submit", "word_cards.train"],
      rbacPermissionScopes: {
        "homework.submit": ["own"],
        "word_cards.train": ["own"]
      }
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

    expect(can(confirmedDualRoleStudent, "practice.attempts.submit")).toBe(false);
    expect(can(confirmedDualRoleStudent, "word_cards.train")).toBe(false);
    expect(can(confirmedDualRoleStudent, "word_cards.demo_train")).toBe(false);
    expect(can(confirmedDualRoleStudent, "words.sessions.complete")).toBe(false);
    expect(can(confirmedDualRoleStudent, "students.notes.write", { studentId: "student-1" })).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "practice.attempts.submit")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "word_cards.train")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "word_cards.demo_train")).toBe(false);
    expect(can(teacherPreviewWithStudentRow, "words.sessions.complete")).toBe(false);
  });

  it("throws a transport-compatible permission error", () => {
    const student = {
      userId: "student-profile-1",
      role: "student" as const,
      isStudent: true,
      studentId: "student-1",
      rbacRoles: ["student"],
      rbacPermissions: ["billing.view", "notifications.view", "profile.view", "payments.view", "homework.submit", "schedule.view", "word_cards.train"],
      rbacPermissionScopes: {
        "billing.view": ["own"],
        "notifications.view": ["own"],
        "profile.view": ["own"],
        "payments.view": ["own"],
        "homework.submit": ["own"],
        "schedule.view": ["own"],
        "word_cards.train": ["own"]
      }
    };

    expect(can(student, "billing.summary.read", { studentId: "student-1" })).toBe(true);
    expect(can(student, "billing.view", { studentId: "student-1" })).toBe(true);
    expect(can(student, "billing.view", { studentId: "student-2" })).toBe(false);
    expect(can(student, "billing.summary.read", { studentId: "student-2" })).toBe(false);
    expect(can(student, "billing.settings.update", { studentId: "student-1" })).toBe(false);
    expect(can(student, "notifications.user.read")).toBe(true);
    expect(can(student, "notifications.user.manage")).toBe(true);
    expect(can(student, "profile.view", { ownerUserId: "student-profile-1" })).toBe(true);
    expect(can(student, "profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(student, "settings.profile.read", { ownerUserId: "student-profile-1" })).toBe(true);
    expect(can(student, "settings.profile.update", { ownerUserId: "other-user" })).toBe(false);
    expect(can(student, "payments.checkout.create")).toBe(true);
    expect(can(student, "payments.view")).toBe(true);
    expect(can(student, "payments.manage")).toBe(false);
    expect(can(student, "payments.history.read")).toBe(true);
    expect(can(student, "payments.status.read")).toBe(true);
    expect(can(student, "practice.attempts.submit")).toBe(true);
    expect(can(student, "homework.assign", { studentId: "student-1" })).toBe(false);
    expect(can(student, "learning.placement.assign", { studentId: "student-1" })).toBe(false);
    expect(can(student, "schedule.lessons.read")).toBe(true);
    expect(can(student, "schedule.view")).toBe(true);
    expect(can(student, "schedule.followups.read")).toBe(true);
    expect(can(student, "schedule.followups.manage")).toBe(false);
    expect(can(student, "schedule.manage")).toBe(false);
    expect(can(student, "schedule.lessons.manage")).toBe(false);
    expect(can(student, "word_cards.train")).toBe(true);
    expect(can(student, "word_cards.demo_train")).toBe(false);
    expect(can(student, "words.sessions.complete")).toBe(true);

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
