"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthApiError } from "@/features/auth/client/auth-api";
import {
  formatAuthRateLimitMessage,
  isAuthRateLimitMessageFlow,
  type AuthRateLimitMessageFlow
} from "@/lib/auth/rate-limit-messages";

function getRemainingSeconds(rateLimitUntil: number | null) {
  if (!rateLimitUntil) return 0;
  return Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
}

function getStorageKey(flow: AuthRateLimitMessageFlow) {
  return `authRateLimit:${flow}:blockedUntil`;
}

function readStoredBlockedUntil(key: string) {
  try {
    const value = window.sessionStorage.getItem(key);
    if (!value) return null;

    const blockedUntil = Number(value);
    return Number.isFinite(blockedUntil) ? blockedUntil : null;
  } catch {
    return null;
  }
}

function readActiveStoredBlockedUntil(key: string) {
  const blockedUntil = readStoredBlockedUntil(key);
  if (!blockedUntil) {
    removeStoredBlockedUntil(key);
    return null;
  }

  if (getRemainingSeconds(blockedUntil) <= 0) {
    removeStoredBlockedUntil(key);
    return null;
  }

  return blockedUntil;
}

function writeStoredBlockedUntil(key: string, blockedUntil: number) {
  try {
    window.sessionStorage.setItem(key, String(blockedUntil));
  } catch {
    // Storage can be unavailable in private browsing or constrained webviews.
  }
}

function removeStoredBlockedUntil(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or constrained webviews.
  }
}

export function useAuthRateLimitCountdown(defaultFlow: AuthRateLimitMessageFlow) {
  const storageKey = getStorageKey(defaultFlow);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(() => readActiveStoredBlockedUntil(storageKey));
  const [flow, setFlow] = useState<AuthRateLimitMessageFlow>(defaultFlow);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(readActiveStoredBlockedUntil(storageKey)));

  const clear = useCallback(() => {
    setRateLimitUntil(null);
    setRemainingSeconds(0);
    setFlow(defaultFlow);
    removeStoredBlockedUntil(storageKey);
  }, [defaultFlow, storageKey]);

  const syncRemainingFromNow = useCallback(() => {
    const nextRemaining = getRemainingSeconds(rateLimitUntil);
    if (nextRemaining <= 0) {
      setRateLimitUntil(null);
      setRemainingSeconds(0);
      setFlow(defaultFlow);
      removeStoredBlockedUntil(storageKey);
      return;
    }

    setRemainingSeconds(nextRemaining);
  }, [defaultFlow, rateLimitUntil, storageKey]);

  const startFromError = useCallback(
    (error: unknown) => {
      if (!(error instanceof AuthApiError)) return false;
      if (error.code !== "RATE_LIMITED" || typeof error.retryAfter !== "number" || error.retryAfter <= 0) return false;

      const nextUntil = Date.now() + Math.ceil(error.retryAfter) * 1000;
      setFlow(isAuthRateLimitMessageFlow(error.flow) ? error.flow : defaultFlow);
      setRateLimitUntil(nextUntil);
      setRemainingSeconds(getRemainingSeconds(nextUntil));
      writeStoredBlockedUntil(storageKey, nextUntil);
      return true;
    },
    [defaultFlow, storageKey]
  );

  useEffect(() => {
    if (!rateLimitUntil) return;

    const timer = window.setInterval(syncRemainingFromNow, 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitUntil, syncRemainingFromNow]);

  useEffect(() => {
    if (!rateLimitUntil) return;

    const syncOnVisible = () => {
      if (document.visibilityState === "visible") {
        syncRemainingFromNow();
      }
    };

    document.addEventListener("visibilitychange", syncOnVisible);
    window.addEventListener("focus", syncRemainingFromNow);

    return () => {
      document.removeEventListener("visibilitychange", syncOnVisible);
      window.removeEventListener("focus", syncRemainingFromNow);
    };
  }, [rateLimitUntil, syncRemainingFromNow]);

  const message = useMemo(() => {
    if (!rateLimitUntil || remainingSeconds <= 0) return "";
    return formatAuthRateLimitMessage(flow, remainingSeconds);
  }, [flow, rateLimitUntil, remainingSeconds]);

  return {
    active: Boolean(rateLimitUntil && remainingSeconds > 0),
    clear,
    message,
    remainingSeconds,
    startFromError
  };
}
