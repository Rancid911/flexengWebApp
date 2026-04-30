import { NextRequest, NextResponse } from "next/server";

import { submitPracticeTestAttempt } from "@/lib/practice/attempts";
import { withPracticeErrorHandling, PracticeHttpError } from "@/lib/practice/http";
import { practiceTestAttemptSchema } from "@/lib/practice/validation";

export const POST = withPracticeErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = practiceTestAttemptSchema.safeParse(body);
  if (!parsed.success) {
    throw new PracticeHttpError(400, "VALIDATION_ERROR", "Invalid test attempt payload", parsed.error.flatten());
  }

  const result = await submitPracticeTestAttempt(parsed.data);
  return NextResponse.json(result, { status: 201 });
});
