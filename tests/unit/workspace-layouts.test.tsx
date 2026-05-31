import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthLayout from "@/app/(auth)/layout";
import PublicLayout from "@/app/(public)/layout";
import WorkspaceLayout from "@/app/(workspace)/layout";
import WorkspaceLoading from "@/app/(workspace)/loading";
import AdminLoading from "@/app/(workspace)/(staff-zone)/admin/loading";
import AdminPaymentsLoading from "@/app/(workspace)/(staff-zone)/admin/payments/loading";
import AdminStudentsLoading from "@/app/(workspace)/(staff-zone)/admin/students/loading";
import AdminStudentProfileLoading from "@/app/(workspace)/(staff-zone)/admin/students/[studentId]/loading";
import AdminTeachersLoading from "@/app/(workspace)/(staff-zone)/admin/teachers/loading";
import AdminTeacherProfileLoading from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/loading";
import CrmPage from "@/app/(workspace)/(staff-zone)/crm/page";
import CrmLoading from "@/app/(workspace)/(staff-zone)/crm/loading";
import DashboardLoading from "@/app/(workspace)/(shared-zone)/dashboard/loading";
import HomeworkLoading from "@/app/(workspace)/(shared-zone)/homework/loading";
import HomeworkDetailLoading from "@/app/(workspace)/(shared-zone)/homework/[id]/loading";
import ActiveHomeworkLoading from "@/app/(workspace)/(shared-zone)/homework/active/loading";
import CompletedHomeworkLoading from "@/app/(workspace)/(shared-zone)/homework/completed/loading";
import OverdueHomeworkLoading from "@/app/(workspace)/(shared-zone)/homework/overdue/loading";
import PracticeLoading from "@/app/(workspace)/(shared-zone)/practice/loading";
import PracticeActivityLoading from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/loading";
import PracticeCatalogLoading from "@/app/(workspace)/(shared-zone)/practice/catalog/loading";
import PracticeFavoritesLoading from "@/app/(workspace)/(shared-zone)/practice/favorites/loading";
import PracticeMistakesLoading from "@/app/(workspace)/(shared-zone)/practice/mistakes/loading";
import PracticeRecommendedLoading from "@/app/(workspace)/(shared-zone)/practice/recommended/loading";
import PracticeTopicsLoading from "@/app/(workspace)/(shared-zone)/practice/topics/loading";
import PracticeTopicLoading from "@/app/(workspace)/(shared-zone)/practice/topics/[topic]/loading";
import PracticeSubtopicLoading from "@/app/(workspace)/(shared-zone)/practice/topics/[topic]/[subtopic]/loading";
import ScheduleLoading from "@/app/(workspace)/(shared-zone)/schedule/loading";
import ProfileSettingsLoading from "@/app/(workspace)/(shared-zone)/settings/profile/loading";
import DifficultWordsLoading from "@/app/(workspace)/(shared-zone)/words/difficult/loading";
import MyWordsLoading from "@/app/(workspace)/(shared-zone)/words/my/loading";
import NewWordsLoading from "@/app/(workspace)/(shared-zone)/words/new/loading";
import ReviewWordsLoading from "@/app/(workspace)/(shared-zone)/words/review/loading";
import WordsTopicLoading from "@/app/(workspace)/(shared-zone)/words/topics/[topicSlug]/loading";
import WordsTrainLoading from "@/app/(workspace)/(shared-zone)/words/train/loading";
import SearchZoneLayout from "@/app/(workspace)/(search-zone)/layout";
import SharedZoneLayout from "@/app/(workspace)/(shared-zone)/layout";
import StaffZoneLayout from "@/app/(workspace)/(staff-zone)/layout";
import StudentZoneLayout from "@/app/(workspace)/(student-zone)/layout";
import StudentDashboardLoading from "@/app/(workspace)/(student-zone)/student-dashboard/loading";
import PaymentSettingsLoading from "@/app/(workspace)/(student-zone)/settings/payments/loading";
import TeacherZoneLayout from "@/app/(workspace)/(teacher-zone)/layout";
import StudentProfileLoading from "@/app/(workspace)/(teacher-zone)/students/[studentId]/loading";
import StudentsLoading from "@/app/(workspace)/(teacher-zone)/students/loading";
import { resolveWorkspaceShellIntent } from "@/features/workspace-shell/model/workspace-shell-intent";

