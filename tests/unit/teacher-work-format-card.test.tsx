import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TeacherWorkFormatCard,
  type TeacherWorkFormatDto
} from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/teacher-work-format-card";

const initialData: TeacherWorkFormatDto = {
  teacherId: "teacher-1",
  availableWeekdays: ["monday", "wednesday"],
  timeSlots: "10:00-14:00",
  maxLessonsPerDay: 5,
  maxLessonsPerWeek: 22,
  lessonTypes: ["individual"],
  lessonDurations: ["60"]
};

function startEditing() {
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Действия блока" }));
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.queryByRole("button", { name: "Действия блока" })).not.toBeInTheDocument();
}

describe("TeacherWorkFormatCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders work format fields disabled in the expected grid order and switches to editing", () => {
    render(<TeacherWorkFormatCard initialData={initialData} />);

    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toHaveTextContent("Понедельник, Среда");
    expect(screen.getByLabelText("Временные слоты")).toHaveValue("10:00-14:00");
    expect(screen.getByLabelText("Временные слоты").tagName).toBe("INPUT");
    expect(screen.getByLabelText("Временные слоты")).toHaveClass("h-10");
    expect(document.querySelector("textarea[name='timeSlots']")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Максимум уроков в день")).toHaveValue(5);
    expect(screen.getByLabelText("Максимум уроков в неделю")).toHaveValue(22);
    expect(screen.getByRole("button", { name: "Тип уроков" })).toHaveTextContent("Индивидуальные");
    expect(screen.getByRole("button", { name: "Длительность урока" })).toHaveTextContent("60 минут");
    expect(screen.getByLabelText("Временные слоты")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Временные слоты")).not.toHaveClass("font-semibold");
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toHaveClass("font-normal");
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).not.toHaveClass("font-semibold");
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toBeDisabled();
    expect(screen.getByLabelText("Временные слоты")).toBeDisabled();
    expect(screen.getByLabelText("Максимум уроков в день")).toBeDisabled();
    expect(screen.getByTestId("teacher-work-format-fields-grid")).toHaveClass("md:grid-cols-3");
    expect(
      Array.from(screen.getByTestId("teacher-work-format-fields-grid").querySelectorAll("label > span")).map((item) => item.textContent)
    ).toEqual([
      "Доступные дни недели",
      "Временные слоты",
      "Максимум уроков в день",
      "Максимум уроков в неделю",
      "Тип уроков",
      "Длительность урока"
    ]);

    startEditing();

    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toBeEnabled();
    expect(screen.getByLabelText("Временные слоты")).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Доступные дни недели" }));
    expect(screen.getByLabelText("Понедельник")).toBeChecked();
    expect(screen.getByText("Понедельник")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Среда")).toBeChecked();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("updates multiselect labels for weekdays, lesson types, and durations", () => {
    render(<TeacherWorkFormatCard initialData={{ ...initialData, availableWeekdays: [], lessonTypes: [], lessonDurations: [] }} />);

    startEditing();
    fireEvent.click(screen.getByRole("button", { name: "Доступные дни недели" }));
    fireEvent.click(screen.getByLabelText("Пятница"));
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toHaveTextContent("Пятница");

    fireEvent.click(screen.getByRole("button", { name: "Тип уроков" }));
    fireEvent.click(screen.getByLabelText("Групповые"));
    expect(screen.getByRole("button", { name: "Тип уроков" })).toHaveTextContent("Групповые");

    fireEvent.click(screen.getByRole("button", { name: "Длительность урока" }));
    fireEvent.click(screen.getByLabelText("30 минут"));
    fireEvent.click(screen.getByLabelText("90 минут"));
    expect(screen.getByRole("button", { name: "Длительность урока" })).toHaveTextContent("30 минут, 90 минут");
  });

  it("cancels inline edits and restores saved values", () => {
    render(<TeacherWorkFormatCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Максимум уроков в день"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(screen.getByLabelText("Максимум уроков в день")).toHaveValue(5);
    expect(screen.getByLabelText("Максимум уроков в день")).toBeDisabled();
  });

  it("sends normalized work format payload and closes editing on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          teacherId: "teacher-1",
          availableWeekdays: ["monday", "wednesday"],
          timeSlots: "11:00-15:00",
          maxLessonsPerDay: 5,
          maxLessonsPerWeek: 30,
          lessonTypes: ["individual", "group"],
          lessonDurations: ["60", "90"]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherWorkFormatCard initialData={{ ...initialData, timeSlots: "  10:00-14:00  " }} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Временные слоты"), { target: { value: "  11:00-15:00  " } });
    fireEvent.change(screen.getByLabelText("Максимум уроков в неделю"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Тип уроков" }));
    fireEvent.click(screen.getByLabelText("Групповые"));
    fireEvent.click(screen.getByRole("button", { name: "Длительность урока" }));
    fireEvent.click(screen.getByLabelText("90 минут"));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/teachers/teacher-1/dossier/work-format");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      available_weekdays: ["monday", "wednesday"],
      time_slots: "11:00-15:00",
      max_lessons_per_day: 5,
      max_lessons_per_week: 30,
      lesson_types: ["individual", "group"],
      lesson_durations: ["60", "90"]
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument());
    expect(screen.queryByText("Сохранение будет доступно после расширения базы данных")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Временные слоты")).toHaveValue("11:00-15:00");
    expect(screen.getByLabelText("Временные слоты")).toBeDisabled();
  });
});
