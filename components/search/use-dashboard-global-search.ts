"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

import { useAbortableRequest } from "@/hooks/use-abortable-request";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchGroupDto, SearchResultDto } from "@/lib/search/types";

type SearchStatus = "idle" | "loading" | "success" | "error";

type SearchState = {
  items: SearchResultDto[];
  groups: SearchGroupDto[];
  status: SearchStatus;
  error: string;
};

const initialState: SearchState = {
  items: [],
  groups: [],
  status: "idle",
  error: ""
};

const GLOBAL_SEARCH_DEBOUNCE_MS = 200;
const GLOBAL_SEARCH_RESULT_LIMIT = 8;
const GLOBAL_SEARCH_CACHE_LIMIT = 50;
const globalSearchSessionCache = new Map<string, Pick<SearchState, "items" | "groups">>();

function getGlobalSearchCacheKey(query: string) {
  return `${query}::${GLOBAL_SEARCH_RESULT_LIMIT}`;
}

function rememberGlobalSearchResult(cacheKey: string, result: Pick<SearchState, "items" | "groups">) {
  if (globalSearchSessionCache.has(cacheKey)) {
    globalSearchSessionCache.delete(cacheKey);
  }

  globalSearchSessionCache.set(cacheKey, result);

  while (globalSearchSessionCache.size > GLOBAL_SEARCH_CACHE_LIMIT) {
    const oldestKey = globalSearchSessionCache.keys().next().value;
    if (!oldestKey) break;
    globalSearchSessionCache.delete(oldestKey);
  }
}

export function useDashboardGlobalSearch(query: string) {
  const [state, setState] = useState<SearchState>(initialState);
  const deferredQuery = useDeferredValue(query.trim());
  const debouncedQuery = useDebouncedValue(deferredQuery, GLOBAL_SEARCH_DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length >= 2;
  const { cancel, run } = useAbortableRequest();

  useEffect(() => {
    if (!hasQuery) {
      cancel();
      startTransition(() => {
        setState(initialState);
      });
      return;
    }

    const cacheKey = getGlobalSearchCacheKey(debouncedQuery);
    const cachedResult = globalSearchSessionCache.get(cacheKey);
    if (cachedResult) {
      cancel();
      startTransition(() => {
        setState({
          ...cachedResult,
          status: "success",
          error: ""
        });
      });
      return;
    }

    void run({
      onStart: () => {
        startTransition(() => {
          setState((current) => ({
            ...current,
            status: "loading",
            error: ""
          }));
        });
      },
      onSuccess: (payload: { items?: SearchResultDto[]; groups?: SearchGroupDto[] }) => {
        const nextState = {
          items: Array.isArray(payload.items) ? payload.items : [],
          groups: Array.isArray(payload.groups) ? payload.groups : []
        };
        rememberGlobalSearchResult(cacheKey, nextState);
        startTransition(() => {
          setState({
            ...nextState,
            status: "success",
            error: ""
          });
        });
      },
      onError: (fetchError) => {
        console.error("GLOBAL_SEARCH_ERROR", fetchError);
        startTransition(() => {
          setState({
            items: [],
            groups: [],
            status: "error",
            error: "Не удалось выполнить поиск"
          });
        });
      },
      request: async (signal) => {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=${GLOBAL_SEARCH_RESULT_LIMIT}`, {
          signal,
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("SEARCH_REQUEST_FAILED");
        }

        return (await response.json()) as { items?: SearchResultDto[]; groups?: SearchGroupDto[] };
      }
    });
  }, [cancel, debouncedQuery, hasQuery, run]);

  const dropdownItems = useMemo(() => {
    const grouped = new Map<string, SearchResultDto[]>();
    for (const item of state.items) {
      const bucket = grouped.get(item.section) ?? [];
      if (bucket.length >= 2) continue;
      bucket.push(item);
      grouped.set(item.section, bucket);
    }

    return state.groups.flatMap((group) => grouped.get(group.key) ?? []).slice(0, 8);
  }, [state.groups, state.items]);

  const dropdownGroups = useMemo(
    () =>
      state.groups
        .map((group) => ({
          ...group,
          count: dropdownItems.filter((item) => item.section === group.key).length
        }))
        .filter((group) => group.count > 0),
    [dropdownItems, state.groups]
  );

  return {
    ...state,
    hasQuery,
    dropdownItems,
    dropdownGroups
  };
}
