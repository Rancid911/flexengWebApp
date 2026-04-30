"use client";

import { useCallback, useState } from "react";

type RunAsyncActionOptions<T> = {
  action: () => Promise<T>;
  onError?: (error: unknown) => void;
  onStart?: () => void;
  onSuccess?: (result: T) => void;
};

export function useAsyncAction() {
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>({ action, onError, onStart, onSuccess }: RunAsyncActionOptions<T>) => {
    setPending(true);
    onStart?.();

    try {
      const result = await action();
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return {
    pending,
    run
  };
}
