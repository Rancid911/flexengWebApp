import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduleClient } from "@/app/(workspace)/(shared-zone)/schedule/schedule-client";
import { parseScheduleApiResponse } from "@/app/(workspace)/(shared-zone)/schedule/use-staff-schedule-query-state";
import type { StaffSchedulePageData, StudentSchedulePageData } from "@/lib/schedule/types";

const fetchMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  }),
  useSearchParams: () => new URLSearchParams("")
}));

function makeStudentData(overrides: Partial<StudentSchedulePageData> = {}): StudentSchedulePageData {
  return {
    role: "student",
    nextLesson: {
      id: "lesson-1",
      studentId: "student-1",
      studentName: "Анна Иванова",
      teacherId: "teacher-1",
      teacherName: "Мария Петрова",
      title: "Speaking club",
      startsAt: "2026-03-28T10:00:00.000Z",
      endsAt: "2026-03-28T11:00:00.000Z",
      meetingUrl: "https://example.com/meet",
      comment: "Подготовить 3 темы",
      status: "scheduled",
      createdAt: null,
      updatedAt: null,
      attendanceStatus: null,
      hasOutcome: false,
      studentVisibleOutcome: null
    },
    lessons: [
      {
        id: "lesson-1",
        studentId: "student-1",
        studentName: "Анна Иванова",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Speaking club",
        startsAt: "2026-03-28T10:00:00.000Z",
        endsAt: "2026-03-28T11:00:00.000Z",
        meetingUrl: "https://example.com/meet",
        comment: "Подготовить 3 темы",
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      }
    ],
    ...overrides
  };
}

function makeStaffData(overrides: Partial<StaffSchedulePageData> = {}): StaffSchedulePageData {
  return {
    role: "teacher",
    lessons: [
      {
        id: "lesson-1",
        studentId: "student-1",
        studentName: "Анна Иванова",
        teacherId: "teacher-1",
        teacherName: "Мария Петрова",
        title: "Speaking club",
        startsAt: "2026-03-28T10:00:00.000Z",
        endsAt: "2026-03-28T11:00:00.000Z",
        meetingUrl: "https://example.com/meet",
        comment: "Подготовить 3 темы",
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      }
    ],
    students: [{ id: "student-1", label: "Анна Иванова" }],
    teachers: [{ id: "teacher-1", label: "Мария Петрова" }],
    filters: {
      studentId: "",
      teacherId: "teacher-1",
      status: "all",
      dateFrom: "",
      dateTo: ""
    },
    teacherLocked: true,
    ...overrides
  };
}

