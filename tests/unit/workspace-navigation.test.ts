import { describe, expect, it } from "vitest";

import { getActiveWorkspaceNavItemId, getWorkspaceNavConfig, isWorkspaceNavItemActive } from "@/features/workspace-shell/model/workspace-navigation";

const fullStaffAccess = {
  rbacRoles: ["admin"],
  rbacPermissions: ["content.manage", "crm.leads.view", "payments.manage", "profile.view", "schedule.view", "students.view", "teachers.view", "users.view"],
  rbacPermissionScopes: {
    "content.manage": ["all"],
    "crm.leads.view": ["all"],
    "payments.manage": ["all"],
    "profile.view": ["all"],
    "schedule.view": ["all"],
    "students.view": ["all"],
    "teachers.view": ["all"],
    "users.view": ["all"]
  }
};

const fullTeacherAccess = {
  rbacRoles: ["teacher"],
  rbacPermissions: ["homework.view", "profile.view", "schedule.view", "student_progress.view", "students.view", "word_cards.demo_train"],
  rbacPermissionScopes: {
    "homework.view": ["assigned"],
    "profile.view": ["own"],
    "schedule.view": ["assigned"],
    "student_progress.view": ["assigned"],
    "students.view": ["assigned"],
    "word_cards.demo_train": ["own_demo"]
  }
};

const fullStudentAccess = {
  rbacRoles: ["student"],
  rbacPermissions: ["billing.view", "homework.view", "profile.view", "schedule.view", "student_progress.view", "word_cards.train"],
  rbacPermissionScopes: {
    "billing.view": ["own"],
    "homework.view": ["own"],
    "profile.view": ["own"],
    "schedule.view": ["own"],
    "student_progress.view": ["own"],
    "word_cards.train": ["own"]
  }
};

