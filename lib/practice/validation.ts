import { z } from "zod";

export const practiceTestAttemptSchema = z.object({
  activityId: z.string().regex(/^test_[0-9a-f-]{36}$/i),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid()
      })
    )
    .min(1),
  timeSpentSeconds: z.number().int().min(0).max(60 * 60 * 6).optional(),
  allowPartial: z.boolean().optional()
});

export type PracticeTestAttemptPayload = z.infer<typeof practiceTestAttemptSchema>;
