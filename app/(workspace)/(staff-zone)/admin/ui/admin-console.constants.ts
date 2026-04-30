import type { AdminUserRole, NotificationTargetRole, NotificationType } from "@/lib/admin/types";
import type { PlacementBandKey } from "@/lib/practice/placement";
import type { PaginatedResponse } from "@/lib/admin/types";

export type TabId = "tests" | "users" | "blog" | "notifications";

export const PAGE_SIZE = 5;
export const SEARCH_DEBOUNCE_MS = 400;
export const CACHE_TTL_MS = 5 * 60 * 1000;
export const BACKGROUND_PREFETCH_CONCURRENCY = 2;

export type TestQuestionOptionForm = {
  clientId: string;
  id?: string;
  optionText: string;
  isCorrect: boolean;
};

export type TestQuestionForm = {
  clientId: string;
  id?: string;
  prompt: string;
  explanation: string;
  placementBand: "" | PlacementBandKey;
  options: [TestQuestionOptionForm, TestQuestionOptionForm, TestQuestionOptionForm, TestQuestionOptionForm];
};

export type TestsForm = {
  activity_type: "trainer" | "test";
  assessment_kind: "regular" | "placement";
  title: string;
  description: string;
  lesson_id: string;
  module_id: string;
  cefr_level: string;
  drill_topic_key: string;
  drill_kind: "" | "grammar" | "vocabulary" | "mixed";
  scoring_profile: string;
  lesson_reinforcement: boolean;
  sort_order: string;
  passing_score: string;
  time_limit_minutes: string;
  is_published: boolean;
  has_attempts: boolean;
  questions: TestQuestionForm[];
};

export type WordCardItemForm = {
  clientId: string;
  id?: string;
  term: string;
  translation: string;
  example_sentence: string;
  example_translation: string;
};

export type WordCardSetForm = {
  title: string;
  description: string;
  topic_slug: string;
  topic_title: string;
  cefr_level: string;
  sort_order: string;
  is_published: boolean;
  cards: WordCardItemForm[];
};

export type UsersForm = {
  role: AdminUserRole;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  birth_date: string;
  english_level: string;
  target_level: string;
  learning_goal: string;
  notes: string;
  assigned_teacher_id: string;
  billing_mode: "" | "package_lessons" | "per_lesson_price";
  lesson_price_amount: string;
};

export type BlogPostForm = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: "draft" | "published";
  published_at: string;
  author_name: string;
  category_id: string;
  category_name: string;
  reading_time_min: string;
  views_count: string;
  seo_title: string;
  seo_description: string;
  tag_names: string;
};

export type NotificationForm = {
  title: string;
  body: string;
  type: NotificationType;
  target_roles: NotificationTargetRole[];
  is_active: boolean;
  published_at: string;
  expires_at: string;
};

export type CacheEntry<T> = {
  data: PaginatedResponse<T>;
  fetchedAt: number;
};

export type LoadOptions = {
  background?: boolean;
  preferCache?: boolean;
  revalidate?: boolean;
};

function createOption(index: number): TestQuestionOptionForm {
  return {
    clientId: crypto.randomUUID(),
    optionText: "",
    isCorrect: index === 0
  };
}

export function createEmptyQuestionForm(): TestQuestionForm {
  return {
    clientId: crypto.randomUUID(),
    prompt: "",
    explanation: "",
    placementBand: "",
    options: [createOption(0), createOption(1), createOption(2), createOption(3)]
  };
}

export function createDefaultTestsForm(): TestsForm {
  return {
    activity_type: "trainer",
    assessment_kind: "regular",
    title: "",
    description: "",
    lesson_id: "",
    module_id: "",
    cefr_level: "",
    drill_topic_key: "",
    drill_kind: "",
    scoring_profile: "",
    lesson_reinforcement: false,
    sort_order: "",
    passing_score: "70",
    time_limit_minutes: "",
    is_published: false,
    has_attempts: false,
    questions: []
  };
}

export const defaultTestsForm: TestsForm = createDefaultTestsForm();

export function createEmptyWordCardItemForm(): WordCardItemForm {
  return {
    clientId: crypto.randomUUID(),
    term: "",
    translation: "",
    example_sentence: "",
    example_translation: ""
  };
}

export function createDefaultWordCardSetForm(): WordCardSetForm {
  return {
    title: "",
    description: "",
    topic_slug: "",
    topic_title: "",
    cefr_level: "",
    sort_order: "",
    is_published: false,
    cards: Array.from({ length: 5 }, () => createEmptyWordCardItemForm())
  };
}

export const drillKindOptions = [
  { value: "grammar", label: "Грамматика" },
  { value: "vocabulary", label: "Словарь" },
  { value: "mixed", label: "Смешанный" }
] as const;

export const placementBandOptions: Array<{ value: PlacementBandKey; label: string }> = [
  { value: "beginner", label: "Начальный" },
  { value: "elementary", label: "Элементарный" },
  { value: "pre_intermediate", label: "Pre-Intermediate" },
  { value: "intermediate", label: "Intermediate" },
  { value: "upper_intermediate", label: "Upper-Intermediate" },
  { value: "advanced", label: "Продвинутый" }
];

export const defaultUsersForm: UsersForm = {
  role: "student",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "+7 ",
  birth_date: "",
  english_level: "",
  target_level: "",
  learning_goal: "",
  notes: "",
  assigned_teacher_id: "",
  billing_mode: "",
  lesson_price_amount: ""
};

export const defaultBlogPostForm: BlogPostForm = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  status: "draft",
  published_at: "",
  author_name: "",
  category_id: "",
  category_name: "",
  reading_time_min: "",
  views_count: "0",
  seo_title: "",
  seo_description: "",
  tag_names: ""
};

export const defaultNotificationForm: NotificationForm = {
  title: "",
  body: "",
  type: "update",
  target_roles: ["all"],
  is_active: true,
  published_at: "",
  expires_at: ""
};

export const englishLevelOptions = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper-Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficiency" }
] as const;

export const roleOptions: Array<{ value: AdminUserRole; label: string }> = [
  { value: "student", label: "Студент" },
  { value: "teacher", label: "Преподаватель" },
  { value: "manager", label: "Менеджер" },
  { value: "admin", label: "Администратор" }
];

export function getRoleLabel(role: AdminUserRole | "all"): string {
  if (role === "all") return "Все роли";
  const option = roleOptions.find((item) => item.value === role);
  return option?.label ?? role;
}

export const notificationTypeOptions: Array<{ value: NotificationType; label: string }> = [
  { value: "maintenance", label: "Техработы" },
  { value: "update", label: "Обновления" },
  { value: "news", label: "Новости" },
  { value: "assignments", label: "Задания" }
];

export function getNotificationTypeLabel(type: NotificationType): string {
  const option = notificationTypeOptions.find((item) => item.value === type);
  return option?.label ?? type;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
