import { getAppActor, type AppActor } from "@/lib/auth/request-context";
import { createClient } from "@/lib/supabase/server";

type StudentProfile = {
  userId: string;
  studentId: string | null;
  role: string | null;
  displayName: string;
  email: string;
  englishLevel: string | null;
};

export type RealStudentWriteContext = {
  userId: string;
  studentId: string;
};

export class StudentWriteAccessError extends Error {
  status: number;
  code: string;
  exposeDetails: boolean;

  constructor(message = "Real student write context required", status = 403, code = "FORBIDDEN") {
    super(message);
    this.name = "StudentWriteAccessError";
    this.status = status;
    this.code = code;
    this.exposeDetails = true;
  }
}

export function requireRealStudentWriteContext(
  actor: AppActor | null | undefined,
  operation = "student-write"
): RealStudentWriteContext {
  void operation;

  if (!actor) {
    throw new StudentWriteAccessError("Authentication required", 401, "UNAUTHORIZED");
  }

  const isConfirmedRealStudent = actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher;
  if (!isConfirmedRealStudent) {
    throw new StudentWriteAccessError();
  }

  return {
    userId: actor.userId,
    studentId: actor.studentId as string
  };
}

export async function getCurrentRealStudentWriteContext(operation = "student-write"): Promise<RealStudentWriteContext> {
  return requireRealStudentWriteContext(await getAppActor(), operation);
}

export async function getCurrentStudentProfile(): Promise<StudentProfile | null> {
  const actor = await getAppActor();
  if (!actor?.isStudent) return null;

  let englishLevel: string | null = null;
  if (actor.studentId) {
    const supabase = await createClient();
    const response = await supabase.from("students").select("english_level").eq("id", actor.studentId).maybeSingle();
    if (!response.error) {
      englishLevel = response.data?.english_level ?? null;
    }
  }

  return {
    userId: actor.userId,
    studentId: actor.studentId,
    role: actor.profileRole,
    displayName: actor.displayName || actor.email.split("@")[0] || "Студент",
    email: actor.email,
    englishLevel
  };
}
