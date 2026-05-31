import { describe, expect, it, vi } from "vitest";

import { canSubmitLessonForm } from "@/features/schedule/client/use-staff-schedule-state";
import {
  createScheduleLesson,
  getSchedulePageDataInternal,
  hasExplicitPastDateSelection,
  mapStaffScheduleLessonsLightweight,
  mapStaffScheduleLessonsWithFollowup,
  resolveStudentOptionIds
} from "@/lib/schedule/queries";
import { buildStudentSchedulePreview, formatScheduleDateLabel, getScheduleStatusLabel, getStudentVisibleLessons } from "@/lib/schedule/utils";
import { scheduleLessonMutationSchema } from "@/lib/schedule/validation";
import { getStudentSchedulePreviewByStudentId } from "@/lib/schedule/queries";
import type { ScheduleLessonRow } from "@/lib/schedule/mappers";
import type { StudentScheduleLessonDto } from "@/lib/schedule/types";
import { createScheduleActor } from "@/tests/unit/helpers/actors";

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

let activeUserClientMock: { from: (table: string) => unknown; rpc?: (...args: unknown[]) => Promise<{ data: unknown; error: { message: string } | null }> } = defaultAdminClientMock as { from: (table: string) => unknown };
let activeAdminClientMock: { from: (table: string) => unknown; rpc?: (...args: unknown[]) => Promise<{ data: unknown; error: { message: string } | null }> } = defaultAdminClientMock as { from: (table: string) => unknown };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => activeAdminClientMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => activeUserClientMock
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

