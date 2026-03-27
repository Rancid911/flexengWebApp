import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScheduleClient } from "@/app/(dashboard)/schedule/schedule-client";
import type { StaffSchedulePageData, StudentSchedulePageData } from "@/lib/schedule/types";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

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
      updatedAt: null
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
        updatedAt: null
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
        updatedAt: null
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
  afterEach(() => {
    fetchMock.mockReset();
  });

  it("shows student upcoming lessons and meeting CTA", () => {
    render(<ScheduleClient initialData={makeStudentData()} />);

    expect(screen.getByText("Все будущие уроки в одном месте")).toBeInTheDocument();
    expect(screen.getAllByText("Speaking club")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Подключиться" })).toBeInTheDocument();
  });

  it("shows student empty state when no lessons exist", () => {
    render(<ScheduleClient initialData={makeStudentData({ nextLesson: null, lessons: [] })} />);

    expect(screen.getByText("Пока уроки не назначены")).toBeInTheDocument();
  });

  it("opens staff create drawer and keeps teacher selector locked for teacher scope", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ lessons: makeStaffData().lessons })
    });

    render(<ScheduleClient initialData={makeStaffData()} />);

    fireEvent.click(screen.getByRole("button", { name: /Назначить урок/i }));

    expect(screen.getByText("Новый урок")).toBeInTheDocument();
    const teacherFields = screen.getAllByLabelText("Преподаватель");
    const studentFields = screen.getAllByLabelText("Ученик");
    expect(teacherFields.at(-1)).toBeDisabled();
    expect(teacherFields.at(0)).toBeDisabled();
    expect(screen.queryAllByText("Все преподаватели")).toHaveLength(0);
    expect(studentFields.at(-1)).toHaveValue("student-1");
    expect(screen.getByText("Показываем только ваших учеников и ваши уроки.")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("renders canceled lessons without student-only scheduled filtering in staff mode", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        lessons: [
          {
            ...makeStaffData().lessons[0],
            id: "lesson-2",
            status: "canceled"
          }
        ]
      })
    });

    render(<ScheduleClient initialData={makeStaffData()} />);

    await waitFor(() => {
      expect(screen.getByText("Отменён")).toBeInTheDocument();
    });
  });

  it("keeps scheduled lesson actions in a single responsive action block", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ lessons: makeStaffData().lessons })
    });

    render(<ScheduleClient initialData={makeStaffData()} />);

    await waitFor(() => {
      expect(screen.getByText("Speaking club")).toBeInTheDocument();
    });

    const actions = screen.getByTestId("staff-lesson-actions");
    expect(actions.className).toContain("flex-col");
    expect(actions.className).toContain("xl:ml-4");
    expect(actions.className).toContain("xl:shrink-0");
    expect(screen.getByRole("button", { name: "Изменить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отметить проведённым" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отменить" })).toBeInTheDocument();
  });
});
