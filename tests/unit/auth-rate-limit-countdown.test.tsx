import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthApiError } from "@/features/auth/client/auth-api";
import { useAuthRateLimitCountdown } from "@/features/auth/client/use-auth-rate-limit-countdown";
import { formatAuthRateLimitMessage, formatRateLimitDuration } from "@/lib/auth/rate-limit-messages";

describe("auth rate-limit countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats retry-after durations as xx мин xx сек", () => {
    expect(formatRateLimitDuration(512)).toBe("08 мин 32 сек");
    expect(formatRateLimitDuration(2530)).toBe("42 мин 10 сек");
    expect(formatRateLimitDuration(45)).toBe("00 мин 45 сек");
  });

  it("counts down locally for the triggering auth flow", () => {
    const { result } = renderHook(() => useAuthRateLimitCountdown("login"));

    act(() => {
      result.current.startFromError(
        new AuthApiError(
          "rate limited",
          429,
          "RATE_LIMITED",
          undefined,
          45,
          "login"
        )
      );
    });

    expect(result.current.active).toBe(true);
    expect(result.current.message).toBe(formatAuthRateLimitMessage("login", 45));

    act(() => {
      vi.advanceTimersByTime(13_000);
    });

    expect(result.current.message).toBe(formatAuthRateLimitMessage("login", 32));

    act(() => {
      vi.advanceTimersByTime(32_000);
    });

    expect(result.current.active).toBe(false);
    expect(result.current.message).toBe("");
  });

  it("does not leak countdown state between auth forms", () => {
    const login = renderHook(() => useAuthRateLimitCountdown("login"));
    const forgotPassword = renderHook(() => useAuthRateLimitCountdown("forgot-password"));

    act(() => {
      forgotPassword.result.current.startFromError(
        new AuthApiError(
          "rate limited",
          429,
          "RATE_LIMITED",
          undefined,
          300,
          "forgot-password"
        )
      );
    });

    expect(forgotPassword.result.current.message).toBe(formatAuthRateLimitMessage("forgot-password", 300));
    expect(login.result.current.active).toBe(false);
    expect(login.result.current.message).toBe("");
  });
});
