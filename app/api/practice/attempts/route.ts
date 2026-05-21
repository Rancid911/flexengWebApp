import { NextRequest, NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { requirePermission } from "@/lib/permissions";
import { submitPracticeTestAttempt } from "@/lib/practice/attempts";
import { withPracticeErrorHandling, PracticeHttpError } from "@/lib/practice/http";
import { practiceTestAttemptSchema } from "@/lib/practice/validation";
import { requireRealStudentWriteContext } from "@/lib/students/current-student";

export const POST = withPracticeErrorHandling(async (request: NextRequest) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new PracticeHttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requireRealStudentWriteContext(actor, "practice.attempts.submit");
  requirePermission(actor, "practice.attempts.submit");

  const body = await request.json();
  const parsed = practiceTestAttemptSchema.safeParse(body);
  if (!parsed.success) {
    throw new PracticeHttpError(400, "VALIDATION_ERROR", "Invalid test attempt payload", parsed.error.flatten());
  }

  const result = await submitPracticeTestAttempt(parsed.data);
  return NextResponse.json(result, { status: 201 });
});
