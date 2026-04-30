import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAdminPrefetchOrchestration } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-prefetch-orchestration";
import type { AdminTabAdapters } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-tab-registry";

function createAdapter() {
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
              roleFilter: "all" as const
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
          roleFilter: "student" as const
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
