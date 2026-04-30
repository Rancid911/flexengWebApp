import type { ScheduleActor } from "@/lib/schedule/server";
import { isStaffAdminScheduleActor, isTeacherScheduleActor } from "@/lib/schedule/server";
import { ScheduleHttpError } from "@/lib/schedule/http";

export function canReadTeacherWorkspace(actor: ScheduleActor) {
  return actor.role === "teacher" || actor.role === "manager" || actor.role === "admin";
}

export function canWriteTeacherWorkspaceNotes(actor: ScheduleActor, studentId?: string) {
  if (isStaffAdminScheduleActor(actor)) {
    return true;
  }

  if (!isTeacherScheduleActor(actor) || !actor.teacherId) {
    return false;
  }

  if (!studentId) {
    return true;
  }

  return (actor.accessibleStudentIds ?? []).includes(studentId);
}

export function canManageTeacherStudentBilling(actor: ScheduleActor) {
  return actor.role === "manager" || actor.role === "admin";
}

export function assertTeacherWorkspaceWriteAccess(actor: ScheduleActor) {
  if (!isTeacherScheduleActor(actor) || !actor.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher write capability required");
  }
}

export function assertTeacherStudentNotesWriteAccess(actor: ScheduleActor) {
  if (isStaffAdminScheduleActor(actor)) {
    return;
  }

  assertTeacherWorkspaceWriteAccess(actor);
}
