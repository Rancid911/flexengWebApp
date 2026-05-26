import { redirect } from "next/navigation";

import {
  assertStaffAdminCapability as assertStaffAdminAccess,
  getAppActor,
  getLayoutActor,
  requireAppActor,
  resolveDefaultWorkspace,
  type AppActor
} from "@/lib/auth/request-context";
import type { UserRole } from "@/lib/auth/get-user-role";
import { ScheduleHttpError } from "@/lib/schedule/http";

export type ScheduleActor = {
  userId: string;
  role: UserRole;
  accessMode: ScheduleAccessMode;
  studentId: string | null;
  teacherId: string | null;
  accessibleStudentIds: string[] | null;
};

export type ScheduleAccessMode = "student_own" | "teacher_assigned" | "staff_all";
export type ScheduleActorMode = "contextOnly" | "teacherScope";

export function isStudentScheduleActor(actor: ScheduleActor) {
  return actor.accessMode === "student_own";
}

export function isTeacherScheduleActor(actor: ScheduleActor) {
  return actor.accessMode === "teacher_assigned";
}

export function isStaffAdminScheduleActor(actor: ScheduleActor) {
  return actor.accessMode === "staff_all";
}

function toScheduleActor(context: AppActor | null, mode: ScheduleActorMode = "teacherScope"): ScheduleActor {
  if (!context) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Authentication required");
  }

  const workspaceRole = resolveDefaultWorkspace(context);
  if (!workspaceRole) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Schedule access requires a valid role");
  }

  if (workspaceRole === "teacher" && !context.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher profile is not linked");
  }

  if (workspaceRole === "student" && !context.studentId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Student profile is not linked");
  }

  const accessMode: ScheduleAccessMode =
    workspaceRole === "student" ? "student_own" : workspaceRole === "teacher" ? "teacher_assigned" : "staff_all";

  return {
    userId: context.userId,
    role: workspaceRole,
    accessMode,
    studentId: context.studentId,
    teacherId: workspaceRole === "teacher" ? context.teacherId : null,
    accessibleStudentIds: workspaceRole === "teacher" && mode === "teacherScope" ? context.accessibleStudentIds : null
  };
}

export async function requireSchedulePage(mode: ScheduleActorMode = "teacherScope") {
  const context = mode === "contextOnly" ? await getLayoutActor() : await requireAppActor();

  try {
    return toScheduleActor(context, mode);
  } catch (error) {
    if (error instanceof ScheduleHttpError && error.status === 403) {
      redirect("/");
    }
    throw error;
  }
}

export async function requireScheduleApi(mode: ScheduleActorMode = "teacherScope") {
  const context = mode === "contextOnly" ? await getLayoutActor() : await getAppActor();
  if (!context) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Authentication required");
  }

  return toScheduleActor(context, mode);
}

export async function requireScheduleActor(mode: ScheduleActorMode = "teacherScope") {
  return requireScheduleApi(mode);
}

export async function resolveScheduleActor(context: AppActor | null, mode: ScheduleActorMode = "teacherScope") {
  return toScheduleActor(context, mode);
}

export function assertTeacherCapability(actor: AppActor | ScheduleActor) {
  const hasTeacherCapability = "isTeacher" in actor ? actor.isTeacher : isTeacherScheduleActor(actor);
  if (!hasTeacherCapability) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher workspace is not available");
  }
}

export function assertStaffAdminCapability(actor: AppActor | ScheduleActor) {
  if ("isStaffAdmin" in actor) {
    assertStaffAdminAccess(actor);
    return;
  }

  if (!isStaffAdminScheduleActor(actor)) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Staff access required");
  }
}

export function assertScheduleWriteAccess(actor: ScheduleActor) {
  if (isStudentScheduleActor(actor)) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Students cannot manage schedule lessons");
  }
}

export function assertTeacherScope(
  actor: ScheduleActor,
  scheduleInput: {
    studentId?: string | null;
    teacherId?: string | null;
  }
) {
  if (!isTeacherScheduleActor(actor)) return;

  assertScheduleWriteAccess(actor);
  if (!actor.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher profile is not linked");
  }
  if (!Array.isArray(actor.accessibleStudentIds)) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher scope is not loaded");
  }

  if (scheduleInput.teacherId && scheduleInput.teacherId !== actor.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teachers can only plan lessons for themselves");
  }

  if (scheduleInput.studentId && !(actor.accessibleStudentIds ?? []).includes(scheduleInput.studentId)) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Student is outside the teacher scope");
  }
}
