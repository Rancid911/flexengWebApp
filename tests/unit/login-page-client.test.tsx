import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPageClient from "@/features/auth/components/login-page-client";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  }),
  useSearchParams: () => new URLSearchParams(window.location.search)
}));

vi.stubGlobal("fetch", fetchMock);

function okJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}

describe("LoginPageClient rate-limit countdown", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/login");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T10:00:00.000Z"));
    replaceMock.mockReset();
    refreshMock.mockReset();
    fetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function storeLoginBlockedUntil(retryAfterSeconds: number) {
    window.sessionStorage.setItem("authRateLimit:login:blockedUntil", String(Date.now() + retryAfterSeconds * 1000));
  }

  function renderLoginPage() {
    render(<LoginPageClient />);
    return {
      email: screen.getByTestId("login-email"),
      password: screen.getByTestId("login-password"),
      submit: screen.getByTestId("login-submit")
    };
  }

  it("shows restored rate-limit UI immediately and disables submit", () => {
    storeLoginBlockedUntil(300);

    const { submit } = renderLoginPage();

    expect(screen.getByText("Слишком много попыток входа. Попробуйте снова через 05 мин 00 сек.")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("does not submit while restored countdown is active", () => {
    storeLoginBlockedUntil(300);

    const { email, password, submit } = renderLoginPage();
    fireEvent.change(email, { target: { value: "user@example.com" } });
    fireEvent.change(password, { target: { value: "Password123!" } });

    fireEvent.submit(submit.closest("form") as HTMLFormElement);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("authRateLimit:login:blockedUntil")).toBe(String(Date.now() + 300_000));
  });

  it("keeps restored rate-limit UI visible after sleep and wake", () => {
    storeLoginBlockedUntil(300);
    const { submit } = renderLoginPage();

    vi.setSystemTime(new Date("2026-06-06T10:03:00.000Z"));

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(screen.getByText("Слишком много попыток входа. Попробуйте снова через 02 мин 00 сек.")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("clears expired stored countdown and enables submit", () => {
    window.sessionStorage.setItem("authRateLimit:login:blockedUntil", String(Date.now() - 1000));

    const { submit } = renderLoginPage();

    expect(screen.queryByText(/Слишком много попыток входа/)).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
    expect(window.sessionStorage.getItem("authRateLimit:login:blockedUntil")).toBeNull();
  });

  it("clears stored login countdown after successful login", async () => {
    const { email, password, submit } = renderLoginPage();
    window.sessionStorage.setItem("authRateLimit:login:blockedUntil", String(Date.now() + 300_000));
    fetchMock.mockResolvedValueOnce(okJson({ ok: true }));

    fireEvent.change(email, { target: { value: " USER@EXAMPLE.COM " } });
    fireEvent.change(password, { target: { value: "Password123!" } });

    await act(async () => {
      fireEvent.click(submit);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", password: "Password123!" })
      })
    );
    expect(window.sessionStorage.getItem("authRateLimit:login:blockedUntil")).toBeNull();
  });
});
