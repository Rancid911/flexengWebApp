"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SEARCH_DEBOUNCE_MS, type TabId } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminTabAdapters } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-tab-registry";

type UseAdminQuerySyncArgs = {
  initialQuery: string;
  currentTab: TabId;
  tabAdapters: AdminTabAdapters;
  setTab: (tab: TabId) => void;
  bumpPrefetchRun: () => void;
};

export function useAdminQuerySync({
  initialQuery,
  currentTab,
  tabAdapters,
  setTab,
  bumpPrefetchRun
}: UseAdminQuerySyncArgs) {
  const [q, setQState] = useState(initialQuery);
  const searchSyncTimeoutRef = useRef<number | null>(null);

  const clearSearchSyncTimeout = useCallback(() => {
    if (searchSyncTimeoutRef.current === null) return;
    window.clearTimeout(searchSyncTimeoutRef.current);
    searchSyncTimeoutRef.current = null;
  }, []);

  const syncTabQuery = useCallback(
    (nextQuery: string) => {
      const adapter = tabAdapters[currentTab];
      if (!adapter || nextQuery === adapter.query || nextQuery.length === 1) return;
      bumpPrefetchRun();
      adapter.setQuery(nextQuery);
      adapter.resetPage();
    },
    [bumpPrefetchRun, currentTab, tabAdapters]
  );

  const setQ = useCallback(
    (nextValue: string) => {
      setQState(nextValue);
      clearSearchSyncTimeout();

      searchSyncTimeoutRef.current = window.setTimeout(() => {
        syncTabQuery(nextValue.trim());
      }, SEARCH_DEBOUNCE_MS);
    },
    [clearSearchSyncTimeout, syncTabQuery]
  );

  useEffect(() => clearSearchSyncTimeout, [clearSearchSyncTimeout]);

  const setTabAndSyncQuery = useCallback(
    (nextTab: TabId) => {
      clearSearchSyncTimeout();
      setTab(nextTab);
      setQState(tabAdapters[nextTab].query);
    },
    [clearSearchSyncTimeout, setTab, tabAdapters]
  );

  return {
    q,
    setQ,
    setTabAndSyncQuery
  };
}
