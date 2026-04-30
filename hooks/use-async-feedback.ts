"use client";

import { useCallback, useState } from "react";

import { useAutoClearingState } from "@/hooks/use-auto-clearing-state";

export function useAsyncFeedback() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useAutoClearingState(successMessage, setSuccessMessage, "");

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage("");
  }, []);

  const clearFeedback = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

  return {
    error,
    successMessage,
    setErrorMessage: setError,
    setSuccessMessage,
    clearError,
    clearSuccess,
    clearFeedback
  };
}
