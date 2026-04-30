import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TeacherMethodologyStyleCard,
  type TeacherMethodologyStyleDto
} from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/teacher-methodology-style-card";

const initialData: TeacherMethodologyStyleDto = {
  teacherId: "teacher-1",
  teachingApproach: "mixed",
  teachingMaterials: ["own_materials", "platform"],
  teachingFeatures: "Акцент на разговорной практике."
};

function startEditing() {
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Действия блока" }));
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.queryByRole("button", { name: "Действия блока" })).not.toBeInTheDocument();
}

describe("TeacherMethodologyStyleCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders methodology fields disabled in a three-column grid and switches to editing", () => {
    render(<TeacherMethodologyStyleCard initialData={initialData} />);

    expect(screen.getByRole("heading", { name: "Методика и стиль" })).toBeInTheDocument();
    expect(screen.getByTestId("teacher-methodology-style-fields-grid")).toHaveClass("md:grid-cols-3");
    expect(screen.getByLabelText("Подход")).toHaveValue("mixed");
    expect(screen.getByLabelText("Подход")).toHaveDisplayValue("Смешанный");
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toHaveTextContent("Свои, Платформа");
    expect(screen.getByLabelText("Особенности преподавания")).toHaveValue("Акцент на разговорной практике.");
    expect(screen.getByLabelText("Особенности преподавания")).toHaveClass("h-10", "min-h-10", "resize-none");
    expect(screen.getByLabelText("Подход")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toBeDisabled();
    expect(screen.getByLabelText("Особенности преподавания")).toBeDisabled();

    startEditing();

    expect(screen.getByLabelText("Подход")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("updates materials multiselect and sends normalized payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          teacherId: "teacher-1",
          teachingApproach: "conversational",
          teachingMaterials: ["own_materials", "platform", "textbooks"],
          teachingFeatures: "Новый комментарий"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherMethodologyStyleCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Подход"), { target: { value: "conversational" } });
    fireEvent.click(screen.getByRole("button", { name: "Используемые материалы" }));
    expect(screen.getByLabelText("Свои")).toBeChecked();
    expect(screen.getByLabelText("Платформа")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Учебники"));
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toHaveTextContent("Свои, Учебники, Платформа");
    fireEvent.change(screen.getByLabelText("Особенности преподавания"), { target: { value: "  Новый комментарий  " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/teachers/teacher-1/dossier/methodology-style");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      teaching_approach: "conversational",
      teaching_materials: ["own_materials", "platform", "textbooks"],
      teaching_features: "Новый комментарий"
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument());
    expect(screen.getByLabelText("Подход")).toHaveDisplayValue("Разговорный");
    expect(screen.getByLabelText("Особенности преподавания")).toHaveValue("Новый комментарий");
    expect(screen.getByLabelText("Особенности преподавания")).toBeDisabled();
  });
});
