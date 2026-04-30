import {
  defineDataLoadingDescriptor,
  type DataLoadingCatalogEntry
} from "@/lib/data-loading/contracts";
import {
  STUDENT_DASHBOARD_CORE_DATA_LOADING,
  STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING,
  type StudentDashboardSummaryBlocks
} from "@/lib/dashboard/student-dashboard";
import {
  STUDENT_PAYMENTS_BILLING_SUMMARY_DATA_LOADING,
  STUDENT_PAYMENTS_LIST_DATA_LOADING,
  STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING,
  STUDENT_PAYMENT_PLANS_DATA_LOADING,
  STUDENT_PAYMENT_STATUS_CONTEXT_DATA_LOADING
} from "@/lib/payments/queries";
import {
  ADMIN_PAYMENT_CONTROL_SETTINGS_DATA_LOADING,
  ADMIN_PAYMENT_CONTROL_SUMMARY_LIST_DATA_LOADING
} from "@/lib/admin/payments-control";
import {
  TEACHER_DASHBOARD_ATTENTION_QUEUE_DATA_LOADING,
  TEACHER_DASHBOARD_DATA_LOADING,
  TEACHER_DASHBOARD_STUDENT_ROSTER_DATA_LOADING,
  TEACHER_DASHBOARD_TODAY_AGENDA_DATA_LOADING,
  TEACHER_LESSON_FOLLOWUP_DATA_LOADING,
  TEACHER_NOTES_MUTATION_DATA_LOADING,
  TEACHER_STUDENT_BILLING_SNAPSHOT_DATA_LOADING,
  TEACHER_STUDENT_HEADER_DATA_LOADING,
  TEACHER_STUDENT_HOMEWORK_MISTAKES_DATA_LOADING,
  TEACHER_STUDENT_LESSONS_DATA_LOADING,
  TEACHER_STUDENT_NOTES_DATA_LOADING,
  TEACHER_STUDENT_PROFILE_DATA_LOADING
} from "@/lib/teacher-workspace/queries";
import {
  SCHEDULE_FILTER_CATALOG_DATA_LOADING,
  SCHEDULE_PAGE_DATA_LOADING,
  STUDENT_SCHEDULE_PREVIEW_DATA_LOADING
} from "@/lib/schedule/queries";
import {
  PROGRESS_HISTORY_DATA_LOADING,
  PROGRESS_OVERVIEW_DATA_LOADING,
  PROGRESS_TOPICS_DATA_LOADING,
  PROGRESS_WEAK_POINTS_DATA_LOADING
} from "@/lib/progress/queries";
import {
  PRACTICE_ACTIVITY_DETAIL_DATA_LOADING,
  PRACTICE_FAVORITES_DATA_LOADING,
  PRACTICE_MISTAKES_DATA_LOADING,
  PRACTICE_OVERVIEW_DATA_LOADING,
  PRACTICE_RECOMMENDATIONS_DATA_LOADING,
  PRACTICE_SUBTOPIC_DETAIL_DATA_LOADING,
  PRACTICE_TOPIC_DETAIL_DATA_LOADING,
  PRACTICE_TOPICS_DATA_LOADING,
  type PracticeOverviewSummary
} from "@/lib/practice/queries";
import {
  HOMEWORK_DETAIL_DATA_LOADING,
  HOMEWORK_LIST_DATA_LOADING,
  HOMEWORK_OVERVIEW_SUMMARY_DATA_LOADING,
  type HomeworkOverviewSummary
} from "@/lib/homework/queries";
import {
  WORDS_LIST_DATA_LOADING,
  WORDS_NEW_LIST_DATA_LOADING,
  WORDS_OVERVIEW_SUMMARY_DATA_LOADING,
  WORDS_REVIEW_QUEUE_DATA_LOADING,
  type WordsOverviewSummary
} from "@/lib/words/queries";

const SETTINGS_PROFILE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "settings-profile",
  owner: "@/app/(workspace)/(shared-zone)/settings/profile/page#ProfileSettingsPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "detail",
  issues: ["mixed_responsibilities"],
  transitional: true,
  notes: ["The page delegates immediately into a large client form and should stay out of layout-level loading."]
});

