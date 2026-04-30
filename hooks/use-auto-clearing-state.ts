"use client";

import { useEffect } from "react";

export function useAutoClearingState<T>(value: T, setValue: (next: T) => void, emptyValue: T, delayMs = 5000) {
  useEffect(() => {
    if (!value) return;

    const timeoutId = window.setTimeout(() => {
      setValue(emptyValue);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, emptyValue, setValue, value]);
}
