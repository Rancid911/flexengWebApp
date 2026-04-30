import type { Dispatch, SetStateAction } from "react";

import type { TabId, BlogPostForm, NotificationForm, TestsForm, UsersForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminUserDto, AdminUserRole } from "@/lib/admin/types";

export type UserFormFieldKey =
  | "first_name"
  | "last_name"
  | "email"
  | "password"
  | "phone"
  | "birth_date"
  | "english_level"
  | "target_level"
  | "learning_goal"
  | "notes"
  | "assigned_teacher_id"
  | "billing_mode"
  | "lesson_price_amount";

export type RefreshDeps = {
  blogPage: number;
  blogPageCount: number;
  blogQuery: string;
  notificationsPage: number;
  notificationsPageCount: number;
  notificationsQuery: string;
  prefetchNeighbors: (tabId: TabId, pageNumber: number, pageCount: number, query: string, roleFilter?: AdminUserRole | "all") => void;
  testsPage: number;
  testsPageCount: number;
  testsQuery: string;
  usersPage: number;
  usersPageCount: number;
  usersQuery: string;
  usersRoleFilter: AdminUserRole | "all";
};

export type DataDeps = {
  invalidateCacheForQuery: (tabId: TabId, query: string, roleFilter?: AdminUserRole | "all") => void;
  loadBlogMeta: (force?: boolean) => Promise<void>;
  loadBlogPageData: (pageNumber: number, query: string, options?: { background?: boolean; preferCache?: boolean; revalidate?: boolean }) => Promise<unknown>;
  loadNotificationsPageData: (pageNumber: number, query: string, options?: { background?: boolean; preferCache?: boolean; revalidate?: boolean }) => Promise<unknown>;
  loadTestsPageData: (pageNumber: number, query: string, options?: { background?: boolean; preferCache?: boolean; revalidate?: boolean }) => Promise<unknown>;
  loadUsersPageData: (
    pageNumber: number,
    query: string,
    roleFilter: AdminUserRole | "all",
    options?: { background?: boolean; preferCache?: boolean; revalidate?: boolean }
  ) => Promise<unknown>;
};

export type TestFormSetter = Dispatch<SetStateAction<TestsForm>>;
export type UserFormSetter = Dispatch<SetStateAction<UsersForm>>;
export type BlogPostFormSetter = Dispatch<SetStateAction<BlogPostForm>>;
export type NotificationFormSetter = Dispatch<SetStateAction<NotificationForm>>;
export type AdminUsersStateSetter = Dispatch<SetStateAction<{ items: AdminUserDto[]; total: number; page: number; pageSize: number }>>;
