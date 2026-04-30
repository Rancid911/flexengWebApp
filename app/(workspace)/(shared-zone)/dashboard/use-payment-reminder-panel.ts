"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAYMENT_REMINDER_CLOSE_MS = 650;

export function usePaymentReminderPanel(enabled: boolean) {
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelMounted, setPanelMounted] = useState(enabled);
  const [panelClosing, setPanelClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (!enabled) {
        setPanelVisible(false);
        setPanelMounted(false);
        setPanelClosing(false);
        return;
      }

      setPanelMounted(true);
      setPanelVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const closePanel = useCallback(() => {
    setPanelClosing(true);
    setPanelVisible(false);

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setPanelMounted(false);
      setPanelClosing(false);
      closeTimeoutRef.current = null;
    }, PAYMENT_REMINDER_CLOSE_MS);
  }, []);

  return {
    panelVisible,
    panelMounted,
    panelClosing,
    closePanel
  };
}
