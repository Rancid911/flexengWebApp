"use client";

import { useCallback, useEffect, useRef } from "react";

type RunAbortableRequestParams<T> = {
  onError?: (error: unknown) => void;
  onStart?: () => void;
  onSuccess?: (payload: T) => void;
  request: (signal: AbortSignal) => Promise<T>;
};

export function useAbortableRequest() {
  const activeRequestIdRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
  }, []);

  const run = useCallback(async <T,>({ onError, onStart, onSuccess, request }: RunAbortableRequestParams<T>) => {
    cancel();
    const controller = new AbortController();
    const requestId = activeRequestIdRef.current + 1;

    activeRequestIdRef.current = requestId;
    activeControllerRef.current = controller;
    onStart?.();

    try {
      const payload = await request(controller.signal);
      if (controller.signal.aborted || requestId !== activeRequestIdRef.current) return null;
      onSuccess?.(payload);
      return payload;
    } catch (error) {
      if (controller.signal.aborted || requestId !== activeRequestIdRef.current) return null;
      onError?.(error);
      return null;
    }
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { cancel, run };
}
