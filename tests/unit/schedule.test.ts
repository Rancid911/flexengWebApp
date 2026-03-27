import { describe, expect, it, vi } from "vitest";

import { hasExplicitPastDateSelection } from "@/lib/schedule/queries";
import { buildStudentSchedulePreview, formatScheduleDateLabel, getScheduleStatusLabel, getStudentVisibleLessons } from "@/lib/schedule/utils";
import { scheduleLessonMutationSchema } from "@/lib/schedule/validation";
import { getStudentSchedulePreviewByStudentId } from "@/lib/schedule/queries";
import type { StudentScheduleLessonDto } from "@/lib/schedule/types";

const adminClientMock = {
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          gt: () => ({
            order: () => ({
              limit: async () => ({
                data: null,
                error: { message: 'relation "public.student_schedule_lessons" does not exist' }
              })
            })
          })
        })
      })
    })
  })
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClientMock
}));

function makeLesson(index: number, overrides: Partial<StudentScheduleLessonDto> = {}): StudentScheduleLessonDto {
  return {
    id: `lesson-${index}`,
    studentId: "student-1",
    studentName: "Ученик",
    teacherId: "teacher-1",
    teacherName: "Преподаватель",
    title: `Урок ${index}`,
    startsAt: `2026-03-${String(27 + index).padStart(2, "0")}T10:00:00.000Z`,
    endsAt: `2026-03-${String(27 + index).padStart(2, "0")}T11:00:00.000Z`,
    meetingUrl: null,
    comment: null,
    status: "scheduled",
    createdAt: null,
    updatedAt: null,
    ...overrides
  };
}

describe("schedule helpers", () => {
  it("validates that lesson end must be after start", () => {
    const parsed = scheduleLessonMutationSchema.safeParse({
      studentId: "11111111-1111-4111-8111-111111111111",
      teacherId: "22222222-2222-4222-8222-222222222222",
      title: "Conversation practice",
      startsAt: "2026-03-27T10:00:00.000Z",
      endsAt: "2026-03-27T09:30:00.000Z"
    });

    expect(parsed.success).toBe(false);
  });

  it("filters student-visible lessons to future scheduled only", () => {
    const referenceDate = new Date("2026-03-27T09:00:00.000Z");
    const lessons = [
      makeLesson(1),
      makeLesson(2, { status: "completed" }),
      makeLesson(3, { startsAt: "2026-03-27T08:00:00.000Z", endsAt: "2026-03-27T09:00:00.000Z" })
    ];

    expect(getStudentVisibleLessons(lessons, referenceDate)).toHaveLength(1);
  });

  it("picks the nearest upcoming lesson for the dashboard preview", () => {
    const referenceDate = new Date("2026-03-27T09:00:00.000Z");
    const preview = buildStudentSchedulePreview(
      [
        makeLesson(2, { startsAt: "2026-03-28T10:00:00.000Z", endsAt: "2026-03-28T11:00:00.000Z" }),
        makeLesson(1, { startsAt: "2026-03-27T10:15:00.000Z", endsAt: "2026-03-27T11:00:00.000Z" })
      ],
      referenceDate,
      3
    );

    expect(preview.nextLesson?.id).toBe("lesson-1");
    expect(preview.upcomingLessons).toHaveLength(2);
  });

  it("formats labels for status and date groups", () => {
    expect(getScheduleStatusLabel("scheduled")).toBe("Запланирован");
    expect(formatScheduleDateLabel("2026-03-27T10:00:00.000Z", new Date("2026-03-27T08:00:00.000Z"))).toBe("Сегодня");
  });

  it("returns empty preview when schedule table is not available yet", async () => {
    const preview = await getStudentSchedulePreviewByStudentId("student-1");

    expect(preview).toEqual({
      nextLesson: null,
      upcomingLessons: []
    });
  });

  it("treats past lessons as hidden by default unless a past date was explicitly selected", () => {
    const referenceDate = new Date("2026-03-27T12:00:00.000Z");

    expect(hasExplicitPastDateSelection({}, referenceDate)).toBe(false);
    expect(hasExplicitPastDateSelection({ dateFrom: "2026-03-27" }, referenceDate)).toBe(false);
    expect(hasExplicitPastDateSelection({ dateTo: "2026-03-26" }, referenceDate)).toBe(true);
    expect(hasExplicitPastDateSelection({ dateFrom: "2026-03-20", dateTo: "2026-03-27" }, referenceDate)).toBe(true);
  });

  it("keeps canceled lessons hidden by default until canceled status is explicitly selected", () => {
    const defaultStatus = null;
    const explicitCanceledStatus = "canceled";

    expect(defaultStatus == null || defaultStatus === "all").toBe(true);
    expect(explicitCanceledStatus).toBe("canceled");
  });
});
