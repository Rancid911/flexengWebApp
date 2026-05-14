import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminConsole } from "@/features/admin/components/admin-console/admin-console";
import type { AdminTestDto, AdminUserDto, PaginatedResponse } from "@/lib/admin/types";

const fetchJsonMock = vi.fn();
const setUsersMock = vi.fn();
const invalidateCacheForQueryMock = vi.fn();
const loadTestsPageDataMock = vi.fn();
const loadUsersPageDataMock = vi.fn();
const loadBlogPageDataMock = vi.fn();
const loadNotificationsPageDataMock = vi.fn();
const loadBlogMetaMock = vi.fn();
const prefetchNeighborsMock = vi.fn();

let currentTab: "tests" | "users" | "blog" | "notifications" = "tests";
let currentTests: PaginatedResponse<AdminTestDto>;
let currentUsers: PaginatedResponse<AdminUserDto>;

vi.mock("next/dynamic", async () => {
  const React = await import("react");

  return {
    default: (loader: () => Promise<unknown>) => {
      const LazyComponent = React.lazy(() =>
        Promise.resolve(loader()).then((module) => ({
          default:
            typeof module === "function"
              ? (module as React.ComponentType<Record<string, unknown>>)
              : ((module as Record<string, React.ComponentType<Record<string, unknown>>>).default ??
                Object.values(module as Record<string, React.ComponentType<Record<string, unknown>>>)[0])
        }))
      );

      function DynamicComponent(props: Record<string, unknown>) {
        return (
          <React.Suspense fallback={null}>
            <LazyComponent {...props} />
          </React.Suspense>
        );
      }

      return DynamicComponent;
    }
  };
});

vi.mock("@/shared/client/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/client/api-client")>();
  return {
    ...actual,
    fetchJson: (...args: unknown[]) => fetchJsonMock(...args)
  };
});

vi.mock("@/features/admin/components/admin-console/use-admin-tab-data", () => ({
  useAdminTabData: () => ({
    tab: currentTab,
    setTabAndSyncQuery: vi.fn(),
    q: "",
    setQ: vi.fn(),
    tests: currentTests,
    users: currentUsers,
    setUsers: setUsersMock,
    blogPosts: { items: [], total: 0, page: 1, pageSize: 20 },
    notifications: { items: [], total: 0, page: 1, pageSize: 20 },
    blogCategories: [],
    testsPage: 1,
    setTestsPage: vi.fn(),
    usersPage: 1,
    setUsersPage: vi.fn(),
    usersRoleFilter: "all",
    setUsersRoleFilter: vi.fn(),
    blogPage: 1,
    setBlogPage: vi.fn(),
    notificationsPage: 1,
    setNotificationsPage: vi.fn(),
    testsQuery: "",
    usersQuery: "",
    blogQuery: "",
    notificationsQuery: "",
    testsPageCount: 1,
    usersPageCount: 1,
    blogPageCount: 1,
    notificationsPageCount: 1,
    activePage: 1,
    activePageCount: 1,
    activeListError: "",
    activeListLoading: false,
    invalidateCacheForQuery: invalidateCacheForQueryMock,
    loadTestsPageData: loadTestsPageDataMock,
    loadUsersPageData: loadUsersPageDataMock,
    loadBlogPageData: loadBlogPageDataMock,
    loadNotificationsPageData: loadNotificationsPageDataMock,
    loadBlogMeta: loadBlogMetaMock,
    prefetchNeighbors: prefetchNeighborsMock
  })
}));

function makeTest(overrides: Partial<AdminTestDto> = {}): AdminTestDto {
  return {
    id: "test-1",
    material_type: "test",
    lesson_id: null,
    module_id: "module-1",
    activity_type: "trainer",
    assessment_kind: "regular",
    title: "Grammar trainer",
    description: null,
    cefr_level: "A1",
    drill_topic_key: "grammar",
    drill_kind: "grammar",
    scoring_profile: null,
    lesson_reinforcement: false,
    sort_order: 0,
    passing_score: 70,
    time_limit_minutes: 15,
    is_published: true,
    created_at: "2026-04-21T10:00:00.000Z",
    updated_at: "2026-04-21T10:00:00.000Z",
    ...overrides
  };
}

function makeUser(): AdminUserDto {
  return {
    id: "user-1",
    student_id: null,
    assigned_teacher_id: null,
    assigned_teacher_name: null,
    role: "teacher",
    first_name: "Анна",
    last_name: "Иванова",
    email: "teacher@example.com",
    phone: "+79999999999",
    birth_date: null,
    english_level: null,
    target_level: null,
    learning_goal: null,
    notes: null,
    billing_mode: null,
    lesson_price_amount: null,
    billing_currency: null,
    billing_balance_label: null,
    billing_debt_label: null,
    billing_is_negative: false,
    created_at: "2026-04-21T10:00:00.000Z"
  };
}

function makeDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function optionCalls() {
  return fetchJsonMock.mock.calls.map((call) => call[0]).filter((url) => typeof url === "string" && url.includes("/options"));
}