const ADMIN_CONSOLE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "admin-console",
  owner: "@/app/(workspace)/(staff-zone)/admin/page#AdminPage",
  accessMode: "privileged",
  loadLevel: "page",
  shape: "aggregate",
  issues: ["mixed_responsibilities", "overfetch"],
  transitional: true,
  notes: ["Admin console remains a large client orchestration surface backed by broad resource loaders."]
});

const SEARCH_PAGE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "search-page",
  owner: "@/app/(workspace)/(search-zone)/search/page#SearchPage",
  accessMode: "aggregate",
  loadLevel: "page",
  shape: "list",
  issues: [],
  notes: ["Search page is correctly isolated as a dedicated page-level search result loader."]
});

const STUDENT_DASHBOARD_ENTRY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-dashboard-entry",
  owner: "@/app/(workspace)/(student-zone)/student-dashboard/page#AdminStudentDashboardPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Good narrow-loader composition example: page summary plus a separate reminder section companion."]
});

const LEARNING_ROUTE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "learning-route",
  owner: "@/app/(workspace)/(student-zone)/learning/page#LearningPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "identity",
  issues: [],
  notes: ["Redirect-only student route. No screen data should be introduced here."]
});

const TESTS_ROUTE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "tests-route",
  owner: "@/app/(workspace)/(student-zone)/tests/page#TestsPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "identity",
  issues: [],
  notes: ["Redirect-only placeholder route. Keep data loading on the destination workflow instead."]
});

const ASSIGNMENTS_ROUTE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "assignments-route",
  owner: "@/app/(workspace)/(student-zone)/assignments/page#AssignmentsPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "identity",
  issues: [],
  notes: ["Redirect-only placeholder route. Homework remains the real owner of assignment data."]
});

const FLASHCARDS_ROUTE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "flashcards-route",
  owner: "@/app/(workspace)/(student-zone)/flashcards/page#FlashcardsPage",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "identity",
  issues: [],
  notes: ["Redirect-only placeholder route. Word list/review routes remain the real data owners."]
});

