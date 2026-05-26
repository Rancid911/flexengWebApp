import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  renderHomeworkOverviewRoute: vi.fn(() => <div>homework route</div>),
  renderScheduleRoute: vi.fn(() => <div>schedule route</div>),
  renderStudentPaymentsRoute: vi.fn(() => <div>payments route</div>),
  renderTeacherStudentsRoute: vi.fn(() => <div>teacher students route</div>),
  renderWordsOverviewRoute: vi.fn(() => <div>words route</div>),
  requireLayoutActor: vi.fn()
}));

vi.mock("next/navigation", () => ({
  notFound: routeMocks.notFound,
  redirect: routeMocks.redirect
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => routeMocks.requireLayoutActor()
}));

vi.mock("@/features/homework/server/homework-routes", () => ({
  renderHomeworkOverviewRoute: (...args: unknown[]) => routeMocks.renderHomeworkOverviewRoute(...args)
}));

vi.mock("@/features/payments/server/payments-route", () => ({
  renderStudentPaymentsRoute: (...args: unknown[]) => routeMocks.renderStudentPaymentsRoute(...args)
}));

vi.mock("@/features/schedule/server/schedule-route", () => ({
  renderScheduleRoute: (...args: unknown[]) => routeMocks.renderScheduleRoute(...args)
}));

vi.mock("@/features/teacher-workspace/server/teacher-students-route", () => ({
  renderTeacherStudentsRoute: (...args: unknown[]) => routeMocks.renderTeacherStudentsRoute(...args)
}));

vi.mock("@/features/words/server/words-overview-routes", () => ({
  renderWordsOverviewRoute: (...args: unknown[]) => routeMocks.renderWordsOverviewRoute(...args)
}));

function actorWith(permission: string, scopes: string[]) {
  return {
    userId: "user-1",
    rbacRoles: ["student"],
    rbacPermissions: [permission],
    rbacPermissionScopes: {
      [permission]: scopes
    }
  };
}

function actorWithoutRoutePermission() {
  return {
    userId: "user-1",
    rbacRoles: ["student"],
    rbacPermissions: ["profile.view"],
    rbacPermissionScopes: {
      "profile.view": ["own"]
    }
  };
}

describe("workspace read route RBAC guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["schedule", () => import("@/app/(workspace)/(shared-zone)/schedule/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["homework", () => import("@/app/(workspace)/(shared-zone)/homework/page").then((module) => module.default())],
    ["words", () => import("@/app/(workspace)/(shared-zone)/words/my/page").then((module) => module.default())],
    ["payments", () => import("@/app/(workspace)/(student-zone)/settings/payments/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["teacher students", () => import("@/app/(workspace)/(teacher-zone)/students/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))]
  ])("denies %s when RBAC metadata is empty", async (_name, renderPage) => {
    routeMocks.requireLayoutActor.mockResolvedValue({
      userId: "user-1",
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(routeMocks.notFound).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["schedule", actorWith("schedule.view", ["own"]), () => import("@/app/(workspace)/(shared-zone)/schedule/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["homework", actorWith("homework.view", ["assigned"]), () => import("@/app/(workspace)/(shared-zone)/homework/page").then((module) => module.default())],
    ["progress", actorWith("student_progress.view", ["all"]), () => import("@/app/(workspace)/(shared-zone)/progress/page").then((module) => module.default())],
    ["words train", actorWith("word_cards.train", ["own"]), () => import("@/app/(workspace)/(shared-zone)/words/my/page").then((module) => module.default())],
    ["words demo", actorWith("word_cards.demo_train", ["own_demo"]), () => import("@/app/(workspace)/(shared-zone)/words/my/page").then((module) => module.default())],
    ["payments", actorWith("billing.view", ["own"]), () => import("@/app/(workspace)/(student-zone)/settings/payments/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["teacher students", actorWith("students.view", ["assigned"]), () => import("@/app/(workspace)/(teacher-zone)/students/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))]
  ])("allows %s when RBAC grants the matching permission and scope", async (name, actor, renderPage) => {
    routeMocks.requireLayoutActor.mockResolvedValue(actor);

    if (name === "progress") {
      await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/progress/overview");
      expect(routeMocks.redirect).toHaveBeenCalledWith("/progress/overview");
    } else {
      await expect(renderPage()).resolves.toBeTruthy();
    }
    expect(routeMocks.notFound).not.toHaveBeenCalled();
  });

  it.each([
    ["schedule", () => import("@/app/(workspace)/(shared-zone)/schedule/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["homework", () => import("@/app/(workspace)/(shared-zone)/homework/page").then((module) => module.default())],
    ["progress", () => import("@/app/(workspace)/(shared-zone)/progress/page").then((module) => module.default())],
    ["words", () => import("@/app/(workspace)/(shared-zone)/words/my/page").then((module) => module.default())],
    ["payments", () => import("@/app/(workspace)/(student-zone)/settings/payments/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))],
    ["teacher students", () => import("@/app/(workspace)/(teacher-zone)/students/page").then((module) => module.default({ searchParams: Promise.resolve({}) }))]
  ])("denies %s when loaded RBAC metadata lacks the route permission", async (_name, renderPage) => {
    routeMocks.requireLayoutActor.mockResolvedValue(actorWithoutRoutePermission());

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(routeMocks.notFound).toHaveBeenCalledTimes(1);
  });
});
