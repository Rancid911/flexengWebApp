"use client";

import { CACHE_TTL_MS, type TabId } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type {
  AdminNotificationDto,
  AdminTestDto,
  AdminUserDto,
  AdminUserRole,
  BlogPostDetailDto,
  PaginatedResponse
} from "@/lib/admin/types";

const ADMIN_UI_SNAPSHOT_KEY = "admin-ui-state";

export type AdminUiSnapshot = {
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
    (snapshot.tab === "tests" || snapshot.tab === "users" || snapshot.tab === "blog" || snapshot.tab === "notifications") &&
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

export function getAdminUiInitialSnapshot() {
  return adminRuntimeSnapshot;
}

export function primeAdminUiRuntimeSnapshot(snapshot: AdminUiSnapshot | null) {
  if (!snapshot || adminRuntimeSnapshot) return;
  adminRuntimeSnapshot = snapshot;
}

export function resetAdminUiRuntimeSnapshot() {
  adminRuntimeSnapshot = null;
}

export function writeAdminUiSnapshot(snapshot: AdminUiSnapshot) {
  adminRuntimeSnapshot = snapshot;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_UI_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // no-op
  }
}

export function readAdminUiSessionSnapshot() {
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