const crmQueriesMock = vi.hoisted(() => ({
  loadCrmBoard: vi.fn(async () => ({ stages: [] })),
  loadCrmSettings: vi.fn(async (): Promise<{ background_image_url: string | null; updated_at: string | null }> => ({
    background_image_url: null,
    updated_at: null
  }))
}));

const requireAdminPagePermissionMock = vi.hoisted(() => vi.fn(async () => undefined));

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(join(process.cwd(), directory));
  return entries.flatMap((entry) => {
    const relativePath = `${directory}/${entry}`;
    const absolutePath = join(process.cwd(), relativePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (relativePath === "features/workspace-shell") return [];
      return collectSourceFiles(relativePath);
    }

    return /\.(ts|tsx)$/.test(entry) ? [relativePath] : [];
  });
}

vi.mock("@/features/marketing/components/main-header", () => ({
  MainHeader: () => <div data-testid="public-header">header</div>
}));

vi.mock("@/features/marketing/components/main-footer", () => ({
  MainFooter: () => <div data-testid="public-footer">footer</div>
}));

vi.mock("@/features/workspace-shell/server/workspace-shell.server", () => ({
  WorkspaceShell: ({
    children,
    shellVariant,
    utilitySlots,
    crmBackgroundImageUrl
  }: {
    children: React.ReactNode;
    shellVariant: string;
    utilitySlots?: { search?: string; notifications?: string };
    crmBackgroundImageUrl?: string | null;
  }) => (
    <div
      data-testid="workspace-shell"
      data-variant={shellVariant ?? "auto"}
      data-search={utilitySlots?.search ?? "none"}
      data-notifications={utilitySlots?.notifications ?? "none"}
      data-crm-background={crmBackgroundImageUrl ?? "none"}
    >
      {children}
    </div>
  )
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdminPagePermission: requireAdminPagePermissionMock
}));

vi.mock("@/lib/crm/queries", () => ({
  loadCrmBoard: crmQueriesMock.loadCrmBoard,
  loadCrmSettings: crmQueriesMock.loadCrmSettings
}));

vi.mock("@/features/crm/components/crm-board-client", () => ({
  CrmBoardClient: ({ initialSettings }: { initialSettings: { background_image_url: string | null } }) => (
    <div data-testid="crm-board" data-background={initialSettings.background_image_url ?? "none"} />
  )
}));

