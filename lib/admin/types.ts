import type { StudentBillingMode } from "@/lib/billing/types";

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminTestDto = {
  id: string;
  material_type?: "test" | "word_cards";
  lesson_id: string | null;
  module_id: string | null;
  activity_type: "trainer" | "test";
  assessment_kind: "regular" | "placement";
  title: string;
  description: string | null;
  cefr_level: string | null;
  drill_topic_key: string | null;
  drill_kind: "grammar" | "vocabulary" | "mixed" | null;
  scoring_profile: Record<string, unknown> | null;
  lesson_reinforcement: boolean;
  sort_order: number;
  passing_score: number;
  time_limit_minutes: number | null;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
  card_count?: number;
  topic_title?: string | null;
};

export type AdminTestQuestionOptionDto = {
  id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
};

export type AdminTestQuestionDto = {
  id: string;
  prompt: string;
  explanation: string | null;
  question_type: "single_choice";
  placement_band: "beginner" | "elementary" | "pre_intermediate" | "intermediate" | "upper_intermediate" | "advanced" | null;
  sort_order: number;
  options: AdminTestQuestionOptionDto[];
};

export type AdminTestDetailDto = AdminTestDto & {
  has_attempts: boolean;
  questions: AdminTestQuestionDto[];
};

export type AdminWordCardItemDto = {
  id: string;
  term: string;
  translation: string;
  example_sentence: string;
  example_translation: string;
  sort_order: number;
};

export type AdminWordCardSetDto = {
  id: string;
  material_type: "word_cards";
  title: string;
  description: string | null;
  topic_slug: string;
  topic_title: string;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1";
  sort_order: number;
  is_published: boolean;
  card_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminWordCardSetDetailDto = AdminWordCardSetDto & {
  cards: AdminWordCardItemDto[];
};

export type AdminUserRole = "student" | "teacher" | "admin" | "manager";

export type AdminUserDto = {
  id: string;
  student_id: string | null;
  assigned_teacher_id: string | null;
  assigned_teacher_name: string | null;
  role: AdminUserRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  english_level: string | null;
  target_level: string | null;
  learning_goal: string | null;
  notes: string | null;
  billing_mode: StudentBillingMode | null;
  lesson_price_amount: number | null;
  billing_currency: string | null;
  billing_balance_label: string | null;
  billing_debt_label: string | null;
  billing_is_negative: boolean;
  created_at: string | null;
};

export type TeacherOptionDto = {
  id: string;
  label: string;
};

export type CourseModuleOptionDto = {
  id: string;
  label: string;
  courseTitle: string;
  moduleTitle: string;
  isPublished: boolean;
};

export type CourseOptionDto = {
  id: string;
  label: string;
  title: string;
  isPublished: boolean;
};

export type AdminActor = {
  userId: string;
  role: "admin" | "manager";
};

export type AdminPaymentControlFilter = "all" | "attention" | "debt" | "one_lesson" | "unconfigured";

export type AdminPaymentControlDto = {
  student_id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  billing_mode: StudentBillingMode | null;
  available_lesson_count: number;
  debt_lesson_count: number;
  debt_money_amount: number;
  money_remainder_amount: number;
  lesson_price_amount: number | null;
  effective_lesson_price_amount: number | null;
  billing_currency: string;
  billing_not_configured: boolean;
  requires_attention: boolean;
  billing_is_negative: boolean;
  balance_label: string | null;
  debt_label: string | null;
};

export type AdminPaymentControlStatsDto = {
  total_students: number;
  attention_students: number;
  debt_students: number;
  one_lesson_left_students: number;
  unconfigured_students: number;
};

export type AdminPaymentControlResponse = PaginatedResponse<AdminPaymentControlDto> & {
  stats: AdminPaymentControlStatsDto;
};

export type AdminPaymentReminderSettingsDto = {
  enabled: boolean;
  threshold_lessons: number;
  updated_at: string | null;
};

export type AdminDashboardMetricsDto = {
  revenue_month: number;
  new_payments_7d: number;
  active_students_7d: number;
  active_teachers_7d: number;
  avg_check_month: number;
  currency: string;
};

export type NotificationType = "maintenance" | "update" | "news" | "assignments";

export type NotificationTargetRole = "all" | AdminUserRole;

export type AdminNotificationDto = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_active: boolean;
  target_roles: NotificationTargetRole[];
  published_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UserNotificationDto = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  published_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  is_read: boolean;
};

export type BlogPostStatus = "draft" | "published";

export type BlogCategoryDto = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type BlogTagDto = {
  id: string;
  slug: string;
  name: string;
};

export type BlogPostCardDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: BlogPostStatus;
  author_name: string | null;
  reading_time_min: number | null;
  views_count: number;
  published_at: string | null;
  created_at: string | null;
  category: BlogCategoryDto | null;
  tags: BlogTagDto[];
};

export type BlogPostDetailDto = BlogPostCardDto & {
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string | null;
};
