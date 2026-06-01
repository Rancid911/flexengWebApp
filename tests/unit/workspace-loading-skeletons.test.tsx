import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WorkspaceLoading from "@/app/(workspace)/loading";
import SearchLoading from "@/app/search/loading";
import ArticlesLoading from "@/app/(public)/articles/loading";
import ArticleDetailLoading from "@/app/(public)/articles/[slug]/loading";
import AdminLoading from "@/app/(workspace)/(staff-zone)/admin/loading";
import AdminPaymentsLoading from "@/app/(workspace)/(staff-zone)/admin/payments/loading";
import AdminStudentsLoading from "@/app/(workspace)/(staff-zone)/admin/students/loading";
import AdminStudentProfileLoading from "@/app/(workspace)/(staff-zone)/admin/students/[studentId]/loading";
import AdminTeachersLoading from "@/app/(workspace)/(staff-zone)/admin/teachers/loading";
import AdminTeacherProfileLoading from "@/app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/loading";
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
import WordsLoading from "@/app/(workspace)/(shared-zone)/words/loading";
import NewWordsLoading from "@/app/(workspace)/(shared-zone)/words/new/loading";
import ReviewWordsLoading from "@/app/(workspace)/(shared-zone)/words/review/loading";
import WordsTopicLoading from "@/app/(workspace)/(shared-zone)/words/topics/[topicSlug]/loading";
import WordsTrainLoading from "@/app/(workspace)/(shared-zone)/words/train/loading";
import PaymentSettingsLoading from "@/app/(workspace)/(student-zone)/settings/payments/loading";
import StudentProfileLoading from "@/app/(workspace)/(teacher-zone)/students/[studentId]/loading";
import StudentsLoading from "@/app/(workspace)/(teacher-zone)/students/loading";
import {
  WorkspaceAdminDirectoryLoadingSkeleton,
  WorkspaceAdminPaymentsLoadingSkeleton,
  WorkspaceAdminProfileLoadingSkeleton,
  WorkspaceHomeworkDetailLoadingSkeleton,
  WorkspaceHomeworkListLoadingSkeleton,
  WorkspacePracticeActivityLoadingSkeleton,
  WorkspacePracticeLibraryLoadingSkeleton,
  WorkspacePracticeOverviewLoadingSkeleton,
  WorkspacePracticeTopicLoadingSkeleton,
  WorkspaceStudentPaymentsLoadingSkeleton,
  WorkspaceWordsLibraryLoadingSkeleton,
  WorkspaceWordsTrainerLoadingSkeleton
} from "@/features/workspace-shell/components/loading/workspace-loading-skeletons";
import {
  PublicArticleDetailLoadingSkeleton,
  PublicArticlesListLoadingSkeleton
} from "@/features/blog/components/loading/blog-loading-skeletons";
import { SearchPageLoadingSkeleton } from "@/features/search/components/search-page-loading-skeleton";

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function fileExists(path: string) {
  try {
    statSync(join(process.cwd(), path));
    return true;
  } catch {
    return false;
  }
}

function collectFiles(directory: string): string[] {
  const absoluteDirectory = join(process.cwd(), directory);
  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const relativePath = `${directory}/${entry}`;
    const absolutePath = join(process.cwd(), relativePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return collectFiles(relativePath);
    }

    return [relativePath];
  });
}

