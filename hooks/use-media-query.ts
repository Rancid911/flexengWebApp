"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, initialValue = false) {
  const [matches, setMatches] = useState(initialValue);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const syncMatches = () => {
      setMatches(mediaQuery.matches);
    };

    syncMatches();
    mediaQuery.addEventListener("change", syncMatches);
    return () => {
      mediaQuery.removeEventListener("change", syncMatches);
    };
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
