import { describe, expect, it } from "vitest";

import { getActiveWorkspaceNavItemId, getWorkspaceNavConfig, isWorkspaceNavItemActive } from "@/app/(workspace)/workspace-navigation";

describe("getWorkspaceNavConfig", () => {
  it("returns staff navigation for staff shell", () => {
    const config = getWorkspaceNavConfig("staff", "manager");

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/crm", "/admin", "/admin/students", "/admin/teachers", "/admin/payments"]);
    expect(config.primary.map((item) => item.label)).not.toEqual(expect.arrayContaining(["Практика", "Домашнее задание", "Слова"]));
    expect(config.showBottomProfileLink).toBe(true);
  });

  it("returns teacher navigation for teacher shell", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher");

    expect(config.primary.map((item) => item.href)).toEqual(["/dashboard", "/schedule", "/students", "/practice", "/homework", "/words", "/progress"]);
    expect(config.secondary).toEqual([]);
    expect(config.showBottomProfileLink).toBe(true);
  });

  it("returns student navigation and payments shortcut for student shell", () => {
    const config = getWorkspaceNavConfig("student", "student");

    expect(config.secondary.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
    expect(config.mobileMore.map((item) => item.href)).toEqual(["/settings/profile", "/settings/payments"]);
    expect(config.showBottomProfileLink).toBe(false);
  });

  it("keeps shared shell tied to resolved workspace role", () => {
    const teacherConfig = getWorkspaceNavConfig("shared", "teacher");
    const studentConfig = getWorkspaceNavConfig("shared", "student");

    expect(teacherConfig.secondary).toEqual([]);
    expect(teacherConfig.mobileMore.map((item) => item.href)).toEqual(["/settings/profile"]);
    expect(studentConfig.secondary.map((item) => item.href)).toContain("/settings/payments");
  });

  it("marks only payments control as active on nested admin payments routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin");

    expect(getActiveWorkspaceNavItemId("/admin/payments", config.primary)).toBe("payments-control");
    expect(isWorkspaceNavItemActive("/admin/payments", config.primary.find((item) => item.id === "admin")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/payments", config.primary.find((item) => item.id === "payments-control")!)).toBe(true);
  });

  it("marks admin students as active on nested student profile routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin");

    expect(getActiveWorkspaceNavItemId("/admin/students/student-1", config.primary)).toBe("admin-students");
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "admin-students")!)).toBe(true);
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "admin-teachers")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/students/student-1", config.primary.find((item) => item.id === "payments-control")!)).toBe(false);
  });

  it("marks admin teachers as active on nested teacher profile routes", () => {
    const config = getWorkspaceNavConfig("staff", "admin");

    expect(getActiveWorkspaceNavItemId("/admin/teachers/teacher-1", config.primary)).toBe("admin-teachers");
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "admin-teachers")!)).toBe(true);
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "admin-students")!)).toBe(false);
    expect(isWorkspaceNavItemActive("/admin/teachers/teacher-1", config.primary.find((item) => item.id === "payments-control")!)).toBe(false);
  });

  it("keeps learning section routes active on nested paths", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher");

    expect(getActiveWorkspaceNavItemId("/practice/topics", config.primary)).toBe("practice");
    expect(getActiveWorkspaceNavItemId("/homework/active", config.primary)).toBe("homework");
  });

  it("marks teacher students as active on student list and profile routes", () => {
    const config = getWorkspaceNavConfig("teacher", "teacher");

    expect(getActiveWorkspaceNavItemId("/students", config.primary)).toBe("teacher-students");
    expect(getActiveWorkspaceNavItemId("/students/student-1", config.primary)).toBe("teacher-students");
    expect(isWorkspaceNavItemActive("/students/student-1", config.primary.find((item) => item.id === "teacher-students")!)).toBe(true);
  });

  it("does not cross-highlight student settings shortcuts", () => {
    const config = getWorkspaceNavConfig("student", "student");
    const profileItem = config.secondary.find((item) => item.id === "profile")!;
    const paymentsItem = config.secondary.find((item) => item.id === "payments")!;

    expect(isWorkspaceNavItemActive("/settings/payments", profileItem)).toBe(false);
    expect(isWorkspaceNavItemActive("/settings/payments", paymentsItem)).toBe(true);
  });
});
