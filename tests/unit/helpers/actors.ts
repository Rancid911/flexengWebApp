import type { UserRole } from "@/lib/auth/get-user-role";
import type { AppActor } from "@/lib/auth/request-context";
import type { ScheduleActor, ScheduleAccessMode } from "@/lib/schedule/server";

function accessModeForRole(role: UserRole): ScheduleAccessMode {
  if (role === "student") return "student_own";
  if (role === "teacher") return "teacher_assigned";
  return "staff_all";
}

export function createScheduleActor(overrides: Partial<ScheduleActor> = {}): ScheduleActor {
  const role = overrides.role ?? "teacher";
  const accessMode = overrides.accessMode ?? accessModeForRole(role);

  return {
    userId: "user-1",
    role,
    accessMode,
    studentId: accessMode === "student_own" ? "student-1" : null,
    teacherId: accessMode === "teacher_assigned" ? "teacher-1" : null,
    accessibleStudentIds: accessMode === "teacher_assigned" ? ["student-1"] : null,
    ...overrides
  };
}

export function createAppActor(overrides: Partial<AppActor> = {}): AppActor {
  return {
    userId: "user-1",
    email: "user@example.com",
    displayName: "User",
    avatarUrl: null,
    profileRole: "student",
    role: "student",
    capabilities: ["student"],
    isStudent: true,
    isTeacher: false,
    isStaffAdmin: false,
    studentId: "student-1",
    teacherId: null,
    accessibleStudentIds: null,
    rbacStatus: "loaded",
    rbacRoles: ["student"],
    rbacPermissions: [],
    rbacPermissionScopes: {},
    ...overrides
  };
}
