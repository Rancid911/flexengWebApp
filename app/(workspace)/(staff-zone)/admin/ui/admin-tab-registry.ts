"use client";

import type { LoadOptions, TabId } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminUserRole } from "@/lib/admin/types";

export const ADMIN_TABS = ["tests", "users", "blog", "notifications"] as const satisfies readonly TabId[];

export type AdminTabAdapter = {
  error: string;
  invalidateQueryCache: (query: string, roleFilter?: AdminUserRole | "all") => void;
  loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
  loading: boolean;
  page: number;
  pageCount: number;
  query: string;
  resetPage: () => void;
  roleFilter?: AdminUserRole | "all";
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
};

export type AdminTabAdapters = Record<TabId, AdminTabAdapter>;

type AdminTabAdaptersContext = {
  blog: {
    error: string;
    invalidateCacheByPrefix: (prefix: string) => void;
    loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
    loading: boolean;
    page: number;
    pageCount: number;
    query: string;
    setPage: (page: number) => void;
    setQuery: (query: string) => void;
  };
  notifications: {
    error: string;
    invalidateCacheByPrefix: (prefix: string) => void;
    loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
    loading: boolean;
    page: number;
    pageCount: number;
    query: string;
    setPage: (page: number) => void;
    setQuery: (query: string) => void;
  };
  tests: {
    error: string;
    invalidateCacheByPrefix: (prefix: string) => void;
    loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
    loading: boolean;
    page: number;
    pageCount: number;
    query: string;
    setPage: (page: number) => void;
    setQuery: (query: string) => void;
  };
  users: {
    error: string;
    invalidateCacheByPrefix: (prefix: string) => void;
    loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
    loading: boolean;
    page: number;
    pageCount: number;
    query: string;
    roleFilter: AdminUserRole | "all";
    setPage: (page: number) => void;
    setQuery: (query: string) => void;
  };
};

function buildCommonAdapter(config: {
  error: string;
  invalidateCacheByPrefix: (prefix: string) => void;
  loadPage: (pageNumber: number, query: string, options?: LoadOptions) => Promise<{ total: number } | null>;
  loading: boolean;
  page: number;
  pageCount: number;
  query: string;
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
  roleFilter?: AdminUserRole | "all";
}): AdminTabAdapter {
  return {
    error: config.error,
    invalidateQueryCache: (query: string, roleFilter?: AdminUserRole | "all") => {
      const prefix = roleFilter == null ? `${query}::` : `${query}::${roleFilter}::`;
      config.invalidateCacheByPrefix(prefix);
    },
    loadPage: config.loadPage,
    loading: config.loading,
    page: config.page,
    pageCount: config.pageCount,
    query: config.query,
    resetPage: () => config.setPage(1),
    roleFilter: config.roleFilter,
    setPage: config.setPage,
    setQuery: config.setQuery
  };
}

export function buildAdminTabAdapters(context: AdminTabAdaptersContext): AdminTabAdapters {
  return {
    tests: buildCommonAdapter(context.tests),
    users: buildCommonAdapter(context.users),
    blog: buildCommonAdapter(context.blog),
    notifications: buildCommonAdapter(context.notifications)
  };
}
