import { createAdminClient } from "@/lib/supabase/admin";

export type AdminBlogRepositoryClient = ReturnType<typeof createAdminClient>;

export const BLOG_POST_SELECT =
  "id, slug, title, excerpt, content, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, seo_title, seo_description, created_at, updated_at";

export const BLOG_CATEGORY_SELECT = "id, slug, name, sort_order, is_active";
export const BLOG_TAG_SELECT = "id, slug, name";

export function createAdminBlogRepository(client: AdminBlogRepositoryClient = createAdminClient()) {
  return {
    listPosts(params: { from: number; to: number; q?: string | null }) {
      let query = client
        .from("blog_posts")
        .select(BLOG_POST_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(params.from, params.to);

      if (params.q) query = query.or(`title.ilike.%${params.q}%,excerpt.ilike.%${params.q}%,slug.ilike.%${params.q}%`);
      return query;
    },

    loadPostById(id: string, select = "*") {
      return client.from("blog_posts").select(select).eq("id", id).maybeSingle();
    },

    loadPostByIdRequired(id: string, select = "*") {
      return client.from("blog_posts").select(select).eq("id", id).single();
    },

    createPost(payload: Record<string, unknown>) {
      return client.from("blog_posts").insert(payload).select("*").single();
    },

    updatePost(id: string, patch: Record<string, unknown>) {
      return client.from("blog_posts").update(patch).eq("id", id);
    },

    deletePost(id: string) {
      return client.from("blog_posts").delete().eq("id", id);
    },

    listCategories() {
      return client.from("blog_categories").select(BLOG_CATEGORY_SELECT).order("sort_order", { ascending: true });
    },

    loadCategoriesByIds(categoryIds: string[]) {
      return client.from("blog_categories").select(BLOG_CATEGORY_SELECT).in("id", categoryIds);
    },

    loadCategoryById(id: string, select = "*") {
      return client.from("blog_categories").select(select).eq("id", id).maybeSingle();
    },

    loadCategoryBySlug(slug: string) {
      return client.from("blog_categories").select("id").eq("slug", slug).maybeSingle();
    },

    loadCategoryByName(name: string) {
      return client.from("blog_categories").select("id").ilike("name", name).limit(1).maybeSingle();
    },

    createCategory(payload: Record<string, unknown>, select = BLOG_CATEGORY_SELECT) {
      return client.from("blog_categories").insert(payload).select(select).single();
    },

    updateCategory(id: string, patch: Record<string, unknown>, select = BLOG_CATEGORY_SELECT) {
      return client.from("blog_categories").update(patch).eq("id", id).select(select).single();
    },

    deleteCategory(id: string) {
      return client.from("blog_categories").delete().eq("id", id);
    },

    listTags() {
      return client.from("blog_tags").select(BLOG_TAG_SELECT).order("name", { ascending: true });
    },

    loadTagsByIds(tagIds: string[]) {
      return client.from("blog_tags").select(BLOG_TAG_SELECT).in("id", tagIds);
    },

    loadTagsBySlugs(slugs: string[], select = BLOG_TAG_SELECT) {
      return client.from("blog_tags").select(select).in("slug", slugs);
    },

    loadTagById(id: string, select = "*") {
      return client.from("blog_tags").select(select).eq("id", id).maybeSingle();
    },

    createTags(payload: Array<Record<string, unknown>>) {
      return client.from("blog_tags").insert(payload);
    },

    createTag(payload: Record<string, unknown>, select = BLOG_TAG_SELECT) {
      return client.from("blog_tags").insert(payload).select(select).single();
    },

    updateTag(id: string, patch: Record<string, unknown>, select = BLOG_TAG_SELECT) {
      return client.from("blog_tags").update(patch).eq("id", id).select(select).single();
    },

    deleteTag(id: string) {
      return client.from("blog_tags").delete().eq("id", id);
    },

    loadPostTagRelations(postIds: string[]) {
      return client.from("blog_post_tags").select("post_id, tag_id").in("post_id", postIds);
    },

    createPostTagRelations(relations: Array<{ post_id: string; tag_id: string }>) {
      return client.from("blog_post_tags").insert(relations);
    },

    deletePostTagRelations(postId: string) {
      return client.from("blog_post_tags").delete().eq("post_id", postId);
    }
  };
}
