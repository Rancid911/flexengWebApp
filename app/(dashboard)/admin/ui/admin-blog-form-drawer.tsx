"use client";

import { AdminDrawer } from "@/app/(dashboard)/admin/ui/admin-drawer";
import type { BlogCategoryDto } from "@/lib/admin/types";
import type { BlogPostForm } from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  title: string;
  form: BlogPostForm;
  categories: BlogCategoryDto[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<BlogPostForm>>;
  submitLabel: string;
};

export function AdminBlogFormDrawer({ open, title, form, categories, onClose, onSubmit, setForm, submitLabel }: Props) {
  return (
    <AdminDrawer open={open} onClose={onClose} title={title} widthClass="max-w-[76rem]">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Заголовок</label>
            <Input
              data-testid="admin-blog-title-input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Slug</label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="если пусто, сгенерируется из заголовка" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm text-muted-foreground">Лид (excerpt)</label>
            <Input value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm text-muted-foreground">Контент</label>
            <textarea
              data-testid="admin-blog-content-input"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Обложка URL</label>
            <Input value={form.cover_image_url} onChange={(event) => setForm((prev) => ({ ...prev, cover_image_url: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Автор</label>
            <Input value={form.author_name} onChange={(event) => setForm((prev) => ({ ...prev, author_name: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Статус</label>
            <select
              data-testid="admin-blog-status-select"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "published" }))}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Дата публикации</label>
            <DateField value={form.published_at} onChange={(value) => setForm((prev) => ({ ...prev, published_at: value }))} placeholder="Выберите дату" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Категория</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.category_id}
              onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Новая категория (приоритет)</label>
            <Input
              value={form.category_name}
              onChange={(event) => setForm((prev) => ({ ...prev, category_name: event.target.value }))}
              placeholder="например: Грамматика для начинающих"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Теги (через запятую)</label>
            <Input value={form.tag_names} onChange={(event) => setForm((prev) => ({ ...prev, tag_names: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Время чтения (мин)</label>
            <Input value={form.reading_time_min} onChange={(event) => setForm((prev) => ({ ...prev, reading_time_min: event.target.value }))} type="number" min={1} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Просмотры</label>
            <Input value={form.views_count} onChange={(event) => setForm((prev) => ({ ...prev, views_count: event.target.value }))} type="number" min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">SEO title</label>
            <Input value={form.seo_title} onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm text-muted-foreground">SEO description</label>
            <Input value={form.seo_description} onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))} />
          </div>
        </div>

        <Button data-testid="admin-blog-submit" type="submit">
          {submitLabel}
        </Button>
      </form>
    </AdminDrawer>
  );
}
