import { describe, expect, it } from "vitest";

import { buildAppActor, normalizeRbacActorData, resolveDefaultWorkspace } from "@/lib/auth/request-context";
import { resolveScheduleActor } from "@/lib/schedule/server";

describe("app actor resolution", () => {
  it("builds student capability from linked student row", () => {
    const actor = buildAppActor(
      {
        userId: "user-1",
        email: "student@example.com",
        displayName: "Student",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: "student-1",
        teacherId: null,
        accessibleStudentIds: null
      }
    );

    expect(actor.capabilities).toContain("student");
    expect(actor.isStudent).toBe(true);
    expect(actor.isTeacher).toBe(false);
    expect(actor.isStaffAdmin).toBe(false);
    expect(actor.rbacRoles).toEqual([]);
    expect(actor.rbacPermissions).toEqual([]);
    expect(actor.rbacPermissionScopes).toEqual({});
  });

  it("keeps teacher RBAC metadata separate from linked teacher capability", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac",
        email: "teacher@example.com",
        displayName: "Teacher",
        avatarUrl: null,
        role: "teacher",
        profileRole: "teacher"
      },
      {
        studentId: null,
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      },
      {
        rbacRoles: ["teacher"],
        rbacPermissions: ["students.view"],
        rbacPermissionScopes: {
          "students.view": ["assigned"]
        }
      }
    );

    expect(actor.capabilities).toEqual(["teacher"]);
    expect(actor.rbacRoles).toEqual(["teacher"]);
    expect(actor.rbacPermissions).toEqual(["students.view"]);
    expect(actor.rbacPermissionScopes).toEqual({
      "students.view": ["assigned"]
    });
  });

  it("derives staff-admin capability and admin workspace from loaded RBAC admin role", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac-admin",
        email: "rbac-admin@example.com",
        displayName: "RBAC Admin",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: ["admin"],
        rbacPermissions: ["users.manage"],
        rbacPermissionScopes: {
          "users.manage": ["all"]
        }
      }
    );

    expect(actor.capabilities).toEqual(["staff_admin"]);
    expect(actor.isStaffAdmin).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("admin");
  });

  it("derives staff-admin capability and manager workspace from loaded RBAC manager role", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac-manager",
        email: "rbac-manager@example.com",
        displayName: "RBAC Manager",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: ["manager"],
        rbacPermissions: ["crm.leads.view"],
        rbacPermissionScopes: {
          "crm.leads.view": ["all"]
        }
      }
    );

    expect(actor.capabilities).toEqual(["staff_admin"]);
    expect(actor.isStaffAdmin).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("manager");
  });

  it("derives staff-admin capability from all-scoped staff domain permission without a staff RBAC role", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac-staff-permission",
        email: "staff-permission@example.com",
        displayName: "Staff Permission",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: ["teacher"],
        rbacPermissions: ["students.view"],
        rbacPermissionScopes: {
          "students.view": ["all"]
        }
      }
    );

    expect(actor.capabilities).toEqual(["staff_admin"]);
    expect(actor.isStaffAdmin).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("manager");
  });

  it("derives staff-admin capability from roles view but not runtime dashboard permission", () => {
    const actorWithRolesView = buildAppActor(
      {
        userId: "user-rbac-roles-view",
        email: "roles-view@example.com",
        displayName: "Roles View",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: [],
        rbacPermissions: ["roles.view"],
        rbacPermissionScopes: {
          "roles.view": ["all"]
        }
      }
    );
    const actorWithRuntimeDashboardOnly = buildAppActor(
      {
        userId: "user-rbac-dashboard-runtime",
        email: "dashboard-runtime@example.com",
        displayName: "Dashboard Runtime",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: [],
        rbacPermissions: ["admin.dashboard.read"],
        rbacPermissionScopes: {
          "admin.dashboard.read": ["all"]
        }
      }
    );

    expect(actorWithRolesView.capabilities).toEqual(["staff_admin"]);
    expect(actorWithRolesView.isStaffAdmin).toBe(true);
    expect(resolveDefaultWorkspace(actorWithRolesView)).toBe("manager");
    expect(actorWithRuntimeDashboardOnly.capabilities).toEqual([]);
    expect(actorWithRuntimeDashboardOnly.isStaffAdmin).toBe(false);
    expect(resolveDefaultWorkspace(actorWithRuntimeDashboardOnly)).toBeNull();
  });

  it("does not derive staff-admin capability from assigned-scoped staff domain permission", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac-assigned",
        email: "assigned@example.com",
        displayName: "Assigned",
        avatarUrl: null,
        role: "manager",
        profileRole: "manager"
      },
      {
        studentId: null,
        teacherId: "teacher-assigned",
        accessibleStudentIds: ["student-1"]
      },
      {
        rbacRoles: ["teacher"],
        rbacPermissions: ["students.view"],
        rbacPermissionScopes: {
          "students.view": ["assigned"]
        }
      }
    );

    expect(actor.capabilities).toEqual(["teacher"]);
    expect(actor.isStaffAdmin).toBe(false);
    expect(resolveDefaultWorkspace(actor)).toBe("teacher");
  });

  it("normalizes RBAC role permission rows into stable metadata", () => {
    expect(
      normalizeRbacActorData([
        {
          roles: {
            key: "teacher",
            role_permissions: [
              { scope: "assigned", permissions: { key: "students.view" } },
              { scope: "assigned", permissions: { key: "students.view" } },
              { scope: "own_demo", permissions: { key: "learning.preview_as_student" } }
            ]
          }
        },
        {
          roles: {
            key: "student",
            role_permissions: [{ scope: "own", permissions: { key: "profile.view" } }]
          }
        }
      ])
    ).toEqual({
      rbacRoles: ["teacher", "student"],
      rbacPermissions: ["learning.preview_as_student", "profile.view", "students.view"],
      rbacPermissionScopes: {
        "learning.preview_as_student": ["own_demo"],
        "profile.view": ["own"],
        "students.view": ["assigned"]
      },
      rbacStatus: "loaded"
    });
  });

  it("builds dual-role capability from linked teacher and student rows", () => {
    const actor = buildAppActor(
      {
        userId: "user-2",
        email: "dual@example.com",
        displayName: "Dual",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: "student-2",
        teacherId: "teacher-2",
        accessibleStudentIds: ["student-2", "student-3"]
      }
    );

    expect(actor.capabilities.sort()).toEqual(["student", "teacher"]);
    expect(actor.isStudent).toBe(true);
    expect(actor.isTeacher).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("teacher");
  });

  it("does not preserve manager staff-admin fallback when RBAC metadata is empty", () => {
    const actor = buildAppActor(
      {
        userId: "user-3",
        email: "manager@example.com",
        displayName: "Manager",
        avatarUrl: null,
        role: "manager",
        profileRole: "manager"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }
    );

    expect(actor.capabilities).toEqual([]);
    expect(actor.isStaffAdmin).toBe(false);
    expect(resolveDefaultWorkspace(actor)).toBeNull();
  });

  it("does not let loaded RBAC metadata missing staff grants fall back to legacy admin profileRole", () => {
    const actor = buildAppActor(
      {
        userId: "user-rbac-deny",
        email: "deny@example.com",
        displayName: "Deny",
        avatarUrl: null,
        role: "admin",
        profileRole: "admin"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      },
      {
        rbacRoles: ["student"],
        rbacPermissions: ["profile.view"],
        rbacPermissionScopes: {
          "profile.view": ["own"]
        }
      }
    );

    expect(actor.capabilities).toEqual([]);
    expect(actor.isStaffAdmin).toBe(false);
    expect(resolveDefaultWorkspace(actor)).toBeNull();
  });

  it("does not infer student or teacher capability from profileRole without linked rows", () => {
    const actor = buildAppActor(
      {
        userId: "user-legacy",
        email: "legacy@example.com",
        displayName: "Legacy",
        avatarUrl: null,
        role: "teacher",
        profileRole: "teacher"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: []
      }
    );

    expect(actor.capabilities).toEqual([]);
    expect(actor.isStudent).toBe(false);
    expect(actor.isTeacher).toBe(false);
    expect(resolveDefaultWorkspace(actor)).toBeNull();
  });

  it("prefers RBAC admin workspace over teacher and student", () => {
    const actor = buildAppActor(
      {
        userId: "user-4",
        email: "admin@example.com",
        displayName: "Admin",
        avatarUrl: null,
        role: "admin",
        profileRole: "admin"
      },
      {
        studentId: "student-4",
        teacherId: "teacher-4",
        accessibleStudentIds: ["student-4"]
      },
      {
        rbacRoles: ["admin"],
        rbacPermissions: ["roles.view"],
        rbacPermissionScopes: {
          "roles.view": ["all"]
        }
      }
    );

    expect(resolveDefaultWorkspace(actor)).toBe("admin");
  });
});

describe("schedule actor resolution", () => {
  it("keeps teacher profile linkage failure explicit", async () => {
    const actor = buildAppActor(
      {
        userId: "user-5",
        email: "teacher@example.com",
        displayName: "Teacher",
        avatarUrl: null,
        role: "teacher",
        profileRole: "teacher"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: []
      }
    );

    await expect(resolveScheduleActor(actor)).rejects.toMatchObject({
      message: "Schedule access requires a valid role"
    });
  });
});
