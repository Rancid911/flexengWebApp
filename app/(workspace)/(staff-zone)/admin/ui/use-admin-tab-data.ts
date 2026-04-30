"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PAGE_SIZE,
  type LoadOptions,
  type TabId
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { buildAdminTabAdapters } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-tab-registry";
import { useAdminQuerySync } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-query-sync";
import {
  getAdminUiInitialSnapshot,
  readAdminUiSessionSnapshot,
  primeAdminUiRuntimeSnapshot,
  writeAdminUiSnapshot,
  type AdminUiSnapshot
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-ui-snapshot";
import { useAdminPrefetchOrchestration } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-prefetch-orchestration";
import { useAdminPaginatedResource } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-paginated-resource";
import { useAdminBlogMeta } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-blog-meta";
import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import type { AdminNotificationDto, AdminTestDto, AdminUserDto, AdminUserRole, BlogPostDetailDto, PaginatedResponse } from "@/lib/admin/types";

export function useAdminTabData() {
  const initialSnapshot = getAdminUiInitialSnapshot();

  const [tab, setTab] = useState<TabId>(initialSnapshot?.tab ?? "tests");

  const [testsPage, setTestsPage] = useState(initialSnapshot?.testsPage ?? 1);
  const [usersPage, setUsersPage] = useState(initialSnapshot?.usersPage ?? 1);
  const [blogPage, setBlogPage] = useState(initialSnapshot?.blogPage ?? 1);
  const [notificationsPage, setNotificationsPage] = useState(initialSnapshot?.notificationsPage ?? 1);

  const [testsQuery, setTestsQuery] = useState(initialSnapshot?.testsQuery ?? "");
  const [usersQuery, setUsersQuery] = useState(initialSnapshot?.usersQuery ?? "");
  const [blogQuery, setBlogQuery] = useState(initialSnapshot?.blogQuery ?? "");
  const [notificationsQuery, setNotificationsQuery] = useState(initialSnapshot?.notificationsQuery ?? "");
  const [usersRoleFilter, setUsersRoleFilter] = useState<AdminUserRole | "all">(initialSnapshot?.usersRoleFilter ?? "all");

  const [hydratedFromSession, setHydratedFromSession] = useState(false);
  const { blogCategories, loadBlogMeta } = useAdminBlogMeta();

  const testsResource = useAdminPaginatedResource<AdminTestDto>(initialSnapshot?.tests ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const usersResource = useAdminPaginatedResource<AdminUserDto>(initialSnapshot?.users ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const blogResource = useAdminPaginatedResource<BlogPostDetailDto>(
    initialSnapshot?.blogPosts ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );
  const notificationsResource = useAdminPaginatedResource<AdminNotificationDto>(
    initialSnapshot?.notifications ?? { items: [], total: 0, page: 1, pageSize: PAGE_SIZE }
  );

  const tests = testsResource.data;
  const users = usersResource.data;
  const blogPosts = blogResource.data;
  const notifications = notificationsResource.data;
  const testsError = testsResource.error;
  const usersError = usersResource.error;
  const blogError = blogResource.error;
  const notificationsError = notificationsResource.error;
  const testsLoading = testsResource.loading;
  const usersLoading = usersResource.loading;
  const blogLoading = blogResource.loading;
  const notificationsLoading = notificationsResource.loading;
  const setTests = testsResource.setData;
  const setUsers = usersResource.setData;
  const setBlogPosts = blogResource.setData;
  const setNotifications = notificationsResource.setData;
  const primeTestsCache = testsResource.primeCache;
  const primeUsersCache = usersResource.primeCache;
  const primeBlogCache = blogResource.primeCache;
  const primeNotificationsCache = notificationsResource.primeCache;
  const invalidateTestsCacheByPrefix = testsResource.invalidateCacheByPrefix;
  const invalidateUsersCacheByPrefix = usersResource.invalidateCacheByPrefix;
  const invalidateBlogCacheByPrefix = blogResource.invalidateCacheByPrefix;
  const invalidateNotificationsCacheByPrefix = notificationsResource.invalidateCacheByPrefix;
  const loadTestsResourcePage = testsResource.loadPage;
  const loadUsersResourcePage = usersResource.loadPage;
  const loadBlogResourcePage = blogResource.loadPage;
  const loadNotificationsResourcePage = notificationsResource.loadPage;

  const testsPageCount = useMemo(() => Math.max(1, Math.ceil(tests.total / PAGE_SIZE)), [tests.total]);
  const usersPageCount = useMemo(() => Math.max(1, Math.ceil(users.total / PAGE_SIZE)), [users.total]);
  const blogPageCount = useMemo(() => Math.max(1, Math.ceil(blogPosts.total / PAGE_SIZE)), [blogPosts.total]);
  const notificationsPageCount = useMemo(() => Math.max(1, Math.ceil(notifications.total / PAGE_SIZE)), [notifications.total]);

  const makeCacheKey = useCallback((query: string, pageNumber: number) => `${query}::${pageNumber}`, []);
  const makeUsersCacheKey = useCallback((query: string, role: AdminUserRole | "all", pageNumber: number) => `${query}::${role}::${pageNumber}`, []);

  useEffect(() => {
    const snapshot = initialSnapshot;
    if (!snapshot) return;

    primeAdminUiRuntimeSnapshot(snapshot);

    primeTestsCache(makeCacheKey(snapshot.testsQuery, snapshot.tests.page), snapshot.tests, snapshot.fetchedAt);
    primeUsersCache(
      makeUsersCacheKey(snapshot.usersQuery, snapshot.usersRoleFilter, snapshot.users.page),
      snapshot.users,
      snapshot.fetchedAt
    );
    primeBlogCache(makeCacheKey(snapshot.blogQuery, snapshot.blogPosts.page), snapshot.blogPosts, snapshot.fetchedAt);
    primeNotificationsCache(
      makeCacheKey(snapshot.notificationsQuery, snapshot.notifications.page),
      snapshot.notifications,
      snapshot.fetchedAt
    );
  }, [initialSnapshot, makeCacheKey, makeUsersCacheKey, primeBlogCache, primeNotificationsCache, primeTestsCache, primeUsersCache]);

  useEffect(() => {
    if (initialSnapshot || hydratedFromSession) return;

    const frameId = window.requestAnimationFrame(() => {
      const snapshot = readAdminUiSessionSnapshot();
      if (!snapshot) {
        setHydratedFromSession(true);
        return;
      }

      primeAdminUiRuntimeSnapshot(snapshot);
      setTab(snapshot.tab);
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
      setHydratedFromSession(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    hydratedFromSession,
    initialSnapshot,
    setBlogPosts,
    setNotifications,
    setTests,
    setUsers
  ]);

  const loadTestsPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const cacheKey = makeCacheKey(query, pageNumber);
      return loadTestsResourcePage({
        cacheKey,
        options,
        pageNumber,
        request: () => fetchJson<PaginatedResponse<AdminTestDto>>(`/api/admin/tests?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`)
      });
    },
    [loadTestsResourcePage, makeCacheKey]
  );

  const loadUsersPageData = useCallback(
    async (pageNumber: number, query: string, roleFilter: AdminUserRole | "all", options?: LoadOptions) => {
      const cacheKey = makeUsersCacheKey(query, roleFilter, pageNumber);
      return loadUsersResourcePage({
        cacheKey,
        options,
        pageNumber,
        request: () =>
          fetchJson<PaginatedResponse<AdminUserDto>>(
            `/api/admin/users?q=${encodeURIComponent(query)}&role=${roleFilter}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
        )
      });
    },
    [loadUsersResourcePage, makeUsersCacheKey]
  );

  const loadUsersAdapterPage = useCallback(
    (pageNumber: number, query: string, options?: LoadOptions) => {
      return loadUsersPageData(pageNumber, query, usersRoleFilter, options);
    },
    [loadUsersPageData, usersRoleFilter]
  );

  const loadBlogPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const cacheKey = makeCacheKey(query, pageNumber);
      return loadBlogResourcePage({
        cacheKey,
        options,
        pageNumber,
        request: async () => {
          const [postsData] = await Promise.all([
            fetchJson<PaginatedResponse<BlogPostDetailDto>>(
              `/api/admin/blog/posts?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
            ),
            loadBlogMeta()
          ]);
          return postsData;
        }
      });
    },
    [loadBlogMeta, loadBlogResourcePage, makeCacheKey]
  );

  const loadNotificationsPageData = useCallback(
    async (pageNumber: number, query: string, options?: LoadOptions) => {
      const cacheKey = makeCacheKey(query, pageNumber);
      return loadNotificationsResourcePage({
        cacheKey,
        options,
        pageNumber,
        request: () =>
          fetchJson<PaginatedResponse<AdminNotificationDto>>(
            `/api/admin/notifications?q=${encodeURIComponent(query)}&page=${pageNumber}&pageSize=${PAGE_SIZE}`
        )
      });
    },
    [loadNotificationsResourcePage, makeCacheKey]
  );

  const tabAdapters = useMemo(
    () =>
      buildAdminTabAdapters({
        blog: {
          error: blogError,
          invalidateCacheByPrefix: invalidateBlogCacheByPrefix,
          loadPage: loadBlogPageData,
          loading: blogLoading,
          page: blogPage,
          pageCount: blogPageCount,
          query: blogQuery,
          setPage: setBlogPage,
          setQuery: setBlogQuery
        },
        notifications: {
          error: notificationsError,
          invalidateCacheByPrefix: invalidateNotificationsCacheByPrefix,
          loadPage: loadNotificationsPageData,
          loading: notificationsLoading,
          page: notificationsPage,
          pageCount: notificationsPageCount,
          query: notificationsQuery,
          setPage: setNotificationsPage,
          setQuery: setNotificationsQuery
        },
        tests: {
          error: testsError,
          invalidateCacheByPrefix: invalidateTestsCacheByPrefix,
          loadPage: loadTestsPageData,
          loading: testsLoading,
          page: testsPage,
          pageCount: testsPageCount,
          query: testsQuery,
          setPage: setTestsPage,
          setQuery: setTestsQuery
        },
        users: {
          error: usersError,
          invalidateCacheByPrefix: invalidateUsersCacheByPrefix,
          loadPage: loadUsersAdapterPage,
          loading: usersLoading,
          page: usersPage,
          pageCount: usersPageCount,
          query: usersQuery,
          roleFilter: usersRoleFilter,
          setPage: setUsersPage,
          setQuery: setUsersQuery
        }
      }),
    [
      blogPage,
      blogPageCount,
      blogQuery,
      blogError,
      invalidateBlogCacheByPrefix,
      invalidateNotificationsCacheByPrefix,
      invalidateTestsCacheByPrefix,
      invalidateUsersCacheByPrefix,
      blogLoading,
      loadBlogPageData,
      loadNotificationsPageData,
      loadTestsPageData,
      loadUsersAdapterPage,
      notificationsPage,
      notificationsPageCount,
      notificationsQuery,
      notificationsError,
      notificationsLoading,
      testsPage,
      testsPageCount,
      testsQuery,
      testsError,
      testsLoading,
      usersPage,
      usersPageCount,
      usersQuery,
      usersError,
      usersLoading,
      usersRoleFilter
    ]
  );
  const activeAdapter = tabAdapters[tab];
  const activePage = activeAdapter.page;
  const activePageCount = activeAdapter.pageCount;
  const activeListError = activeAdapter.error;
  const activeListLoading = activeAdapter.loading;

  const { bootstrapped, prefetchNeighbors, bumpPrefetchRun } = useAdminPrefetchOrchestration({
    adapterRegistry: tabAdapters,
    initialSnapshotPresent: Boolean(initialSnapshot),
    tab,
  });

  const { q, setQ, setTabAndSyncQuery } = useAdminQuerySync({
    initialQuery: initialSnapshot?.q ?? "",
    currentTab: tab,
    tabAdapters,
    setTab,
    bumpPrefetchRun
  });

  const invalidateCacheForQuery = useCallback((tabId: TabId, query: string, roleFilter: AdminUserRole | "all" = "all") => {
    tabAdapters[tabId].invalidateQueryCache(query, roleFilter);
  }, [tabAdapters]);

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
    writeAdminUiSnapshot(snapshot);
  }, [blogPage, blogPosts, blogQuery, bootstrapped, notifications, notificationsPage, notificationsQuery, q, tab, tests, testsPage, testsQuery, users, usersPage, usersQuery, usersRoleFilter]);

  const setUsersRoleFilterAndSync = useCallback((nextRole: AdminUserRole | "all") => {
    if (nextRole === usersRoleFilter) return;
    bumpPrefetchRun();
    setUsersRoleFilter(nextRole);
    setUsersPage(1);
  }, [bumpPrefetchRun, usersRoleFilter]);

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
