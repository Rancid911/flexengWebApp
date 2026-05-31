import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, gteCalls } = vi.hoisted(() => ({
  state: {
    userCreatedAt: "2026-04-10T00:00:00.000Z",
    profile: {
      created_at: "2026-04-12T00:00:00.000Z" as string | null
    },
    notifications: [
      {
        id: "old-notif",
        title: "Old",
        body: "Old notification",
        type: "update",
        published_at: "2026-04-11T00:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["student"],
        target_user_ids: [] as string[]
      },
      {
        id: "new-notif",
        title: "New",
        body: "New notification",
        type: "update",
        published_at: "2026-04-12T01:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["student"],
        target_user_ids: [] as string[]
      }
    ],
    states: [] as Array<{ notification_id: string; read_at: string | null; dismissed_at: string | null }>
  },
  gteCalls: [] as Array<{ column: string; value: string }>
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => Promise<unknown>) => await callback()
}));

vi.mock("@/lib/supabase/auth-request", () => ({
  runAuthRequestWithLockRetry: async (callback: () => Promise<unknown>) => await callback()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            id: "user-1",
            created_at: state.userCreatedAt
          }
        },
        error: null
      }))
    },
    from: (table: string) => {
      if (table === "profiles") return makeProfilesQuery();
      if (table === "notifications") return makeNotificationsQuery();
      if (table === "notification_user_state") return makeNotificationStateQuery();
      throw new Error(`Unexpected table ${table}`);
    }
  })
}));

import { getUnreadNotificationsSummaryForUser, listVisibleNotificationsForUser } from "@/lib/notifications/server";

function resetState() {
  state.userCreatedAt = "2026-04-10T00:00:00.000Z";
  state.profile = {
    created_at: "2026-04-12T00:00:00.000Z"
  };
  state.notifications = [
    {
      id: "old-notif",
      title: "Old",
      body: "Old notification",
      type: "update",
      published_at: "2026-04-11T00:00:00.000Z",
      expires_at: null,
      created_at: "2026-04-01T00:00:00.000Z",
      target_roles: ["student"],
      target_user_ids: [] as string[]
    },
    {
      id: "new-notif",
      title: "New",
      body: "New notification",
      type: "update",
      published_at: "2026-04-12T01:00:00.000Z",
      expires_at: null,
      created_at: "2026-04-01T00:00:00.000Z",
      target_roles: ["student"],
      target_user_ids: [] as string[]
    }
  ];
  state.states = [];
  gteCalls.length = 0;
}

function makeProfilesQuery() {
  return {
    select: vi.fn((columns: string) => {
      expect(columns).toBe("created_at");
      return makeProfilesQuery();
    }),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: state.profile,
      error: null
    }))
  };
}

function actorWithRbacRoles(rbacRoles: string[], overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    role: "student",
    profileRole: "admin",
    rbacStatus: "loaded",
    rbacRoles,
    rbacPermissions: ["notifications.view"],
    rbacPermissionScopes: {
      "notifications.view": ["own"]
    },
    ...overrides
  } as never;
}

function makeNotificationsQuery() {
  let cutoff: string | null = null;
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn((column: string, value: string) => {
      cutoff = value;
      gteCalls.push({ column, value });
      return query;
    }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({
      data: cutoff ? state.notifications.filter((item) => item.published_at >= (cutoff ?? "")) : state.notifications,
      error: null
    }))
  };
  return query;
}

function makeNotificationStateQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn(async (_column: string, ids: string[]) => ({
      data: state.states.filter((item) => ids.includes(item.notification_id)),
      error: null
    }))
  };
}

