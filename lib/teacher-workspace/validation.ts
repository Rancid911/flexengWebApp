import { z } from "zod";

import { lessonAttendanceStatuses } from "@/lib/schedule/types";

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value == null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max).nullable().optional()
  );

export const teacherLessonFollowupSchema = z
  .object({
    attendanceStatus: z.enum(lessonAttendanceStatuses),
    summary: z.string().trim().min(1).max(5000),
    coveredTopics: optionalTrimmedString(3000),
    mistakesSummary: optionalTrimmedString(3000),
    nextSteps: optionalTrimmedString(3000),
    visibleToStudent: z.boolean().optional(),
    homeworkTitle: optionalTrimmedString(200),
    homeworkDescription: optionalTrimmedString(5000),
    homeworkDueAt: z.string().datetime({ offset: true }).nullable().optional(),
    homeworkTestIds: z.array(z.string().uuid()).optional().default([])
  })
  .strict();

export const teacherNoteMutationSchema = z
  .object({
    body: z.string().trim().min(1).max(5000),
    visibility: z.enum(["private", "manager_visible"]).optional()
  })
  .strict();

export const teacherStandaloneHomeworkCreateSchema = z
  .object({
    title: optionalTrimmedString(200),
    description: optionalTrimmedString(5000),
    dueAt: z.string().datetime({ offset: true }).nullable().optional(),
    activityIds: z.array(z.string().uuid()).min(1).max(20)
  })
  .strict();
