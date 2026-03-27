import { cache } from "react";
import { redirect } from "next/navigation";

import { getUserRoleById } from "@/lib/auth/get-user-role";
import type { UserRole } from "@/lib/auth/get-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ScheduleHttpError } from "@/lib/schedule/http";

export type ScheduleActor = {
  userId: string;
  role: UserRole;
  studentId: string | null;
  teacherId: string | null;
  accessibleStudentIds: string[] | null;
};

function dedupeStudentIds(rows: Array<{ student_id: string | null }>) {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.student_id) ids.add(row.student_id);
  }
  return Array.from(ids);
}

const resolveScheduleActorForUser = cache(async (userId: string): Promise<ScheduleActor> => {
  const userClient = await createClient();
  const adminClient = createAdminClient();

  let role: UserRole | null = null;
  try {
    role = await getUserRoleById(userClient, userId);
  } catch {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to resolve user role");
  }

  if (!role) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Schedule access requires a valid role");
  }

  const [studentResponse, teacherResponse] = await Promise.all([
    adminClient.from("students").select("id").eq("profile_id", userId).maybeSingle(),
    adminClient.from("teachers").select("id").eq("profile_id", userId).maybeSingle()
  ]);

  if (studentResponse.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to resolve student profile", studentResponse.error.message);
  }

  if (teacherResponse.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to resolve teacher profile", teacherResponse.error.message);
  }

  let accessibleStudentIds: string[] | null = null;
  if (role === "teacher") {
    const teacherId = teacherResponse.data?.id ?? null;
    if (!teacherId) {
      throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher profile is not linked");
    }

    const enrollmentsResponse = await adminClient
      .from("student_course_enrollments")
      .select("student_id")
      .eq("assigned_teacher_id", teacherId)
      .eq("status", "active");

    if (enrollmentsResponse.error) {
      throw new ScheduleHttpError(500, "SCHEDULE_SCOPE_FAILED", "Failed to resolve teacher schedule scope", enrollmentsResponse.error.message);
    }

    accessibleStudentIds = dedupeStudentIds((enrollmentsResponse.data ?? []) as Array<{ student_id: string | null }>);
  }

  return {
    userId,
    role,
    studentId: typeof studentResponse.data?.id === "string" ? studentResponse.data.id : null,
    teacherId: typeof teacherResponse.data?.id === "string" ? teacherResponse.data.id : null,
    accessibleStudentIds
  };
});

export async function requireSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  try {
    return await resolveScheduleActorForUser(user.id);
  } catch (error) {
    if (error instanceof ScheduleHttpError && error.status === 403) {
      redirect("/");
    }
    throw error;
  }
}

export async function requireScheduleApi() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Authentication required");
  }

  return resolveScheduleActorForUser(user.id);
}

export function assertScheduleWriteAccess(actor: ScheduleActor) {
  if (actor.role === "student") {
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
  if (actor.role !== "teacher") return;

  assertScheduleWriteAccess(actor);
  if (!actor.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher profile is not linked");
  }

  if (scheduleInput.teacherId && scheduleInput.teacherId !== actor.teacherId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Teachers can only plan lessons for themselves");
  }

  if (scheduleInput.studentId && !(actor.accessibleStudentIds ?? []).includes(scheduleInput.studentId)) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Student is outside the teacher scope");
  }
}
