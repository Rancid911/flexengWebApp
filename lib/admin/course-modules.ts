import { AdminHttpError } from "@/lib/admin/http";
import type { CourseModuleOptionDto, CourseOptionDto } from "@/lib/admin/types";
import { createAdminClient } from "@/lib/supabase/admin";

function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function loadCourseModuleOptions(supabase: ReturnType<typeof createAdminClient>): Promise<CourseModuleOptionDto[]> {
  const response = await supabase
    .from("course_modules")
    .select("id, title, is_published, courses(title)")
    .order("title", { ascending: true });

  if (response.error) {
    throw new AdminHttpError(500, "COURSE_MODULES_FETCH_FAILED", "Failed to fetch course module options", response.error.message);
  }

  const items = (response.data ?? []) as Array<{
    id: string;
    title?: string | null;
    is_published?: boolean | null;
    courses?: { title?: string | null } | Array<{ title?: string | null }> | null;
  }>;

  return items
    .map((item) => {
      const course = readRelationRecord(item.courses);
      const courseTitle = course?.title?.trim() || "Курс без названия";
      const moduleTitle = item.title?.trim() || "Модуль без названия";
      return {
        id: String(item.id),
        label: `${courseTitle} · ${moduleTitle}`,
        courseTitle,
        moduleTitle,
        isPublished: Boolean(item.is_published)
      };
    })
    .sort((left, right) => {
      const courseCompare = left.courseTitle.localeCompare(right.courseTitle, "ru");
      if (courseCompare !== 0) return courseCompare;
      return left.moduleTitle.localeCompare(right.moduleTitle, "ru");
    });
}

export async function loadCourseOptions(supabase: ReturnType<typeof createAdminClient>): Promise<CourseOptionDto[]> {
  const response = await supabase.from("courses").select("id, title, is_published").order("title", { ascending: true });

  if (response.error) {
    throw new AdminHttpError(500, "COURSES_FETCH_FAILED", "Failed to fetch course options", response.error.message);
  }

  const items = (response.data ?? []) as Array<{
    id: string;
    title?: string | null;
    is_published?: boolean | null;
  }>;

  return items
    .map((item) => {
      const title = item.title?.trim() || "Курс без названия";
      return {
        id: String(item.id),
        label: title,
        title,
        isPublished: Boolean(item.is_published)
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title, "ru"));
}

export async function createCourseModuleOption(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    course_id: string;
    title: string;
    description?: string | null;
    is_published: boolean;
  }
): Promise<CourseModuleOptionDto> {
  const courseResponse = await supabase.from("courses").select("id, title").eq("id", input.course_id).maybeSingle();
  if (courseResponse.error) {
    throw new AdminHttpError(500, "COURSE_FETCH_FAILED", "Failed to fetch course", courseResponse.error.message);
  }
  if (!courseResponse.data) {
    throw new AdminHttpError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  const sortResponse = await supabase
    .from("course_modules")
    .select("sort_order")
    .eq("course_id", input.course_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (sortResponse.error) {
    throw new AdminHttpError(500, "COURSE_MODULE_SORT_ORDER_FETCH_FAILED", "Failed to calculate module sort order", sortResponse.error.message);
  }

  const currentMax = Number(sortResponse.data?.[0]?.sort_order ?? -1);
  const sortOrder = Number.isFinite(currentMax) ? currentMax + 1 : 0;
  const createResponse = await supabase
    .from("course_modules")
    .insert({
      course_id: input.course_id,
      title: input.title,
      description: input.description ?? null,
      sort_order: sortOrder,
      is_published: input.is_published
    })
    .select("id, title, is_published")
    .single();

  if (createResponse.error) {
    throw new AdminHttpError(500, "COURSE_MODULE_CREATE_FAILED", "Failed to create course module", createResponse.error.message);
  }

  const courseTitle = String((courseResponse.data as { title?: string | null }).title ?? "").trim() || "Курс без названия";
  const moduleTitle = String((createResponse.data as { title?: string | null }).title ?? "").trim() || "Модуль без названия";
  return {
    id: String(createResponse.data.id),
    label: `${courseTitle} · ${moduleTitle}`,
    courseTitle,
    moduleTitle,
    isPublished: Boolean(createResponse.data.is_published)
  };
}
