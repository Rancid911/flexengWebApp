import { z } from "zod";

export const wordSessionModeSchema = z.enum(["default", "new", "review", "difficult"]);
export const wordSessionLimitSchema = z.coerce.number().int().refine((value) => value === 5 || value === 10 || value === 15, {
  message: "Limit must be 5, 10 or 15"
});

export const wordSessionParamsSchema = z.object({
  mode: wordSessionModeSchema.default("default"),
  topicSlug: z.string().trim().min(1).optional(),
  setSlug: z.string().trim().min(1).optional(),
  limit: wordSessionLimitSchema.default(5)
});

export const wordSessionAnswerSchema = z.object({
  wordId: z.string().min(1),
  result: z.enum(["known", "hard", "unknown"]),
  markedDifficult: z.boolean().optional()
});

export const wordSessionCompleteSchema = z.object({
  answers: z.array(wordSessionAnswerSchema).min(1)
});

export type WordSessionMode = z.infer<typeof wordSessionModeSchema>;
export type WordSessionParams = z.infer<typeof wordSessionParamsSchema>;
export type WordSessionAnswer = z.infer<typeof wordSessionAnswerSchema>;
export type WordSessionCompletePayload = z.infer<typeof wordSessionCompleteSchema>;
