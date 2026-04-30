import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TeacherOperationalInfoCard,
  type TeacherOperationalInfoDto
} from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/teacher-operational-info-card";

const initialData: TeacherOperationalInfoDto = {
  teacherId: "teacher-1",
  status: "active",
  startDate: "2026-04-01",
  cooperationType: "freelance",
  lessonRateAmount: 2500,
  currency: "RUB"
};

function startEditing() {
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Действия блока" }));
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.queryByRole("button", { name: "Действия блока" })).not.toBeInTheDocument();
}

describe("TeacherOperationalInfoCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders operational fields disabled with Russian labels and switches to editing", () => {
    render(<TeacherOperationalInfoCard initialData={initialData} />);

    expect(screen.getByLabelText("Статус")).toHaveValue("active");
    expect(screen.getByLabelText("Статус")).toHaveDisplayValue("Активный");
    expect(screen.getByLabelText("Дата начала работы")).toHaveValue("2026-04-01");
    expect(screen.getByLabelText("Тип сотрудничества")).toHaveValue("freelance");
    expect(screen.getByLabelText("Тип сотрудничества")).toHaveDisplayValue("Фриланс");
    expect(screen.getByLabelText("Ставка за урок")).toHaveValue(2500);
    expect(screen.getByLabelText("Валюта")).toHaveValue("RUB");
    expect(screen.getByLabelText("Валюта")).toHaveDisplayValue("Рубли");
    expect(screen.getByLabelText("Статус")).toBeDisabled();
    expect(screen.getByLabelText("Дата начала работы")).toBeDisabled();
    expect(screen.getByLabelText("Статус")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Статус")).not.toHaveClass("font-semibold");
    expect(screen.getByLabelText("Дата начала работы")).toHaveClass(
      "font-normal",
      "disabled:text-slate-900",
      "disabled:opacity-100",
      "disabled:[-webkit-text-fill-color:#0f172a]"
    );
    expect(screen.getByLabelText("Дата начала работы")).not.toHaveClass("font-semibold");
    expect(screen.getByTestId("teacher-operational-info-fields-grid")).toHaveClass("md:grid-cols-3");

    startEditing();

    expect(screen.getByLabelText("Статус")).toBeEnabled();
    expect(screen.getByLabelText("Дата начала работы")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("cancels inline edits and restores saved values", () => {
    render(<TeacherOperationalInfoCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Ставка за урок"), { target: { value: "3200" } });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(screen.getByLabelText("Ставка за урок")).toHaveValue(2500);
    expect(screen.getByLabelText("Ставка за урок")).toBeDisabled();
  });

  it("sends normalized operational payload and closes editing on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          teacherId: "teacher-1",
          status: "on_vacation",
          startDate: "2026-05-10",
          cooperationType: "staff",
          lessonRateAmount: 3000,
          currency: "RUB"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherOperationalInfoCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Статус"), { target: { value: "on_vacation" } });
    fireEvent.change(screen.getByLabelText("Дата начала работы"), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText("Тип сотрудничества"), { target: { value: "staff" } });
    fireEvent.change(screen.getByLabelText("Ставка за урок"), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/teachers/teacher-1/dossier/operational-info");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      status: "on_vacation",
      start_date: "2026-05-10",
      cooperation_type: "staff",
      lesson_rate_amount: 3000,
      currency: "RUB"
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument());
    expect(screen.queryByText("Сохранение будет доступно после расширения базы данных")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Статус")).toHaveDisplayValue("В отпуске");
    expect(screen.getByLabelText("Статус")).toBeDisabled();
  });
});
