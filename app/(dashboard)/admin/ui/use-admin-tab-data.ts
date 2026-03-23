"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BACKGROUND_PREFETCH_CONCURRENCY,
  CACHE_TTL_MS,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  type CacheEntry,
  type LoadOptions,
  type TabId
} from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { fetchJson } from "@/app/(dashboard)/admin/ui/admin-console.utils";
import type { AdminNotificationDto, AdminTestDto, AdminUserDto, AdminUserRole, BlogCategoryDto, BlogPostDetailDto, PaginatedResponse } from "@/lib/admin/types";

const ADMIN_UI_SNAPSHOT_KEY = "admin-ui-state";

type AdminUiSnapshot = {
  fetchedAt: number;
  tab: TabId;
  q: string;
  testsPage: number;
  usersPage: number;
  blogPage: number;
  notificationsPage: number;
  testsQuery: string;
  usersQuery: string;
  blogQuery: string;
  notificationsQuery: string;
  usersRoleFilter: AdminUserRole | "all";
  tests: PaginatedResponse<AdminTestDto>;
  users: PaginatedResponse<AdminUserDto>;
  blogPosts: PaginatedResponse<BlogPostDetailDto>;
  notifications: PaginatedResponse<AdminNotificationDto>;
};

let adminRuntimeSnapshot: AdminUiSnapshot | null = null;

function isPaginatedShape(value: unknown): value is { items: unknown[]; total: number; page: number; pageSize: number } {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { items?: unknown; total?: unknown; page?: unknown; pageSize?: unknown };
  return Array.isArray(maybe.items) && typeof maybe.total === "number" && typeof maybe.page === "number" && typeof maybe.pageSize === "number";
}

function isValidSnapshot(value: unknown): value is AdminUiSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<AdminUiSnapshot>;
  return (
    typeof snapshot.fetchedAt === "number" &&
    (snapshot.tab === "tests" || snapshot.tab === "users" || snapshot.tab === "blog") &&
    typeof snapshot.q === "string" &&
    typeof snapshot.testsPage === "number" &&
    typeof snapshot.usersPage === "number" &&
    typeof snapshot.blogPage === "number" &&
    typeof snapshot.notificationsPage === "number" &&
    typeof snapshot.testsQuery === "string" &&
    typeof snapshot.usersQuery === "string" &&
    typeof snapshot.blogQuery === "string" &&
    typeof snapshot.notificationsQuery === "string" &&
    (snapshot.usersRoleFilter === "all" ||
      snapshot.usersRoleFilter === "student" ||
      snapshot.usersRoleFilter === "teacher" ||
      snapshot.usersRoleFilter === "manager" ||
      snapshot.usersRoleFilter === "admin") &&
    isPaginatedShape(snapshot.tests) &&
    isPaginatedShape(snapshot.users) &&
    isPaginatedShape(snapshot.blogPosts) &&
    isPaginatedShape(snapshot.notifications)
  );
}

function readSessionSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ADMIN_UI_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionSnapshot(snapshot: AdminUiSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_UI_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // no-op
  }
}

