"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BACKGROUND_PREFETCH_CONCURRENCY, PAGE_SIZE, type TabId } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminTabAdapters } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-tab-registry";

type PrefetchArgs = {
  adapterRegistry: AdminTabAdapters;
  initialSnapshotPresent: boolean;
  tab: TabId;
};

function debugAdminPrefetch(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.debug(`[admin-prefetch] ${event}`, details);
}

export function useAdminPrefetchOrchestration({
  adapterRegistry,
  initialSnapshotPresent,
  tab,
}: PrefetchArgs) {
  const [bootstrapped, setBootstrapped] = useState(initialSnapshotPresent);
  const prefetchRunIdRef = useRef(0);
  const adapterRegistryRef = useRef(adapterRegistry);
  const bootstrappedFromSessionRef = useRef(initialSnapshotPresent);
  const skipNextActiveRefreshRef = useRef(false);
  const previousActiveStateRef = useRef<{
    page: number;
    query: string;
    roleFilter?: string;
    tab: TabId;
  } | null>(null);

  const activeAdapter = adapterRegistry[tab];
  const activePage = activeAdapter.page;
  const activePageCount = activeAdapter.pageCount;
  const activeQuery = activeAdapter.query;
  const activeRoleFilter = activeAdapter.roleFilter;
  const activeLoadPage = activeAdapter.loadPage;

  useEffect(() => {
    adapterRegistryRef.current = adapterRegistry;
  }, [adapterRegistry]);

  const bumpPrefetchRun = useCallback(() => {
    prefetchRunIdRef.current += 1;
  }, []);

  const runPrefetchQueue = useCallback(async (tasks: Array<() => Promise<void>>, runId: number) => {
    let index = 0;
    const workers = Array.from({ length: BACKGROUND_PREFETCH_CONCURRENCY }, async () => {
      while (index < tasks.length) {
        if (prefetchRunIdRef.current !== runId) return;
        const current = tasks[index];
        index += 1;
        await current();
      }
    });
    await Promise.all(workers);
  }, []);

  const prefetchTabPages = useCallback(
    async (tabId: TabId, pageCount: number, query: string, runId: number) => {
      const adapter = adapterRegistryRef.current[tabId];
      if (!adapter) return;
      if (pageCount <= 1) return;
      const tasks: Array<() => Promise<void>> = [];
      for (let pageNumber = 2; pageNumber <= pageCount; pageNumber += 1) {
        tasks.push(async () => {
          debugAdminPrefetch("admin-users-background-prefetch", {
            pageNumber,
            query,
            source: "bootstrap-pages",
            tabId
          });
          await adapter.loadPage(pageNumber, query, { background: true, preferCache: true, revalidate: false });
        });
      }
      await runPrefetchQueue(tasks, runId);
    },
    [runPrefetchQueue]
  );

  const prefetchNeighbors = useCallback(
    (tabId: TabId, pageNumber: number, pageCount: number, query: string) => {
      const adapter = adapterRegistryRef.current[tabId];
      if (!adapter) return;
      const neighbors = [pageNumber - 1, pageNumber + 1].filter((page) => page >= 1 && page <= pageCount);
      for (const neighborPage of neighbors) {
        debugAdminPrefetch("admin-users-background-prefetch", {
          pageNumber: neighborPage,
          query,
          source: "neighbors",
          tabId
        });
        void adapter.loadPage(neighborPage, query, { background: true, preferCache: true, revalidate: false });
      }
    },
    []
  );

  useEffect(() => {
    if (bootstrappedFromSessionRef.current) {
      bootstrappedFromSessionRef.current = false;
      return;
    }
    let cancelled = false;
    const runId = prefetchRunIdRef.current + 1;
    prefetchRunIdRef.current = runId;

    async function bootstrap() {
      debugAdminPrefetch("admin-users-bootstrap", {
        page: activePage,
        query: activeQuery,
        roleFilter: activeRoleFilter ?? null,
        tab
      });
      const firstPage = await activeLoadPage(activePage, activeQuery, {
        preferCache: true,
        revalidate: true
      });
      if (cancelled) return;
      skipNextActiveRefreshRef.current = true;
      setBootstrapped(true);

      const pageCount = firstPage ? Math.max(1, Math.ceil(firstPage.total / PAGE_SIZE)) : 1;
      previousActiveStateRef.current = {
        page: activePage,
        query: activeQuery,
        roleFilter: activeRoleFilter,
        tab
      };
      prefetchNeighbors(tab, activePage, pageCount, activeQuery);
      void prefetchTabPages(tab, pageCount, activeQuery, runId);
    }

    void bootstrap();
    return () => {
      cancelled = true;
      prefetchRunIdRef.current += 1;
    };
  }, [activeLoadPage, activePage, activeQuery, activeRoleFilter, prefetchNeighbors, prefetchTabPages, tab]);

  useEffect(() => {
    if (!bootstrapped) return;
    if (skipNextActiveRefreshRef.current) {
      skipNextActiveRefreshRef.current = false;
      return;
    }
    const previous = previousActiveStateRef.current;
    const source =
      !previous || previous.tab !== tab
        ? "tab-change"
        : previous.roleFilter !== activeRoleFilter
          ? "role-filter-change"
          : previous.query !== activeQuery
            ? "query-change"
            : previous.page !== activePage
              ? "page-change"
              : null;

    if (!source) return;

    previousActiveStateRef.current = {
      page: activePage,
      query: activeQuery,
      roleFilter: activeRoleFilter,
      tab
    };

    queueMicrotask(() => {
      debugAdminPrefetch("admin-users-active-refresh", {
        page: activePage,
        query: activeQuery,
        roleFilter: activeRoleFilter ?? null,
        source,
        tab
      });
      void activeLoadPage(activePage, activeQuery, { preferCache: true, revalidate: true });
      prefetchNeighbors(tab, activePage, activePageCount, activeQuery);
    });
  }, [activeLoadPage, activePage, activePageCount, activeQuery, activeRoleFilter, bootstrapped, prefetchNeighbors, tab]);

  return {
    bootstrapped,
    prefetchNeighbors,
    bumpPrefetchRun
  };
}
