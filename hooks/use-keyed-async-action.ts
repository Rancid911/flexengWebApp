"use client";

import { useCallback, useState } from "react";

type RunKeyedAsyncActionOptions<T> = {
  action: () => Promise<T>;
  onError?: (error: unknown) => void;
  onStart?: () => void;
  onSuccess?: (result: T) => void;
};

export function useKeyedAsyncAction() {
  const [pendingByKey, setPendingByKey] = useState<Record<string, boolean>>({});

  const run = useCallback(async <T,>(key: string, { action, onError, onStart, onSuccess }: RunKeyedAsyncActionOptions<T>) => {
    setPendingByKey((prev) => ({ ...prev, [key]: true }));
    onStart?.();

    try {
      const result = await action();
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      return null;
    } finally {
      setPendingByKey((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  return {
    pendingByKey,
    run
  };
}