export function useAdminTabData() {
  const [tab, setTab] = useState<TabId>(adminRuntimeSnapshot?.tab ?? "tests");
  const [q, setQ] = useState(adminRuntimeSnapshot?.q ?? "");

  const [testsPage, setTestsPage] = useState(adminRuntimeSnapshot?.testsPage ?? 1);
  const [usersPage, setUsersPage] = useState(adminRuntimeSnapshot?.usersPage ?? 1);
  const [blogPage, setBlogPage] = useState(adminRuntimeSnapshot?.blogPage ?? 1);
  const [notificationsPage, setNotificationsPage] = useState(adminRuntimeSnapshot?.notificationsPage ?? 1);

  const [testsQuery, setTestsQuery] = useState(adminRuntimeSnapshot?.testsQuery ?? "");
  const [usersQuery, setUsersQuery] = useState(adminRuntimeSnapshot?.usersQuery ?? "");
  const [blogQuery, setBlogQuery] = useState(adminRuntimeSnapshot?.blogQuery ?? "");
  const [notificationsQuery, setNotificationsQuery] = useState(adminRuntimeSnapshot?.notificationsQuery ?? "");
  const [usersRoleFilter, setUsersRoleFilter] = useState<AdminUserRole | "all">(adminRuntimeSnapshot?.usersRoleFilter ?? "all");

  const [testsError, setTestsError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [blogError, setBlogError] = useState("");
  const [notificationsError, setNotificationsError] = useState("");
  const [testsLoading, setTestsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [tests, setTests] = useState<PaginatedResponse<AdminTestDto>>(
    adminRuntimeSnapshot?.tests ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );
  const [users, setUsers] = useState<PaginatedResponse<AdminUserDto>>(
    adminRuntimeSnapshot?.users ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );
  const [blogPosts, setBlogPosts] = useState<PaginatedResponse<BlogPostDetailDto>>(
    adminRuntimeSnapshot?.blogPosts ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );
  const [notifications, setNotifications] = useState<PaginatedResponse<AdminNotificationDto>>(
    adminRuntimeSnapshot?.notifications ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );
  const [blogCategories, setBlogCategories] = useState<BlogCategoryDto[]>([]);

  const [bootstrapped, setBootstrapped] = useState(adminRuntimeSnapshot !== null);

  const testsCacheRef = useRef(new Map<string, CacheEntry<AdminTestDto>>());
  const usersCacheRef = useRef(new Map<string, CacheEntry<AdminUserDto>>());
  const blogCacheRef = useRef(new Map<string, CacheEntry<BlogPostDetailDto>>());
  const notificationsCacheRef = useRef(new Map<string, CacheEntry<AdminNotificationDto>>());
  const blogMetaLoadedRef = useRef(false);
  const prefetchRunIdRef = useRef(0);
  const bootstrappedFromSessionRef = useRef(false);

  const testsPageCount = useMemo(() => Math.max(1, Math.ceil(tests.total / PAGE_SIZE)), [tests.total]);
  const usersPageCount = useMemo(() => Math.max(1, Math.ceil(users.total / PAGE_SIZE)), [users.total]);
  const blogPageCount = useMemo(() => Math.max(1, Math.ceil(blogPosts.total / PAGE_SIZE)), [blogPosts.total]);
  const notificationsPageCount = useMemo(() => Math.max(1, Math.ceil(notifications.total / PAGE_SIZE)), [notifications.total]);
  const activePage = tab === "tests" ? testsPage : tab === "users" ? usersPage : tab === "blog" ? blogPage : notificationsPage;
  const activePageCount = tab === "tests" ? testsPageCount : tab === "users" ? usersPageCount : tab === "blog" ? blogPageCount : notificationsPageCount;
  const activeListError = tab === "tests" ? testsError : tab === "users" ? usersError : tab === "blog" ? blogError : notificationsError;
  const activeListLoading = tab === "tests" ? testsLoading : tab === "users" ? usersLoading : tab === "blog" ? blogLoading : notificationsLoading;

  const makeCacheKey = useCallback((query: string, pageNumber: number) => `${query}::${pageNumber}`, []);
  const makeUsersCacheKey = useCallback((query: string, role: AdminUserRole | "all", pageNumber: number) => `${query}::${role}::${pageNumber}`, []);

  useEffect(() => {
    if (adminRuntimeSnapshot) {
      testsCacheRef.current.set(
        makeCacheKey(adminRuntimeSnapshot.testsQuery, adminRuntimeSnapshot.tests.page),
        { data: adminRuntimeSnapshot.tests, fetchedAt: adminRuntimeSnapshot.fetchedAt }
      );
      usersCacheRef.current.set(
        makeUsersCacheKey(adminRuntimeSnapshot.usersQuery, adminRuntimeSnapshot.usersRoleFilter, adminRuntimeSnapshot.users.page),
        { data: adminRuntimeSnapshot.users, fetchedAt: adminRuntimeSnapshot.fetchedAt }
      );
      blogCacheRef.current.set(
        makeCacheKey(adminRuntimeSnapshot.blogQuery, adminRuntimeSnapshot.blogPosts.page),
        { data: adminRuntimeSnapshot.blogPosts, fetchedAt: adminRuntimeSnapshot.fetchedAt }
      );
      notificationsCacheRef.current.set(
        makeCacheKey(adminRuntimeSnapshot.notificationsQuery, adminRuntimeSnapshot.notifications.page),
        { data: adminRuntimeSnapshot.notifications, fetchedAt: adminRuntimeSnapshot.fetchedAt }
      );
      return;
    }

    const snapshot = readSessionSnapshot();
    if (!snapshot) return;

    adminRuntimeSnapshot = snapshot;
    bootstrappedFromSessionRef.current = true;

    setTab(snapshot.tab);
    setQ(snapshot.q);
    setTestsPage(snapshot.testsPage);
    setUsersPage(snapshot.usersPage);
    setBlogPage(snapshot.blogPage);
    setNotificationsPage(snapshot.notificationsPage);
    setTestsQuery(snapshot.testsQuery);
    setUsersQuery(snapshot.usersQuery);
    setBlogQuery(snapshot.blogQuery);
    setNotificationsQuery(snapshot.notificationsQuery);
    setUsersRoleFilter(snapshot.usersRoleFilter);
    setTests(snapshot.tests);
    setUsers(snapshot.users);
    setBlogPosts(snapshot.blogPosts);
    setNotifications(snapshot.notifications);

    testsCacheRef.current.set(makeCacheKey(snapshot.testsQuery, snapshot.tests.page), {
      data: snapshot.tests,
      fetchedAt: snapshot.fetchedAt
    });
    usersCacheRef.current.set(makeUsersCacheKey(snapshot.usersQuery, snapshot.usersRoleFilter, snapshot.users.page), {
      data: snapshot.users,
      fetchedAt: snapshot.fetchedAt
    });
    blogCacheRef.current.set(makeCacheKey(snapshot.blogQuery, snapshot.blogPosts.page), {
      data: snapshot.blogPosts,
      fetchedAt: snapshot.fetchedAt
    });
    notificationsCacheRef.current.set(makeCacheKey(snapshot.notificationsQuery, snapshot.notifications.page), {
      data: snapshot.notifications,
      fetchedAt: snapshot.fetchedAt
    });
    setBootstrapped(true);
  }, [makeCacheKey, makeUsersCacheKey]);

  const getFreshCacheEntry = useCallback(<T,>(cache: Map<string, CacheEntry<T>>, key: string) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry;
  }, []);

  const invalidateCacheForQuery = useCallback((tabId: TabId, query: string, roleFilter: AdminUserRole | "all" = "all") => {
    const map =
      tabId === "tests"
        ? testsCacheRef.current
        : tabId === "users"
          ? usersCacheRef.current
          : tabId === "blog"
            ? blogCacheRef.current
            : notificationsCacheRef.current;
    const prefix = tabId === "users" ? `${query}::${roleFilter}::` : `${query}::`;
    for (const key of map.keys()) {
      if (key.startsWith(prefix)) {
        map.delete(key);
      }
    }
  }, []);

  const loadBlogMeta = useCallback(async (force = false) => {
    if (blogMetaLoadedRef.current && !force) return;
    const categories = await fetchJson<BlogCategoryDto[]>("/api/admin/blog/categories");
    setBlogCategories(categories);
    blogMetaLoadedRef.current = true;
  }, []);

  const loadTestsPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const shouldApplyToView = !options?.background;
      const cacheKey = makeCacheKey(query, pageNumber);
      const cached = options?.preferCache ? getFreshCacheEntry(testsCacheRef.current, cacheKey) : null;

      if (cached) {
        if (shouldApplyToView) setTests(cached.data);
        if (!options?.revalidate) return cached.data;
      }

      setTestsError("");
      if (shouldApplyToView && !cached) {
        setTestsLoading(true);
        setTests((prev) => ({ ...prev, items: [], page: pageNumber, pageSize: PAGE_SIZE }));
      }
      try {
        const data = await fetchJson<PaginatedResponse<AdminTestDto>>(
          `/api/admin/tests?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
        );
        testsCacheRef.current.set(cacheKey, { data, fetchedAt: Date.now() });
        if (shouldApplyToView) setTests(data);
        return data;
      } catch (requestError) {
        if (shouldApplyToView) setTestsError(requestError instanceof Error ? requestError.message : "Не удалось загрузить тесты");
        return null;
      } finally {
        if (shouldApplyToView) setTestsLoading(false);
      }
    },
    [getFreshCacheEntry, makeCacheKey]
  );

  const loadUsersPageData = useCallback(
    async (pageNumber: number, query: string, roleFilter: AdminUserRole | "all", options?: LoadOptions) => {
      const shouldApplyToView = !options?.background;
      const cacheKey = makeUsersCacheKey(query, roleFilter, pageNumber);
      const cached = options?.preferCache ? getFreshCacheEntry(usersCacheRef.current, cacheKey) : null;

      if (cached) {
        if (shouldApplyToView) setUsers(cached.data);
        if (!options?.revalidate) return cached.data;
      }

      setUsersError("");
      if (shouldApplyToView && !cached) {
        setUsersLoading(true);
        setUsers((prev) => ({ ...prev, items: [], page: pageNumber, pageSize: PAGE_SIZE }));
      }
      try {
        const data = await fetchJson<PaginatedResponse<AdminUserDto>>(
          `/api/admin/users?q=${encodeURIComponent(query)}&role=${roleFilter}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
        );
        usersCacheRef.current.set(cacheKey, { data, fetchedAt: Date.now() });
        if (shouldApplyToView) setUsers(data);
        return data;
      } catch (requestError) {
        if (shouldApplyToView) setUsersError(requestError instanceof Error ? requestError.message : "Не удалось загрузить пользователей");
        return null;
      } finally {
        if (shouldApplyToView) setUsersLoading(false);
      }
    },
    [getFreshCacheEntry, makeUsersCacheKey]
  );

  const loadBlogPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const shouldApplyToView = !options?.background;
      const cacheKey = makeCacheKey(query, pageNumber);
      const cached = options?.preferCache ? getFreshCacheEntry(blogCacheRef.current, cacheKey) : null;

      if (cached) {
        if (shouldApplyToView) setBlogPosts(cached.data);
        if (!options?.revalidate) return cached.data;
      }

      setBlogError("");
      if (shouldApplyToView && !cached) {
        setBlogLoading(true);
        setBlogPosts((prev) => ({ ...prev, items: [], page: pageNumber, pageSize: PAGE_SIZE }));
      }
      try {
        const [postsData] = await Promise.all([
          fetchJson<PaginatedResponse<BlogPostDetailDto>>(
            `/api/admin/blog/posts?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
          ),
          loadBlogMeta()
        ]);
        blogCacheRef.current.set(cacheKey, { data: postsData, fetchedAt: Date.now() });
        if (shouldApplyToView) setBlogPosts(postsData);
        return postsData;
      } catch (requestError) {
        if (shouldApplyToView) setBlogError(requestError instanceof Error ? requestError.message : "Не удалось загрузить блог");
        return null;
      } finally {
        if (shouldApplyToView) setBlogLoading(false);
      }
    },
    [getFreshCacheEntry, loadBlogMeta, makeCacheKey]
  );

  const loadNotificationsPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const shouldApplyToView = !options?.background;
      const cacheKey = makeCacheKey(query, pageNumber);
      const cached = options?.preferCache ? getFreshCacheEntry(notificationsCacheRef.current, cacheKey) : null;

      if (cached) {
        if (shouldApplyToView) setNotifications(cached.data);
        if (!options?.revalidate) return cached.data;
      }

      setNotificationsError("");
      if (shouldApplyToView && !cached) {
        setNotificationsLoading(true);
        setNotifications((prev) => ({ ...prev, items: [], page: pageNumber, pageSize: PAGE_SIZE }));
      }

      try {
        const data = await fetchJson<PaginatedResponse<AdminNotificationDto>>(
          `/api/admin/notifications?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
        );
        notificationsCacheRef.current.set(cacheKey, { data, fetchedAt: Date.now() });
        if (shouldApplyToView) setNotifications(data);
        return data;
      } catch (requestError) {
        if (shouldApplyToView) {
          setNotificationsError(requestError instanceof Error ? requestError.message : "Не удалось загрузить уведомления");
        }
        return null;
      } finally {
        if (shouldApplyToView) setNotificationsLoading(false);
      }
    },
    [getFreshCacheEntry, makeCacheKey]
  );

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
    async (tabId: TabId, pageCount: number, query: string, roleFilter: AdminUserRole | "all", runId: number) => {
      if (pageCount <= 1) return;
      const tasks: Array<() => Promise<void>> = [];
      for (let pageNumber = 2; pageNumber <= pageCount; pageNumber += 1) {
        if (tabId === "tests") {
          tasks.push(async () => {
            await loadTestsPageData(pageNumber, query, { background: true, preferCache: true, revalidate: false });
          });
        } else if (tabId === "users") {
          tasks.push(async () => {
            await loadUsersPageData(pageNumber, query, roleFilter, { background: true, preferCache: true, revalidate: false });
          });
        } else if (tabId === "blog") {
          tasks.push(async () => {
            await loadBlogPageData(pageNumber, query, { background: true, preferCache: true, revalidate: false });
          });
        } else {
          tasks.push(async () => {
            await loadNotificationsPageData(pageNumber, query, { background: true, preferCache: true, revalidate: false });
          });
        }
      }
      await runPrefetchQueue(tasks, runId);
    },
    [loadBlogPageData, loadNotificationsPageData, loadTestsPageData, loadUsersPageData, runPrefetchQueue]
  );

  const prefetchNeighbors = useCallback(
    (tabId: TabId, pageNumber: number, pageCount: number, query: string, roleFilter: AdminUserRole | "all" = "all") => {
      const neighbors = [pageNumber - 1, pageNumber + 1].filter((page) => page >= 1 && page <= pageCount);
      for (const neighborPage of neighbors) {
        if (tabId === "tests") {
          void loadTestsPageData(neighborPage, query, { background: true, preferCache: true, revalidate: false });
        } else if (tabId === "users") {
          void loadUsersPageData(neighborPage, query, roleFilter, { background: true, preferCache: true, revalidate: false });
        } else if (tabId === "blog") {
          void loadBlogPageData(neighborPage, query, { background: true, preferCache: true, revalidate: false });
        } else {
          void loadNotificationsPageData(neighborPage, query, { background: true, preferCache: true, revalidate: false });
        }
      }
    },
    [loadBlogPageData, loadNotificationsPageData, loadTestsPageData, loadUsersPageData]
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
      const [testsFirst, usersFirst, blogFirst, notificationsFirst] = await Promise.all([
        loadTestsPageData(1, testsQuery, { preferCache: true, revalidate: true }),
        loadUsersPageData(1, usersQuery, usersRoleFilter, { preferCache: true, revalidate: true }),
        loadBlogPageData(1, blogQuery, { preferCache: true, revalidate: true }),
        loadNotificationsPageData(1, notificationsQuery, { preferCache: true, revalidate: true })
      ]);
      if (cancelled) return;
      setBootstrapped(true);

      void Promise.all([
        prefetchTabPages("tests", testsFirst ? Math.max(1, Math.ceil(testsFirst.total / PAGE_SIZE)) : 1, testsQuery, "all", runId),
        prefetchTabPages("users", usersFirst ? Math.max(1, Math.ceil(usersFirst.total / PAGE_SIZE)) : 1, usersQuery, usersRoleFilter, runId),
        prefetchTabPages("blog", blogFirst ? Math.max(1, Math.ceil(blogFirst.total / PAGE_SIZE)) : 1, blogQuery, "all", runId),
        prefetchTabPages("notifications", notificationsFirst ? Math.max(1, Math.ceil(notificationsFirst.total / PAGE_SIZE)) : 1, notificationsQuery, "all", runId)
      ]);
    }

    void bootstrap();
    return () => {
      cancelled = true;
      prefetchRunIdRef.current += 1;
    };
  }, [blogQuery, loadBlogPageData, loadNotificationsPageData, loadTestsPageData, loadUsersPageData, notificationsQuery, prefetchTabPages, testsQuery, usersQuery, usersRoleFilter]);

  useEffect(() => {
    if (!bootstrapped) return;
    const snapshot: AdminUiSnapshot = {
      fetchedAt: Date.now(),
      tab,
      q,
      testsPage,
      usersPage,
      blogPage,
      notificationsPage,
      testsQuery,
      usersQuery,
      blogQuery,
      notificationsQuery,
      usersRoleFilter,
      tests,
      users,
      blogPosts,
      notifications
    };
    adminRuntimeSnapshot = snapshot;
    writeSessionSnapshot(snapshot);
  }, [blogPage, blogPosts, blogQuery, bootstrapped, notifications, notificationsPage, notificationsQuery, q, tab, tests, testsPage, testsQuery, users, usersPage, usersQuery, usersRoleFilter]);

  useEffect(() => {
    if (!bootstrapped) return;
    if (tab === "tests") {
      queueMicrotask(() => {
        void loadTestsPageData(testsPage, testsQuery, { preferCache: true, revalidate: true });
        prefetchNeighbors("tests", testsPage, testsPageCount, testsQuery);
      });
      return;
    }
    if (tab === "users") {
      queueMicrotask(() => {
        void loadUsersPageData(usersPage, usersQuery, usersRoleFilter, { preferCache: true, revalidate: true });
        prefetchNeighbors("users", usersPage, usersPageCount, usersQuery, usersRoleFilter);
      });
      return;
    }
    if (tab === "blog") {
      queueMicrotask(() => {
        void loadBlogPageData(blogPage, blogQuery, { preferCache: true, revalidate: true });
        prefetchNeighbors("blog", blogPage, blogPageCount, blogQuery);
      });
      return;
    }
    queueMicrotask(() => {
      void loadNotificationsPageData(notificationsPage, notificationsQuery, { preferCache: true, revalidate: true });
      prefetchNeighbors("notifications", notificationsPage, notificationsPageCount, notificationsQuery);
    });
  }, [
    blogPage,
    blogPageCount,
    blogQuery,
    bootstrapped,
    loadBlogPageData,
    loadNotificationsPageData,
    loadTestsPageData,
    loadUsersPageData,
    notificationsPage,
    notificationsPageCount,
    notificationsQuery,
    prefetchNeighbors,
    tab,
    testsPage,
    testsPageCount,
    testsQuery,
    usersPage,
    usersPageCount,
    usersQuery
    ,
    usersRoleFilter
  ]);

  useEffect(() => {
    const nextQuery = q.trim();
    const handle = window.setTimeout(() => {
      if (nextQuery.length === 1) return;

      if (tab === "tests") {
        if (nextQuery === testsQuery) return;
        prefetchRunIdRef.current += 1;
        setTestsQuery(nextQuery);
        setTestsPage(1);
        return;
      }

      if (tab === "users") {
        if (nextQuery === usersQuery) return;
        prefetchRunIdRef.current += 1;
        setUsersQuery(nextQuery);
        setUsersPage(1);
        return;
      }
      if (tab === "blog") {
        if (nextQuery === blogQuery) return;
        prefetchRunIdRef.current += 1;
        setBlogQuery(nextQuery);
        setBlogPage(1);
        return;
      }
      if (nextQuery === notificationsQuery) return;
      prefetchRunIdRef.current += 1;
      setNotificationsQuery(nextQuery);
      setNotificationsPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [blogQuery, notificationsQuery, q, tab, testsQuery, usersQuery]);

  const setUsersRoleFilterAndSync = useCallback((nextRole: AdminUserRole | "all") => {
    if (nextRole === usersRoleFilter) return;
    prefetchRunIdRef.current += 1;
    setUsersRoleFilter(nextRole);
    setUsersPage(1);
  }, [usersRoleFilter]);

  const setTabAndSyncQuery = useCallback(
    (nextTab: TabId) => {
      setTab(nextTab);
      if (nextTab === "tests") setQ(testsQuery);
      if (nextTab === "users") setQ(usersQuery);
      if (nextTab === "blog") setQ(blogQuery);
      if (nextTab === "notifications") setQ(notificationsQuery);
    },
    [blogQuery, notificationsQuery, testsQuery, usersQuery]
  );

  return {
    tab,
    setTabAndSyncQuery,
    q,
    setQ,
    tests,
    setTests,
    users,
    setUsers,
    blogPosts,
    blogCategories,
    testsPage,
    setTestsPage,
    usersPage,
    setUsersPage,
    blogPage,
    setBlogPage,
    notifications,
    setNotifications,
    notificationsPage,
    setNotificationsPage,
    testsQuery,
    usersQuery,
    usersRoleFilter,
    setUsersRoleFilter: setUsersRoleFilterAndSync,
    blogQuery,
    notificationsQuery,
    testsPageCount,
    usersPageCount,
    blogPageCount,
    notificationsPageCount,
    activePage,
    activePageCount,
    activeListError,
    activeListLoading,
    invalidateCacheForQuery,
    loadTestsPageData,
    loadUsersPageData,
    loadBlogPageData,
    loadNotificationsPageData,
    loadBlogMeta,
    prefetchNeighbors
  };
}