function makeQueryResult(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

function makeScheduleLessonRow(): ScheduleLessonRow {
  return {
    id: "lesson-1",
    student_id: "student-1",
    teacher_id: "teacher-1",
    title: "Speaking club",
    starts_at: "2099-03-28T10:00:00.000Z",
    ends_at: "2099-03-28T11:00:00.000Z",
    meeting_url: null,
    comment: null,
    status: "scheduled",
    created_at: null,
    updated_at: null
  };
}

function makeScheduleMutationUserClient(tableCalls: string[]) {
  return {
    from: (table: string) => {
      tableCalls.push(table);
      switch (table) {
        case "student_schedule_lessons": {
          const result = { data: makeScheduleLessonRow(), error: null };
          const builder = {
            insert: () => builder,
            select: () => builder,
            single: async () => result
          };
          return builder;
        }
        case "students":
          return makeQueryResult([
            {
              id: "student-1",
              profile_id: "profile-student-1",
              profiles: {
                id: "profile-student-1",
                display_name: "Анна Иванова",
                first_name: "Анна",
                last_name: "Иванова",
                email: "student@example.com"
              }
            }
          ]);
        case "teachers":
          return makeQueryResult([
            {
              id: "teacher-1",
              profile_id: "profile-teacher-1",
              profiles: {
                id: "profile-teacher-1",
                display_name: "Мария Петрова",
                first_name: "Мария",
                last_name: "Петрова",
                email: "teacher@example.com"
              }
            }
          ]);
        case "lesson_attendance":
        case "lesson_outcomes":
          return makeQueryResult([]);
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    }
  };
}

function makeSchedulePageDataClient(tableCalls: string[]) {
  return {
    from: (table: string) => {
      tableCalls.push(table);
      switch (table) {
        case "student_schedule_lessons":
          return makeQueryResult([
            {
              id: "lesson-1",
              student_id: "student-1",
              teacher_id: "teacher-1",
              title: "Speaking club",
              starts_at: "2099-03-28T10:00:00.000Z",
              ends_at: "2099-03-28T11:00:00.000Z",
              meeting_url: null,
              comment: null,
              status: "scheduled",
              created_at: null,
              updated_at: null
            }
          ]);
        case "students":
          return makeQueryResult([
            {
              id: "student-1",
              profile_id: "profile-student-1",
              profiles: {
                id: "profile-student-1",
                display_name: "Анна Иванова",
                first_name: "Анна",
                last_name: "Иванова",
                email: "student@example.com"
              }
            }
          ]);
        case "teachers":
          return makeQueryResult([
            {
              id: "teacher-1",
              profile_id: "profile-teacher-1",
              profiles: {
                id: "profile-teacher-1",
                display_name: "Мария Петрова",
                first_name: "Мария",
                last_name: "Петрова",
                email: "teacher@example.com"
              }
            }
          ]);
        case "lesson_attendance":
          return makeQueryResult([
            {
              id: "attendance-1",
              schedule_lesson_id: "lesson-1",
              student_id: "student-1",
              teacher_id: "teacher-1",
              status: "completed",
              marked_at: "2099-03-28T11:05:00.000Z",
              created_at: null,
              updated_at: null
            }
          ]);
        case "lesson_outcomes":
          return makeQueryResult([
            {
              id: "outcome-1",
              schedule_lesson_id: "lesson-1",
              student_id: "student-1",
              teacher_id: "teacher-1",
              summary: "Good speaking practice",
              covered_topics: null,
              mistakes_summary: null,
              next_steps: "Review vocabulary",
              visible_to_student: true,
              created_at: null,
              updated_at: null
            }
          ]);
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    }
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
    activeUserClientMock = defaultAdminClientMock;
    const preview = await getStudentSchedulePreviewByStudentId("student-1");

    expect(preview).toEqual({
      nextLesson: null,
      upcomingLessons: []
    });
  });

  it("uses lightweight preview loading without attendance or outcome enrichment", async () => {
    activeUserClientMock = {
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

  it("keeps staff schedule page data lightweight when follow-up enrichment is disabled", async () => {
    const tableCalls: string[] = [];
    activeUserClientMock = makeSchedulePageDataClient(tableCalls);

    const data = await getSchedulePageDataInternal(
      createScheduleActor({
        role: "teacher",
        userId: "teacher-profile-1",
        teacherId: "teacher-1",
        studentId: null,
        accessibleStudentIds: ["student-1"]
      }),
      {},
      { includeFollowup: false }
    );

    expect(data.role).toBe("teacher");
    expect(data.lessons[0]).toMatchObject({
      attendanceStatus: null,
      hasOutcome: false,
      studentVisibleOutcome: null
    });
    expect(tableCalls).not.toContain("lesson_attendance");
    expect(tableCalls).not.toContain("lesson_outcomes");
  });

  it("maps staff schedule lessons with explicit lightweight enrichment", async () => {
    const tableCalls: string[] = [];
    activeUserClientMock = makeSchedulePageDataClient(tableCalls);

    const [lesson] = await mapStaffScheduleLessonsLightweight([makeScheduleLessonRow()]);

    expect(lesson).toMatchObject({
      attendanceStatus: null,
      hasOutcome: false,
      studentVisibleOutcome: null
    });
    expect(tableCalls).not.toContain("lesson_attendance");
    expect(tableCalls).not.toContain("lesson_outcomes");
  });

  it("maps staff schedule lessons with explicit follow-up enrichment", async () => {
    const tableCalls: string[] = [];
    activeUserClientMock = makeSchedulePageDataClient(tableCalls);

    const [lesson] = await mapStaffScheduleLessonsWithFollowup([makeScheduleLessonRow()]);

    expect(lesson).toMatchObject({
      attendanceStatus: "completed",
      hasOutcome: true
    });
    expect(tableCalls).toContain("lesson_attendance");
    expect(tableCalls).toContain("lesson_outcomes");
  });

  it("loads staff schedule follow-up data when enrichment is explicitly enabled", async () => {
    const tableCalls: string[] = [];
    activeUserClientMock = makeSchedulePageDataClient(tableCalls);

    const data = await getSchedulePageDataInternal(
      createScheduleActor({
        role: "teacher",
        userId: "teacher-profile-1",
        teacherId: "teacher-1",
        studentId: null,
        accessibleStudentIds: ["student-1"]
      }),
      {},
      { includeFollowup: true }
    );

    expect(data.role).toBe("teacher");
    expect(data.lessons[0]).toMatchObject({
      attendanceStatus: "completed",
      hasOutcome: true,
      studentVisibleOutcome: {
        summary: "Good speaking practice",
        nextSteps: "Review vocabulary"
      }
    });
    expect(tableCalls).toContain("lesson_attendance");
    expect(tableCalls).toContain("lesson_outcomes");
  });

  it("uses the user-scoped client for schedule create mutations", async () => {
    const userTableCalls: string[] = [];
    const adminTableCalls: string[] = [];
    activeUserClientMock = makeScheduleMutationUserClient(userTableCalls);
    activeAdminClientMock = makeSchedulePageDataClient(adminTableCalls);

    const lesson = await createScheduleLesson(
      createScheduleActor({
        role: "manager",
        userId: "manager-profile-1",
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }),
      {
        studentId: "student-1",
        teacherId: "teacher-1",
        title: "Speaking club",
        startsAt: "2099-03-28T10:00:00.000Z",
        endsAt: "2099-03-28T11:00:00.000Z",
        status: "scheduled"
      }
    );

    expect(adminTableCalls).toEqual([]);
    expect(userTableCalls).toContain("student_schedule_lessons");
    expect(userTableCalls).toContain("students");
    expect(userTableCalls).toContain("teachers");
    expect(lesson).toMatchObject({
      id: "lesson-1",
      studentName: "Анна Иванова",
      teacherName: "Мария Петрова"
    });
  });

  it("keeps student schedule page data enriched with visible outcomes", async () => {
    const tableCalls: string[] = [];
    activeUserClientMock = makeSchedulePageDataClient(tableCalls);

    const data = await getSchedulePageDataInternal(createScheduleActor({
      role: "student",
      userId: "student-profile-1",
      studentId: "student-1",
      teacherId: null,
      accessibleStudentIds: null
    }), {}, { includeFollowup: true });

    expect(data.role).toBe("student");
    expect(data.lessons[0]).toMatchObject({
      attendanceStatus: "completed",
      hasOutcome: true,
      studentVisibleOutcome: {
        summary: "Good speaking practice",
        nextSteps: "Review vocabulary"
      }
    });
    expect(tableCalls).toContain("lesson_attendance");
    expect(tableCalls).toContain("lesson_outcomes");
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
        createScheduleActor({
          role: "teacher",
          userId: "teacher-1",
          teacherId: "teacher-1",
          studentId: null,
          accessibleStudentIds: ["student-1", "student-2", "student-3"]
        }),
        ["student-1", "student-2"]
      )
    ).toEqual(["student-1", "student-2"]);
  });
});