describe("route layouts", () => {
  beforeEach(() => {
    crmQueriesMock.loadCrmBoard.mockClear();
    crmQueriesMock.loadCrmSettings.mockClear();
    requireAdminPagePermissionMock.mockClear();
  });

  it("renders marketing shell for public layout", () => {
    render(<PublicLayout><div>content</div></PublicLayout>);

    expect(screen.getByTestId("public-header")).toBeInTheDocument();
    expect(screen.getByTestId("public-footer")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders plain auth layout without marketing shell", () => {
    render(<AuthLayout><div>auth-content</div></AuthLayout>);

    expect(screen.getByText("auth-content")).toBeInTheDocument();
    expect(screen.queryByTestId("public-header")).not.toBeInTheDocument();
  });

  it("renders one workspace shell from the common workspace layout", async () => {
    render(await WorkspaceLayout({ children: <div>workspace-content</div> }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "auto");
    expect(screen.getByText("workspace-content")).toBeInTheDocument();
  });

  it("keeps workspace zone layouts as thin passthrough wrappers", async () => {
    const shared = render(await SharedZoneLayout({ children: <div>shared</div> }));
    expect(screen.getByText("shared")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
    shared.unmount();

    const student = render(await StudentZoneLayout({ children: <div>student</div> }));
    expect(screen.getByText("student")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
    student.unmount();

    const teacher = render(await TeacherZoneLayout({ children: <div>teacher</div> }));
    expect(screen.getByText("teacher")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
    teacher.unmount();

    const staff = render(await StaffZoneLayout({ children: <div>staff</div> }));
    expect(screen.getByText("staff")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
    staff.unmount();

    render(await SearchZoneLayout({ children: <div>search</div> }));
    expect(screen.getByText("search")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
  });

  it("resolves workspace shell intent from pathname instead of route group ownership", () => {
    expect(resolveWorkspaceShellIntent("/admin").shellVariant).toBe("staff");
    expect(resolveWorkspaceShellIntent("/admin/students/student-1").shellVariant).toBe("staff");
    expect(resolveWorkspaceShellIntent("/crm").shellVariant).toBe("staff");
    expect(resolveWorkspaceShellIntent("/students").shellVariant).toBe("teacher");
    expect(resolveWorkspaceShellIntent("/students/student-1").shellVariant).toBe("teacher");
    expect(resolveWorkspaceShellIntent("/student-dashboard").shellVariant).toBe("student");
    expect(resolveWorkspaceShellIntent("/settings/payments").shellVariant).toBe("student");
    expect(resolveWorkspaceShellIntent("/dashboard").shellVariant).toBe("shared");
    expect(resolveWorkspaceShellIntent("/schedule").shellVariant).toBe("shared");
    expect(resolveWorkspaceShellIntent("/settings/profile").shellVariant).toBe("shared");
  });

  it("loads CRM settings in the CRM route instead of the staff layout", async () => {
    crmQueriesMock.loadCrmSettings.mockResolvedValue({
      background_image_url: "https://example.com/crm-bg.jpg",
      updated_at: "2026-04-24T12:00:00.000Z"
    });

    render(await CrmPage());

    expect(requireAdminPagePermissionMock).toHaveBeenCalledWith("crm.leads.view");
    expect(crmQueriesMock.loadCrmBoard).toHaveBeenCalledTimes(1);
    expect(crmQueriesMock.loadCrmSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("crm-board")).toHaveAttribute("data-background", "https://example.com/crm-bg.jpg");
  });

  it("disables header search for the dedicated search route", async () => {
    const intent = resolveWorkspaceShellIntent("/search");

    expect(intent.shellVariant).toBe("shared");
    expect(intent.utilitySlots.search).toBe("none");
    expect(intent.utilitySlots.notifications).toBe("lazy");
  });

  it("keeps zone layouts free of workspace shell ownership", () => {
    const zoneLayouts = [
      "app/(workspace)/(shared-zone)/layout.tsx",
      "app/(workspace)/(staff-zone)/layout.tsx",
      "app/(workspace)/(student-zone)/layout.tsx",
      "app/(workspace)/(teacher-zone)/layout.tsx",
      "app/(workspace)/(search-zone)/layout.tsx"
    ];

    for (const filePath of zoneLayouts) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source).not.toContain("WorkspaceShell");
      expect(source).not.toContain("resolveWorkspaceShellOptions");
    }
  });

  it("keeps common workspace layout and search as the only workspace shell owners", () => {
    const allowedShellConsumers = [
      "app/(workspace)/layout.tsx",
      "features/search/server/search-route.tsx"
    ];
    const shellConsumers = [...collectSourceFiles("app"), ...collectSourceFiles("features")]
      .filter((filePath) => {
        const source = readFileSync(join(process.cwd(), filePath), "utf8");
        return source.includes("@/features/workspace-shell/server/workspace-shell.server");
      })
      .sort();

    expect(shellConsumers).toEqual(allowedShellConsumers.sort());
  });

  it("keeps internal workspace navigation link-driven instead of forcing window.location transitions", () => {
    const navigationSurfaces = [
      "features/workspace-shell/components/shell/workspace-navigation-view.tsx",
      "features/workspace-shell/components/dashboard-mobile-actions-sheet.tsx",
      "features/workspace-shell/components/shell/workspace-frame.tsx"
    ];

    for (const filePath of navigationSurfaces) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source).toContain('from "next/link"');
      expect(source).not.toMatch(/window\.location|location\.assign/);
    }
  });

  it("keeps workspace route groups free of route-group loading ownership", () => {
    const zoneLoadingFiles = [
      "app/(workspace)/(shared-zone)/loading.tsx",
      "app/(workspace)/(staff-zone)/loading.tsx",
      "app/(workspace)/(student-zone)/loading.tsx",
      "app/(workspace)/(teacher-zone)/loading.tsx",
      "app/(workspace)/(search-zone)/loading.tsx"
    ];

    for (const filePath of zoneLoadingFiles) {
      expect(() => readFileSync(join(process.cwd(), filePath), "utf8")).toThrow();
    }
  });

  it("keeps the workspace fallback neutral and free of page-specific imports", () => {
    const source = readFileSync(join(process.cwd(), "app/(workspace)/loading.tsx"), "utf8");

    expect(source).toContain("WorkspaceNeutralLoadingSkeleton");
    expect(source).not.toMatch(/Dashboard|Schedule|StudentDirectory|StudentProfile|Admin|Crm|Settings/);
    expect(source).not.toContain("WorkspaceShell");
  });

  it("keeps route-specific loading coverage for high-impact workspace routes", () => {
    const routeLoadingFiles = [
      "app/(workspace)/(shared-zone)/dashboard/loading.tsx",
      "app/(workspace)/(shared-zone)/schedule/loading.tsx",
      "app/(workspace)/(teacher-zone)/students/loading.tsx",
      "app/(workspace)/(teacher-zone)/students/[studentId]/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/payments/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/students/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/students/[studentId]/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/teachers/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/loading.tsx",
      "app/(workspace)/(staff-zone)/crm/loading.tsx",
      "app/(workspace)/(shared-zone)/settings/profile/loading.tsx",
      "app/(workspace)/(student-zone)/settings/payments/loading.tsx",
      "app/(workspace)/(student-zone)/student-dashboard/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/[id]/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/active/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/completed/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/overdue/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/activity/[activityId]/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/catalog/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/favorites/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/mistakes/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/recommended/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/topics/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/topics/[topic]/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/topics/[topic]/[subtopic]/loading.tsx",
      "app/(workspace)/(shared-zone)/words/my/loading.tsx",
      "app/(workspace)/(shared-zone)/words/review/loading.tsx",
      "app/(workspace)/(shared-zone)/words/new/loading.tsx",
      "app/(workspace)/(shared-zone)/words/difficult/loading.tsx",
      "app/(workspace)/(shared-zone)/words/topics/[topicSlug]/loading.tsx",
      "app/(workspace)/(shared-zone)/words/train/loading.tsx"
    ];

    for (const filePath of routeLoadingFiles) {
      const source = readFileSync(join(process.cwd(), filePath), "utf8");

      expect(source).toContain("workspace-loading-skeletons");
      expect(source).not.toContain("WorkspaceShell");
    }
  });

  it("renders workspace loading components without workspace shell ownership", () => {
    const loadingComponents = [
      WorkspaceLoading,
      DashboardLoading,
      ScheduleLoading,
      HomeworkLoading,
      HomeworkDetailLoading,
      ActiveHomeworkLoading,
      CompletedHomeworkLoading,
      OverdueHomeworkLoading,
      PracticeLoading,
      PracticeActivityLoading,
      PracticeCatalogLoading,
      PracticeFavoritesLoading,
      PracticeMistakesLoading,
      PracticeRecommendedLoading,
      PracticeTopicsLoading,
      PracticeTopicLoading,
      PracticeSubtopicLoading,
      MyWordsLoading,
      ReviewWordsLoading,
      NewWordsLoading,
      DifficultWordsLoading,
      WordsTopicLoading,
      WordsTrainLoading,
      StudentsLoading,
      StudentProfileLoading,
      AdminLoading,
      AdminPaymentsLoading,
      AdminStudentsLoading,
      AdminStudentProfileLoading,
      AdminTeachersLoading,
      AdminTeacherProfileLoading,
      CrmLoading,
      ProfileSettingsLoading,
      StudentDashboardLoading,
      PaymentSettingsLoading
    ];

    for (const LoadingComponent of loadingComponents) {
      const { unmount } = render(<LoadingComponent />);

      expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
      unmount();
    }
  });
});