describe("AdminConsole option catalog loading", () => {
  beforeEach(() => {
    currentTab = "tests";
    currentTests = { items: [], total: 0, page: 1, pageSize: 20 };
    currentUsers = { items: [], total: 0, page: 1, pageSize: 20 };
    fetchJsonMock.mockReset();
    setUsersMock.mockReset();
    invalidateCacheForQueryMock.mockReset();
    loadTestsPageDataMock.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    loadUsersPageDataMock.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    loadBlogPageDataMock.mockReset();
    loadNotificationsPageDataMock.mockReset();
    loadBlogMetaMock.mockReset();
    prefetchNeighborsMock.mockReset();
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/users/teacher-options") return Promise.resolve([{ id: "teacher-1", label: "Анна Иванова" }]);
      if (url === "/api/admin/course-modules/options") return Promise.resolve([{ id: "module-1", label: "Module 1", courseTitle: "Course", moduleTitle: "Module 1", isPublished: true }]);
      if (url === "/api/admin/courses/options") return Promise.resolve([{ id: "course-1", label: "Course", title: "Course", isPublished: true }]);
      if (url === "/api/admin/tests/test-1") return Promise.resolve({ ...makeTest(), has_attempts: false, questions: [] });
      return Promise.resolve({});
    });
  });

  it("does not load drawer option catalogs on initial render", () => {
    render(<AdminConsole />);

    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/users/teacher-options");
    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/course-modules/options");
    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/courses/options");
    expect(screen.queryByTestId("admin-test-title-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-word-card-set-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-user-first-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-blog-title-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-notification-title-input")).not.toBeInTheDocument();
  });

  it("loads only teacher options before opening the user drawer", async () => {
    currentTab = "users";
    currentUsers = { items: [makeUser()], total: 1, page: 1, pageSize: 20 };
    render(<AdminConsole />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Добавить пользователя" }));
      await Promise.resolve();
    });

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/users/teacher-options"));
    expect(await screen.findByTestId("admin-user-first-name-input", undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/course-modules/options");
    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/courses/options");
  });

  it("loads course and module options when selecting the test material flow", async () => {
    render(<AdminConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Создать материал" }));
    fireEvent.click(screen.getByRole("button", { name: /Тест \/ тренажёр/i }));

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/course-modules/options"));
    expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/courses/options");
    expect(fetchJsonMock).not.toHaveBeenCalledWith("/api/admin/users/teacher-options");
    await waitFor(() => expect(screen.getByTestId("admin-test-title-input")).toBeInTheDocument());
    expect(screen.queryByTestId("admin-word-card-set-title")).not.toBeInTheDocument();
  });

  it("opens and closes only the word card drawer for the word card flow", async () => {
    render(<AdminConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Создать материал" }));
    fireEvent.click(screen.getByRole("button", { name: /Карточки/i }));

    await waitFor(() => expect(screen.getByText("Создать набор карточек")).toBeInTheDocument());
    expect(screen.getByTestId("admin-word-card-set-title")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-test-title-input")).not.toBeInTheDocument();
    expect(optionCalls()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    await waitFor(() => expect(screen.queryByTestId("admin-word-card-set-title")).not.toBeInTheDocument());
  });

  it("loads course catalogs before editing a regular test material", async () => {
    currentTests = { items: [makeTest()], total: 1, page: 1, pageSize: 20 };
    render(<AdminConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));

    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/course-modules/options"));
    expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/courses/options");
    await waitFor(() => expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/tests/test-1"));
    await waitFor(() => expect(screen.getByTestId("admin-test-title-input")).toBeInTheDocument());
  });

  it("deduplicates in-flight course catalog requests", async () => {
    const modules = makeDeferred<Array<{ id: string; label: string; courseTitle: string; moduleTitle: string; isPublished: boolean }>>();
    const courses = makeDeferred<Array<{ id: string; label: string; title: string; isPublished: boolean }>>();
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/course-modules/options") return modules.promise;
      if (url === "/api/admin/courses/options") return courses.promise;
      return Promise.resolve({});
    });
    render(<AdminConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Создать материал" }));
    fireEvent.click(screen.getByRole("button", { name: /Тест \/ тренажёр/i }));
    fireEvent.click(screen.getByRole("button", { name: "Создать материал" }));
    fireEvent.click(screen.getByRole("button", { name: /Тест \/ тренажёр/i }));

    expect(fetchJsonMock.mock.calls.filter((call) => call[0] === "/api/admin/course-modules/options")).toHaveLength(1);
    expect(fetchJsonMock.mock.calls.filter((call) => call[0] === "/api/admin/courses/options")).toHaveLength(1);

    modules.resolve([{ id: "module-1", label: "Module 1", courseTitle: "Course", moduleTitle: "Module 1", isPublished: true }]);
    courses.resolve([{ id: "course-1", label: "Course", title: "Course", isPublished: true }]);
    await waitFor(() => expect(screen.getByText("Создать учебный материал")).toBeInTheDocument());
  });
});