describe("ScheduleClient", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        students: [],
        teachers: []
      })
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("surfaces field-level validation details from schedule api responses", async () => {
    const response = {
      ok: false,
      json: async () => ({
        message: "Invalid lesson payload",
        details: {
          fieldErrors: {
            teacherId: ["Выберите преподавателя"]
          },
          formErrors: []
        }
      })
    } as Response;

    await expect(parseScheduleApiResponse(response)).rejects.toThrow("Выберите преподавателя");
  });

  it("shows student upcoming lessons and meeting CTA", () => {
    render(<ScheduleClient initialData={makeStudentData()} />);

    expect(screen.getByText("Все будущие уроки в одном месте")).toBeInTheDocument();
    expect(screen.getByTestId("student-schedule-hero")).toHaveClass("bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)]");
    expect(screen.getAllByText("Speaking club")).toHaveLength(2);
    expect(screen.getByText("Запланирован")).toHaveClass("bg-sky-50", "text-sky-700");
    expect(screen.getByRole("link", { name: "Подключиться" })).toHaveClass("bg-[#1f7aff]");
  });

  it("shows student empty state when no lessons exist", () => {
    render(<ScheduleClient initialData={makeStudentData({ nextLesson: null, lessons: [] })} />);

    expect(screen.getByText("Пока уроки не назначены")).toBeInTheDocument();
  });

  it("opens staff create drawer and keeps teacher selector locked for teacher scope", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeStaffData()
    });

    render(<ScheduleClient initialData={makeStaffData()} />);

    fireEvent.click(screen.getByRole("button", { name: /Назначить урок/i }));

    expect(screen.getByText("Новый урок")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    const teacherFields = [selects[1], selects.at(-1)].filter(Boolean);
    const studentFields = [selects[0], selects.at(-2)].filter(Boolean);
    expect(teacherFields.at(-1)).toBeDisabled();
    expect(teacherFields.at(0)).toBeDisabled();
    expect(screen.queryAllByText("Все преподаватели")).toHaveLength(0);
    expect(studentFields.at(-1)).toHaveValue("student-1");
    expect(screen.getByText("Показываем только ваших учеников и ваши уроки.")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/schedule?includeFollowup=1", expect.objectContaining({ cache: "no-store" }));
    });
  });

  it("loads create catalog on demand for empty teacher agenda and auto-fills locked teacher only", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        students: [
          { id: "student-1", label: "Anton Rancid" },
          { id: "student-2", label: "Anna Smirnova" }
        ],
        teachers: []
      })
    });

    render(
      <ScheduleClient
        initialData={makeStaffData({
          lessons: [],
          students: [],
          teachers: [{ id: "teacher-1", label: "Елизавета" }],
          filterCatalogDeferred: true
        })}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/schedule/options?entity=students&limit=50", { cache: "no-store" });
    });

    fireEvent.click(screen.getByRole("button", { name: /Назначить урок/i }));

    await waitFor(() => {
      expect(screen.queryByText("Загружаю список учеников и преподавателей…")).not.toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox").slice(-2);
    const studentSelect = selects[0];
    const teacherSelect = selects[1];

    expect(studentSelect).toHaveValue("");
    expect(within(studentSelect).getByRole("option", { name: "Выберите ученика" })).toBeInTheDocument();
    expect(teacherSelect).toHaveValue("teacher-1");
    expect(teacherSelect).toBeDisabled();
  });

  it("requires explicit student and teacher selection for manager create flow on empty agenda", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          students: [
            { id: "student-1", label: "Anton Rancid" },
            { id: "student-2", label: "Anna Smirnova" }
          ],
          teachers: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          students: [],
          teachers: [
            { id: "teacher-1", label: "Елизавета" },
            { id: "teacher-2", label: "Мария" }
          ]
        })
      });

    render(
      <ScheduleClient
        initialData={makeStaffData({
          role: "manager",
          lessons: [],
          students: [],
          teachers: [],
          teacherLocked: false,
          filters: {
            studentId: "",
            teacherId: "",
            status: "all",
            dateFrom: "",
            dateTo: ""
          },
          filterCatalogDeferred: true
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Назначить урок/i }));

    await waitFor(() => {
      expect(screen.queryByText("Загружаю список учеников и преподавателей…")).not.toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox").slice(-2);
    const studentSelect = selects[0];
    const teacherSelect = selects[1];

    expect(studentSelect).toHaveValue("");
    expect(teacherSelect).toHaveValue("");
    expect(screen.getAllByRole("button", { name: "Назначить урок" }).at(-1)).toBeDisabled();
    expect(within(studentSelect).getByRole("option", { name: "Выберите ученика" })).toBeInTheDocument();
    expect(within(teacherSelect).getByRole("option", { name: "Выберите преподавателя" })).toBeInTheDocument();

    fireEvent.change(studentSelect, { target: { value: "student-1" } });
    fireEvent.change(teacherSelect, { target: { value: "teacher-1" } });
    expect(screen.getAllByRole("button", { name: "Назначить урок" }).at(-1)).toBeDisabled();
  });

  it("keeps edit submit enabled when filter catalog is deferred", async () => {
    render(
      <ScheduleClient
        initialData={makeStaffData({
          role: "manager",
          students: [],
          teachers: [],
          teacherLocked: false,
          filterCatalogDeferred: true,
          filters: {
            studentId: "",
            teacherId: "",
            status: "all",
            dateFrom: "",
            dateTo: ""
          },
          lessons: [
            {
              ...makeStaffData().lessons[0],
              studentId: "student-99",
              studentName: "Максим Иванов",
              teacherId: "teacher-99",
              teacherName: "Елизавета",
              title: "Present Perfect tense",
              startsAt: "2026-04-07T11:00:00.000Z",
              endsAt: "2026-04-07T12:00:00.000Z",
              meetingUrl: "http://ya.ru",
              comment: "No comments"
            }
          ]
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));

    expect(screen.getByText("Редактировать урок")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Present Perfect tense")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Сохранить" }).at(-1)).not.toBeDisabled();
    expect(screen.queryByText("Загружаю список учеников и преподавателей…")).not.toBeInTheDocument();
  });

  it("reflects staff filters in the schedule URL", async () => {
    render(<ScheduleClient initialData={makeStaffData()} />);

    fireEvent.change(screen.getAllByRole("combobox")[2], {
      target: { value: "completed" }
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/schedule?status=completed", { scroll: false });
    });
  });

  it("renders canceled lessons without student-only scheduled filtering in staff mode", async () => {
    render(
      <ScheduleClient
        initialData={makeStaffData({
          lessons: [
            {
              ...makeStaffData().lessons[0],
              id: "lesson-2",
              status: "canceled"
            }
          ]
        })}
      />
    );

    expect(screen.getAllByText("Отменён")).toHaveLength(2);
  });

  it("keeps scheduled lesson actions in a single responsive action block", async () => {
    render(<ScheduleClient initialData={makeStaffData()} />);

    const actions = screen.getByTestId("staff-lesson-actions");
    expect(actions.className).toContain("flex-col");
    expect(actions.className).toContain("xl:ml-4");
    expect(actions.className).toContain("xl:shrink-0");
    const mainContent = screen.getByTestId("staff-lesson-main-content");
    expect(mainContent.className).toContain("xl:mt-auto");
    expect(screen.getByRole("link", { name: "Открыть ученика" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Изменить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отметить проведённым" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отменить" })).toBeInTheDocument();
  });

  it("shows follow-up action for completed lessons instead of cancel controls", async () => {
    const completedLesson = {
      ...makeStaffData().lessons[0],
      status: "completed" as const,
      hasOutcome: false
    };
    render(<ScheduleClient initialData={makeStaffData({ lessons: [completedLesson] })} />);

    expect(screen.getByRole("button", { name: "Заполнить итог" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отменить" })).not.toBeInTheDocument();
  });

  it("uses russian labels for follow-up workflow and readable attendance text", async () => {
    const lessonWithAttendance = {
      ...makeStaffData().lessons[0],
      startsAt: "2020-03-28T12:30:00+03:00",
      endsAt: "2020-03-28T13:30:00+03:00",
      attendanceStatus: "missed_by_student" as const
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeStaffData({ lessons: [lessonWithAttendance] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          attendance: {
            id: "attendance-1",
            scheduleLessonId: "lesson-1",
            studentId: "student-1",
            teacherId: "teacher-1",
            status: "missed_by_student",
            markedAt: null,
            createdAt: null,
            updatedAt: null
          },
          outcome: null
        })
      });

    render(<ScheduleClient initialData={makeStaffData({ lessons: [lessonWithAttendance] })} />);

    expect(
      screen.getByText((_, element) => element?.textContent === "Посещаемость: Ученик не пришёл")
    ).toBeInTheDocument();
    expect(screen.queryByText("Attendance: missed_by_student")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Отметить проведённым" }));

    await waitFor(() => {
      expect(screen.getByText("Итоги урока")).toBeInTheDocument();
      expect(screen.getByText("Посещаемость")).toBeInTheDocument();
      expect(screen.getByText("Что прошли")).toBeInTheDocument();
      expect(screen.queryByText("Attendance")).not.toBeInTheDocument();
      expect(screen.queryByText("Covered topics")).not.toBeInTheDocument();
    });
  });

  it("disables early completion action until lesson end time", async () => {
    const futureLesson = {
      ...makeStaffData().lessons[0],
      startsAt: "2099-03-28T12:30:00+03:00",
      endsAt: "2099-03-28T13:30:00+03:00"
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ lessons: [futureLesson] })
    });

    render(<ScheduleClient initialData={makeStaffData({ lessons: [futureLesson] })} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Отметить проведённым" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Отметить проведённым" })).toBeDisabled();
  });

  it("disables completed attendance option in follow-up before lesson end", async () => {
    const futureCompletedLesson = {
      ...makeStaffData().lessons[0],
      startsAt: "2099-03-28T12:30:00+03:00",
      endsAt: "2099-03-28T13:30:00+03:00",
      status: "completed" as const,
      hasOutcome: false
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lessons: [futureCompletedLesson] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          attendance: null,
          outcome: null
        })
      });

    render(<ScheduleClient initialData={makeStaffData({ lessons: [futureCompletedLesson] })} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Заполнить итог" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Заполнить итог" }));

    await waitFor(() => {
      expect(screen.getByText("Итоги урока")).toBeInTheDocument();
    });

    const attendanceSelect = screen.getAllByRole("combobox").at(-1);
    expect(attendanceSelect).toBeDefined();
    const completedOption = within(attendanceSelect as HTMLElement).getByRole("option", { name: "Проведён" });
    expect(completedOption).toBeDisabled();
  });
});
