"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { clearPlacementProgress } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/use-placement-test-timer";

const PLACEMENT_EXIT_WARNING = "Если выйти сейчас, placement test будет прерван, а результаты не засчитаются.";

type UsePlacementNavigationGuardArgs = {
  activityId: string;
  active: boolean;
};

export function usePlacementNavigationGuard({ activityId, active }: UsePlacementNavigationGuardArgs) {
  const router = useRouter();
  const allowNavigationRef = useRef(false);
  const resumeNavigationRef = useRef<(() => void) | null>(null);

  const confirmInterrupt = useCallback(() => window.confirm(PLACEMENT_EXIT_WARNING), []);

  const handleExit = useCallback(() => {
    if (!active) return;
    if (!confirmInterrupt()) return;
    allowNavigationRef.current = true;
    clearPlacementProgress(activityId);
    router.push("/dashboard");
  }, [activityId, active, confirmInterrupt, router]);

  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = PLACEMENT_EXIT_WARNING;
      return PLACEMENT_EXIT_WARNING;
    };

    const handleUnload = () => {
      if (allowNavigationRef.current) return;
      clearPlacementProgress(activityId);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (allowNavigationRef.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank" || event.defaultPrevented) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.href === current.href) return;

      event.preventDefault();
      event.stopPropagation();
      if (!confirmInterrupt()) return;
      allowNavigationRef.current = true;
      clearPlacementProgress(activityId);
      window.location.assign(destination.href);
    };

    const handlePopState = () => {
      if (allowNavigationRef.current) return;
      if (!confirmInterrupt()) {
        window.history.pushState(null, "", window.location.href);
        return;
      }
      allowNavigationRef.current = true;
      clearPlacementProgress(activityId);
      const resumeNavigation = resumeNavigationRef.current;
      resumeNavigationRef.current = null;
      resumeNavigation?.();
    };

    window.history.pushState(null, "", window.location.href);
    resumeNavigationRef.current = () => {
      window.history.back();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      resumeNavigationRef.current = null;
    };
  }, [activityId, active, confirmInterrupt, router]);

  return {
    allowNavigationRef,
    handleExit
  };
}
