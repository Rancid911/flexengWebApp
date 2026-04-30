import { describe, expect, it, vi } from "vitest";

import { canSubmitLessonForm } from "@/app/(workspace)/(shared-zone)/schedule/use-staff-schedule-state";
import { hasExplicitPastDateSelection, resolveStudentOptionIds } from "@/lib/schedule/queries";
import { buildStudentSchedulePreview, formatScheduleDateLabel, getScheduleStatusLabel, getStudentVisibleLessons } from "@/lib/schedule/utils";
import { scheduleLessonMutationSchema } from "@/lib/schedule/validation";
import { getStudentSchedulePreviewByStudentId } from "@/lib/schedule/queries";
import type { StudentScheduleLessonDto } from "@/lib/schedule/types";

const defaultAdminClientMock = {
  from: (table: string) => {
    if (table === "lesson_attendance" || table === "lesson_outcomes") {
      throw new Error("preview path should not load enrichment tables");
    }

    if (table === "student_schedule_lessons") {
      return {
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
      };
    }

    if (table === "teachers") {
      return {
        select: () => ({
          in: async () => ({
            data: [{ id: "teacher-1", profile_id: "profile-1" }],
            error: null
          }),
          order: () => ({
            in: async () => ({
              data: [{ id: "teacher-1", profile_id: "profile-1" }],
              error: null
            })
          })
        })
      };
    }

    if (table === "profiles") {
      return {
        select: () => ({
          in: async () => ({
            data: [{ id: "profile-1", display_name: "Мария Петрова", first_name: "Мария", last_name: "Петрова", email: "teacher@example.com" }],
            error: null
          })
        })
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  }
};

let activeAdminClientMock: { from: (table: string) => unknown } = defaultAdminClientMock as { from: (table: string) => unknown };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => activeAdminClientMock
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
    attendanceStatus: null,
    hasOutcome: false,
    studentVisibleOutcome: null,
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

  it("accepts non-empty internal schedule option ids without enforcing uuid formatting", () => {
    const parsed = scheduleLessonMutationSchema.safeParse({
      studentId: "student-seeded-id",
      teacherId: "teacher-seeded-id",
      title: "Conversation practice",
      startsAt: "2026-03-27T10:00:00.000Z",
      endsAt: "2026-03-27T11:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });

  it("returns field-specific messages when lesson identifiers are missing", () => {
    const parsed = scheduleLessonMutationSchema.safeParse({
      studentId: "",
      teacherId: "",
      title: "Conversation practice",
      startsAt: "2026-03-27T10:00:00.000Z",
      endsAt: "2026-03-27T11:00:00.000Z"
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.studentId).toContain("Выберите ученика");
    expect(parsed.error?.flatten().fieldErrors.teacherId).toContain("Выберите преподавателя");
  });

  it("allows edit form submit even when create catalog is deferred", () => {
    expect(
      canSubmitLessonForm({
        formState: {
          id: "lesson-1",
          studentId: "student-1",
          teacherId: "teacher-1",
          title: "Conversation practice",
          date: "2026-03-27",
          startTime: "10:00",
          endTime: "11:00",
          meetingUrl: "",
          comment: "",
          status: "scheduled"
        },
        saving: false,
        createCatalogLoading: false,
        createCatalogReady: false,
        mode: "edit"
      })
    ).toBe(true);
  });

  it("keeps create form submit blocked until deferred create catalog is ready", () => {
    expect(
      canSubmitLessonForm({
        formState: {
          id: null,
          studentId: "student-1",
          teacherId: "teacher-1",
          title: "Conversation practice",
          date: "2026-03-27",
          startTime: "10:00",
          endTime: "11:00",
          meetingUrl: "",
          comment: "",
          status: "scheduled"
        },
        saving: false,
        createCatalogLoading: false,
        createCatalogReady: false,
        mode: "create"
      })
    ).toBe(false);
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
    activeAdminClientMock = defaultAdminClientMock;
    const preview = await getStudentSchedulePreviewByStudentId("student-1");

    expect(preview).toEqual({
      nextLesson: null,
      upcomingLessons: []
    });
  });

  it("uses lightweight preview loading without attendance or outcome enrichment", async () => {
    activeAdminClientMock = {
      from: (table: string) => {
        if (table === "lesson_attendance" || table === "lesson_outcomes") {
          throw new Error("preview path should stay lightweight");
        }

        if (table === "student_schedule_lessons") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  gt: () => ({
                    order: () => ({
                      limit: async () => ({
                        data: [
                          {
                            id: "lesson-1",
                            student_id: "student-1",
                            teacher_id: "teacher-1",
                            title: "Speaking club",
                            starts_at: "2099-03-28T10:00:00.000Z",
                            ends_at: "2099-03-28T11:00:00.000Z",
                            meeting_url: "https://example.com/meet",
                            comment: null,
                            status: "scheduled",
                            created_at: null,
                            updated_at: null
                          }
                        ],
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        }

        if (table === "teachers") {
          return {
            select: () => ({
              in: async () => ({
                data: [
                  {
                    id: "teacher-1",
                    profile_id: "profile-1",
                    profiles: {
                      id: "profile-1",
                      display_name: "Мария Петрова",
                      first_name: "Мария",
                      last_name: "Петрова",
                      email: "teacher@example.com"
                    }
                  }
                ],
                error: null
              }),
              order: () => ({
                in: async () => ({
                  data: [
                    {
                      id: "teacher-1",
                      profile_id: "profile-1",
                      profiles: {
                        id: "profile-1",
                        display_name: "Мария Петрова",
                        first_name: "Мария",
                        last_name: "Петрова",
                        email: "teacher@example.com"
                      }
                    }
                  ],
                  error: null
                })
              })
            })
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }
    };
    const preview = await getStudentSchedulePreviewByStudentId("student-1");

    expect(preview.nextLesson?.teacherName).toBe("Мария Петрова");
    expect(preview.nextLesson?.attendanceStatus).toBeNull();
    expect(preview.nextLesson?.hasOutcome).toBe(false);
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

  it("prefers explicit lesson-list student ids over full teacher scope for schedule options", () => {
    expect(
      resolveStudentOptionIds(
        {
          role: "teacher",
          userId: "teacher-1",
          teacherId: "teacher-1",
          studentId: null,
          accessibleStudentIds: ["student-1", "student-2", "student-3"]
        },
        ["student-1", "student-2"]
      )
    ).toEqual(["student-1", "student-2"]);
  });
});
