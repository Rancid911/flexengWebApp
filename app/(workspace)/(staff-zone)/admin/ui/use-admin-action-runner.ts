"use client";

import { useCallback } from "react";

import { useAsyncAction } from "@/hooks/use-async-action";

export function useAdminActionRunner(setActionError: (value: string) => void) {
  const { pending, run } = useAsyncAction();

  const runWithActionError = useCallback(
    async <T,>({ action, fallbackMessage }: { action: () => Promise<T>; fallbackMessage: string }) =>
      run({
        onStart: () => setActionError(""),
        onError: (requestError) => {
          setActionError(requestError instanceof Error ? requestError.message : fallbackMessage);
        },
        action
      }),
    [run, setActionError]
  );

  return { pending, runWithActionError };
}
