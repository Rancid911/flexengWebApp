import { z } from "zod";

const roleEnum = z.enum(["admin", "manager", "teacher", "student"]);

const nullableString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value == null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max).nullable().optional()
  );

const nullableDateString = z.preprocess(
  (value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
);

const nullableUrlString = z.preprocess(
  (value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().url().nullable().optional()
);

const ruPhoneString = z.string().trim().regex(/^\+7\d{10}$/, "phone must match +7XXXXXXXXXX");

export const adminTestCreateSchema = z
  .object({
    lesson_id: z.string().uuid().nullable().optional(),
    module_id: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(200),
    description: nullableString(5000),
    passing_score: z.number().int().min(0).max(100).optional().default(70),
    time_limit_minutes: z.number().int().positive().nullable().optional(),
    is_published: z.boolean().optional().default(false)
  })
  .strict();

export const adminTestUpdateSchema = adminTestCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const adminUserCreateSchema = z
  .object({
    role: roleEnum,
    first_name: z.string().trim().min(1).max(200),
    last_name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    phone: ruPhoneString,
    birth_date: nullableDateString,
    english_level: nullableString(150),
    target_level: nullableString(150),
    learning_goal: nullableString(5000),
    notes: nullableString(10000)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.role !== "student") return;

    if (!value.birth_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "birth_date is required for student", path: ["birth_date"] });
    }
    if (!value.english_level) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "english_level is required for student", path: ["english_level"] });
    }
    if (!value.target_level) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "target_level is required for student", path: ["target_level"] });
    }
    if (!value.learning_goal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "learning_goal is required for student", path: ["learning_goal"] });
    }
  });

export const adminUserUpdateSchema = z
  .object({
    first_name: z.string().trim().min(1).max(200).optional(),
    last_name: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    password: z.string().min(8).max(128).nullable().optional(),
    phone: ruPhoneString.optional(),
    birth_date: nullableDateString,
    english_level: nullableString(150),
    target_level: nullableString(150),
    learning_goal: nullableString(5000),
    notes: nullableString(10000)
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const blogCategoryCreateSchema = z
  .object({
    slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
    name: z.string().trim().min(1).max(120),
    sort_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true)
  })
  .strict();

export const blogCategoryUpdateSchema = blogCategoryCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const blogTagCreateSchema = z
  .object({
    slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
    name: z.string().trim().min(1).max(120)
  })
  .strict();

export const blogTagUpdateSchema = blogTagCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

const blogStatusEnum = z.enum(["draft", "published"]);

export const blogPostCreateSchema = z
  .object({
    slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(1).max(240),
    excerpt: nullableString(1000),
    content: z.string().trim().min(1),
    cover_image_url: nullableUrlString,
    status: blogStatusEnum.optional().default("draft"),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
    author_name: nullableString(140),
    category_id: z.string().uuid().nullable().optional(),
    category_name: nullableString(120),
    reading_time_min: z.number().int().positive().nullable().optional(),
    views_count: z.number().int().min(0).optional().default(0),
    seo_title: nullableString(240),
    seo_description: nullableString(320),
    tag_names: z.array(z.string().trim().min(1).max(80)).optional().default([])
  })
  .strict();

export const blogPostUpdateSchema = blogPostCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});
