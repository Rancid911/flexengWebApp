"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

type OutsideEvent = MouseEvent | PointerEvent | TouchEvent;

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onOutsideClick: (event: OutsideEvent) => void
) {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: OutsideEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (ref.current?.contains(target)) return;
      onOutsideClick(event);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [enabled, onOutsideClick, ref]);
}