export const DATA_LOADING_CATALOG: DataLoadingCatalogEntry[] = [
  {
    route: "/dashboard",
    pageLoaders: [STUDENT_DASHBOARD_CORE_DATA_LOADING, TEACHER_DASHBOARD_DATA_LOADING],
    sectionLoaders: [
      STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING,
      TEACHER_DASHBOARD_TODAY_AGENDA_DATA_LOADING,
      TEACHER_DASHBOARD_ATTENTION_QUEUE_DATA_LOADING,
      TEACHER_DASHBOARD_STUDENT_ROSTER_DATA_LOADING
    ],
    notes: [
      "Student dashboard follows the preferred pattern: page summary + independent section loader.",
      "Teacher dashboard preferred path is section assembly from today agenda, week agenda and roster summary loaders.",
      "Teacher dashboard critical render is today agenda plus follow-up attention; student roster remains a secondary section."
    ]
  },
  {
    route: "/student-dashboard",
    pageLoaders: [STUDENT_DASHBOARD_ENTRY_DATA_LOADING],
    sectionLoaders: [STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING],
    notes: ["Dedicated student dashboard route is the second canonical example of page summary plus section companion loading."]
  },
  {
    route: "/schedule",
    pageLoaders: [SCHEDULE_PAGE_DATA_LOADING],
    sectionLoaders: [SCHEDULE_FILTER_CATALOG_DATA_LOADING, STUDENT_SCHEDULE_PREVIEW_DATA_LOADING, TEACHER_LESSON_FOLLOWUP_DATA_LOADING],
    notes: [
      "Schedule page loader is a transitional aggregate composition root.",
      "Filter catalog and preview loaders are the future boundary anchors for section extraction.",
      "Teacher follow-up interaction is a distinct teacher-workspace section and should not expand the page aggregate."
    ]
  },
  {
    route: "/admin/payments",
    pageLoaders: [ADMIN_PAYMENT_CONTROL_SUMMARY_LIST_DATA_LOADING, ADMIN_PAYMENT_CONTROL_SETTINGS_DATA_LOADING],
    notes: ["Admin payments control is already summary-first and should keep row detail out of the page list path."]
  },
  {
    route: "/settings/payments",
    pageLoaders: [
      STUDENT_PAYMENTS_LIST_DATA_LOADING,
      STUDENT_PAYMENTS_BILLING_SUMMARY_DATA_LOADING,
      STUDENT_PAYMENT_PLANS_DATA_LOADING,
      STUDENT_PAYMENT_STATUS_CONTEXT_DATA_LOADING
    ],
    sectionLoaders: [STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING],
    notes: [
      "Page should compose narrow loaders with Promise.all.",
      "The wrapper stays only as a compatibility path for consumers like /api/payments."
    ]
  },
  {
    route: "/students/[studentId]",
    pageLoaders: [TEACHER_STUDENT_PROFILE_DATA_LOADING],
    sectionLoaders: [
      TEACHER_STUDENT_HEADER_DATA_LOADING,
      TEACHER_STUDENT_NOTES_DATA_LOADING,
      TEACHER_STUDENT_LESSONS_DATA_LOADING,
      TEACHER_STUDENT_HOMEWORK_MISTAKES_DATA_LOADING,
      TEACHER_STUDENT_BILLING_SNAPSHOT_DATA_LOADING,
      TEACHER_NOTES_MUTATION_DATA_LOADING
    ],
    notes: [
      "Teacher student profile preferred path is section assembly; aggregate wrapper remains compatibility-only.",
      "Billing snapshot is a staff-only companion block and must stay separate from teacher-only write flows."
    ]
  },
  {
    route: "/progress/*",
    pageLoaders: [PROGRESS_OVERVIEW_DATA_LOADING, PROGRESS_TOPICS_DATA_LOADING, PROGRESS_HISTORY_DATA_LOADING, PROGRESS_WEAK_POINTS_DATA_LOADING],
    notes: ["Progress overview/topics are the closest current examples of good summary-first user-scoped loading."]
  },
  {
    route: "/practice/*",
    pageLoaders: [PRACTICE_OVERVIEW_DATA_LOADING, PRACTICE_TOPICS_DATA_LOADING, PRACTICE_TOPIC_DETAIL_DATA_LOADING, PRACTICE_SUBTOPIC_DETAIL_DATA_LOADING],
    sectionLoaders: [PRACTICE_RECOMMENDATIONS_DATA_LOADING, PRACTICE_MISTAKES_DATA_LOADING, PRACTICE_FAVORITES_DATA_LOADING, PRACTICE_ACTIVITY_DETAIL_DATA_LOADING],
    notes: ["Practice overview is still transitional, but recommendations, topic catalog and secondary detail surfaces are now explicitly separated."]
  },
  {
    route: "/homework/*",
    pageLoaders: [HOMEWORK_OVERVIEW_SUMMARY_DATA_LOADING, HOMEWORK_LIST_DATA_LOADING],
    sectionLoaders: [HOMEWORK_DETAIL_DATA_LOADING],
    notes: ["Homework list/detail already follows a cleaner list-vs-detail split than schedule or teacher workspace."]
  },
  {
    route: "/settings/profile",
    pageLoaders: [SETTINGS_PROFILE_DATA_LOADING],
    notes: ["Profile settings should keep page ownership and avoid moving form data loading into layouts."]
  },
  {
    route: "/words/*",
    pageLoaders: [WORDS_OVERVIEW_SUMMARY_DATA_LOADING, WORDS_LIST_DATA_LOADING, WORDS_REVIEW_QUEUE_DATA_LOADING, WORDS_NEW_LIST_DATA_LOADING],
    notes: ["Words routes are user-scoped list pages; /words/my is the only one with obvious duplicate list composition."]
  },
  {
    route: "/admin",
    pageLoaders: [ADMIN_CONSOLE_DATA_LOADING],
    notes: ["Admin index remains a transitional aggregate entrypoint until resource tabs are decomposed later."]
  },
  {
    route: "/search",
    pageLoaders: [SEARCH_PAGE_DATA_LOADING],
    notes: ["Search stays page-first and should not leak back into the workspace shell."]
  },
  {
    route: "/learning",
    pageLoaders: [LEARNING_ROUTE_DATA_LOADING],
    notes: ["Learning route is a redirect-only compatibility entrypoint."]
  },
  {
    route: "/tests",
    pageLoaders: [TESTS_ROUTE_DATA_LOADING],
    notes: ["Tests route is a redirect-only placeholder and should stay free of screen-level loading."]
  },
  {
    route: "/assignments",
    pageLoaders: [ASSIGNMENTS_ROUTE_DATA_LOADING],
    notes: ["Assignments route is a redirect-only placeholder and should not become a second homework loader."]
  },
  {
    route: "/flashcards",
    pageLoaders: [FLASHCARDS_ROUTE_DATA_LOADING],
    notes: ["Flashcards route is a redirect-only placeholder and should not grow its own word data path."]
  }
] as const;

