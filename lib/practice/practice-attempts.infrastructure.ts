import { syncHomeworkProgressForCompletedTest } from "@/lib/homework/assignments.service";
import { createPracticeAttemptsRepository } from "@/lib/practice/practice-attempts.repository";
import { createClient } from "@/lib/supabase/server";

export async function createPracticeAttemptsInfrastructure() {
  const client = await createClient();

  return {
    repository: createPracticeAttemptsRepository(client),
    syncHomeworkProgress(
      studentId: string,
      testId: string,
      completedAtIso: string,
      startedAtIso: string
    ) {
      return syncHomeworkProgressForCompletedTest(
        studentId,
        testId,
        completedAtIso,
        startedAtIso,
        client
      );
    }
  };
}

export type PracticeAttemptsInfrastructure = Awaited<
  ReturnType<typeof createPracticeAttemptsInfrastructure>
>;
