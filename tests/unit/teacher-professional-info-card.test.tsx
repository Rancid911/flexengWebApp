import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TeacherProfessionalInfoCard,
  type TeacherProfessionalInfoDto
} from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/teacher-professional-info-card";

const initialData: TeacherProfessionalInfoDto = {
  teacherId: "teacher-1",
  englishProficiency: "C1",
  specializations: ["business_english", "it_english"],
  teachingExperienceYears: 7,
  educationLevel: "higher_linguistic",
  certificates: ["ielts"],
  targetAudiences: ["adults", "it_specialists"],
  certificateOther: "",
  teacherBio: "Работает с взрослыми студентами."
};

function startEditing() {
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Действия блока" }));
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.queryByRole("button", { name: "Действия блока" })).not.toBeInTheDocument();
}

describe("TeacherProfessionalInfoCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders professional fields disabled and switches to inline editing", () => {
    render(<TeacherProfessionalInfoCard initialData={initialData} />);

    expect(screen.getByLabelText("Уровень английского")).toHaveValue("C1");
    expect(screen.getByLabelText("Опыт преподавания")).toHaveValue(7);
    expect(screen.getByLabelText("Образование")).toHaveValue("higher_linguistic");
    expect(screen.getByLabelText("Краткая биография")).toHaveValue("Работает с взрослыми студентами.");
    expect(screen.getByRole("button", { name: "Специализации" })).toHaveTextContent("Business English, IT English");
    expect(screen.getByRole("button", { name: "Сертификаты" })).toHaveTextContent("IELTS");
    expect(screen.getByRole("button", { name: "Целевая аудитория" })).toHaveTextContent("Взрослые, IT-специалисты");
    expect(screen.getByLabelText("Уровень английского")).toHaveClass("font-normal");
    expect(screen.getByLabelText("Уровень английского")).not.toHaveClass("font-semibold");
    expect(screen.getByRole("button", { name: "Специализации" })).toHaveClass("font-normal");
    expect(screen.getByRole("button", { name: "Специализации" })).not.toHaveClass("font-semibold");
    expect(screen.getByRole("button", { name: "Специализации" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сертификаты" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Целевая аудитория" })).toBeDisabled();
    expect(screen.getByTestId("teacher-professional-fields-grid")).toHaveClass("md:grid-cols-3");
    expect(screen.getByTestId("teacher-bio-field")).toHaveClass("lg:w-1/2");
    expect(screen.getByLabelText("Уровень английского")).toBeDisabled();

    startEditing();

    expect(screen.getByLabelText("Уровень английского")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Специализации" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Специализации" }));
    expect(screen.getByLabelText("Business English")).toBeChecked();
    expect(screen.getByText("Business English")).toHaveClass("font-normal");
    expect(screen.getByLabelText("IT English")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Целевая аудитория" }));
    expect(screen.getByLabelText("Взрослые")).toBeChecked();
    expect(screen.getByLabelText("IT-специалисты")).toBeChecked();
    expect(screen.getByLabelText("Начинающие (A1-A2)")).toBeInTheDocument();
    expect(screen.getByLabelText("Средний уровень (B1-B2)")).toBeInTheDocument();
    expect(screen.getByLabelText("Продвинутый (C1+)")).toBeInTheDocument();
    expect(screen.queryByLabelText("A1")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("A2")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("B1")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("B2")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("C1+")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("cancels inline edits and restores saved values", () => {
    render(<TeacherProfessionalInfoCard initialData={initialData} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Опыт преподавания"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(screen.getByLabelText("Опыт преподавания")).toHaveValue(7);
    expect(screen.getByLabelText("Опыт преподавания")).toBeDisabled();
  });

  it("keeps none certificate mutually exclusive and shows other certificate field", () => {
    render(<TeacherProfessionalInfoCard initialData={{ ...initialData, certificates: ["none"], certificateOther: "" }} />);

    startEditing();
    fireEvent.click(screen.getByRole("button", { name: "Сертификаты" }));
    expect(screen.getByLabelText("Нет")).toBeChecked();

    fireEvent.click(screen.getByLabelText("IELTS"));
    expect(screen.getByLabelText("Нет")).not.toBeChecked();
    expect(screen.getByLabelText("IELTS")).toBeChecked();

    fireEvent.click(screen.getByLabelText("Другой"));
    expect(screen.getByLabelText("Другой сертификат")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Нет"));
    expect(screen.getByLabelText("Нет")).toBeChecked();
    expect(screen.getByLabelText("IELTS")).not.toBeChecked();
    expect(screen.queryByLabelText("Другой сертификат")).not.toBeInTheDocument();
  });

  it("sends normalized professional payload and closes editing on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          teacherId: "teacher-1",
          englishProficiency: "C2",
          specializations: ["business_english", "it_english", "general_english"],
          teachingExperienceYears: 7,
          educationLevel: "higher_linguistic",
          certificates: ["other"],
          targetAudiences: ["adults", "it_specialists", "interview_preparation", "beginners", "intermediate", "advanced"],
          certificateOther: "TKT",
          teacherBio: "Новый текст"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherProfessionalInfoCard initialData={{ ...initialData, certificates: ["none"], certificateOther: "" }} />);

    startEditing();
    fireEvent.change(screen.getByLabelText("Уровень английского"), { target: { value: "C2" } });
    fireEvent.click(screen.getByRole("button", { name: "Специализации" }));
    fireEvent.click(screen.getByLabelText("General English"));
    fireEvent.click(screen.getByRole("button", { name: "Сертификаты" }));
    fireEvent.click(screen.getByLabelText("Другой"));
    fireEvent.click(screen.getByRole("button", { name: "Целевая аудитория" }));
    fireEvent.click(screen.getByLabelText("Подготовка к собеседованиям"));
    fireEvent.click(screen.getByLabelText("Начинающие (A1-A2)"));
    fireEvent.click(screen.getByLabelText("Средний уровень (B1-B2)"));
    fireEvent.click(screen.getByLabelText("Продвинутый (C1+)"));
    fireEvent.change(screen.getByLabelText("Другой сертификат"), { target: { value: "TKT" } });
    fireEvent.change(screen.getByLabelText("Краткая биография"), { target: { value: "  Новый текст  " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/teachers/teacher-1/dossier/professional-info");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      english_proficiency: "C2",
      specializations: ["business_english", "it_english", "general_english"],
      teaching_experience_years: 7,
      education_level: "higher_linguistic",
      certificates: ["other"],
      target_audiences: ["adults", "it_specialists", "interview_preparation", "beginners", "intermediate", "advanced"],
      certificate_other: "TKT",
      teacher_bio: "Новый текст"
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument());
    expect(screen.queryByText("Сохранение будет доступно после расширения базы данных")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Краткая биография")).toHaveValue("Новый текст");
    expect(screen.getByLabelText("Краткая биография")).toBeDisabled();
  });
});
