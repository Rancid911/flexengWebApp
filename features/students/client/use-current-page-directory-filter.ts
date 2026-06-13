"use client";

import { useMemo } from "react";

type UseCurrentPageDirectoryFilterOptions<TItem> = {
  items: TItem[];
  immediateQuery: string;
  serverQuery: string;
  getSearchText: (item: TItem) => string;
};

export function useCurrentPageDirectoryFilter<TItem>({
  items,
  immediateQuery,
  serverQuery,
  getSearchText
}: UseCurrentPageDirectoryFilterOptions<TItem>) {
  const immediateSearch = immediateQuery.trim().toLowerCase();
  const normalizedServerQuery = serverQuery.trim().toLowerCase();
  const isFilteringCurrentPage = immediateSearch.length >= 3 && immediateSearch !== normalizedServerQuery;

  const visibleItems = useMemo(() => {
    if (!isFilteringCurrentPage) {
      return items;
    }

    return items.filter((item) => getSearchText(item).toLowerCase().includes(immediateSearch));
  }, [getSearchText, immediateSearch, isFilteringCurrentPage, items]);

  const shouldShowFinalEmptyState = !isFilteringCurrentPage;

  return {
    visibleItems,
    isFilteringCurrentPage,
    shouldShowFinalEmptyState
  };
}
