import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminTeacherProfilePage from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/page";

const requireStaffAdminPageMock = vi.fn();
const createAdminClientMock = vi.fn();
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminPage: () => requireStaffAdminPageMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock()
}));

function createQueryMock(data: Record<string, unknown> | null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn()
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({
    data,
    error: null
  });

  return query;
}

function createTeacherQueryMock(data: Record<string, unknown> | null = {
  id: "teacher-1",
  profile_id: "profile-1",
  profiles: {
    id: "profile-1",
    display_name: "Мария Петрова",
    first_name: "Мария",
    last_name: "Петрова",
    email: "teacher@example.com",
    phone: "+79990000000",
    avatar_url: "https://cdn.example.com/teacher-avatar.png",
    created_at: "2026-01-01T00:00:00.000Z"
  }
}) {
  return createQueryMock(data);
}

function createDossierQueryMock(data: Record<string, unknown> | null = {
  teacher_id: "teacher-1",
  patronymic: "Сергеевна",
  internal_role: "senior_teacher",
  timezone: "Europe/London",
  english_proficiency: "C1",
  specializations: ["business_english", "it_english"],
  teaching_experience_years: 8,
  education_level: "higher_linguistic",
  certificates: ["ielts", "tesol"],
  target_audiences: ["adults", "it_specialists"],
  certificate_other: null,
  teacher_bio: "Преподаватель с опытом корпоративного английского.",
  available_weekdays: ["monday", "wednesday"],
  time_slots: "10:00-14:00",
  max_lessons_per_day: 5,
  max_lessons_per_week: 25,
  lesson_types: ["individual", "group"],
  lesson_durations: ["60", "90"],
  teaching_approach: "mixed",
  teaching_materials: ["own_materials", "platform"],
  teaching_features: "Акцент на разговорной практике.",
  operational_status: "on_vacation",
  start_date: "2026-04-01",
  cooperation_type: "staff",
  lesson_rate_amount: 2500,
  currency: "RUB"
}) {
  return createQueryMock(data);
}

