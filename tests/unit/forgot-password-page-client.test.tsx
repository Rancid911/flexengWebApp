import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPageClient from "@/features/auth/components/forgot-password-page-client";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("ForgotPasswordPageClient rate-limit countdown", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T10:00:00.000Z"));
    fetchMock.mockReset();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  function storeForgotPasswordBlockedUntil(retryAfterSeconds: number) {
    window.sessionStorage.setItem("authRateLimit:forgot-password:blockedUntil", String(Date.now() + retryAfterSeconds * 1000));
  }

  it("disables and guards submit while forgot-password countdown is active", () => {
    storeForgotPasswordBlockedUntil(300);
    render(<ForgotPasswordPageClient />);

    const submit = screen.getByRole("button", { name: "Отправить ссылку" });
    expect(screen.getByText("Слишком много запросов на сброс пароля. Попробуйте снова через 05 мин 00 сек.")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.submit(submit.closest("form") as HTMLFormElement);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("re-enables forgot-password submit after countdown expires", () => {
    storeForgotPasswordBlockedUntil(2);
    render(<ForgotPasswordPageClient />);

    const submit = screen.getByRole("button", { name: "Отправить ссылку" });
    expect(submit).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText(/Слишком много запросов на сброс пароля/)).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });
});