describe("notifications server queries", () => {
  beforeEach(() => {
    resetState();
  });

  it("filters visible notifications by profile creation date", async () => {
    const result = await listVisibleNotificationsForUser(actorWithRbacRoles(["student"]));

    expect(gteCalls).toContainEqual({
      column: "published_at",
      value: "2026-04-12T00:00:00.000Z"
    });
    expect(result.items.map((item) => item.id)).toEqual(["new-notif"]);
    expect(result.unreadCount).toBe(1);
  });

  it("filters unread summary by profile creation date", async () => {
    const result = await getUnreadNotificationsSummaryForUser(actorWithRbacRoles(["student"]));

    expect(gteCalls).toContainEqual({
      column: "published_at",
      value: "2026-04-12T00:00:00.000Z"
    });
    expect(result.unreadCount).toBe(1);
  });

  it("falls back to auth user creation date when profile creation date is unavailable", async () => {
    state.profile.created_at = null;

    const result = await listVisibleNotificationsForUser(actorWithRbacRoles(["student"]));

    expect(gteCalls).toContainEqual({
      column: "published_at",
      value: "2026-04-10T00:00:00.000Z"
    });
    expect(result.items.map((item) => item.id)).toEqual(["old-notif", "new-notif"]);
  });

  it("uses RBAC role keys instead of profile role metadata for student targeting", async () => {
    state.profile.created_at = null;

    const result = await listVisibleNotificationsForUser(actorWithRbacRoles(["teacher"], { profileRole: "student" }));

    expect(result.items).toEqual([]);
    expect(result.unreadCount).toBe(0);
  });

  it("matches teacher-targeted notifications through RBAC roles", async () => {
    state.profile.created_at = null;
    state.notifications = [
      {
        id: "teacher-notif",
        title: "Teacher",
        body: "Teacher notification",
        type: "update",
        published_at: "2026-04-12T01:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["teacher"],
        target_user_ids: [] as string[]
      }
    ];

    const result = await listVisibleNotificationsForUser(actorWithRbacRoles(["teacher"]));

    expect(result.items.map((item) => item.id)).toEqual(["teacher-notif"]);
  });

  it("matches manager and admin targeting through RBAC roles", async () => {
    state.profile.created_at = null;
    state.notifications = [
      {
        id: "manager-notif",
        title: "Manager",
        body: "Manager notification",
        type: "update",
        published_at: "2026-04-12T01:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["manager"],
        target_user_ids: [] as string[]
      },
      {
        id: "admin-notif",
        title: "Admin",
        body: "Admin notification",
        type: "update",
        published_at: "2026-04-12T02:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["admin"],
        target_user_ids: [] as string[]
      }
    ];

    const result = await listVisibleNotificationsForUser(actorWithRbacRoles(["manager"]));

    expect(result.items.map((item) => item.id)).toEqual(["manager-notif"]);
  });

  it("fails closed for role-targeted notifications when RBAC metadata is empty or errored", async () => {
    state.profile.created_at = null;

    const emptyResult = await listVisibleNotificationsForUser(actorWithRbacRoles([], { rbacStatus: "empty", profileRole: "student" }));
    const errorResult = await listVisibleNotificationsForUser(actorWithRbacRoles([], { rbacStatus: "error", profileRole: "student" }));

    expect(emptyResult.items).toEqual([]);
    expect(errorResult.items).toEqual([]);
  });

  it("keeps explicit user-targeted notifications visible without RBAC role membership", async () => {
    state.profile.created_at = null;
    state.notifications = [
      {
        id: "direct-notif",
        title: "Direct",
        body: "Direct notification",
        type: "update",
        published_at: "2026-04-12T01:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["teacher"],
        target_user_ids: ["user-1"]
      }
    ];

    const result = await listVisibleNotificationsForUser(actorWithRbacRoles([], { rbacStatus: "empty" }));

    expect(result.items.map((item) => item.id)).toEqual(["direct-notif"]);
  });

  it("keeps all-user notifications visible for authenticated actors", async () => {
    state.profile.created_at = null;
    state.notifications = [
      {
        id: "all-notif",
        title: "All",
        body: "All notification",
        type: "update",
        published_at: "2026-04-12T01:00:00.000Z",
        expires_at: null,
        created_at: "2026-04-01T00:00:00.000Z",
        target_roles: ["all"],
        target_user_ids: [] as string[]
      }
    ];

    const result = await getUnreadNotificationsSummaryForUser(actorWithRbacRoles([], { rbacStatus: "empty" }));

    expect(result.unreadCount).toBe(1);
  });
});
