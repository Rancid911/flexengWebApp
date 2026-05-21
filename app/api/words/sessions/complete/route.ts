import { NextRequest, NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { requirePermission } from "@/lib/permissions";
import { requireRealStudentWriteContext } from "@/lib/students/current-student";
import { WordsHttpError, withWordsErrorHandling } from "@/lib/words/http";
import { completeWordSession } from "@/lib/words/queries";
import { wordSessionCompleteSchema } from "@/lib/words/validation";

export const POST = withWordsErrorHandling(async (request: NextRequest) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new WordsHttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requireRealStudentWriteContext(actor, "word_cards.train");
  requirePermission(actor, "word_cards.train");

  const body = await request.json();
  const parsed = wordSessionCompleteSchema.safeParse(body);

  if (!parsed.success) {
    throw new WordsHttpError(400, "VALIDATION_ERROR", "Invalid word session payload", parsed.error.flatten());
  }

  const result = await completeWordSession(parsed.data.answers);
  return NextResponse.json(result, { status: 201 });
});