describe("getWorkspaceNavConfig", () => {
  it("returns staff navigation for staff shell", () => {
    const config = getWorkspaceNavConfig("staff", "manager", fullStaffAccess);

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/crm", "/admin", "/admin/students", "/admin/teachers", "/admin/payments"]);
    expect(config.primary.map((item) => item.label)).not.toEqual(expect.arrayContaining(["Практика", "Домашнее задание", "Слова"]));
    expect(config.showBottomProfileLink).toBe(true);
  });

  it("returns teacher navigation for teacher shell", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher", fullTeacherAccess);

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/students", "/practice", "/homework", "/words", "/progress"]);
    expect(config.secondary).toEqual([]);
    expect(config.showBottomProfileLink).toBe(true);
  });

  it("returns student navigation and payments shortcut for student shell", () => {
    const config = getWorkspaceNavConfig("student", "student", fullStudentAccess);

    expect(config.secondary.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
    expect(config.mobileMore.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
    expect(config.showBottomProfileLink).toBe(false);
  });

  it("hides profile navigation while RBAC metadata is empty", () => {
    const staffConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });
    const studentConfig = getWorkspaceNavConfig("student", "student", {
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    expect(staffConfig.showBottomProfileLink).toBe(false);
    expect(staffConfig.mobileMore).toEqual([]);
    expect(studentConfig.secondary).toEqual([]);
  });

  it("keeps profile navigation visible when RBAC grants profile.view own scope", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher", {
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    expect(config.showBottomProfileLink).toBe(true);
    expect(config.mobileMore.map((item) => item.href)).toEqual(["/settings/profile"]);
  });

  it("hides profile navigation when RBAC metadata is present without profile.view", () => {
    const staffConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacPermissions: ["schedule.view"],
      rbacPermissionScopes: {
        "schedule.view": ["all"]
      }
    });
    const teacherConfig = getWorkspaceNavConfig("teacher", "teacher", {
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    });
    const studentConfig = getWorkspaceNavConfig("student", "student", {
      rbacPermissions: ["billing.view", "schedule.view"],
      rbacPermissionScopes: {
        "billing.view": ["own"],
        "schedule.view": ["own"]
      }
    });

    expect(staffConfig.showBottomProfileLink).toBe(false);
    expect(staffConfig.mobileMore).toEqual([]);
    expect(teacherConfig.showBottomProfileLink).toBe(false);
    expect(teacherConfig.mobileMore).toEqual([]);
    expect(studentConfig.secondary.map((item) => item.href)).toEqual(["/settings/payments"]);
    expect(studentConfig.mobileMore.map((item) => item.href)).toEqual(["/settings/payments"]);
  });

  it("hides gated workspace items while RBAC metadata is empty", () => {
    const teacherConfig = getWorkspaceNavConfig("teacher", "teacher", {
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });
    const studentConfig = getWorkspaceNavConfig("student", "student", {
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    expect(teacherConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/practice"]);
    expect(studentConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/practice"]);
    expect(studentConfig.secondary).toEqual([]);
  });

  it("keeps gated workspace items visible when matching RBAC scopes are present", () => {
    const teacherConfig = getWorkspaceNavConfig("teacher", "teacher", {
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.view", "profile.view", "schedule.view", "student_progress.view", "students.view", "word_cards.demo_train"],
      rbacPermissionScopes: {
        "homework.view": ["assigned"],
        "profile.view": ["own"],
        "schedule.view": ["assigned"],
        "student_progress.view": ["assigned"],
        "students.view": ["assigned"],
        "word_cards.demo_train": ["own_demo"]
      }
    });
    const studentConfig = getWorkspaceNavConfig("student", "student", {
      rbacRoles: ["student"],
      rbacPermissions: ["billing.view", "homework.view", "profile.view", "schedule.view", "student_progress.view", "word_cards.train"],
      rbacPermissionScopes: {
        "billing.view": ["own"],
        "homework.view": ["own"],
        "profile.view": ["own"],
        "schedule.view": ["own"],
        "student_progress.view": ["own"],
        "word_cards.train": ["own"]
      }
    });

    expect(teacherConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/students", "/practice", "/homework", "/words", "/progress"]);
    expect(studentConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/practice", "/homework", "/words", "/progress"]);
    expect(studentConfig.secondary.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
  });

  it("hides only denied workspace read items and keeps practice on legacy navigation", () => {
    const teacherConfig = getWorkspaceNavConfig("teacher", "teacher", {
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.view", "schedule.view", "students.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"],
        "schedule.view": ["assigned"],
        "students.view": ["assigned"]
      }
    });
    const studentConfig = getWorkspaceNavConfig("student", "student", {
      rbacRoles: ["student"],
      rbacPermissions: ["billing.view", "profile.view", "word_cards.train"],
      rbacPermissionScopes: {
        "billing.view": ["own"],
        "profile.view": ["own"],
        "word_cards.train": ["own"]
      }
    });

    expect(teacherConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/students", "/practice"]);
    expect(studentConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/practice", "/words"]);
    expect(studentConfig.secondary.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
  });

  it("hides staff navigation while RBAC metadata is empty", () => {
    const config = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard"]);
  });

  it("shows all staff navigation items when full staff RBAC grants are present", () => {
    const config = getWorkspaceNavConfig("staff", "admin", {
      rbacRoles: ["admin"],
      rbacPermissions: ["content.manage", "crm.leads.view", "payments.manage", "profile.view", "schedule.view", "students.view", "teachers.view", "users.view"],
      rbacPermissionScopes: {
        "content.manage": ["all"],
        "crm.leads.view": ["all"],
        "payments.manage": ["all"],
        "profile.view": ["all"],
        "schedule.view": ["all"],
        "students.view": ["all"],
        "teachers.view": ["all"],
        "users.view": ["all"]
      }
    });

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/crm", "/admin", "/admin/students", "/admin/teachers", "/admin/payments"]);
  });

  it("gates staff primary navigation by matching all-scoped RBAC permissions", () => {
    const crmConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: ["manager"],
      rbacPermissions: ["crm.leads.view"],
      rbacPermissionScopes: {
        "crm.leads.view": ["all"]
      }
    });
    const studentsConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
    });
    const teachersConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: ["manager"],
      rbacPermissions: ["teachers.view"],
      rbacPermissionScopes: {
        "teachers.view": ["all"]
      }
    });
    const paymentsConfig = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: ["manager"],
      rbacPermissions: ["payments.manage"],
      rbacPermissionScopes: {
        "payments.manage": ["all"]
      }
    });

    expect(crmConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/crm"]);
    expect(studentsConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/admin/students"]);
    expect(teachersConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/admin/teachers"]);
    expect(paymentsConfig.primary.map((item) => item.href)).toEqual(["/dashboard", "/admin/payments"]);
  });

  it("shows the staff admin console for any console-domain RBAC permission", () => {
    const permissions = ["users.view", "content.manage", "notifications.manage", "word_cards.manage"] as const;

    for (const permission of permissions) {
      const config = getWorkspaceNavConfig("staff", "manager", {
        rbacRoles: ["manager"],
        rbacPermissions: [permission],
        rbacPermissionScopes: {
          [permission]: ["all"]
        }
      });

      expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/admin"]);
    }
  });

  it("hides denied staff primary navigation items when RBAC metadata is loaded", () => {
    const config = getWorkspaceNavConfig("staff", "manager", {
      rbacRoles: ["manager"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard"]);
  });

  it("keeps shared shell tied to resolved workspace role", () => {
    const teacherConfig = getWorkspaceNavConfig("shared", "teacher", fullTeacherAccess);
    const studentConfig = getWorkspaceNavConfig("shared", "student", fullStudentAccess);

    expect(teacherConfig.secondary).toEqual([]);
    expect(teacherConfig.mobileMore.map((item) => item.href)).toEqual(["/settings/profile"]);
    expect(studentConfig.secondary.map((item) => item.href)).toContain("/settings/payments");
  });

  it("marks only payments control as active on nested admin payments routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin", fullStaffAccess);

    expect(getActiveWorkspaceNavItemId("/admin/payments", config.primary)).toBe("payments-control");
    expect(isWorkspaceNavItemActive("/admin/payments", config.primary.find((item) => item.id === "admin")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/payments", config.primary.find((item) => item.id === "payments-control")!)).toBe(true);
  });

  it("marks admin students as active on nested student profile routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin", fullStaffAccess);

    expect(getActiveWorkspaceNavItemId("/admin/students/student-1", config.primary)).toBe("admin-students");
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "admin-students")!)).toBe(true);
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "admin-teachers")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "payments-control")!)).toBe(false);
  });

  it("marks admin teachers as active on nested teacher profile routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin", fullStaffAccess);

    expect(getActiveWorkspaceNavItemId("/admin/teachers/teacher-1", config.primary)).toBe("admin-teachers");
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "admin-teachers")!)).toBe(true);
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "admin-students")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "payments-control")!)).toBe(false);
  });

  it("keeps learning section routes active on nested paths", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher", fullTeacherAccess);

    expect(getActiveWorkspaceNavItemId("/practice/topics", config.primary)).toBe("practice");
    expect(getActiveWorkspaceNavItemId("/homework/active", config.primary)).toBe("homework");
  });

  it("marks teacher students as active on student list and profile routes", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher", fullTeacherAccess);

    expect(getActiveWorkspaceNavItemId("/students", config.primary)).toBe("teacher-students");
    expect(getActiveWorkspaceNavItemId("/students/student-1", config.primary)).toBe("teacher-students");
    expect(isWorkspaceNavItemActive("/students/student-1", config.primary.find((item) => item.id === "teacher-students")!)).toBe(true);
  });

  it("does not cross-highlight student settings shortcuts", () => {
    const config = getWorkspaceNavConfig("student", "student", fullStudentAccess);
    const profileItem = config.secondary.find((item) => item.id === "profile")!;
    const paymentsItem = config.secondary.find((item) => item.id === "payments")!;

    expect(isWorkspaceNavItemActive("/settings/payments", profileItem)).toBe(false);
    expect(isWorkspaceNavItemActive("/settings/payments", paymentsItem)).toBe(true);
  });
});
