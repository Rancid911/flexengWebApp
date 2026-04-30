import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TeacherBasicInfoCard, type TeacherBasicInfoDto } from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/teacher-basic-info-card";

const initialData: TeacherBasicInfoDto = {
  teacherId: "teacher-1",
  profileId: "profile-1",
  firstName: "Мария",
  lastName: "Петрова",
  patronymic: "Сергеевна",
  email: "teacher@example.com",
  phone: "+79990000000",
  internalRole: "senior_teacher",
  internalRoleLabel: "Senior Teacher",
  timezone: "Europe/London"
};

function startEditing() {
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Действия блока" }));
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.queryByRole("button", { name: "Действия блока" })).not.toBeInTheDocument();
}

describe("TeacherBasicInfoCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fields in read-only mode and switches to inline editing", () => {
    render(<TeacherBasicInfoCard initialData={initialData} />);

    expect(screen.getByLabelText("Имя")).toHaveValue("Мария");
    expect(screen.getByLabelText("Фамилия")).toHaveValue("Петрова");
    expect(screen.getByLabelText("Отчество")).toHaveValue("Сергеевна");
    expect(screen.getByLabelText("E-mail")).toHaveValue("teacher@example.com");
    expect(screen.getByLabelText("Телефон")).toHaveValue("+7 (999) 000 00 00");
    expect(screen.getByLabelText("Внутренняя роль")).toHaveValue("senior_teacher");
    expect(screen.getByLabelText("Часовой пояс")).toHaveValue("Europe/London");
    expect(screen.getByLabelText("Имя")).toBeDisabled();
    expect(screen.getByLabelText("Имя")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Имя")).not.toHaveClass("font-semibold");
    expect(screen.getByLabelText("Внутренняя роль")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Внутренняя роль")).not.toHaveClass("font-semibold");
    expect(screen.getByRole("button", { name: "Действия блока" })).toHaveClass("h-10", "w-10", "bg-transparent");
    expect(screen.getByRole("button", { name: "Действия блока" })).not.toHaveClass("bg-secondary");

    startEditing();

    expect(screen.getByLabelText("Имя")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("cancels inline edits and restores saved values", () => {
    render(<TeacherBasicInfoCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Анна" } });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(screen.getByLabelText("Имя")).toHaveValue("Мария");
    expect(screen.getByLabelText("Имя")).toBeDisabled();
  });

  it("saves basic info with canonical phone and updates read-only values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ...initialData,
          firstName: "Анна",
          lastName: "Иванова",
          patronymic: null,
          email: "anna@example.com",
          phone: "+79991112233",
          internalRole: "methodologist",
          internalRoleLabel: "Methodologist",
          timezone: "Asia/Dubai"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherBasicInfoCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByLabelText("Фамилия"), { target: { value: "Иванова" } });
    fireEvent.change(screen.getByLabelText("Отчество"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "anna@example.com" } });
    fireEvent.change(screen.getByLabelText("Телефон"), { target: { value: "+7 (999) 111 22 33" } });
    fireEvent.change(screen.getByLabelText("Внутренняя роль"), { target: { value: "methodologist" } });
    fireEvent.change(screen.getByLabelText("Часовой пояс"), { target: { value: "Asia/Dubai" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/teachers/teacher-1/dossier/basic-info");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      first_name: "Анна",
      last_name: "Иванова",
      patronymic: null,
      email: "anna@example.com",
      phone: "+79991112233",
      internal_role: "methodologist",
      timezone: "Asia/Dubai"
    });

    await waitFor(() => expect(screen.getByLabelText("Имя")).toBeDisabled());
    expect(screen.getByLabelText("Имя")).toHaveValue("Анна");
    expect(screen.getByLabelText("Телефон")).toHaveValue("+7 (999) 111 22 33");
  });
});
