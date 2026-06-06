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

export function useAuthRateLimitCountdown(defaultFlow: AuthRateLimitMessageFlow) {
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [flow, setFlow] = useState<AuthRateLimitMessageFlow>(defaultFlow);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const clear = useCallback(() => {
    setRateLimitUntil(null);
    setRemainingSeconds(0);
    setFlow(defaultFlow);
  }, [defaultFlow]);

  const startFromError = useCallback(
    (error: unknown) => {
      if (!(error instanceof AuthApiError)) return false;
      if (error.code !== "RATE_LIMITED" || typeof error.retryAfter !== "number" || error.retryAfter <= 0) return false;

      const nextUntil = Date.now() + Math.ceil(error.retryAfter) * 1000;
      setFlow(isAuthRateLimitMessageFlow(error.flow) ? error.flow : defaultFlow);
      setRateLimitUntil(nextUntil);
      setRemainingSeconds(getRemainingSeconds(nextUntil));
      return true;
    },
    [defaultFlow]
  );

  useEffect(() => {
    if (!rateLimitUntil) return;

    const syncRemaining = () => {
      const nextRemaining = getRemainingSeconds(rateLimitUntil);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining <= 0) {
        setRateLimitUntil(null);
      }
    };

    syncRemaining();
    const timer = window.setInterval(syncRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [rateLimitUntil]);

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
