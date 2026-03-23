"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminBlogFormDrawer } from "@/app/(dashboard)/admin/ui/admin-blog-form-drawer";
import { AdminPaginationControls } from "@/app/(dashboard)/admin/ui/admin-pagination-controls";
import { AdminTestFormDrawer } from "@/app/(dashboard)/admin/ui/admin-test-form-drawer";
import { AdminUserFormDrawer } from "@/app/(dashboard)/admin/ui/admin-user-form-drawer";
import {
  defaultBlogPostForm,
  defaultTestsForm,
  defaultUsersForm,
  getRoleLabel,
  PAGE_SIZE,
  type BlogPostForm,
  type TestsForm,
  type UsersForm,
  UUID_RE
} from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { ApiRequestError, fetchJson, slugify } from "@/app/(dashboard)/admin/ui/admin-console.utils";
import { useAdminTabData } from "@/app/(dashboard)/admin/ui/use-admin-tab-data";
import type {
  AdminTestDto,
  AdminUserDto,
  AdminUserRole,
  BlogPostDetailDto
} from "@/lib/admin/types";
import { dateToIsoWithCurrentTime, isoToDateOnly } from "@/lib/date-utils";
import { isValidRuPhone, normalizeRuPhoneInput, toRuPhoneStorage } from "@/lib/phone";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

