"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { SearchResultList } from "@/components/search/search-result-list";
import { Input } from "@/components/ui/input";
import type { SearchGroupDto, SearchResultDto } from "@/lib/search/types";
import { cn } from "@/lib/utils";

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

export function DashboardGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchResultDto[]>([]);
  const [groups, setGroups] = useState<SearchGroupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeRequestIdRef = useRef(0);
  const deferredQuery = useDeferredValue(query.trim());
  const debouncedQuery = useDebounce(deferredQuery, 300);

  const dropdownItems = useMemo(() => {
    const grouped = new Map<string, SearchResultDto[]>();
    for (const item of items) {
      const bucket = grouped.get(item.section) ?? [];
      if (bucket.length >= 2) continue;
      bucket.push(item);
      grouped.set(item.section, bucket);
    }

    return groups.flatMap((group) => grouped.get(group.key) ?? []).slice(0, 8);
  }, [groups, items]);

  const dropdownGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          count: dropdownItems.filter((item) => item.section === group.key).length
        }))
        .filter((group) => group.count > 0),
    [dropdownItems, groups]
  );

  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      return;
    }

    const requestId = ++activeRequestIdRef.current;
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("SEARCH_REQUEST_FAILED");
        }
        return (await response.json()) as { items?: SearchResultDto[]; groups?: SearchGroupDto[] };
      })
      .then((payload) => {
        if (controller.signal.aborted || requestId !== activeRequestIdRef.current) return;
        startTransition(() => {
          setItems(Array.isArray(payload.items) ? payload.items : []);
          setGroups(Array.isArray(payload.groups) ? payload.groups : []);
          setActiveIndex(-1);
          setOpen(true);
        });
      })
      .catch((fetchError) => {
        if (controller.signal.aborted || requestId !== activeRequestIdRef.current) return;
        console.error("GLOBAL_SEARCH_ERROR", fetchError);
        startTransition(() => {
          setError("Не удалось выполнить поиск");
          setItems([]);
          setGroups([]);
          setActiveIndex(-1);
          setOpen(true);
        });
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const hasQuery = query.trim().length >= 2;
  const showDropdown = open && hasQuery;
  const footerHref = useMemo(() => `/search?q=${encodeURIComponent(query.trim())}`, [query]);
  const visibleItems = hasQuery ? dropdownItems : [];
  const visibleGroups = hasQuery ? dropdownGroups : [];
  const activeItem = activeIndex >= 0 ? visibleItems[activeIndex] ?? null : null;

  function handleSubmit() {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    if (activeItem) {
      setOpen(false);
      router.push(activeItem.href);
      return;
    }

    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <Input
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (nextQuery.trim().length < 2) {
            setLoading(false);
            setError("");
            setActiveIndex(-1);
          } else {
            setLoading(true);
            setError("");
            setActiveIndex(-1);
          }
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!showDropdown) {
              setOpen(true);
              return;
            }
            setActiveIndex((prev) => {
              const next = prev + 1;
              return next >= visibleItems.length ? 0 : next;
            });
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!showDropdown) {
              setOpen(true);
              return;
            }
            setActiveIndex((prev) => {
              if (prev <= 0) return Math.max(visibleItems.length - 1, 0);
              return prev - 1;
            });
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-10 border-none bg-[#eef1f3] pl-10 pr-10 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-200"
        placeholder="Поиск по сайту"
        aria-label="Глобальный поиск по сайту"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setItems([]);
            setGroups([]);
            setActiveIndex(-1);
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
          aria-label="Очистить поиск"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div
        data-testid="dashboard-search-dropdown"
        className={cn(
          "absolute left-[-0.75rem] right-[-0.75rem] top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[1.5rem] border border-[#dde2e9] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
          showDropdown ? "block" : "hidden"
        )}
      >
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`search-skeleton-${index}`} className="h-[58px] animate-pulse rounded-2xl border border-[#eef2f7] bg-slate-50" />
            ))}
          </div>
        ) : error ? (
          <div className="m-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-3.5 py-2.5">
              <p className="truncate text-[12px] font-semibold text-slate-500">
                {query.trim().length >= 2 ? `Быстрый поиск: “${query.trim()}”` : "Поиск по сайту"}
              </p>
              {visibleItems.length > 0 ? <span className="text-[11px] text-slate-400">Найдено {visibleItems.length}</span> : null}
            </div>
            <div className="max-h-[460px] overflow-y-auto p-3">
            <SearchResultList
              items={visibleItems}
              groups={visibleGroups}
              emptyTitle="Ничего не найдено"
              emptyDescription="Попробуйте изменить запрос или открыть полную страницу результатов."
              onNavigate={() => setOpen(false)}
              query={query.trim()}
              compact
              activeItemKey={activeItem ? `${activeItem.entityType}:${activeItem.entityId}` : null}
              onItemHover={(itemKey) => {
                const nextIndex = visibleItems.findIndex((item) => `${item.entityType}:${item.entityId}` === itemKey);
                if (nextIndex >= 0) setActiveIndex(nextIndex);
              }}
            />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#eef2f7] px-3.5 py-2.5">
              <p className="text-[11px] text-slate-400">Enter — все результаты</p>
              <Link
                href={footerHref}
                onClick={() => setOpen(false)}
                className="text-[13px] font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Открыть полную выдачу
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
