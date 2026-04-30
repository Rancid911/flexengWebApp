import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { AdminTestFormDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-drawer";
import { createDefaultTestsForm, type TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { CourseModuleOptionDto, CourseOptionDto } from "@/lib/admin/types";

const moduleOptions: CourseModuleOptionDto[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    label: "A1 Grammar · Present Simple",
    courseTitle: "A1 Grammar",
    moduleTitle: "Present Simple",
    isPublished: true
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    label: "A2 Vocabulary · Travel",
    courseTitle: "A2 Vocabulary",
    moduleTitle: "Travel",
    isPublished: false
  }
];

const courseOptions: CourseOptionDto[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    label: "A1 Grammar",
    title: "A1 Grammar",
    isPublished: true
  }
];

function TestHarness({ submitting = false, formError = "" }: { submitting?: boolean; formError?: string } = {}) {
  const [form, setForm] = useState<TestsForm>(() => createDefaultTestsForm());
  const [items, setItems] = useState<CourseModuleOptionDto[]>(moduleOptions);

  return (
      <AdminTestFormDrawer
        open
      title="Новый учебный материал"
      form={form}
      onClose={() => undefined}
      onSubmit={() => undefined}
      setForm={setForm}
      submitLabel="Сохранить"
      submitting={submitting}
      formError={formError}
      moduleOptions={items}
      courseOptions={courseOptions}
      onCreateModule={async (input) => {
        const created = {
          id: "33333333-3333-4333-8333-333333333333",
          label: `A1 Grammar · ${input.title}`,
          courseTitle: "A1 Grammar",
          moduleTitle: input.title,
          isPublished: input.is_published
        };
        setItems((prev) => [...prev, created]);
        return created;
      }}
    />
  );
}

describe("AdminTestFormDrawer", () => {
  it("shows submit pending state and form error", () => {
    render(<TestHarness submitting formError="Не удалось сохранить учебный материал" />);

    expect(screen.getByTestId("admin-test-form-error")).toHaveTextContent("Не удалось сохранить учебный материал");
    expect(screen.getByRole("button", { name: "Сохранение..." })).toBeDisabled();
  });

  it("renders Russian labels and starts without a default question", () => {
    render(<TestHarness />);

    expect(screen.getByText("Основное")).toBeInTheDocument();
    expect(screen.getByTestId("admin-test-title-input")).toBeInTheDocument();
    expect(screen.getByText("Тип материала")).toBeInTheDocument();
    expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("trainer");
    expect(screen.queryByText("Тип проверки")).not.toBeInTheDocument();
    expect(screen.queryByText("Формат материала")).not.toBeInTheDocument();
    expect(screen.getByText("Модуль *")).toBeInTheDocument();
    expect(screen.queryByText("ID модуля *")).not.toBeInTheDocument();
    expect(screen.queryByText("Дополнительно")).not.toBeInTheDocument();
    expect(screen.queryByText("ID урока")).not.toBeInTheDocument();
    expect(screen.queryByText("Scoring profile")).not.toBeInTheDocument();
    expect(screen.getByText("CEFR *")).toBeInTheDocument();
    expect(screen.getByText("Тема *")).toBeInTheDocument();
    expect(screen.queryByText("Порядок в списке")).not.toBeInTheDocument();
    expect(screen.getByText("Вопросы и ответы")).toBeInTheDocument();
    expect(screen.getByText("0 шт.")).toBeInTheDocument();
    expect(screen.queryByText("Вопрос 1")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByTestId("admin-test-option-input-1-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Добавить вариант")).not.toBeInTheDocument();
  });

  it("keeps exactly one correct answer selected", () => {
    render(<TestHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить вопрос" }));

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0]?.checked).toBe(true);

    fireEvent.click(radios[2] as HTMLInputElement);

    const nextRadios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(nextRadios[0]?.checked).toBe(false);
    expect(nextRadios[1]?.checked).toBe(false);
    expect(nextRadios[2]?.checked).toBe(true);
    expect(nextRadios[3]?.checked).toBe(false);
  });

  it("adds a new question with four fixed options", () => {
    render(<TestHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить вопрос" }));

    expect(screen.getByText("Вопрос 1")).toBeInTheDocument();
    expect(screen.getByText("1 шт.")).toBeInTheDocument();
    expect(screen.getByTestId("admin-test-option-input-1-1")).toBeInTheDocument();
    expect(screen.getByTestId("admin-test-option-input-1-4")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("selects a module from readable options and has no module search field", () => {
    render(<TestHarness />);

    const moduleSelect = screen.getByTestId("admin-test-module-select") as HTMLSelectElement;
    fireEvent.change(moduleSelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    expect(moduleSelect.value).toBe("11111111-1111-4111-8111-111111111111");
    expect(screen.queryByText("ID: 11111111-1111-4111-8111-111111111111")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-test-module-search")).not.toBeInTheDocument();
  });

  it("creates a module inline and selects it", async () => {
    render(<TestHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Создать модуль" }));
    fireEvent.change(screen.getByTestId("admin-test-new-module-course"), { target: { value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } });
    fireEvent.change(screen.getByTestId("admin-test-new-module-title"), { target: { value: "Past Simple" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать" }));

    await waitFor(() => {
      expect((screen.getByTestId("admin-test-module-select") as HTMLSelectElement).value).toBe("33333333-3333-4333-8333-333333333333");
    });
    expect(screen.getByText("A1 Grammar · Past Simple")).toBeInTheDocument();
  });

  it("requires module for final tests without rendering additional settings", () => {
    render(<TestHarness />);

    expect(screen.getByText("Модуль *")).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox")[0] as HTMLSelectElement, { target: { value: "final_test" } });

    expect(screen.getByText("Модуль *")).toBeInTheDocument();
    expect(screen.queryByText("Дополнительно")).not.toBeInTheDocument();
    expect(screen.queryByText("ID урока")).not.toBeInTheDocument();
    expect(screen.queryByText("Scoring profile")).not.toBeInTheDocument();
  });

  it("uses placement as a separate material scenario with placement block levels", () => {
    render(<TestHarness />);

    fireEvent.change(screen.getAllByRole("combobox")[0] as HTMLSelectElement, { target: { value: "placement" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить вопрос" }));

    expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("placement");
    expect(screen.getByText("Уровень блока")).toBeInTheDocument();
    expect(screen.getByText("Расширенные настройки placement")).toBeInTheDocument();
    expect(screen.getByText("Scoring profile")).toBeInTheDocument();
    expect(screen.queryByText("Модуль *")).not.toBeInTheDocument();
    expect(screen.queryByText("Дополнительно")).not.toBeInTheDocument();
    expect(screen.queryByText("ID урока")).not.toBeInTheDocument();
    expect(screen.queryByText("Тип проверки")).not.toBeInTheDocument();
  });
});