export type StudentAreaLoadingCatalogEntry = {
  route: string;
  criticalBlocks: string[];
  secondaryBlocks: string[];
  futureRpcCandidates: string[];
};

export type StudentExperienceContractCatalog = {
  dashboardSummaryBlocks: Array<keyof StudentDashboardSummaryBlocks>;
  practiceOverviewBlocks: Array<keyof PracticeOverviewSummary>;
  homeworkOverviewBlocks: Array<keyof HomeworkOverviewSummary>;
  wordsOverviewBlocks: Array<keyof WordsOverviewSummary>;
  redirectOnlyRoutes: string[];
  routes: StudentAreaLoadingCatalogEntry[];
};

export type TeacherAreaLoadingCatalogEntry = {
  route: string;
  criticalBlocks: string[];
  secondaryBlocks: string[];
  teacherWriteBlocks: string[];
  notes?: string[];
};

export type TeacherExperienceContractCatalog = {
  actorModel: {
    teacherScopeFields: string[];
    staffObserverRules: string[];
  };
  routes: TeacherAreaLoadingCatalogEntry[];
  futureSplitTargets: string[];
};

export const STUDENT_EXPERIENCE_LOADING_CATALOG: StudentExperienceContractCatalog = {
  dashboardSummaryBlocks: [
    "lessonOfTheDay",
    "progress",
    "heroStats",
    "homeworkSummaryPreview",
    "recommendationsSummary",
    "nextBestAction",
    "schedulePreview"
  ],
  practiceOverviewBlocks: ["doNowId", "continueTopicSlug", "weakSpotId"],
  homeworkOverviewBlocks: ["activeCount", "overdueCount", "nearestDueAt", "nearestDueTitle"],
  wordsOverviewBlocks: ["totalWords", "reviewCount", "newCount", "activeCount"],
  redirectOnlyRoutes: ["/learning", "/assignments", "/flashcards", "/tests"],
  routes: [
    {
      route: "/dashboard",
      criticalBlocks: ["student dashboard core summary"],
      secondaryBlocks: ["payment reminder"],
      futureRpcCandidates: ["student_words counts", "progress/test/mistakes summary aggregates"]
    },
    {
      route: "/student-dashboard",
      criticalBlocks: ["student dashboard core summary"],
      secondaryBlocks: ["payment reminder"],
      futureRpcCandidates: ["student_words counts", "progress/test/mistakes summary aggregates"]
    },
    {
      route: "/homework",
      criticalBlocks: ["homework overview summary", "initial list shell"],
      secondaryBlocks: ["homework detail"],
      futureRpcCandidates: ["homework summary counts"]
    },
    {
      route: "/homework/[id]",
      criticalBlocks: ["homework detail header", "assignment detail"],
      secondaryBlocks: [],
      futureRpcCandidates: ["homework detail summary"]
    },
    {
      route: "/practice",
      criticalBlocks: ["do-now recommendation", "continue-topic summary", "weak-spot summary"],
      secondaryBlocks: ["recommendations feed", "mistakes", "favorites", "activity detail"],
      futureRpcCandidates: ["topic progress summary", "recommendation feed aggregate"]
    },
    {
      route: "/practice/recommended",
      criticalBlocks: ["recommendation list"],
      secondaryBlocks: [],
      futureRpcCandidates: ["recommendation feed aggregate"]
    },
    {
      route: "/practice/topics",
      criticalBlocks: ["topics summary"],
      secondaryBlocks: [],
      futureRpcCandidates: ["topic progress summary"]
    },
    {
      route: "/practice/topics/[topic]",
      criticalBlocks: ["topic detail", "subtopic summaries"],
      secondaryBlocks: [],
      futureRpcCandidates: ["topic progress summary"]
    },
    {
      route: "/practice/topics/[topic]/[subtopic]",
      criticalBlocks: ["subtopic detail", "activity list"],
      secondaryBlocks: [],
      futureRpcCandidates: []
    },
    {
      route: "/practice/mistakes",
      criticalBlocks: ["mistakes feed"],
      secondaryBlocks: [],
      futureRpcCandidates: ["weak-spot aggregate"]
    },
    {
      route: "/practice/favorites",
      criticalBlocks: ["favorites feed"],
      secondaryBlocks: [],
      futureRpcCandidates: []
    },
    {
      route: "/practice/activity/[activityId]",
      criticalBlocks: ["activity detail"],
      secondaryBlocks: [],
      futureRpcCandidates: []
    },
    {
      route: "/progress/*",
      criticalBlocks: ["overview summary", "topics summary"],
      secondaryBlocks: ["history", "weak-points"],
      futureRpcCandidates: ["overview aggregate", "weak-points aggregate"]
    },
    {
      route: "/settings/payments",
      criticalBlocks: ["billing summary", "payments list", "payment plans"],
      secondaryBlocks: ["payment status context"],
      futureRpcCandidates: ["user-scoped billing summary", "reminder-state summary"]
    },
    {
      route: "/words/*",
      criticalBlocks: ["words overview summary", "review queue", "new words list"],
      secondaryBlocks: ["full words list"],
      futureRpcCandidates: ["words summary counters"]
    },
    {
      route: "/words/my",
      criticalBlocks: ["words overview summary", "full words list"],
      secondaryBlocks: ["review queue", "new words list"],
      futureRpcCandidates: ["words summary counters"]
    },
    {
      route: "/words/review",
      criticalBlocks: ["review queue"],
      secondaryBlocks: [],
      futureRpcCandidates: []
    },
    {
      route: "/words/new",
      criticalBlocks: ["new words list"],
      secondaryBlocks: [],
      futureRpcCandidates: []
    }
  ]
} as const;

