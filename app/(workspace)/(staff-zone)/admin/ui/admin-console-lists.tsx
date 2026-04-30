"use client";

import { Button } from "@/components/ui/button";
import type {
  AdminNotificationDto,
  AdminTestDto,
  AdminUserDto,
  BlogPostDetailDto,
  PaginatedResponse
} from "@/lib/admin/types";
import { getNotificationTypeLabel, getRoleLabel, PAGE_SIZE, type BlogPostForm, type NotificationForm, type UsersForm } from "./admin-console.constants";
import { isoToDateOnly } from "@/lib/date-utils";
import { normalizeRuPhoneInput } from "@/lib/phone";

const rowClass =
  "group flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-white px-3 py-1.5 transition-colors hover:border-[#cfd6e4] hover:bg-slate-50/60";
const rowMainClass = "min-w-0 space-y-0.5";
const rowActionsClass = "flex shrink-0 items-center gap-2 self-center";

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SkeletonList({ prefix }: { prefix: string }) {
  return Array.from({ length: PAGE_SIZE }).map((_, index) => (
    <div key={`${prefix}-${index}`} className="h-[76px] animate-pulse rounded-xl border border-border bg-muted/35" />
  ));
}

export function AdminTestsList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete
}: {
  items: PaginatedResponse<AdminTestDto>["items"];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (item: AdminTestDto) => void;
  onDelete: (item: AdminTestDto) => void;
}) {
  if (loading && items.length === 0) return <>{SkeletonList({ prefix: "tests-skeleton" })}</>;
  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {items.map((item) => (
        <div key={item.id} data-testid={`admin-user-row-${item.id}`} className={rowClass}>
          <div className={rowMainClass}>
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="text-xs leading-tight text-muted-foreground">{item.description ?? "—"}</p>
            {item.material_type === "word_cards" ? (
              <>
                <p className="text-xs leading-tight text-muted-foreground">
                  Карточки · CEFR: {item.cefr_level ?? "—"} · тема: {item.topic_title ?? item.drill_topic_key ?? "—"}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">карточек: {item.card_count ?? 0} · статус: {item.is_published ? "опубликовано" : "черновик"}</p>
              </>
            ) : (
              <>
                <p className="text-xs leading-tight text-muted-foreground">
                  {item.assessment_kind === "placement" ? "Placement" : item.activity_type === "trainer" ? "Тренажёр" : "Финальный тест"} · CEFR: {item.cefr_level ?? "—"} · тема: {item.drill_topic_key ?? "—"}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">
                  проходной балл: {item.passing_score}% · лимит: {item.time_limit_minutes ?? "—"} мин · тип тренировки: {item.drill_kind ?? "—"}
                </p>
              </>
            )}
          </div>
          <div className={rowActionsClass}>
            <Button
              data-testid={`admin-user-edit-${item.id}`}
              variant="secondary"
              size="sm"
              onClick={() => onEdit(item)}
              type="button"
            >
              Изменить
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onDelete(item)} type="button">
              Удалить
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminUsersList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete
}: {
  items: PaginatedResponse<AdminUserDto>["items"];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (item: AdminUserDto, nextForm: UsersForm) => void;
  onDelete: (id: string) => void;
}) {
  if (loading && items.length === 0) return <>{SkeletonList({ prefix: "users-skeleton" })}</>;
  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className={rowClass}>
          <div className={rowMainClass}>
            <p className="font-semibold text-foreground">{`${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || `User #${item.id.slice(0, 8)}`}</p>
            <p className="text-xs leading-tight text-muted-foreground">{item.email ?? "—"}</p>
            <p className="text-xs leading-tight text-muted-foreground">Роль: {getRoleLabel(item.role)}</p>
            {item.role === "student" ? (
              <>
                <p className="text-xs leading-tight text-muted-foreground">Уровень: {item.english_level ?? "—"} → {item.target_level ?? "—"}</p>
                <p className="text-xs leading-tight text-muted-foreground">Преподаватель: {item.assigned_teacher_name ?? "—"}</p>
                <p className="text-xs leading-tight text-muted-foreground">
                  Оплата и списания: {item.billing_mode === "package_lessons" ? "пакет уроков" : item.billing_mode === "per_lesson_price" ? "по цене урока" : "не настроено"}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">Доступно уроков: {item.billing_balance_label ?? "Не настроено"}</p>
                {item.billing_debt_label ? <p className="text-xs font-semibold leading-tight text-rose-600">Задолженность: {item.billing_debt_label}</p> : null}
              </>
            ) : null}
          </div>
          <div className={rowActionsClass}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onEdit(item, {
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
                  notes: item.notes ?? "",
                  assigned_teacher_id: item.assigned_teacher_id ?? "",
                  billing_mode: item.billing_mode ?? "",
                  lesson_price_amount: item.lesson_price_amount == null ? "" : String(item.lesson_price_amount)
                })
              }
              type="button"
            >
              Изменить
            </Button>
            <Button data-testid={`admin-user-delete-${item.id}`} variant="secondary" size="sm" onClick={() => onDelete(item.id)} type="button">
              Удалить
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminBlogPostsList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete
}: {
  items: PaginatedResponse<BlogPostDetailDto>["items"];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (item: BlogPostDetailDto, nextForm: BlogPostForm) => void;
  onDelete: (id: string) => void;
}) {
  if (loading && items.length === 0) return <>{SkeletonList({ prefix: "blog-skeleton" })}</>;
  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {items.map((item) => (
        <div key={item.id} data-testid={`admin-blog-row-${item.id}`} className={rowClass}>
          <div className={rowMainClass}>
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="text-xs leading-tight text-muted-foreground">/{item.slug}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {item.status} · {item.category?.name ?? "Без категории"} · {item.reading_time_min ?? 5} мин · {item.views_count} просмотров
            </p>
          </div>
          <div className={rowActionsClass}>
            <Button
              data-testid={`admin-blog-edit-${item.id}`}
              variant="secondary"
              size="sm"
              onClick={() =>
                onEdit(item, {
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
                })
              }
              type="button"
            >
              Изменить
            </Button>
            <Button data-testid={`admin-blog-delete-${item.id}`} variant="secondary" size="sm" onClick={() => onDelete(item.id)} type="button">
              Удалить
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AdminNotificationsList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete
}: {
  items: PaginatedResponse<AdminNotificationDto>["items"];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (item: AdminNotificationDto, nextForm: NotificationForm) => void;
  onDelete: (id: string) => void;
}) {
  if (loading && items.length === 0) return <>{SkeletonList({ prefix: "notifications-skeleton" })}</>;
  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {items.map((item) => (
        <div key={item.id} data-testid={`admin-notification-row-${item.id}`} className={rowClass}>
          <div className={rowMainClass}>
            <p className="truncate font-semibold text-foreground">{item.title}</p>
            <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">{item.body}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {getNotificationTypeLabel(item.type)} · {item.is_active ? "активно" : "выключено"} · роли: {item.target_roles.join(", ")}
            </p>
          </div>
          <div className={rowActionsClass}>
            <Button
              data-testid={`admin-notification-edit-${item.id}`}
              variant="secondary"
              size="sm"
              onClick={() =>
                onEdit(item, {
                  title: item.title,
                  body: item.body,
                  type: item.type,
                  is_active: item.is_active,
                  target_roles: item.target_roles,
                  published_at: toDateTimeLocal(item.published_at),
                  expires_at: toDateTimeLocal(item.expires_at)
                })
              }
              type="button"
            >
              Изменить
            </Button>
            <Button data-testid={`admin-notification-delete-${item.id}`} variant="secondary" size="sm" onClick={() => onDelete(item.id)} type="button">
              Удалить
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}
