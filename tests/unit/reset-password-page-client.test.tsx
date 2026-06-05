import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPageClient from "@/features/auth/components/reset-password-page-client";

const replaceMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.stubGlobal("fetch", fetchMock);

function okJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}

function errorJson(status: number, payload: unknown) {
  return {
    ok: false,
    status,
    json: async () => payload
  };
}

async function renderReadyResetPage() {
  fetchMock.mockResolvedValueOnce(okJson({ user: { id: "user-1", email: "user@example.com" } }));
  render(<ResetPasswordPageClient />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Обновить пароль" })).toBeEnabled());
}

describe("ResetPasswordPageClient", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    fetchMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    window.history.replaceState(null, "", "/reset-password");
  });

  it("sends the recovery reset request with a valid password", async () => {
    await renderReadyResetPage();
    fetchMock.mockResolvedValueOnce(okJson({ ok: true }));

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/password/reset",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ nextPassword: "TestPassword123!" })
        })
      );
    });
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/password/change", expect.anything());
  });

  it("rejects mismatched passwords before calling the reset endpoint", async () => {
    await renderReadyResetPage();
    fetchMock.mockClear();

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "Different123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    expect(await screen.findByText("Пароли не совпадают")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows backend nextPassword field errors instead of a generic password error", async () => {
    await renderReadyResetPage();
    fetchMock.mockResolvedValueOnce(
      errorJson(400, {
        code: "AUTH_PASSWORD_ERROR",
        message: "Password reset failed",
        details: {
          fieldErrors: {
            nextPassword: ["Проверьте требования к новому паролю."]
          }
        }
      })
    );

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    expect(await screen.findByText("Проверьте требования к новому паролю.")).toBeInTheDocument();
    expect(screen.queryByText("Проверьте корректность пароля.")).not.toBeInTheDocument();
  });

  it("shows Supabase same-password backend errors instead of password requirements", async () => {
    await renderReadyResetPage();
    fetchMock.mockResolvedValueOnce(
      errorJson(400, {
        code: "AUTH_PASSWORD_ERROR",
        message: "Password reset failed",
        details: {
          fieldErrors: {
            nextPassword: ["Новый пароль должен отличаться от текущего."]
          }
        }
      })
    );

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    expect(await screen.findByText("Новый пароль должен отличаться от текущего.")).toBeInTheDocument();
    expect(screen.queryByText("Проверьте требования к новому паролю.")).not.toBeInTheDocument();
    expect(screen.queryByText("Проверьте корректность пароля.")).not.toBeInTheDocument();
  });

  it("shows backend form-level reset errors", async () => {
    await renderReadyResetPage();
    fetchMock.mockResolvedValueOnce(
      errorJson(400, {
        code: "AUTH_PASSWORD_ERROR",
        message: "Password reset failed",
        details: {
          formErrors: ["Не удалось обновить пароль. Запросите новую ссылку восстановления или попробуйте позже."]
        }
      })
    );

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    expect(await screen.findByText("Не удалось обновить пароль. Запросите новую ссылку восстановления или попробуйте позже.")).toBeInTheDocument();
  });

  it("shows the recovery context backend error", async () => {
    await renderReadyResetPage();
    fetchMock.mockResolvedValueOnce(
      errorJson(403, {
        code: "RECOVERY_CONTEXT_REQUIRED",
        message: "Ссылка для восстановления пароля истекла или недействительна. Запросите новое письмо для восстановления пароля."
      })
    );

    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.change(screen.getByLabelText("Повторите пароль"), { target: { value: "TestPassword123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Обновить пароль" }));

    expect(
      await screen.findByText("Ссылка для восстановления пароля истекла или недействительна. Запросите новое письмо для восстановления пароля.")
    ).toBeInTheDocument();
  });
});
