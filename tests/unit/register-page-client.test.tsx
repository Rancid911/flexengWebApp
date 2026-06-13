import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RegisterPageClient from "@/features/auth/components/register-page-client";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  })
}));

vi.stubGlobal("fetch", fetchMock);

describe("RegisterPageClient rate-limit countdown", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T10:00:00.000Z"));
    replaceMock.mockReset();
    refreshMock.mockReset();
    fetchMock.mockReset();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  function storeSignupBlockedUntil(retryAfterSeconds: number) {
    window.sessionStorage.setItem("authRateLimit:signup:blockedUntil", String(Date.now() + retryAfterSeconds * 1000));
  }

  it("disables and guards submit while signup countdown is active", () => {
    storeSignupBlockedUntil(300);
    render(<RegisterPageClient />);

    const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
    expect(screen.getByText("Слишком много попыток регистрации. Попробуйте снова через 05 мин 00 сек.")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "Password123!" } });
    fireEvent.submit(submit.closest("form") as HTMLFormElement);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("re-enables signup submit after countdown expires", () => {
    storeSignupBlockedUntil(2);
    render(<RegisterPageClient />);

    const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
    expect(submit).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText(/Слишком много попыток регистрации/)).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });
});
