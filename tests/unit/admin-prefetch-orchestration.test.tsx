import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAdminPrefetchOrchestration } from "@/features/admin/components/admin-console/use-admin-prefetch-orchestration";
import type { AdminTabAdapters } from "@/features/admin/components/admin-console/admin-tab-registry";

function createAdapter(overrides: Partial<ReturnType<typeof createAdapterBase>> = {}) {
  return {
    ...createAdapterBase(),
    ...overrides
  };
}

function createAdapterBase() {
  return {
    error: "",
    invalidateQueryCache: vi.fn(),
    loadPage: vi.fn(async () => ({ total: 5 })),
    loading: false,
    page: 1,
    pageCount: 1,
    query: "",
    resetPage: vi.fn(),
    setPage: vi.fn(),
    setQuery: vi.fn()
  };
}

describe("useAdminPrefetchOrchestration", () => {
  it("bootstraps only the active tab when there is no initial snapshot", async () => {
    const adapters: AdminTabAdapters = {
      tests: createAdapter(),
      users: createAdapter(),
      blog: createAdapter(),
      notifications: createAdapter()
    };

    renderHook(() =>
      useAdminPrefetchOrchestration({
        adapterRegistry: adapters,
        initialSnapshotPresent: false,
        tab: "tests"
      })
    );

    await waitFor(() => {
      expect(adapters.tests.loadPage).toHaveBeenCalled();
    });

    expect(adapters.tests.loadPage).toHaveBeenCalledWith(1, "", {
      preferCache: true,
      revalidate: true
    });
    expect(adapters.users.loadPage).not.toHaveBeenCalled();
    expect(adapters.blog.loadPage).not.toHaveBeenCalled();
    expect(adapters.notifications.loadPage).not.toHaveBeenCalled();
  });

  it("prefetches only neighboring pages after bootstrap even when many pages exist", async () => {
    const tests = createAdapter({
      loadPage: vi.fn(async () => ({ total: 45 }))
    });
    const adapters: AdminTabAdapters = {
      tests,
      users: createAdapter(),
      blog: createAdapter(),
      notifications: createAdapter()
    };

    renderHook(() =>
      useAdminPrefetchOrchestration({
        adapterRegistry: adapters,
        initialSnapshotPresent: false,
        tab: "tests"
      })
    );

    await waitFor(() => {
      expect(tests.loadPage).toHaveBeenCalledWith(1, "", {
        preferCache: true,
        revalidate: true
      });
      expect(tests.loadPage).toHaveBeenCalledWith(2, "", {
        background: true,
        preferCache: true,
        revalidate: false
      });
    });

    expect(tests.loadPage).toHaveBeenCalledTimes(2);
    expect(tests.loadPage).not.toHaveBeenCalledWith(3, "", expect.anything());
    expect(adapters.users.loadPage).not.toHaveBeenCalled();
    expect(adapters.blog.loadPage).not.toHaveBeenCalled();
    expect(adapters.notifications.loadPage).not.toHaveBeenCalled();
  });

  it("refreshes the active page and prefetches only neighbors on page changes", async () => {
    const testsPageOne = createAdapter({
      loadPage: vi.fn(async () => ({ total: 45 })),
      page: 1,
      pageCount: 9
    });
    const testsPageFour = createAdapter({
      loadPage: vi.fn(async () => ({ total: 45 })),
      page: 4,
      pageCount: 9
    });
    const users = createAdapter();
    const blog = createAdapter();
    const notifications = createAdapter();

    const { rerender } = renderHook(
      ({ adapterRegistry }) =>
        useAdminPrefetchOrchestration({
          adapterRegistry,
          initialSnapshotPresent: false,
          tab: "tests"
        }),
      {
        initialProps: {
          adapterRegistry: {
            tests: testsPageOne,
            users,
            blog,
            notifications
          } satisfies AdminTabAdapters
        }
      }
    );

    await waitFor(() => {
      expect(testsPageOne.loadPage).toHaveBeenCalledTimes(2);
    });

    testsPageOne.loadPage.mockClear();
    rerender({
      adapterRegistry: {
        tests: testsPageFour,
        users,
        blog,
        notifications
      } satisfies AdminTabAdapters
    });

    await waitFor(() => {
      expect(testsPageFour.loadPage).toHaveBeenCalledWith(4, "", {
        preferCache: true,
        revalidate: true
      });
      expect(testsPageFour.loadPage).toHaveBeenCalledWith(3, "", {
        background: true,
        preferCache: true,
        revalidate: false
      });
      expect(testsPageFour.loadPage).toHaveBeenCalledWith(5, "", {
        background: true,
        preferCache: true,
        revalidate: false
      });
    });

    expect(testsPageFour.loadPage).toHaveBeenCalledTimes(3);
    expect(testsPageFour.loadPage).not.toHaveBeenCalledWith(2, "", expect.anything());
    expect(testsPageFour.loadPage).not.toHaveBeenCalledWith(6, "", expect.anything());
    expect(users.loadPage).not.toHaveBeenCalled();
    expect(blog.loadPage).not.toHaveBeenCalled();
    expect(notifications.loadPage).not.toHaveBeenCalled();
  });

  it("does not restart bootstrap when the active adapter loading state changes", async () => {
    const adapters: AdminTabAdapters = {
      tests: createAdapter(),
      users: createAdapter(),
      blog: createAdapter(),
      notifications: createAdapter()
    };

    const { rerender } = renderHook(
      ({ adapterRegistry }) =>
        useAdminPrefetchOrchestration({
          adapterRegistry,
          initialSnapshotPresent: false,
          tab: "users"
        }),
      { initialProps: { adapterRegistry: adapters } }
    );

    await waitFor(() => {
      expect(adapters.users.loadPage).toHaveBeenCalledTimes(1);
    });

    rerender({
      adapterRegistry: {
        ...adapters,
        users: {
          ...adapters.users,
          loading: true
        }
      }
    });

    await waitFor(() => {
      expect(adapters.users.loadPage).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes once when the users role filter changes", async () => {
    const tests = createAdapter();
    const blog = createAdapter();
    const notifications = createAdapter();
    const usersAll = createAdapter();
    const usersStudents = createAdapter();

    const { rerender } = renderHook(
      ({ adapterRegistry }) =>
        useAdminPrefetchOrchestration({
          adapterRegistry,
          initialSnapshotPresent: false,
          tab: "users"
        }),
      {
        initialProps: {
          adapterRegistry: {
            tests,
            users: {
              ...usersAll,
              roleFilter: "all" as "all" | "student"
            },
            blog,
            notifications
          } satisfies AdminTabAdapters
        }
      }
    );

    await waitFor(() => {
      expect(usersAll.loadPage).toHaveBeenCalledTimes(1);
    });

    rerender({
      adapterRegistry: {
        tests,
        users: {
          ...usersStudents,
          roleFilter: "student" as "all" | "student"
        },
        blog,
        notifications
      } satisfies AdminTabAdapters
    });

    await waitFor(() => {
      expect(usersStudents.loadPage).toHaveBeenCalledTimes(1);
    });
  });
});