type UserFormFieldKey =
  | "first_name"
  | "last_name"
  | "email"
  | "password"
  | "phone"
  | "birth_date"
  | "english_level"
  | "target_level"
  | "learning_goal"
  | "notes";

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
    blogCategories,
    testsPage,
    setTestsPage,
    usersPage,
    setUsersPage,
    usersRoleFilter,
    setUsersRoleFilter,
    blogPage,
    setBlogPage,
    testsQuery,
    usersQuery,
    blogQuery,
    testsPageCount,
    usersPageCount,
    blogPageCount,
    activePage,
    activePageCount,
    activeListError,
    activeListLoading,
    invalidateCacheForQuery,
    loadTestsPageData,
    loadUsersPageData,
    loadBlogPageData,
    loadBlogMeta,
    prefetchNeighbors
  } = useAdminTabData();
  const [submittingUser, setSubmittingUser] = useState(false);
  const [actionError, setActionError] = useState("");
  const [userFormError, setUserFormError] = useState("");
  const [userFormFieldErrors, setUserFormFieldErrors] = useState<Partial<Record<UserFormFieldKey, string>>>({});

  const [testsDrawerOpen, setTestsDrawerOpen] = useState(false);
  const [usersDrawerOpen, setUsersDrawerOpen] = useState(false);
  const [blogPostsDrawerOpen, setBlogPostsDrawerOpen] = useState(false);

  const [editingTest, setEditingTest] = useState<AdminTestDto | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPostDetailDto | null>(null);

  const [testsForm, setTestsForm] = useState<TestsForm>(defaultTestsForm);
  const [usersForm, setUsersForm] = useState<UsersForm>(defaultUsersForm);
  const [blogPostForm, setBlogPostForm] = useState<BlogPostForm>(defaultBlogPostForm);
  const activeRole = editingUser?.role ?? usersForm.role;
  const isStudentRole = activeRole === "student";

  function clearUserFormErrors() {
    setUserFormError("");
    setUserFormFieldErrors({});
  }

  function setUserFieldValue<K extends keyof UsersForm>(key: K, value: UsersForm[K]) {
    setUsersForm((prev) => ({ ...prev, [key]: value }));
    if (userFormFieldErrors[key as UserFormFieldKey]) {
      setUserFormFieldErrors((prev) => ({ ...prev, [key as UserFormFieldKey]: undefined }));
    }
  }

  async function submitTest(event: React.FormEvent) {
    event.preventDefault();
    try {
      setActionError("");
      const payload = {
        title: testsForm.title,
        description: testsForm.description || null,
        lesson_id: UUID_RE.test(testsForm.lesson_id.trim()) ? testsForm.lesson_id.trim() : null,
        module_id: UUID_RE.test(testsForm.module_id.trim()) ? testsForm.module_id.trim() : null,
        passing_score: Number(testsForm.passing_score || "70"),
        time_limit_minutes: testsForm.time_limit_minutes ? Number(testsForm.time_limit_minutes) : null,
        is_published: testsForm.is_published
      };

      if (editingTest) {
        await fetchJson(`/api/admin/tests/${editingTest.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await fetchJson("/api/admin/tests", { method: "POST", body: JSON.stringify(payload) });
      }

      setTestsDrawerOpen(false);
      setEditingTest(null);
      setTestsForm(defaultTestsForm);
      invalidateCacheForQuery("tests", testsQuery);
      await loadTestsPageData(testsPage, testsQuery, { revalidate: true });
      prefetchNeighbors("tests", testsPage, testsPageCount, testsQuery);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не удалось сохранить тест");
    }
  }

  async function deleteTest(id: string) {
    if (!window.confirm("Удалить тест?")) return;

    try {
      setActionError("");
      await fetchJson(`/api/admin/tests/${id}`, { method: "DELETE" });
      invalidateCacheForQuery("tests", testsQuery);
      await loadTestsPageData(testsPage, testsQuery, { revalidate: true });
      prefetchNeighbors("tests", testsPage, testsPageCount, testsQuery);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не удалось удалить тест");
    }
  }

  async function submitUser(event: React.FormEvent) {
    event.preventDefault();
    if (submittingUser) return;

    setSubmittingUser(true);
    try {
      clearUserFormErrors();
      const normalizedPhone = toRuPhoneStorage(usersForm.phone);
      if (!isValidRuPhone(usersForm.phone) || !normalizedPhone) {
        setUserFormFieldErrors((prev) => ({ ...prev, phone: "Телефон должен быть в формате +7 (999) 999 99 99" }));
        setSubmittingUser(false);
        return;
      }
      const studentFields = {
        birth_date: isStudentRole ? usersForm.birth_date || null : null,
        english_level: isStudentRole ? usersForm.english_level || null : null,
        target_level: isStudentRole ? usersForm.target_level || null : null,
        learning_goal: isStudentRole ? usersForm.learning_goal || null : null,
        notes: isStudentRole ? usersForm.notes || null : null
      };

      if (editingUser) {
        const payload = {
          first_name: usersForm.first_name.trim(),
          last_name: usersForm.last_name.trim(),
          email: usersForm.email.trim(),
          password: usersForm.password.trim() || null,
          phone: normalizedPhone,
          ...studentFields
        };
        const saved = await fetchJson<AdminUserDto>(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        setUsers((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item.id === saved.id ? saved : item))
        }));
      } else {
        const payload = {
          role: usersForm.role,
          first_name: usersForm.first_name.trim(),
          last_name: usersForm.last_name.trim(),
          email: usersForm.email.trim(),
          password: usersForm.password,
          phone: normalizedPhone,
          ...studentFields
        };
        const created = await fetchJson<AdminUserDto>("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
        setUsers((prev) => {
          const matchesRoleFilter = usersRoleFilter === "all" || created.role === usersRoleFilter;
          if (!matchesRoleFilter) return prev;
          const alreadyPresent = prev.items.some((item) => item.id === created.id);
          const nextItems = alreadyPresent ? prev.items : [created, ...prev.items].slice(0, PAGE_SIZE);
          return {
            ...prev,
            items: nextItems,
            total: alreadyPresent ? prev.total : prev.total + 1
          };
        });
      }

      setUsersDrawerOpen(false);
      setEditingUser(null);
      setUsersForm(defaultUsersForm);
      clearUserFormErrors();
      invalidateCacheForQuery("users", usersQuery, usersRoleFilter);
      void loadUsersPageData(usersPage, usersQuery, usersRoleFilter).catch((requestError) => {
        console.error("ADMIN_USERS_REFRESH_AFTER_SAVE_FAILED", requestError);
      });
      prefetchNeighbors("users", usersPage, usersPageCount, usersQuery, usersRoleFilter);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.code === "VALIDATION_ERROR") {
        const nextFieldErrors: Partial<Record<UserFormFieldKey, string>> = {};
        const fieldErrors = requestError.details?.fieldErrors ?? {};
        const formErrors = requestError.details?.formErrors ?? [];
        const knownKeys: UserFormFieldKey[] = [
          "first_name",
          "last_name",
          "email",
          "password",
          "phone",
          "birth_date",
          "english_level",
          "target_level",
          "learning_goal",
          "notes"
        ];

        for (const key of knownKeys) {
          const firstError = fieldErrors[key]?.[0];
          if (!firstError) continue;
          nextFieldErrors[key] = mapUiErrorMessage(firstError, "Проверьте корректность поля.");
        }

        setUserFormFieldErrors(nextFieldErrors);
        setUserFormError(mapUiErrorMessage(formErrors[0], requestError.message || "Проверьте правильность заполнения полей."));
      } else {
        setUserFormError(
          requestError instanceof Error ? mapUiErrorMessage(requestError.message, "Не удалось сохранить пользователя") : "Не удалось сохранить пользователя"
        );
      }
    } finally {
      setSubmittingUser(false);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Удалить пользователя?")) return;

    try {
      setActionError("");
      await fetchJson(`/api/admin/users/${id}`, { method: "DELETE" });
      invalidateCacheForQuery("users", usersQuery, usersRoleFilter);
      await loadUsersPageData(usersPage, usersQuery, usersRoleFilter, { revalidate: true });
      prefetchNeighbors("users", usersPage, usersPageCount, usersQuery, usersRoleFilter);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не удалось удалить пользователя");
    }
  }

  async function submitBlogPost(event: React.FormEvent) {
    event.preventDefault();

    try {
      setActionError("");
      const payload = {
        slug: slugify(blogPostForm.slug || blogPostForm.title),
        title: blogPostForm.title.trim(),
        excerpt: blogPostForm.excerpt.trim() || null,
        content: blogPostForm.content,
        cover_image_url: blogPostForm.cover_image_url.trim() || null,
        status: blogPostForm.status,
        published_at: dateToIsoWithCurrentTime(blogPostForm.published_at),
        author_name: blogPostForm.author_name.trim() || null,
        category_id: blogPostForm.category_id || null,
        category_name: blogPostForm.category_name.trim() || null,
        reading_time_min: blogPostForm.reading_time_min ? Number(blogPostForm.reading_time_min) : null,
        views_count: Number(blogPostForm.views_count || "0"),
        seo_title: blogPostForm.seo_title.trim() || null,
        seo_description: blogPostForm.seo_description.trim() || null,
        tag_names: blogPostForm.tag_names
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };

      if (editingBlogPost) {
        await fetchJson(`/api/admin/blog/posts/${editingBlogPost.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await fetchJson("/api/admin/blog/posts", { method: "POST", body: JSON.stringify(payload) });
      }

      setBlogPostsDrawerOpen(false);
      setEditingBlogPost(null);
      setBlogPostForm(defaultBlogPostForm);
      await loadBlogMeta(true);
      invalidateCacheForQuery("blog", blogQuery);
      await loadBlogPageData(blogPage, blogQuery, { revalidate: true });
      prefetchNeighbors("blog", blogPage, blogPageCount, blogQuery);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не удалось сохранить статью");
    }
  }

  async function deleteBlogPost(id: string) {
    if (!window.confirm("Удалить статью?")) return;

    try {
      setActionError("");
      await fetchJson(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
      invalidateCacheForQuery("blog", blogQuery);
      await loadBlogPageData(blogPage, blogQuery, { revalidate: true });
      prefetchNeighbors("blog", blogPage, blogPageCount, blogQuery);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Не удалось удалить статью");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tab === "tests" ? "default" : "secondary"}
              onClick={() => setTabAndSyncQuery("tests")}
              type="button"
            >
              Тесты
            </Button>
            <Button
              variant={tab === "users" ? "default" : "secondary"}
              onClick={() => setTabAndSyncQuery("users")}
              type="button"
            >
              Пользователи
            </Button>
            <Button
              variant={tab === "blog" ? "default" : "secondary"}
              onClick={() => setTabAndSyncQuery("blog")}
              type="button"
            >
              Блог
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Поиск..." className="max-w-sm" />
            {tab === "tests" ? (
              <Button
                onClick={() => {
                  setEditingTest(null);
                  setTestsForm(defaultTestsForm);
                  setTestsDrawerOpen(true);
                }}
                type="button"
              >
                Создать тест
              </Button>
            ) : null}
            {tab === "users" ? (
              <>
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    setUsersForm(defaultUsersForm);
                    clearUserFormErrors();
                    setUsersDrawerOpen(true);
                  }}
                  type="button"
                >
                  Создать пользователя
                </Button>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={usersRoleFilter}
                  onChange={(event) => setUsersRoleFilter(event.target.value as AdminUserRole | "all")}
                >
                  <option value="all">Все роли</option>
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </>
            ) : null}
            {tab === "blog" ? (
              <>
                <Button
                  onClick={() => {
                    setEditingBlogPost(null);
                    setBlogPostForm(defaultBlogPostForm);
                    setBlogPostsDrawerOpen(true);
                  }}
                  type="button"
                >
                  Создать статью
                </Button>
              </>
            ) : null}
          </div>

          {actionError ? <p className="text-sm text-red-400">{actionError}</p> : null}
          {activeListError ? <p className="text-sm text-red-400">{activeListError}</p> : null}

          {tab === "tests" ? (
            <div className="space-y-2">
              {activeListLoading && tests.items.length === 0 ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div key={`tests-skeleton-${index}`} className="h-[74px] animate-pulse rounded-xl border border-border bg-muted/35" />
                ))
              ) : (
                tests.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">passing: {item.passing_score}% · limit: {item.time_limit_minutes ?? "—"} мин</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingTest(item);
                        setTestsForm({
                          title: item.title,
                          description: item.description ?? "",
                          lesson_id: item.lesson_id ?? "",
                          module_id: item.module_id ?? "",
                          passing_score: String(item.passing_score),
                          time_limit_minutes: item.time_limit_minutes == null ? "" : String(item.time_limit_minutes),
                          is_published: item.is_published
                        });
                        setTestsDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Изменить
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void deleteTest(item.id)} type="button">
                      Удалить
                    </Button>
                  </div>
                </div>
                ))
              )}
            </div>
          ) : null}

          {tab === "users" ? (
            <div className="space-y-2">
              {activeListLoading && users.items.length === 0 ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div key={`users-skeleton-${index}`} className="h-[82px] animate-pulse rounded-xl border border-border bg-muted/35" />
                ))
              ) : (
                users.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{`${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || `User #${item.id.slice(0, 8)}`}</p>
                    <p className="text-xs text-muted-foreground">{item.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">Роль: {getRoleLabel(item.role)}</p>
                    {item.role === "student" ? (
                      <p className="text-xs text-muted-foreground">level: {item.english_level ?? "—"} → {item.target_level ?? "—"}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingUser(item);
                        setUsersForm({
                          role: item.role,
                          first_name: item.first_name ?? "",
                          last_name: item.last_name ?? "",
                          email: item.email ?? "",
                          password: "",
                          phone: item.phone ? normalizeRuPhoneInput(item.phone) : "+7 ",
                          birth_date: item.birth_date ?? "",
                          english_level: item.english_level ?? "",
                          target_level: item.target_level ?? "",
                          learning_goal: item.learning_goal ?? "",
                          notes: item.notes ?? ""
                        });
                        clearUserFormErrors();
                        setUsersDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Изменить
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void deleteUser(item.id)} type="button">
                      Удалить
                    </Button>
                  </div>
                </div>
                ))
              )}
            </div>
          ) : null}

          {tab === "blog" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {activeListLoading && blogPosts.items.length === 0 ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <div key={`blog-skeleton-${index}`} className="h-[82px] animate-pulse rounded-xl border border-border bg-muted/35" />
                  ))
                ) : (
                  blogPosts.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">/{item.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.status} · {item.category?.name ?? "Без категории"} · {item.reading_time_min ?? 5} мин · {item.views_count} просмотров
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingBlogPost(item);
                          setBlogPostForm({
                            slug: item.slug,
                            title: item.title,
                            excerpt: item.excerpt ?? "",
                            content: item.content,
                            cover_image_url: item.cover_image_url ?? "",
                            status: item.status,
                            published_at: isoToDateOnly(item.published_at),
                            author_name: item.author_name ?? "",
                            category_id: item.category?.id ?? "",
                            category_name: "",
                            reading_time_min: item.reading_time_min == null ? "" : String(item.reading_time_min),
                            views_count: String(item.views_count),
                            seo_title: item.seo_title ?? "",
                            seo_description: item.seo_description ?? "",
                            tag_names: item.tags.map((tag) => tag.name).join(", ")
                          });
                          setBlogPostsDrawerOpen(true);
                        }}
                        type="button"
                      >
                        Изменить
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => void deleteBlogPost(item.id)} type="button">
                        Удалить
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <AdminPaginationControls
            page={activePage}
            pageCount={activePageCount}
            onFirst={() => {
              if (tab === "tests") setTestsPage(1);
              if (tab === "users") setUsersPage(1);
              if (tab === "blog") setBlogPage(1);
            }}
            onPrev={() => {
              if (tab === "tests") setTestsPage((prev) => Math.max(1, prev - 1));
              if (tab === "users") setUsersPage((prev) => Math.max(1, prev - 1));
              if (tab === "blog") setBlogPage((prev) => Math.max(1, prev - 1));
            }}
            onNext={() => {
              if (tab === "tests") setTestsPage((prev) => Math.min(testsPageCount, prev + 1));
              if (tab === "users") setUsersPage((prev) => Math.min(usersPageCount, prev + 1));
              if (tab === "blog") setBlogPage((prev) => Math.min(blogPageCount, prev + 1));
            }}
            onLast={() => {
              if (tab === "tests") setTestsPage(testsPageCount);
              if (tab === "users") setUsersPage(usersPageCount);
              if (tab === "blog") setBlogPage(blogPageCount);
            }}
          />
        </CardContent>
      </Card>

      <AdminTestFormDrawer
        open={testsDrawerOpen}
        onClose={() => setTestsDrawerOpen(false)}
        title={editingTest ? "Изменить тест" : "Создать тест"}
        form={testsForm}
        setForm={setTestsForm}
        onSubmit={submitTest}
        submitLabel={editingTest ? "Сохранить" : "Создать"}
      />

      <AdminUserFormDrawer
        open={usersDrawerOpen}
        onClose={() => {
          setUsersDrawerOpen(false);
          clearUserFormErrors();
        }}
        title={editingUser ? "Изменить пользователя" : "Создать пользователя"}
        form={usersForm}
        setForm={setUserFieldValue}
        editingUser={editingUser}
        submitting={submittingUser}
        isStudentRole={isStudentRole}
        fieldErrors={userFormFieldErrors}
        formError={userFormError}
        onSubmit={submitUser}
      />

      <AdminBlogFormDrawer
        open={blogPostsDrawerOpen}
        onClose={() => setBlogPostsDrawerOpen(false)}
        title={editingBlogPost ? "Изменить статью" : "Создать статью"}
        form={blogPostForm}
        setForm={setBlogPostForm}
        categories={blogCategories}
        onSubmit={submitBlogPost}
        submitLabel={editingBlogPost ? "Сохранить" : "Создать"}
      />
    </div>
  );
}
