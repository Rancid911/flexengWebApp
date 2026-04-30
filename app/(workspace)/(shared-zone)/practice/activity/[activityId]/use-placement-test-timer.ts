"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlacementTimerSession = {
  activityId: string;
  startedAt: number;
  expiresAt: number;
};

type UsePlacementTestTimerArgs = {
  activityId: string;
  enabled: boolean;
  timeLimitMinutes: number | null;
};

const PLACEMENT_TIMER_STORAGE_PREFIX = "placement-test-timer:";
const PLACEMENT_STARTED_STORAGE_PREFIX = "placement-test-started:";

function getPlacementTimerStorageKey(activityId: string) {
  return `${PLACEMENT_TIMER_STORAGE_PREFIX}${activityId}`;
}

function getPlacementStartedStorageKey(activityId: string) {
  return `${PLACEMENT_STARTED_STORAGE_PREFIX}${activityId}`;
}

function createPlacementTimerSession(activityId: string, timeLimitMinutes: number): PlacementTimerSession {
  const startedAt = Date.now();
  return {
    activityId,
    startedAt,
    expiresAt: startedAt + timeLimitMinutes * 60 * 1000
  };
}

function readPlacementTimerSession(activityId: string): PlacementTimerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getPlacementTimerStorageKey(activityId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlacementTimerSession>;
    if (parsed.activityId !== activityId || typeof parsed.startedAt !== "number" || typeof parsed.expiresAt !== "number") {
      return null;
    }
    return {
      activityId,
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}

function writePlacementTimerSession(session: PlacementTimerSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getPlacementTimerStorageKey(session.activityId), JSON.stringify(session));
  } catch {
    // localStorage is optional for this UX enhancement.
  }
}

function clearPlacementTimerSession(activityId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getPlacementTimerStorageKey(activityId));
  } catch {
    // localStorage is optional for this UX enhancement.
  }
}

export function readPlacementStartedFlag(activityId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(getPlacementStartedStorageKey(activityId)) === "true";
  } catch {
    return false;
  }
}

export function writePlacementStartedFlag(activityId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getPlacementStartedStorageKey(activityId), "true");
  } catch {
    // localStorage is optional for this UX enhancement.
  }
}

export function beginPlacementTest(activityId: string) {
  const hadStartedFlag = readPlacementStartedFlag(activityId);
  if (!hadStartedFlag) {
    clearPlacementTimerSession(activityId);
  }
  writePlacementStartedFlag(activityId);
}

export function clearPlacementStartedFlag(activityId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getPlacementStartedStorageKey(activityId));
  } catch {
    // localStorage is optional for this UX enhancement.
  }
}

export function clearPlacementProgress(activityId: string) {
  clearPlacementTimerSession(activityId);
  clearPlacementStartedFlag(activityId);
}

export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function usePlacementTestTimer({ activityId, enabled, timeLimitMinutes }: UsePlacementTestTimerArgs) {
  const [initialTimerState] = useState(() => {
    if (!enabled || timeLimitMinutes === null) {
      const startedAt = Date.now();
      return {
        session: null,
        remainingSeconds: null,
        timerExpired: false,
        startedAt
      };
    }

    const canRestoreSession = readPlacementStartedFlag(activityId);
    const restoredSession = canRestoreSession ? readPlacementTimerSession(activityId) : null;
    const session = restoredSession ?? createPlacementTimerSession(activityId, timeLimitMinutes);
    return {
      session,
      remainingSeconds: Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000)),
      timerExpired: session.expiresAt <= Date.now(),
      startedAt: session.startedAt
    };
  });
  const startedAtRef = useRef(initialTimerState.startedAt);
  const [timerSession, setTimerSession] = useState<PlacementTimerSession | null>(initialTimerState.session);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(initialTimerState.remainingSeconds);
  const [timerExpired, setTimerExpired] = useState(initialTimerState.timerExpired);
  const [timerStopped, setTimerStopped] = useState(false);

  useEffect(() => {
    if (!enabled || timeLimitMinutes === null) return;

    writePlacementStartedFlag(activityId);
    if (timerSession) {
      writePlacementTimerSession(timerSession);
    }
  }, [activityId, enabled, timeLimitMinutes, timerSession]);

  useEffect(() => {
    if (!enabled || !timerSession || timerStopped) return;

    const updateRemainingTime = () => {
      const nextRemainingSeconds = Math.max(0, Math.ceil((timerSession.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemainingSeconds);
      if (nextRemainingSeconds === 0) {
        setTimerExpired(true);
      }
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled, timerSession, timerStopped]);

  const resetPlacementTimer = useCallback(() => {
    setTimerStopped(false);
    if (enabled && timeLimitMinutes !== null) {
      const nextSession = createPlacementTimerSession(activityId, timeLimitMinutes);
      startedAtRef.current = nextSession.startedAt;
      setTimerSession(nextSession);
      setRemainingSeconds(Math.max(0, Math.ceil((nextSession.expiresAt - Date.now()) / 1000)));
      setTimerExpired(false);
      writePlacementStartedFlag(activityId);
      writePlacementTimerSession(nextSession);
      return;
    }
    startedAtRef.current = Date.now();
  }, [activityId, enabled, timeLimitMinutes]);

  const stopPlacementTimer = useCallback(() => {
    setTimerStopped(true);
  }, []);

  return {
    remainingSeconds,
    resetPlacementTimer,
    startedAtRef,
    stopPlacementTimer,
    timerExpired
  };
}
