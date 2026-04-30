"use client";

import { useCallback, type FormEvent } from "react";

import { defaultBlogPostForm, type BlogPostForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { BlogPostFormSetter, DataDeps, RefreshDeps } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-action-types";
import { fetchJson, slugify } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { useAdminActionRunner } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-action-runner";
import type { BlogPostDetailDto } from "@/lib/admin/types";
import { dateToIsoWithCurrentTime } from "@/lib/date-utils";

export function useAdminBlogPostsActions({
  editingBlogPost,
  refresh,
  data,
  setActionError,
  setBlogPostForm,
  setBlogPostsDrawerOpen,
  setEditingBlogPost
}: {
  editingBlogPost: BlogPostDetailDto | null;
  refresh: Pick<RefreshDeps, "blogPage" | "blogPageCount" | "blogQuery" | "prefetchNeighbors">;
  data: Pick<DataDeps, "invalidateCacheForQuery" | "loadBlogMeta" | "loadBlogPageData">;
  setActionError: (value: string) => void;
  setBlogPostForm: BlogPostFormSetter;
  setBlogPostsDrawerOpen: (value: boolean) => void;
  setEditingBlogPost: (value: BlogPostDetailDto | null) => void;
}) {
  const { runWithActionError } = useAdminActionRunner(setActionError);
  const openCreateBlogPostDrawer = useCallback(() => {
    setEditingBlogPost(null);
    setBlogPostForm(defaultBlogPostForm);
    setBlogPostsDrawerOpen(true);
  }, [setBlogPostForm, setBlogPostsDrawerOpen, setEditingBlogPost]);

  const startEditingBlogPost = useCallback(
    (item: BlogPostDetailDto, nextForm: BlogPostForm) => {
      setEditingBlogPost(item);
      setBlogPostForm(nextForm);
      setBlogPostsDrawerOpen(true);
    },
    [setBlogPostForm, setBlogPostsDrawerOpen, setEditingBlogPost]
  );

  const submitBlogPost = useCallback(
    async (event: FormEvent, blogPostForm: BlogPostForm) => {
      event.preventDefault();
      await runWithActionError({
        fallbackMessage: "Не удалось сохранить статью",
        action: async () => {
          const payload = {
            slug: slugify(blogPostForm.slug || blogPostForm.title),
            title: blogPostForm.title.trim(),
            excerpt: blogPostForm.excerpt.trim() || null,
            content: blogPostForm.content,
            cover_image_url: blogPostForm.cover_image_url.trim() || null,
            status: blogPostForm.status,
            published_at: dateToIsoWithCurrentTime(blogPostForm.published_at),
            author_name: blogPostForm.author_name.trim() || null,
            category_id: blogPostForm.category_id || null,
            category_name: blogPostForm.category_name.trim() || null,
            reading_time_min: blogPostForm.reading_time_min ? Number(blogPostForm.reading_time_min) : null,
            views_count: Number(blogPostForm.views_count || "0"),
            seo_title: blogPostForm.seo_title.trim() || null,
            seo_description: blogPostForm.seo_description.trim() || null,
            tag_names: blogPostForm.tag_names.split(",").map((item) => item.trim()).filter(Boolean)
          };

          if (editingBlogPost) {
            await fetchJson(`/api/admin/blog/posts/${editingBlogPost.id}`, { method: "PATCH", body: JSON.stringify(payload) });
          } else {
            await fetchJson("/api/admin/blog/posts", { method: "POST", body: JSON.stringify(payload) });
          }

          setBlogPostsDrawerOpen(false);
          setEditingBlogPost(null);
          setBlogPostForm(defaultBlogPostForm);
          await data.loadBlogMeta(true);
          data.invalidateCacheForQuery("blog", refresh.blogQuery);
          await data.loadBlogPageData(refresh.blogPage, refresh.blogQuery, { revalidate: true });
          refresh.prefetchNeighbors("blog", refresh.blogPage, refresh.blogPageCount, refresh.blogQuery);
        }
      });
    },
    [data, editingBlogPost, refresh, runWithActionError, setBlogPostForm, setBlogPostsDrawerOpen, setEditingBlogPost]
  );

  const deleteBlogPost = useCallback(
    async (id: string) => {
      if (!window.confirm("Удалить статью?")) return;
      await runWithActionError({
        fallbackMessage: "Не удалось удалить статью",
        action: async () => {
          await fetchJson(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
          data.invalidateCacheForQuery("blog", refresh.blogQuery);
          await data.loadBlogPageData(refresh.blogPage, refresh.blogQuery, { revalidate: true });
          refresh.prefetchNeighbors("blog", refresh.blogPage, refresh.blogPageCount, refresh.blogQuery);
        }
      });
    },
    [data, refresh, runWithActionError]
  );

  return { deleteBlogPost, openCreateBlogPostDrawer, startEditingBlogPost, submitBlogPost };
}
