import { beforeEach, describe, expect, it } from "vitest";

import {
  getAdminUiInitialSnapshot,
  resetAdminUiRuntimeSnapshot,
  readAdminUiSessionSnapshot,
  type AdminUiSnapshot
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-ui-snapshot";

const validSnapshot: AdminUiSnapshot = {
  fetchedAt: Date.now(),
  tab: "notifications",
  q: "alert",
  testsPage: 1,
  usersPage: 1,
  blogPage: 1,
  notificationsPage: 2,
  testsQuery: "",
  usersQuery: "",
  blogQuery: "",
  notificationsQuery: "alert",
  usersRoleFilter: "all",
  tests: { items: [], total: 0, page: 1, pageSize: 20 },
  users: { items: [], total: 0, page: 1, pageSize: 20 },
  blogPosts: { items: [], total: 0, page: 1, pageSize: 20 },
  notifications: { items: [], total: 0, page: 2, pageSize: 20 }
};

describe("admin-ui snapshot hydration safety", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetAdminUiRuntimeSnapshot();
  });

  it("does not read session storage in initial render snapshot getter", () => {
    window.sessionStorage.setItem("admin-ui-state", JSON.stringify(validSnapshot));

    expect(getAdminUiInitialSnapshot()).toBeNull();
  });

  it("can read a valid session snapshot after hydration", () => {
    window.sessionStorage.setItem("admin-ui-state", JSON.stringify(validSnapshot));

    expect(readAdminUiSessionSnapshot()).toEqual(validSnapshot);
  });
});
