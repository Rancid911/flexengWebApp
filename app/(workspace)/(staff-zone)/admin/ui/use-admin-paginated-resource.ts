"use client";

import { useCallback, useRef, useState } from "react";

import { CACHE_TTL_MS, PAGE_SIZE, type CacheEntry, type LoadOptions } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { PaginatedResponse } from "@/lib/admin/types";

type LoadPageParams<T> = {
  cacheKey: string;
  options?: LoadOptions;
  pageNumber: number;
  request: () => Promise<PaginatedResponse<T>>;
};

function isSamePaginatedResponse<T>(left: PaginatedResponse<T>, right: PaginatedResponse<T>) {
  if (left.total !== right.total || left.page !== right.page || left.pageSize !== right.pageSize) {
    return false;
  }
  if (left.items.length !== right.items.length) {
    return false;
  }

  return left.items.every((item, index) => Object.is(item, right.items[index]));
}

export function useAdminPaginatedResource<T>(initialData: PaginatedResponse<T>) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map<string, CacheEntry<T>>());

  const primeCache = useCallback((cacheKey: string, value: PaginatedResponse<T>, fetchedAt: number) => {
    cacheRef.current.set(cacheKey, { data: value, fetchedAt });
  }, []);

  const getFreshCacheEntry = useCallback((cacheKey: string) => {
    const entry = cacheRef.current.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    return entry;
  }, []);

  const invalidateCacheByPrefix = useCallback((prefix: string) => {
    for (const key of cacheRef.current.keys()) {
      if (key.startsWith(prefix)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  const loadPage = useCallback(
    async ({ cacheKey, options, pageNumber, request }: LoadPageParams<T>) => {
      const shouldApplyToView = !options?.background;
      const cached = options?.preferCache ? getFreshCacheEntry(cacheKey) : null;

      if (cached) {
        if (shouldApplyToView) {
          setData((prev) => (isSamePaginatedResponse(prev, cached.data) ? prev : cached.data));
        }
        if (!options?.revalidate) return cached.data;
      }

      if (shouldApplyToView) {
        setError((prev) => (prev === "" ? prev : ""));
      }
      if (shouldApplyToView && !cached) {
        setLoading(true);
        setData((prev) => {
          const nextPageSize = prev.pageSize || PAGE_SIZE;
          if (prev.items.length === 0 && prev.page === pageNumber && prev.pageSize === nextPageSize) {
            return prev;
          }
          return { ...prev, items: [], page: pageNumber, pageSize: nextPageSize };
        });
      }

      try {
        const nextData = await request();
        primeCache(cacheKey, nextData, Date.now());
        if (shouldApplyToView) {
          setData((prev) => (isSamePaginatedResponse(prev, nextData) ? prev : nextData));
        }
        return nextData;
      } catch (requestError) {
        if (shouldApplyToView) {
          const nextError = requestError instanceof Error ? requestError.message : "Не удалось загрузить данные";
          setError((prev) => (prev === nextError ? prev : nextError));
        }
        return null;
      } finally {
        if (shouldApplyToView) setLoading(false);
      }
    },
    [getFreshCacheEntry, primeCache]
  );

  return {
    data,
    error,
    invalidateCacheByPrefix,
    loadPage,
    loading,
    primeCache,
    setData
  };
}
