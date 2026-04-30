import { z } from "zod";

import { scheduleLessonStatuses } from "@/lib/schedule/types";

const scheduleFilterEntityId = z.string().trim().min(1, "Identifier is required");
const scheduleStudentId = z.string().trim().min(1, "Выберите ученика");
const scheduleTeacherId = z.string().trim().min(1, "Выберите преподавателя");

const trimmedOptionalString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value == null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max).nullable().optional()
  );

const isoDateTime = z.string().datetime({ offset: true });

export const scheduleFiltersSchema = z
  .object({
    studentId: scheduleFilterEntityId.optional().nullable(),
    teacherId: scheduleFilterEntityId.optional().nullable(),
    status: z.enum(["all", ...scheduleLessonStatuses]).optional().nullable(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.dateFrom || !value.dateTo) return;
    if (new Date(value.dateFrom).getTime() > new Date(value.dateTo).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "dateTo must be later than dateFrom"
      });
    }
  });

const scheduleLessonMutationShape = z
  .object({
    studentId: scheduleStudentId,
    teacherId: scheduleTeacherId,
    title: z.string().trim().min(1).max(200),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    meetingUrl: trimmedOptionalString(1000).pipe(z.string().url().nullable().optional()),
    comment: trimmedOptionalString(5000),
    status: z.enum(scheduleLessonStatuses).optional()
  })
  .strict();

export const scheduleLessonMutationSchema = scheduleLessonMutationShape.superRefine((value, ctx) => {
    const startsAt = new Date(value.startsAt).getTime();
    const endsAt = new Date(value.endsAt).getTime();
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return;
    if (endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "endsAt must be later than startsAt"
      });
    }
  });

export const scheduleLessonUpdateSchema = scheduleLessonMutationShape
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" })
  .superRefine((value, ctx) => {
    if (!value.startsAt || !value.endsAt) return;
    const startsAt = new Date(value.startsAt).getTime();
    const endsAt = new Date(value.endsAt).getTime();
    if (endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "endsAt must be later than startsAt"
      });
    }
  });
