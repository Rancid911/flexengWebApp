import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentNotesPanel } from "@/app/(workspace)/_components/student-profile/student-notes-panel";
import type { UserRole } from "@/lib/auth/get-user-role";
import type { TeacherStudentNoteDto } from "@/lib/teacher-workspace/types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const fetchMock = vi.fn();

function makeNote(id: string, body: string, createdByName = "Анна Админ", createdByRole: UserRole | null = "admin"): TeacherStudentNoteDto {
  return {
    id,
    studentId: "student-1",
    teacherId: "teacher-1",
    body,
    visibility: "private",
    createdByProfileId: "profile-1",
    createdByName,
    createdByRole,
    createdAt: "2026-04-21T10:00:00.000Z",
    updatedAt: "2026-04-21T10:00:00.000Z"
  };
}

describe("StudentNotesPanel", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders compact notes with creation metadata and no more than two items", () => {
    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Первая заметка"), makeNote("note-2", "Вторая заметка"), makeNote("note-3", "Третья заметка")]}
        canWriteNotes
        detailHref="/students/student-1/notes"
        mode="compact"
      />
    );

    expect(screen.getByLabelText("Новая заметка")).toBeInTheDocument();
    expect(screen.getByLabelText("Новая заметка")).toHaveAttribute("rows", "3");
    expect(screen.getByLabelText("Новая заметка").className).toContain("!min-h-[84px]");
    expect(screen.getByRole("link", { name: "Все заметки" })).toHaveAttribute("href", "/students/student-1/notes");
    expect(screen.getByText("Первая заметка")).toBeInTheDocument();
    expect(screen.getByText("Вторая заметка")).toBeInTheDocument();
    expect(screen.queryByText("Третья заметка")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Добавлено: .*Анна Админ · Администратор/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Изменить" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить" })).not.toBeInTheDocument();
  });

  it("adds a note at the top after successful submit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeNote("created-note", "Новая созданная заметка", "Мария Teacher", "teacher")
    });

    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Старая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.change(screen.getByLabelText("Новая заметка"), { target: { value: "Новая созданная заметка" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить заметку" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/students/student-1/teacher-notes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          body: "Новая созданная заметка",
          visibility: "private"
        })
      })
    );
    expect(await screen.findByText("Новая созданная заметка")).toBeInTheDocument();
    expect(screen.getByText(/Добавлено: .*Мария Teacher · Преподаватель/)).toBeInTheDocument();
    expect(screen.getByLabelText("Новая заметка")).toHaveValue("");
  });

  it("shows a fallback when note author role is missing", () => {
    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Без роли", "Неизвестный автор", null)]}
        canWriteNotes={false}
        mode="full"
      />
    );

    expect(screen.getByText(/Добавлено: .*Неизвестный автор · Роль не указана/)).toBeInTheDocument();
  });

  it("hides the creation form when user cannot write notes", () => {
    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Только просмотр")]}
        canWriteNotes={false}
        mode="full"
      />
    );

    expect(screen.queryByLabelText("Новая заметка")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить заметку" })).not.toBeInTheDocument();
    expect(screen.getByText("Только просмотр")).toBeInTheDocument();
  });

  it("edits a note in full mode", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeNote("note-1", "Обновленная заметка", "Анна Админ")
    });

    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Старая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    const actions = screen.getByTestId("student-note-actions");
    expect(actions).toHaveClass("sm:justify-end");
    expect(actions).toContainElement(screen.getByRole("button", { name: "Изменить" }));
    expect(actions).toContainElement(screen.getByRole("button", { name: "Удалить" }));
    expect(screen.getByRole("button", { name: "Изменить" })).not.toHaveClass("font-bold");
    expect(screen.getByRole("button", { name: "Удалить" })).not.toHaveClass("font-bold");
    expect(screen.getByRole("button", { name: "Удалить" })).not.toHaveClass("text-rose-600");

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    const editTextarea = screen.getByLabelText("Редактировать заметку note-1");
    expect(editTextarea).toHaveValue("Старая заметка");
    expect(editTextarea).toHaveAttribute("rows", "4");

    fireEvent.change(editTextarea, { target: { value: "Обновленная заметка" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/teacher-notes/note-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          body: "Обновленная заметка",
          visibility: "private"
        })
      })
    ));
    expect(await screen.findByText("Обновленная заметка")).toBeInTheDocument();
    expect(screen.queryByText("Старая заметка")).not.toBeInTheDocument();
  });

  it("cancels note editing without calling the API", () => {
    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Старая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.change(screen.getByLabelText("Редактировать заметку note-1"), { target: { value: "Черновик" } });
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Старая заметка")).toBeInTheDocument();
    expect(screen.queryByLabelText("Редактировать заметку note-1")).not.toBeInTheDocument();
  });

  it("does not patch an empty edited note", () => {
    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Старая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.change(screen.getByLabelText("Редактировать заметку note-1"), { target: { value: "   " } });

    expect(screen.getByRole("button", { name: "Сохранить" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes a note after inline confirmation", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "note-1" })
    });

    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Удаляемая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(screen.getByText("Удалить заметку?")).toBeInTheDocument();
    const confirmDeleteButton = screen.getAllByRole("button", { name: "Удалить" })[1];
    expect(confirmDeleteButton).not.toHaveClass("bg-rose-600");
    expect(confirmDeleteButton).not.toHaveClass("font-black");
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/teacher-notes/note-1",
      expect.objectContaining({ method: "DELETE" })
    ));
    expect(screen.queryByText("Удаляемая заметка")).not.toBeInTheDocument();
    expect(screen.getByText("Заметок пока нет.")).toBeInTheDocument();
  });

  it("shows an inline error when note update fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Не удалось обновить" })
    });

    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Старая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.change(screen.getByLabelText("Редактировать заметку note-1"), { target: { value: "Новый текст" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Не удалось обновить")).toBeInTheDocument();
  });

  it("shows an inline error when note delete fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Не удалось удалить" })
    });

    render(
      <StudentNotesPanel
        studentId="student-1"
        initialNotes={[makeNote("note-1", "Удаляемая заметка")]}
        canWriteNotes
        mode="full"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" })[1]);

    expect(await screen.findByText("Не удалось удалить")).toBeInTheDocument();
    expect(screen.getByText("Удаляемая заметка")).toBeInTheDocument();
  });
});
