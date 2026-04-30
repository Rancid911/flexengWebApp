"use client";

import { useCallback, useRef, useState } from "react";

import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import type { BlogCategoryDto } from "@/lib/admin/types";

export function useAdminBlogMeta() {
  const [blogCategories, setBlogCategories] = useState<BlogCategoryDto[]>([]);
  const blogMetaLoadedRef = useRef(false);

  const loadBlogMeta = useCallback(async (force = false) => {
    if (blogMetaLoadedRef.current && !force) return;
    const categories = await fetchJson<BlogCategoryDto[]>("/api/admin/blog/categories");
    setBlogCategories(categories);
    blogMetaLoadedRef.current = true;
  }, []);

  return {
    blogCategories,
    loadBlogMeta
  };
}