describe("AdminTeacherProfilePage", () => {
  beforeEach(() => {
    requireStaffAdminPageMock.mockReset();
    createAdminClientMock.mockReset();
    notFoundMock.mockClear();
    requireStaffAdminPageMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("renders a read-only teacher dossier for staff users", async () => {
    const teacherQuery = createTeacherQueryMock();
    const dossierQuery = createDossierQueryMock();
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "teachers") return teacherQuery;
        if (table === "teacher_dossiers") return dossierQuery;
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    render(await AdminTeacherProfilePage({ params: Promise.resolve({ teacherId: "teacher-1" }) }));

    expect(requireStaffAdminPageMock).toHaveBeenCalledTimes(1);
    expect(teacherQuery.select).toHaveBeenCalledWith(
      "id, profile_id, profiles!inner(id, display_name, first_name, last_name, email, phone, avatar_url, created_at)"
    );
    expect(teacherQuery.eq).toHaveBeenCalledWith("id", "teacher-1");
    expect(dossierQuery.select).toHaveBeenCalledWith(
      "teacher_id, patronymic, internal_role, timezone, english_proficiency, specializations, teaching_experience_years, education_level, certificates, target_audiences, certificate_other, teacher_bio, available_weekdays, time_slots, max_lessons_per_day, max_lessons_per_week, lesson_types, lesson_durations, teaching_approach, teaching_materials, teaching_features, operational_status, start_date, cooperation_type, lesson_rate_amount, currency"
    );
    expect(dossierQuery.eq).toHaveBeenCalledWith("teacher_id", "teacher-1");
    expect(screen.getByRole("heading", { name: "Мария Петрова" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Назад к учителям/ })).toHaveAttribute("href", "/admin/teachers");
    expect(screen.getByTestId("teacher-hero-avatar")).toHaveAttribute("data-avatar-url", "https://cdn.example.com/teacher-avatar.png");
    expect(screen.getByTestId("teacher-hero-avatar")).toHaveClass("border-white/25");

    expect(screen.getByRole("heading", { name: "Базовая информация" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Профессиональные данные" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Формат работы и доступность" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Методика и стиль" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Операционные данные" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Метрики" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Юридические и документы" })).toBeInTheDocument();

    expect(screen.getAllByText("teacher@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("+7 999 000 00 00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Мария")).toBeDisabled();
    expect(screen.getByDisplayValue("Петрова")).toBeDisabled();
    expect(screen.getByDisplayValue("Сергеевна")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Действия блока" })).toHaveLength(5);
    expect(screen.getByLabelText("Уровень английского")).toBeDisabled();
    expect(screen.getByLabelText("Уровень английского")).toHaveDisplayValue("C1");
    expect(screen.getByLabelText("Опыт преподавания")).toBeDisabled();
    expect(screen.getByLabelText("Опыт преподавания")).toHaveValue(8);
    expect(screen.getByLabelText("Образование")).toBeDisabled();
    expect(screen.getByLabelText("Образование")).toHaveDisplayValue("Высшее лингвистическое");
    expect(screen.getByRole("button", { name: "Специализации" })).toHaveTextContent("Business English, IT English");
    expect(screen.getByRole("button", { name: "Сертификаты" })).toHaveTextContent("IELTS, TESOL");
    expect(screen.getByRole("button", { name: "Целевая аудитория" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Целевая аудитория" })).toHaveTextContent("Взрослые, IT-специалисты");
    expect(screen.getByLabelText("Краткая биография")).toBeDisabled();
    expect(screen.getByLabelText("Краткая биография")).toHaveValue("Преподаватель с опытом корпоративного английского.");
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Доступные дни недели" })).toHaveTextContent("Понедельник, Среда");
    expect(screen.getByLabelText("Временные слоты")).toBeDisabled();
    expect(screen.getByLabelText("Временные слоты")).toHaveValue("10:00-14:00");
    expect(screen.getByLabelText("Максимум уроков в день")).toBeDisabled();
    expect(screen.getByLabelText("Максимум уроков в день")).toHaveValue(5);
    expect(screen.getByLabelText("Максимум уроков в неделю")).toBeDisabled();
    expect(screen.getByLabelText("Максимум уроков в неделю")).toHaveValue(25);
    expect(screen.getByRole("button", { name: "Тип уроков" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Тип уроков" })).toHaveTextContent("Индивидуальные, Групповые");
    expect(screen.getByRole("button", { name: "Длительность урока" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Длительность урока" })).toHaveTextContent("60 минут, 90 минут");
    expect(screen.getByLabelText("Подход")).toBeDisabled();
    expect(screen.getByLabelText("Подход")).toHaveDisplayValue("Смешанный");
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Используемые материалы" })).toHaveTextContent("Свои, Платформа");
    expect(screen.getByLabelText("Особенности преподавания")).toBeDisabled();
    expect(screen.getByLabelText("Особенности преподавания")).toHaveValue("Акцент на разговорной практике.");
    expect(screen.getByLabelText("Статус")).toBeDisabled();
    expect(screen.getByLabelText("Статус")).toHaveDisplayValue("В отпуске");
    expect(screen.getByLabelText("Дата начала работы")).toBeDisabled();
    expect(screen.getByLabelText("Дата начала работы")).toHaveValue("2026-04-01");
    expect(screen.getByLabelText("Тип сотрудничества")).toBeDisabled();
    expect(screen.getByLabelText("Тип сотрудничества")).toHaveDisplayValue("Штат");
    expect(screen.getByLabelText("Ставка за урок")).toBeDisabled();
    expect(screen.getByLabelText("Ставка за урок")).toHaveValue(2500);
    expect(screen.getByLabelText("Валюта")).toBeDisabled();
    expect(screen.getByLabelText("Валюта")).toHaveDisplayValue("Рубли");
    for (const value of screen.getAllByTestId("teacher-dossier-readonly-value")) {
      expect(value).toHaveClass("font-normal");
      expect(value).not.toHaveClass("font-semibold");
    }
    expect(screen.getAllByText("Будет заполнено").length).toBeGreaterThan(4);
  });

  it("delegates non-staff access to staff auth guard", async () => {
    requireStaffAdminPageMock.mockRejectedValue(new Error("NEXT_REDIRECT:/"));
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => createTeacherQueryMock()) });

    await expect(AdminTeacherProfilePage({ params: Promise.resolve({ teacherId: "teacher-1" }) })).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("returns not found when teacher record is missing", async () => {
    const teacherQuery = createTeacherQueryMock(null);
    createAdminClientMock.mockReturnValue({ from: vi.fn(() => teacherQuery) });

    await expect(AdminTeacherProfilePage({ params: Promise.resolve({ teacherId: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders defaults when teacher dossier table is not available yet", async () => {
    const teacherQuery = createTeacherQueryMock();
    const dossierQuery = createQueryMock(null);
    dossierQuery.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Could not find the table 'teacher_dossiers'" }
    });
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "teachers") return teacherQuery;
        if (table === "teacher_dossiers") return dossierQuery;
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    render(await AdminTeacherProfilePage({ params: Promise.resolve({ teacherId: "teacher-1" }) }));

    expect(screen.getByLabelText("Отчество")).toHaveValue("");
    expect(screen.getByLabelText("Внутренняя роль")).toHaveValue("teacher");
    expect(screen.getByLabelText("Часовой пояс")).toHaveValue("Europe/Moscow");
  });

  it("renders hero initials fallback when teacher avatar is missing", async () => {
    const teacherQuery = createTeacherQueryMock({
      id: "teacher-1",
      profile_id: "profile-1",
      profiles: {
        id: "profile-1",
        display_name: "Мария Петрова",
        first_name: "Мария",
        last_name: "Петрова",
        email: "teacher@example.com",
        phone: "+79990000000",
        avatar_url: null,
        created_at: "2026-01-01T00:00:00.000Z"
      }
    });
    const dossierQuery = createDossierQueryMock();
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "teachers") return teacherQuery;
        if (table === "teacher_dossiers") return dossierQuery;
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    render(await AdminTeacherProfilePage({ params: Promise.resolve({ teacherId: "teacher-1" }) }));

    expect(screen.getByTestId("teacher-hero-avatar")).toHaveAttribute("data-avatar-url", "");
    expect(screen.getByTestId("teacher-hero-avatar")).toHaveClass("border-white/25");
    expect(screen.getByText("МП")).toBeInTheDocument();
  });
});
