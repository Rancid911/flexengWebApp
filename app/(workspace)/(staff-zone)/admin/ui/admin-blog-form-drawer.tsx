"use client";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import type { BlogCategoryDto } from "@/lib/admin/types";
import type { BlogPostForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
          <FormField label="Заголовок">
            <Input
              data-testid="admin-blog-title-input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Slug">
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="если пусто, сгенерируется из заголовка" />
          </FormField>
          <FormField label="Лид (excerpt)" className="md:col-span-2">
            <Input value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} />
          </FormField>
          <FormField label="Контент" className="md:col-span-2">
            <Textarea
              data-testid="admin-blog-content-input"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              className="min-h-40"
              required
            />
          </FormField>
          <FormField label="Обложка URL">
            <Input value={form.cover_image_url} onChange={(event) => setForm((prev) => ({ ...prev, cover_image_url: event.target.value }))} />
          </FormField>
          <FormField label="Автор">
            <Input value={form.author_name} onChange={(event) => setForm((prev) => ({ ...prev, author_name: event.target.value }))} />
          </FormField>
          <FormField label="Статус">
            <Select
              data-testid="admin-blog-status-select"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "published" }))}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </Select>
          </FormField>
          <FormField label="Дата публикации">
            <DateField value={form.published_at} onChange={(value) => setForm((prev) => ({ ...prev, published_at: value }))} placeholder="Выберите дату" />
          </FormField>
          <FormField label="Категория">
            <Select
              value={form.category_id}
              onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Новая категория (приоритет)">
            <Input
              value={form.category_name}
              onChange={(event) => setForm((prev) => ({ ...prev, category_name: event.target.value }))}
              placeholder="например: Грамматика для начинающих"
            />
          </FormField>
          <FormField label="Теги (через запятую)">
            <Input value={form.tag_names} onChange={(event) => setForm((prev) => ({ ...prev, tag_names: event.target.value }))} />
          </FormField>
          <FormField label="Время чтения (мин)">
            <Input value={form.reading_time_min} onChange={(event) => setForm((prev) => ({ ...prev, reading_time_min: event.target.value }))} type="number" min={1} />
          </FormField>
          <FormField label="Просмотры">
            <Input value={form.views_count} onChange={(event) => setForm((prev) => ({ ...prev, views_count: event.target.value }))} type="number" min={0} />
          </FormField>
          <FormField label="SEO title">
            <Input value={form.seo_title} onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))} />
          </FormField>
          <FormField label="SEO description" className="md:col-span-2">
            <Input value={form.seo_description} onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))} />
          </FormField>
        </div>

        <Button data-testid="admin-blog-submit" type="submit" className={adminPrimaryButtonClassName}>
          {submitLabel}
        </Button>
      </form>
    </AdminDrawer>
  );
}
