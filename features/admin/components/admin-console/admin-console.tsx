"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

import {
  useAdminBlogPostsActions,
  useAdminNotificationsActions,
  useAdminTestsActions,
  useAdminUsersActions
} from "@/features/admin/components/admin-console/admin-console-actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  AdminBlogPostsList,
  AdminNotificationsList,
  AdminTestsList,
  AdminUsersList
} from "@/features/admin/components/admin-console/admin-console-lists";
import { AdminMaterialTypeModal } from "@/features/admin/components/admin-console/admin-material-type-modal";
import { AdminConsoleToolbar } from "@/features/admin/components/admin-console/admin-console-toolbar";
import {
  createDefaultTestsForm,
  defaultBlogPostForm,
  defaultNotificationForm,
  defaultUsersForm,
  type BlogPostForm,
  type NotificationForm,
  type TestsForm,
  type UsersForm
} from "@/features/admin/components/admin-console/admin-console.constants";
import { useAdminTabData } from "@/features/admin/components/admin-console/use-admin-tab-data";
import { fetchJson } from "@/shared/client/api-client";
import { WorkspacePaginationControls } from "@/shared/ui/workspace-pagination-controls";
import { WorkspaceSectionHero } from "@/shared/ui/workspace-section-hero";
import { useAdminWordCardSetWorkflow } from "@/features/admin/components/admin-console/use-admin-word-card-set-workflow";
import type {
  AdminNotificationDto,
  AdminTestDto,
  AdminUserDto,
  BlogPostDetailDto,
  CourseOptionDto,
  CourseModuleOptionDto,
  TeacherOptionDto
} from "@/lib/admin/types";

const AdminBlogFormDrawer = dynamic(
  () => import("@/features/admin/components/admin-console/admin-blog-form-drawer").then((module) => module.AdminBlogFormDrawer),
  { ssr: false, loading: () => null }
);
const AdminNotificationFormDrawer = dynamic(
  () => import("@/features/admin/components/admin-console/admin-notification-form-drawer").then((module) => module.AdminNotificationFormDrawer),
  { ssr: false, loading: () => null }
);
const AdminTestFormDrawer = dynamic(
  () => import("@/features/admin/components/admin-console/admin-test-form-drawer").then((module) => module.AdminTestFormDrawer),
  { ssr: false, loading: () => null }
);
const AdminUserFormDrawer = dynamic(
  () => import("@/features/admin/components/admin-console/admin-user-form-drawer").then((module) => module.AdminUserFormDrawer),
  { ssr: false, loading: () => null }
);
const AdminWordCardSetFormDrawer = dynamic(
  () => import("@/features/admin/components/admin-console/admin-word-card-set-form-drawer").then((module) => module.AdminWordCardSetFormDrawer),
  { ssr: false, loading: () => null }
);

function sortCourseModuleOptions(items: CourseModuleOptionDto[]) {
  return [...items].sort((left, right) => {
    const courseCompare = left.courseTitle.localeCompare(right.courseTitle, "ru");
    if (courseCompare !== 0) return courseCompare;
    return left.moduleTitle.localeCompare(right.moduleTitle, "ru");
  });
}

