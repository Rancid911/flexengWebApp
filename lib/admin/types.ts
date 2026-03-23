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
  lesson_id: string | null;
  module_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminUserRole = "student" | "teacher" | "admin" | "manager";

export type AdminUserDto = {
  id: string;
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
  created_at: string | null;
};

export type AdminActor = {
  userId: string;
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
