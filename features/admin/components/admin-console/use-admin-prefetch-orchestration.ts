"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PAGE_SIZE, type TabId } from "@/features/admin/components/admin-console/admin-console.constants";
import type { AdminTabAdapters } from "@/features/admin/components/admin-console/admin-tab-registry";

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
    if (bootstrapped) {
      return;
    }
    if (bootstrappedFromSessionRef.current) {
      bootstrappedFromSessionRef.current = false;
      return;
    }
    let cancelled = false;
    prefetchRunIdRef.current += 1;

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
    }

    void bootstrap();
    return () => {
      cancelled = true;
      prefetchRunIdRef.current += 1;
    };
  }, [activeLoadPage, activePage, activeQuery, activeRoleFilter, bootstrapped, prefetchNeighbors, tab]);

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