export function AdminConsole() {
  const {
    tab,
    setTabAndSyncQuery,
    q,
    setQ,
    tests,
    users,
    setUsers,
    blogPosts,
    notifications,
    blogCategories,
    testsPage,
    setTestsPage,
    usersPage,
    setUsersPage,
    usersRoleFilter,
    setUsersRoleFilter,
    blogPage,
    setBlogPage,
    notificationsPage,
    setNotificationsPage,
    testsQuery,
    usersQuery,
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
  } = useAdminTabData();
  const [actionError, setActionError] = useState("");

  const [testsDrawerOpen, setTestsDrawerOpen] = useState(false);
  const [usersDrawerOpen, setUsersDrawerOpen] = useState(false);
  const [blogPostsDrawerOpen, setBlogPostsDrawerOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [materialTypeModalOpen, setMaterialTypeModalOpen] = useState(false);

  const [editingTest, setEditingTest] = useState<AdminTestDto | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPostDetailDto | null>(null);
  const [editingNotification, setEditingNotification] = useState<AdminNotificationDto | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOptionDto[]>([]);
  const [courseModuleOptions, setCourseModuleOptions] = useState<CourseModuleOptionDto[]>([]);
  const [courseModuleOptionsError, setCourseModuleOptionsError] = useState("");
  const [courseOptions, setCourseOptions] = useState<CourseOptionDto[]>([]);
  const [courseOptionsError, setCourseOptionsError] = useState("");

  const [testsForm, setTestsForm] = useState<TestsForm>(() => createDefaultTestsForm());
  const [usersForm, setUsersForm] = useState<UsersForm>(defaultUsersForm);
  const [blogPostForm, setBlogPostForm] = useState<BlogPostForm>(defaultBlogPostForm);
  const [notificationForm, setNotificationForm] = useState<NotificationForm>(defaultNotificationForm);
  const activeRole = editingUser?.role ?? usersForm.role;
  const isStudentRole = activeRole === "student";
  const loadTeacherOptions = useCallback(() => fetchJson<TeacherOptionDto[]>("/api/admin/users/teacher-options"), []);
  const loadCourseModuleOptions = useCallback(() => fetchJson<CourseModuleOptionDto[]>("/api/admin/course-modules/options"), []);
  const loadCourseOptions = useCallback(() => fetchJson<CourseOptionDto[]>("/api/admin/courses/options"), []);
  const courseCatalogLoadedRef = useRef(false);
  const courseCatalogInFlightRef = useRef<Promise<void> | null>(null);
  const createCourseModule = useCallback(async (input: { course_id: string; title: string; description: string | null; is_published: boolean }) => {
    const createdModule = await fetchJson<CourseModuleOptionDto>("/api/admin/course-modules", {
      method: "POST",
      body: JSON.stringify(input)
    });
    setCourseModuleOptions((prev) => sortCourseModuleOptions([...prev.filter((item) => item.id !== createdModule.id), createdModule]));
    setTestsForm((prev) => ({ ...prev, module_id: createdModule.id }));
    return createdModule;
  }, []);
  const reloadTeacherOptions = useCallback(async () => {
    const items = await loadTeacherOptions();
    setTeacherOptions(items);
  }, [loadTeacherOptions]);
  const ensureCourseCatalogOptions = useCallback(() => {
    if (courseCatalogLoadedRef.current) return Promise.resolve();
    if (courseCatalogInFlightRef.current) return courseCatalogInFlightRef.current;

    const request = Promise.allSettled([loadCourseModuleOptions(), loadCourseOptions()])
      .then((results) => {
        const [moduleResult, courseResult] = results;
        const modulesLoaded = moduleResult.status === "fulfilled";
        const coursesLoaded = courseResult.status === "fulfilled";

        if (modulesLoaded) {
          setCourseModuleOptions(moduleResult.value);
          setCourseModuleOptionsError("");
        } else {
          console.error("ADMIN_COURSE_MODULE_OPTIONS_LOAD_FAILED", moduleResult.reason);
          setCourseModuleOptionsError("Не удалось загрузить список модулей");
        }

        if (coursesLoaded) {
          setCourseOptions(courseResult.value);
          setCourseOptionsError("");
        } else {
          console.error("ADMIN_COURSE_OPTIONS_LOAD_FAILED", courseResult.reason);
          setCourseOptionsError("Не удалось загрузить список курсов");
        }

        courseCatalogLoadedRef.current = modulesLoaded && coursesLoaded;
      })
      .finally(() => {
        courseCatalogInFlightRef.current = null;
      });

    courseCatalogInFlightRef.current = request;
    return request;
  }, [loadCourseModuleOptions, loadCourseOptions]);

  const testsActions = useAdminTestsActions({
    editingTest,
    refresh: { prefetchNeighbors, testsPage, testsPageCount, testsQuery },
    data: { invalidateCacheForQuery, loadTestsPageData },
    setActionError,
    setEditingTest,
    setTestsDrawerOpen,
    setTestsForm
  });

  const openCreateMaterialModal = useCallback(() => {
    setActionError("");
    setMaterialTypeModalOpen(true);
  }, []);

  const refreshTestsAfterCardsMutation = useCallback(async () => {
    invalidateCacheForQuery("tests", testsQuery);
    await loadTestsPageData(testsPage, testsQuery, { revalidate: true });
    prefetchNeighbors("tests", testsPage, testsPageCount, testsQuery);
  }, [invalidateCacheForQuery, loadTestsPageData, prefetchNeighbors, testsPage, testsPageCount, testsQuery]);
  const wordCardSetWorkflow = useAdminWordCardSetWorkflow({
    onAfterMutation: refreshTestsAfterCardsMutation,
    setActionError
  });

  const usersActions = useAdminUsersActions({
    editingUser,
    refresh: { prefetchNeighbors, usersPage, usersPageCount, usersQuery, usersRoleFilter },
    data: { invalidateCacheForQuery, loadUsersPageData },
    reloadTeacherOptions,
    setActionError,
    setEditingUser,
    setUsers,
    setUsersDrawerOpen,
    setUsersForm
  });

  const blogPostsActions = useAdminBlogPostsActions({
    editingBlogPost,
    refresh: { blogPage, blogPageCount, blogQuery, prefetchNeighbors },
    data: { invalidateCacheForQuery, loadBlogMeta, loadBlogPageData },
    setActionError,
    setBlogPostForm,
    setBlogPostsDrawerOpen,
    setEditingBlogPost
  });

  const notificationsActions = useAdminNotificationsActions({
    editingNotification,
    refresh: { notificationsPage, notificationsPageCount, notificationsQuery, prefetchNeighbors },
    data: { invalidateCacheForQuery, loadNotificationsPageData },
    setActionError,
    setEditingNotification,
    setNotificationForm,
    setNotificationsDrawerOpen
  });

  const activeItemsCount = tab === "tests" ? tests.items.length : tab === "users" ? users.items.length : tab === "blog" ? blogPosts.items.length : notifications.items.length;
  const activeTotal = tab === "tests" ? tests.total : tab === "users" ? users.total : tab === "blog" ? blogPosts.total : notifications.total;
  const emptyTitle =
    tab === "tests"
      ? "Пока нет учебных материалов"
      : tab === "users"
        ? "Пока нет учеников и ролей"
        : tab === "blog"
          ? "Пока нет статей"
          : "Пока нет уведомлений";
  const emptyDescription = q.trim().length >= 2 ? "По текущему поисковому запросу ничего не найдено." : "Создайте первую запись в этом разделе.";

  return (
    <div className="space-y-4 pb-8">
      <WorkspaceSectionHero
        badgeIcon={ShieldCheck}
        badgeLabel="Управление"
        title="Внутренние инструменты школы"
        description="Здесь находятся ученики и роли, учебные материалы, блог и уведомления. Оплата вынесена в отдельный рабочий раздел."
        actionsSlot={
          <Link
            href="/admin/payments"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15"
          >
            Открыть оплату
          </Link>
        }
      />

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-0">
          <div className="sticky top-16 z-10 rounded-t-2xl border-b border-border/80 bg-card/95 p-4 backdrop-blur">
            <AdminConsoleToolbar
              q={q}
              setQ={setQ}
              setTabAndSyncQuery={setTabAndSyncQuery}
              tab={tab}
              usersRoleFilter={usersRoleFilter}
              setUsersRoleFilter={setUsersRoleFilter}
              onCreateTest={openCreateMaterialModal}
              onCreateUser={usersActions.openCreateUserDrawer}
              onCreateBlogPost={blogPostsActions.openCreateBlogPostDrawer}
              onCreateNotification={notificationsActions.openCreateNotificationDrawer}
            />
          </div>

          <div className="space-y-4 p-4">
            {actionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
            ) : null}
            {activeListError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{activeListError}</div>
            ) : null}

            <div className="min-h-[360px] space-y-2">
              {tab === "tests" ? (
                <AdminTestsList
                  items={tests.items}
                  loading={activeListLoading}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  onEdit={(item) => {
                    if (item.material_type === "word_cards") {
                      void wordCardSetWorkflow.startEditing(item);
                    } else {
                      void ensureCourseCatalogOptions().then(() => testsActions.startEditingTest(item));
                    }
                  }}
                  onDelete={(item) => {
                    if (item.material_type === "word_cards") {
                      void wordCardSetWorkflow.deleteItem(item.id);
                    } else {
                      void testsActions.deleteTest(item.id);
                    }
                  }}
                />
              ) : null}

              {tab === "users" ? (
                <AdminUsersList
                  items={users.items}
                  loading={activeListLoading}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  onEdit={usersActions.startEditingUser}
                  onDelete={(id) => void usersActions.deleteUser(id)}
                />
              ) : null}

              {tab === "blog" ? (
                <AdminBlogPostsList
                  items={blogPosts.items}
                  loading={activeListLoading}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  onEdit={blogPostsActions.startEditingBlogPost}
                  onDelete={(id) => void blogPostsActions.deleteBlogPost(id)}
                />
              ) : null}

              {tab === "notifications" ? (
                <AdminNotificationsList
                  items={notifications.items}
                  loading={activeListLoading}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                  onEdit={notificationsActions.startEditingNotification}
                  onDelete={(id) => void notificationsActions.deleteNotification(id)}
                />
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/80 px-4 py-3">
            <p className="mb-2 text-xs text-muted-foreground">Показано {activeItemsCount} из {activeTotal}</p>
            <WorkspacePaginationControls
              page={activePage}
              pageCount={activePageCount}
              onFirst={() => {
                if (tab === "tests") setTestsPage(1);
                if (tab === "users") setUsersPage(1);
                if (tab === "blog") setBlogPage(1);
                if (tab === "notifications") setNotificationsPage(1);
              }}
              onPrev={() => {
                if (tab === "tests") setTestsPage((prev) => Math.max(1, prev - 1));
                if (tab === "users") setUsersPage((prev) => Math.max(1, prev - 1));
                if (tab === "blog") setBlogPage((prev) => Math.max(1, prev - 1));
                if (tab === "notifications") setNotificationsPage((prev) => Math.max(1, prev - 1));
              }}
              onNext={() => {
                if (tab === "tests") setTestsPage((prev) => Math.min(testsPageCount, prev + 1));
                if (tab === "users") setUsersPage((prev) => Math.min(usersPageCount, prev + 1));
                if (tab === "blog") setBlogPage((prev) => Math.min(blogPageCount, prev + 1));
                if (tab === "notifications") setNotificationsPage((prev) => Math.min(notificationsPageCount, prev + 1));
              }}
              onLast={() => {
                if (tab === "tests") setTestsPage(testsPageCount);
                if (tab === "users") setUsersPage(usersPageCount);
                if (tab === "blog") setBlogPage(blogPageCount);
                if (tab === "notifications") setNotificationsPage(notificationsPageCount);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {materialTypeModalOpen ? (
        <AdminMaterialTypeModal
          open={materialTypeModalOpen}
          onClose={() => setMaterialTypeModalOpen(false)}
          onSelectTest={() => {
            setMaterialTypeModalOpen(false);
            void ensureCourseCatalogOptions().then(() => testsActions.openCreateTestDrawer());
          }}
          onSelectCards={() => {
            setMaterialTypeModalOpen(false);
            wordCardSetWorkflow.openCreateDrawer();
          }}
        />
      ) : null}

      {testsDrawerOpen ? (
        <AdminTestFormDrawer
          open={testsDrawerOpen}
          onClose={() => setTestsDrawerOpen(false)}
          title={editingTest ? "Изменить учебный материал" : "Создать учебный материал"}
          form={testsForm}
          setForm={setTestsForm}
          moduleOptions={courseModuleOptions}
          moduleOptionsError={courseModuleOptionsError}
          courseOptions={courseOptions}
          courseOptionsError={courseOptionsError}
          onCreateModule={createCourseModule}
          onSubmit={(event) => void testsActions.submitTest(event, testsForm)}
          submitLabel={editingTest ? "Сохранить" : "Создать"}
          submitting={testsActions.submittingTest}
          formError={actionError}
        />
      ) : null}

      {wordCardSetWorkflow.drawerOpen ? (
        <AdminWordCardSetFormDrawer
          open={wordCardSetWorkflow.drawerOpen}
          onClose={() => wordCardSetWorkflow.setDrawerOpen(false)}
          title={wordCardSetWorkflow.editing ? "Изменить набор карточек" : "Создать набор карточек"}
          form={wordCardSetWorkflow.form}
          setForm={wordCardSetWorkflow.setForm}
          onSubmit={(event) => void wordCardSetWorkflow.submit(event)}
          submitLabel={wordCardSetWorkflow.editing ? "Сохранить" : "Создать"}
          submitting={wordCardSetWorkflow.submitting}
          formError={actionError}
        />
      ) : null}

      {usersDrawerOpen ? (
        <AdminUserFormDrawer
          open={usersDrawerOpen}
          onClose={() => {
            setUsersDrawerOpen(false);
            usersActions.clearUserFormErrors();
          }}
          title={editingUser ? "Изменить пользователя" : "Создать пользователя"}
          form={usersForm}
          setForm={usersActions.setUserFieldValue}
          editingUser={editingUser}
          teacherOptions={teacherOptions}
          submitting={usersActions.submittingUser}
          isStudentRole={isStudentRole}
          fieldErrors={usersActions.userFormFieldErrors}
          formError={usersActions.userFormError}
          onSubmit={(event) => void usersActions.submitUser(event, usersForm, isStudentRole)}
        />
      ) : null}

      {blogPostsDrawerOpen ? (
        <AdminBlogFormDrawer
          open={blogPostsDrawerOpen}
          onClose={() => setBlogPostsDrawerOpen(false)}
          title={editingBlogPost ? "Изменить статью" : "Создать статью"}
          form={blogPostForm}
          setForm={setBlogPostForm}
          categories={blogCategories}
          onSubmit={(event) => void blogPostsActions.submitBlogPost(event, blogPostForm)}
          submitLabel={editingBlogPost ? "Сохранить" : "Создать"}
        />
      ) : null}

      {notificationsDrawerOpen ? (
        <AdminNotificationFormDrawer
          open={notificationsDrawerOpen}
          onClose={() => setNotificationsDrawerOpen(false)}
          title={editingNotification ? "Изменить уведомление" : "Создать уведомление"}
          form={notificationForm}
          setForm={setNotificationForm}
          onSubmit={(event) => void notificationsActions.submitNotification(event, notificationForm)}
          submitLabel={editingNotification ? "Сохранить" : "Создать"}
          submitting={notificationsActions.submittingNotification}
        />
      ) : null}
    </div>
  );
}
