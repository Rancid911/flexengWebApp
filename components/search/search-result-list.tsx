"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SearchIcon } from "@/components/search/search-icon";
import type { SearchGroupDto, SearchResultDto } from "@/lib/search/types";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(value: string, query: string) {
  if (!query.trim()) return value;
  const pattern = new RegExp(`(${escapeRegExp(query.trim())})`, "ig");
  const parts = value.split(pattern);
  const normalizedQuery = query.trim().toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery ? (
      <mark key={`${part}-${index}`} className="rounded bg-[#fff1b8] px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export function SearchResultList({
  items,
  groups,
  emptyTitle,
  emptyDescription,
  onNavigate,
  query = "",
  compact = false,
  activeItemKey,
  onItemHover,
  getItemId,
  listboxId,
  withListboxSemantics = false
}: {
  items: SearchResultDto[];
  groups: SearchGroupDto[];
  emptyTitle: string;
  emptyDescription: string;
  onNavigate?: () => void;
  query?: string;
  compact?: boolean;
  activeItemKey?: string | null;
  onItemHover?: (itemKey: string) => void;
  getItemId?: (itemKey: string) => string;
  listboxId?: string;
  withListboxSemantics?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dde2e9] bg-[#f8fbff] px-4 py-6 text-center">
        <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div
      className={compact ? "space-y-3" : "space-y-6"}
      id={withListboxSemantics ? listboxId : undefined}
      role={withListboxSemantics ? "listbox" : undefined}
    >
      {groups.map((group) => {
        const sectionItems = items.filter((item) => item.section === group.key);
        if (sectionItems.length === 0) return null;

        return (
          <section key={group.key} className={compact ? "space-y-1.5" : "space-y-3"}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={compact ? "text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" : "text-xs font-black uppercase tracking-[0.18em] text-slate-400"}>
                {group.label}
              </h2>
              <span className={compact ? "text-[11px] font-medium text-slate-300" : "text-xs font-semibold text-slate-400"}>{group.count}</span>
            </div>
            <div className={compact ? "space-y-1.5" : "space-y-3"}>
              {sectionItems.map((item) => (
                <Link
                  key={`${item.entityType}:${item.entityId}`}
                  id={withListboxSemantics ? getItemId?.(`${item.entityType}:${item.entityId}`) : undefined}
                  href={item.href}
                  onClick={onNavigate}
                  onMouseEnter={() => onItemHover?.(`${item.entityType}:${item.entityId}`)}
                  role={withListboxSemantics ? "option" : undefined}
                  aria-selected={withListboxSemantics ? activeItemKey === `${item.entityType}:${item.entityId}` : undefined}
                  tabIndex={withListboxSemantics ? -1 : undefined}
                  className={cn(
                    "group flex items-start gap-3 border transition",
                    compact ? "rounded-2xl bg-white px-3.5 py-3" : "rounded-[1.6rem] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]",
                    activeItemKey === `${item.entityType}:${item.entityId}`
                      ? "border-indigo-200 bg-indigo-50/70 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.08)]"
                      : compact
                        ? "border-[#dde2e9] hover:bg-[#f9fbff]"
                        : "border-[#e6ebf2] hover:border-[#d7dff0] hover:bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
                  )}
                >
                  <span className={cn("mt-0.5 inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#f5f8ff] text-indigo-600", compact ? "h-9 w-9" : "h-11 w-11")}>
                    <SearchIcon icon={item.icon} className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn("truncate font-bold text-slate-900", compact ? "text-[13px]" : "text-[15px]")}>{highlightText(item.title, query)}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className={cn("rounded-full bg-slate-100 font-semibold text-slate-600", compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]")}>
                          {item.badge}
                        </Badge>
                      ) : null}
                    </span>
                    {item.subtitle ? (
                      <span className={cn("mt-1 block text-slate-600", compact ? "truncate text-[12px]" : "text-sm")}>
                        {highlightText(item.subtitle, query)}
                      </span>
                    ) : null}
                    {item.snippet ? (
                      <span className={cn("mt-1 block text-slate-500", compact ? "truncate text-[11px]" : "line-clamp-3 text-[13px] leading-6")}>
                        {highlightText(item.snippet, query)}
                      </span>
                    ) : null}
                  </span>
                  {!compact ? <span className="mt-1 text-xs font-semibold text-slate-300 transition group-hover:text-slate-400">Открыть</span> : null}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