describe("workspace loading skeleton boundaries", () => {
  it("documents the screen-by-screen loading inventory and screen-accurate rule", () => {
    const inventory = readProjectFile("docs/loading-screen-inventory.md");
    const contract = readProjectFile("docs/workspace-loading-skeleton-contract.md");
    const requiredRoutes = [
      "/dashboard",
      "/schedule",
      "/students",
      "/students/[studentId]",
      "/admin",
      "/admin/students",
      "/admin/students/[studentId]",
      "/admin/teachers",
      "/admin/teachers/[teacherId]",
      "/admin/payments",
      "/crm",
      "/settings/profile",
      "/settings/payments",
      "/homework",
      "/homework/[id]",
      "/practice",
      "/practice/catalog",
      "/practice/favorites",
      "/practice/mistakes",
      "/practice/topics/[topic]",
      "/practice/topics/[topic]/[subtopic]",
      "/practice/activity/[activityId]",
      "/words",
      "/words/train",
      "/search",
      "/articles",
      "/articles/[slug]",
      "/login",
      "/register"
    ];

    expect(inventory).toContain("| Route/screen | Final layout type | Final component inspected | Existing loading source | Current skeleton type | Problem | Action/status |");
    expect(inventory).toContain("neutral fallback");
    expect(inventory).toContain("no dedicated skeleton needed");
    expect(inventory).toContain("documented exception");
    expect(inventory).toContain("requires manual verification");
    for (const route of requiredRoutes) {
      expect(inventory).toContain(route);
    }

    expect(contract).toContain("Screen-accurate Skeleton Rule");
    expect(contract).toContain("docs/loading-screen-inventory.md");
    expect(contract).toMatch(/broad workspace fallback[\s\S]{0,120}neutral/i);
    expect(contract).toMatch(/section\/client loading[\s\S]{0,160}local/i);
    expect(contract).toMatch(/adding a skeleton is not always the correct fix/i);
  });

  it("keeps the broad workspace fallback neutral and free of page-specific skeleton imports", () => {
    const source = readProjectFile("app/(workspace)/loading.tsx");

    expect(source).toContain("WorkspaceNeutralLoadingSkeleton");
    expect(source).not.toMatch(/Workspace(Dashboard|Schedule|StudentDirectory|StudentProfile|Admin|Crm|Settings)LoadingSkeleton/);
    expect(source).not.toContain("WorkspaceShell");
  });

  it("keeps skeleton components presentational-only", () => {
    const sources = [
      readProjectFile("features/workspace-shell/components/loading/workspace-loading-skeletons.tsx"),
      readProjectFile("features/blog/components/loading/blog-loading-skeletons.tsx"),
      readProjectFile("features/search/components/search-page-loading-skeleton.tsx")
    ];

    for (const source of sources) {
      expect(source).not.toMatch(/@\/lib\/auth|@\/lib\/permissions|@\/lib\/supabase|@\/app\//);
      expect(source).not.toMatch(/requirePermission|requireWorkspaceRouteAccess|requireLayoutActor|can\(/);
      expect(source).not.toMatch(/createClient|createAdminClient|fetch\(|server action/i);
      expect(source).not.toMatch(/repositories?|route handlers?/i);
      expect(source).not.toContain("WorkspaceShell");
    }
  });

  it("renders new screen-accurate skeleton components without shell ownership", () => {
    const skeletonComponents = [
      WorkspaceStudentPaymentsLoadingSkeleton,
      WorkspaceAdminDirectoryLoadingSkeleton,
      WorkspaceAdminProfileLoadingSkeleton,
      WorkspaceAdminPaymentsLoadingSkeleton,
      SearchPageLoadingSkeleton,
      WorkspaceHomeworkListLoadingSkeleton,
      WorkspaceHomeworkDetailLoadingSkeleton,
      WorkspacePracticeOverviewLoadingSkeleton,
      WorkspacePracticeLibraryLoadingSkeleton,
      WorkspacePracticeTopicLoadingSkeleton,
      WorkspacePracticeActivityLoadingSkeleton,
      WorkspaceWordsLibraryLoadingSkeleton,
      WorkspaceWordsTrainerLoadingSkeleton,
      PublicArticlesListLoadingSkeleton,
      PublicArticleDetailLoadingSkeleton
    ];

    for (const SkeletonComponent of skeletonComponents) {
      const { unmount } = render(<SkeletonComponent />);

      expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps route loading components free of workspace shell ownership", () => {
    const loadingComponents = [
      WorkspaceLoading,
      SearchLoading,
      ArticlesLoading,
      ArticleDetailLoading,
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
      WordsLoading,
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
      PaymentSettingsLoading
    ];

    for (const LoadingComponent of loadingComponents) {
      const { unmount } = render(<LoadingComponent />);

      expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("keeps route group loading ownership out of workspace zones", () => {
    const zoneLoadingFiles = [
      "app/(workspace)/(shared-zone)/loading.tsx",
      "app/(workspace)/(staff-zone)/loading.tsx",
      "app/(workspace)/(student-zone)/loading.tsx",
      "app/(workspace)/(teacher-zone)/loading.tsx",
      "app/(workspace)/(search-zone)/loading.tsx"
    ];

    for (const path of zoneLoadingFiles) {
      expect(fileExists(path)).toBe(false);
    }
  });

  it("keeps first-batch route loading files mapped to screen-specific skeletons", () => {
    const inventory = readProjectFile("docs/loading-screen-inventory.md");
    const paymentLoading = readProjectFile("app/(workspace)/(student-zone)/settings/payments/loading.tsx");
    const homeworkListRoutes = [
      "app/(workspace)/(shared-zone)/homework/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/active/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/completed/loading.tsx",
      "app/(workspace)/(shared-zone)/homework/overdue/loading.tsx"
    ];
    const wordsLibraryRoutes = [
      "app/(workspace)/(shared-zone)/words/loading.tsx",
      "app/(workspace)/(shared-zone)/words/review/loading.tsx",
      "app/(workspace)/(shared-zone)/words/new/loading.tsx",
      "app/(workspace)/(shared-zone)/words/difficult/loading.tsx",
      "app/(workspace)/(shared-zone)/words/topics/[topicSlug]/loading.tsx"
    ];

    expect(inventory).toContain("`/settings/payments`");
    expect(inventory).toContain("no longer uses `WorkspaceSettingsLoadingSkeleton`");
    expect(paymentLoading).toContain("WorkspaceStudentPaymentsLoadingSkeleton");
    expect(paymentLoading).not.toContain("WorkspaceSettingsLoadingSkeleton");

    for (const path of homeworkListRoutes) {
      expect(readProjectFile(path)).toContain("WorkspaceHomeworkListLoadingSkeleton");
    }
    expect(readProjectFile("app/(workspace)/(shared-zone)/homework/[id]/loading.tsx")).toContain("WorkspaceHomeworkDetailLoadingSkeleton");
    expect(readProjectFile("app/(workspace)/(shared-zone)/homework/[id]/loading.tsx")).not.toContain("WorkspaceHomeworkListLoadingSkeleton");

    for (const path of wordsLibraryRoutes) {
      expect(readProjectFile(path)).toContain("WorkspaceWordsLibraryLoadingSkeleton");
    }
    expect(readProjectFile("app/(workspace)/(shared-zone)/words/train/loading.tsx")).toContain("WorkspaceWordsTrainerLoadingSkeleton");
    expect(readProjectFile("app/(workspace)/(shared-zone)/words/train/loading.tsx")).not.toContain("WorkspaceWordsLibraryLoadingSkeleton");
  });

  it("keeps public article loading owned by blog skeletons instead of workspace skeletons", () => {
    const articleListLoading = readProjectFile("app/(public)/articles/loading.tsx");
    const articleDetailLoading = readProjectFile("app/(public)/articles/[slug]/loading.tsx");

    expect(articleListLoading).toContain("PublicArticlesListLoadingSkeleton");
    expect(articleDetailLoading).toContain("PublicArticleDetailLoadingSkeleton");
    expect(articleListLoading).toContain("features/blog/components/loading/blog-loading-skeletons");
    expect(articleDetailLoading).toContain("features/blog/components/loading/blog-loading-skeletons");
    expect(articleListLoading).not.toContain("workspace-loading-skeletons");
    expect(articleDetailLoading).not.toContain("workspace-loading-skeletons");
  });

  it("keeps practice route loading files mapped to practice-specific skeletons", () => {
    const inventory = readProjectFile("docs/loading-screen-inventory.md");
    const practiceLibraryRoutes = [
      "app/(workspace)/(shared-zone)/practice/catalog/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/recommended/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/favorites/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/mistakes/loading.tsx"
    ];
    const practiceTopicRoutes = [
      "app/(workspace)/(shared-zone)/practice/topics/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/topics/[topic]/loading.tsx",
      "app/(workspace)/(shared-zone)/practice/topics/[topic]/[subtopic]/loading.tsx"
    ];
    const practiceActivityLoading = readProjectFile("app/(workspace)/(shared-zone)/practice/activity/[activityId]/loading.tsx");

    expect(inventory).toContain("PR-SKEL-2B note");
    expect(inventory).toContain("`/practice/favorites`");
    expect(inventory).toContain("`/practice/mistakes`");
    expect(readProjectFile("app/(workspace)/(shared-zone)/practice/loading.tsx")).toContain("WorkspacePracticeOverviewLoadingSkeleton");

    for (const path of practiceLibraryRoutes) {
      expect(readProjectFile(path)).toContain("WorkspacePracticeLibraryLoadingSkeleton");
    }

    for (const path of practiceTopicRoutes) {
      expect(readProjectFile(path)).toContain("WorkspacePracticeTopicLoadingSkeleton");
    }

    expect(practiceActivityLoading).toContain("WorkspacePracticeActivityLoadingSkeleton");
    expect(practiceActivityLoading).not.toContain("WorkspacePracticeLibraryLoadingSkeleton");
    expect(practiceActivityLoading).not.toContain("WorkspacePracticeTopicLoadingSkeleton");
  });

  it("keeps admin route loading files mapped to admin-specific skeletons", () => {
    const inventory = readProjectFile("docs/loading-screen-inventory.md");
    const adminDirectoryRoutes = [
      "app/(workspace)/(staff-zone)/admin/students/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/teachers/loading.tsx"
    ];
    const adminProfileRoutes = [
      "app/(workspace)/(staff-zone)/admin/students/[studentId]/loading.tsx",
      "app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/loading.tsx"
    ];
    const adminPaymentsLoading = readProjectFile("app/(workspace)/(staff-zone)/admin/payments/loading.tsx");

    expect(inventory).toContain("PR-SKEL-2C note");
    expect(inventory).toContain("no longer inherit the generic `WorkspaceAdminLoadingSkeleton`");

    for (const path of adminDirectoryRoutes) {
      expect(readProjectFile(path)).toContain("WorkspaceAdminDirectoryLoadingSkeleton");
      expect(readProjectFile(path)).not.toContain("WorkspaceAdminLoadingSkeleton");
    }

    for (const path of adminProfileRoutes) {
      expect(readProjectFile(path)).toContain("WorkspaceAdminProfileLoadingSkeleton");
      expect(readProjectFile(path)).not.toContain("WorkspaceAdminLoadingSkeleton");
    }

    expect(adminPaymentsLoading).toContain("WorkspaceAdminPaymentsLoadingSkeleton");
    expect(adminPaymentsLoading).not.toContain("WorkspaceAdminLoadingSkeleton");
  });

  it("keeps hybrid search loading mapped to the search skeleton without route-group ownership", () => {
    const inventory = readProjectFile("docs/loading-screen-inventory.md");
    const searchRouteLoading = readProjectFile("app/search/loading.tsx");
    const searchRoute = readProjectFile("features/search/server/search-route.tsx");

    expect(inventory).toContain("PR-SKEL-2D note");
    expect(inventory).toContain("shell-preserving inner Suspense fallback");
    expect(searchRouteLoading).toContain("SearchPageLoadingSkeleton");
    expect(searchRouteLoading).not.toMatch(/workspace-loading-skeletons|Workspace(Admin|Dashboard|Settings|Search)/);
    expect(searchRouteLoading).not.toMatch(/WorkspaceShell|@\/lib\/auth|@\/lib\/permissions|@\/lib\/supabase|search-service/);
    expect(searchRoute).toContain("Suspense");
    expect(searchRoute).toContain("SearchPageLoadingSkeleton");
    expect(fileExists("app/(workspace)/(search-zone)/loading.tsx")).toBe(false);
  });

  it("keeps existing route loading files imported from the shared presentational module", () => {
    const loadingFiles = collectFiles("app").filter((path) => path.endsWith("/loading.tsx") || path === "app/loading.tsx");
    const workspaceRouteLoadingFiles = loadingFiles.filter((path) => path.startsWith("app/(workspace)/") && path !== "app/(workspace)/loading.tsx");

    for (const path of workspaceRouteLoadingFiles) {
      const source = readProjectFile(path);

      expect(source).toContain("workspace-loading-skeletons");
      expect(source).not.toContain("WorkspaceShell");
      expect(source).not.toMatch(/requirePermission|requireWorkspaceRouteAccess|requireLayoutActor/);
    }
  });
});