export const TEACHER_EXPERIENCE_LOADING_CATALOG: TeacherExperienceContractCatalog = {
  actorModel: {
    teacherScopeFields: ["teacherId", "accessibleStudentIds"],
    staffObserverRules: [
      "staff readers may read teacher workspace surfaces",
      "staff readers do not inherit teacher-only write capability"
    ]
  },
  routes: [
    {
      route: "/dashboard",
      criticalBlocks: ["today agenda", "follow-up attention queue"],
      secondaryBlocks: ["student roster summary"],
      teacherWriteBlocks: [],
      notes: ["Preferred teacher path: shared weekly lesson bundle + derived sections; compatibility aggregate remains transitional."]
    },
    {
      route: "/schedule",
      criticalBlocks: ["teacher-scoped lesson list", "filter catalog"],
      secondaryBlocks: ["follow-up section"],
      teacherWriteBlocks: ["lesson create/update/cancel", "attendance/outcome/homework follow-up"]
    },
    {
      route: "/students/[studentId]",
      criticalBlocks: ["profile header", "notes feed", "lesson history"],
      secondaryBlocks: ["homework snapshot", "mistakes snapshot", "staff billing snapshot"],
      teacherWriteBlocks: ["teacher notes"]
    }
  ],
  futureSplitTargets: [
    "teacher dashboard lessons summary",
    "teacher dashboard roster summary",
    "teacher student header",
    "teacher notes section",
    "teacher lesson history section",
    "teacher homework and mistakes section"
  ]
} as const;
