import { z } from "zod";

import {
  teacherCertificateOptions,
  teacherEducationLevelOptions,
  teacherEnglishProficiencyOptions,
  teacherInternalRoleOptions,
  teacherLessonDurationOptions,
  teacherLessonTypeOptions,
  teacherCooperationTypeOptions,
  teacherCurrencyOptions,
  teacherSpecializationOptions,
  teacherOperationalStatusOptions,
  teacherTargetAudienceOptions,
  teacherTeachingApproachOptions,
  teacherTeachingMaterialOptions,
  teacherTimezoneOptions,
  teacherWeekdayOptions
} from "@/lib/admin/teacher-dossier-options";

const roleEnum = z.enum(["admin", "manager", "teacher", "student"]);
const billingModeEnum = z.enum(["package_lessons", "per_lesson_price"]);
const notificationTypeEnum = z.enum(["maintenance", "update", "news", "assignments"]);
const notificationTargetRoleEnum = z.enum(["all", "admin", "manager", "teacher", "student"]);
const testActivityTypeEnum = z.enum(["trainer", "test"]);
const testAssessmentKindEnum = z.enum(["regular", "placement"]);
const testLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1"]);
const drillKindEnum = z.enum(["grammar", "vocabulary", "mixed"]);
const placementBandEnum = z.enum(["beginner", "elementary", "pre_intermediate", "intermediate", "upper_intermediate", "advanced"]);

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
const teacherInternalRoleEnum = z.enum(teacherInternalRoleOptions.map((option) => option.value) as ["teacher", "senior_teacher", "methodologist"]);
const teacherTimezoneEnum = z.enum(
  teacherTimezoneOptions.map((option) => option.value) as [
    "Europe/Moscow",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Yerevan",
    "Asia/Tbilisi",
    "Asia/Almaty"
  ]
);
const teacherEnglishProficiencyEnum = z.enum(teacherEnglishProficiencyOptions.map((option) => option.value) as ["B2", "C1", "C2", "native"]);
const teacherSpecializationEnum = z.enum(
  teacherSpecializationOptions.map((option) => option.value) as [
    "general_english",
    "business_english",
    "it_english",
    "exam_preparation",
    "speaking",
    "grammar"
  ]
);
const teacherEducationLevelEnum = z.enum(teacherEducationLevelOptions.map((option) => option.value) as ["higher_linguistic", "higher", "secondary"]);
const teacherCertificateEnum = z.enum(teacherCertificateOptions.map((option) => option.value) as ["none", "ielts", "celta", "tesol", "other"]);
const teacherTargetAudienceEnum = z.enum(
  teacherTargetAudienceOptions.map((option) => option.value) as [
    "adults",
    "children",
    "teenagers",
    "beginners",
    "intermediate",
    "advanced",
    "it_specialists",
    "entrepreneurs",
    "interview_preparation",
    "relocation"
  ]
);
const teacherWeekdayEnum = z.enum(
  teacherWeekdayOptions.map((option) => option.value) as [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]
);
const teacherLessonTypeEnum = z.enum(teacherLessonTypeOptions.map((option) => option.value) as ["individual", "group"]);
const teacherLessonDurationEnum = z.enum(teacherLessonDurationOptions.map((option) => option.value) as ["30", "60", "90"]);
const teacherTeachingApproachEnum = z.enum(
  teacherTeachingApproachOptions.map((option) => option.value) as ["conversational", "grammar", "mixed"]
);
const teacherTeachingMaterialEnum = z.enum(
  teacherTeachingMaterialOptions.map((option) => option.value) as ["own_materials", "textbooks", "platform"]
);
const teacherOperationalStatusEnum = z.enum(teacherOperationalStatusOptions.map((option) => option.value) as ["active", "inactive", "on_vacation"]);
const teacherCooperationTypeEnum = z.enum(teacherCooperationTypeOptions.map((option) => option.value) as ["freelance", "staff"]);
const teacherCurrencyEnum = z.enum(teacherCurrencyOptions.map((option) => option.value) as ["RUB"]);

const adminTestBaseSchema = z
  .object({
    lesson_id: z.string().uuid().nullable().optional(),
    module_id: z.string().uuid().nullable().optional(),
    activity_type: testActivityTypeEnum.optional().default("trainer"),
    assessment_kind: testAssessmentKindEnum.optional().default("regular"),
    title: z.string().trim().min(1).max(200),
    description: nullableString(5000),
    cefr_level: testLevelEnum.nullable().optional(),
    drill_topic_key: nullableString(150),
    drill_kind: drillKindEnum.nullable().optional(),
    scoring_profile: z.record(z.string(), z.unknown()).nullable().optional(),
    lesson_reinforcement: z.boolean().optional().default(false),
    sort_order: z.number().int().min(0).optional(),
    passing_score: z.number().int().min(0).max(100).optional().default(70),
    time_limit_minutes: z.number().int().positive().nullable().optional(),
    is_published: z.boolean().optional().default(false),
    questions: z
      .array(
        z
          .object({
            id: z.string().uuid().optional(),
            prompt: z.string().trim().min(1).max(2000),
            explanation: nullableString(5000),
            question_type: z.literal("single_choice").optional().default("single_choice"),
            placement_band: placementBandEnum.nullable().optional(),
            sort_order: z.number().int().min(0).optional().default(0),
            options: z
              .array(
                z.object({
                  id: z.string().uuid().optional(),
                  option_text: z.string().trim().min(1).max(1000),
                  is_correct: z.boolean(),
                  sort_order: z.number().int().min(0).optional().default(0)
                })
              )
              .length(4)
          })
          .strict()
          .superRefine((question, ctx) => {
            if (question.options.filter((option) => option.is_correct).length !== 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "each question must contain exactly one correct option",
                path: ["options"]
              });
            }
          })
      )
      .optional()
      .default([])
  })
  .strict();

export const adminCourseModuleCreateSchema = z
  .object({
    course_id: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    description: nullableString(5000),
    is_published: z.boolean().optional().default(true)
  })
  .strict();

function validateTrainerFields(
  value: Partial<{
    activity_type: "trainer" | "test";
    assessment_kind: "regular" | "placement";
    module_id: string | null;
    cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | null;
    drill_topic_key: string | null;
  }>,
  ctx: z.RefinementCtx
) {
    if (value.activity_type !== "trainer") return;

    if (!value.module_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "module_id is required for trainer", path: ["module_id"] });
    }
    if (!value.cefr_level) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cefr_level is required for trainer", path: ["cefr_level"] });
    }
    if (!value.drill_topic_key) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "drill_topic_key is required for trainer", path: ["drill_topic_key"] });
    }
    if (value.assessment_kind === "placement") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "trainer cannot use placement assessment kind", path: ["assessment_kind"] });
    }
}

function validateRegularTestFields(
  value: Partial<{
    activity_type: "trainer" | "test";
    assessment_kind: "regular" | "placement";
    module_id: string | null;
  }>,
  ctx: z.RefinementCtx
) {
  if (value.activity_type !== "test" || value.assessment_kind !== "regular") return;

  if (!value.module_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "module_id is required for regular test", path: ["module_id"] });
  }
}

function validatePlacementFields(
  value: Partial<{
    activity_type: "trainer" | "test";
    assessment_kind: "regular" | "placement";
    scoring_profile: Record<string, unknown> | null;
    questions: Array<{ placement_band?: "beginner" | "elementary" | "pre_intermediate" | "intermediate" | "upper_intermediate" | "advanced" | null }>;
  }>,
  ctx: z.RefinementCtx
) {
  if (value.assessment_kind !== "placement") return;

  if (value.activity_type && value.activity_type !== "test") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "placement test must use activity_type=test", path: ["activity_type"] });
  }
  if (!value.scoring_profile || typeof value.scoring_profile !== "object") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "scoring_profile is required for placement test", path: ["scoring_profile"] });
  }
  if (Array.isArray(value.questions)) {
    value.questions.forEach((question, index) => {
      if (!question.placement_band) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "placement_band is required for placement question",
          path: ["questions", index, "placement_band"]
        });
      }
    });
  }
}

function validatePublishedQuestions(
  value: Partial<{
    is_published: boolean;
    questions: Array<{ prompt?: string; options?: Array<{ option_text?: string; is_correct?: boolean }> }>;
  }>,
  ctx: z.RefinementCtx
) {
  if (!value.is_published) return;
  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "at least one question is required before publishing",
      path: ["questions"]
    });
  }
}

export const adminTestCreateSchema = adminTestBaseSchema
  .superRefine(validateTrainerFields)
  .superRefine(validateRegularTestFields)
  .superRefine(validatePlacementFields)
  .superRefine(validatePublishedQuestions);

const adminWordCardItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    term: z.string().trim().min(1).max(200),
    translation: z.string().trim().min(1).max(500),
    example_sentence: z.string().trim().min(1).max(1000),
    example_translation: z.string().trim().min(1).max(1000),
    sort_order: z.number().int().min(0).optional().default(0)
  })
  .strict();

const adminWordCardSetObjectSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: nullableString(5000),
    topic_slug: z.string().trim().min(1).max(150),
    topic_title: z.string().trim().min(1).max(200),
    cefr_level: testLevelEnum,
    sort_order: z.number().int().min(0).optional(),
    is_published: z.boolean().optional().default(false),
    cards: z.array(adminWordCardItemSchema).min(1)
  })
  .strict();

function validatePublishedWordCardSet(
  value: Partial<{
    is_published: boolean;
    cards: Array<unknown>;
  }>,
  ctx: z.RefinementCtx
) {
  if (!value.is_published) return;
  if (Array.isArray(value.cards) && value.cards.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "published word card set requires at least 5 cards",
      path: ["cards"]
    });
  }
}

export const adminWordCardSetCreateSchema = adminWordCardSetObjectSchema.superRefine(validatePublishedWordCardSet);
export const adminWordCardSetUpdateSchema = adminWordCardSetObjectSchema.partial().superRefine(validatePublishedWordCardSet);

export const adminTestUpdateSchema = adminTestBaseSchema
  .partial()
  .superRefine(validateTrainerFields)
  .superRefine(validateRegularTestFields)
  .superRefine(validatePlacementFields)
  .superRefine(validatePublishedQuestions)
  .refine((value) => Object.keys(value).length > 0, {
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
    notes: nullableString(10000),
    assigned_teacher_id: z.string().uuid().nullable().optional(),
    billing_mode: billingModeEnum.nullable().optional(),
    lesson_price_amount: z.number().min(0).nullable().optional()
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
    if (value.billing_mode === "per_lesson_price" && (value.lesson_price_amount == null || value.lesson_price_amount <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "lesson_price_amount is required for per_lesson_price", path: ["lesson_price_amount"] });
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
    notes: nullableString(10000),
    assigned_teacher_id: z.string().uuid().nullable().optional(),
    billing_mode: billingModeEnum.nullable().optional(),
    lesson_price_amount: z.number().min(0).nullable().optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.billing_mode === "per_lesson_price" && (value.lesson_price_amount == null || value.lesson_price_amount <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "lesson_price_amount is required for per_lesson_price", path: ["lesson_price_amount"] });
    }
    if (value.billing_mode === "package_lessons" && value.lesson_price_amount != null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "lesson_price_amount is not allowed for package mode", path: ["lesson_price_amount"] });
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const teacherBasicInfoUpdateSchema = z
  .object({
    first_name: z.string().trim().min(1).max(200),
    last_name: z.string().trim().min(1).max(200),
    patronymic: nullableString(200),
    email: z.string().trim().toLowerCase().email(),
    phone: ruPhoneString,
    internal_role: teacherInternalRoleEnum,
    timezone: teacherTimezoneEnum
  })
  .strict();

export const teacherProfessionalInfoUpdateSchema = z
  .object({
    english_proficiency: teacherEnglishProficiencyEnum.nullable(),
    specializations: z.array(teacherSpecializationEnum).max(6),
    teaching_experience_years: z.number().int().min(0).max(60).nullable(),
    education_level: teacherEducationLevelEnum.nullable(),
    certificates: z.array(teacherCertificateEnum).min(1).max(5),
    target_audiences: z.array(teacherTargetAudienceEnum).max(15),
    certificate_other: nullableString(200),
    teacher_bio: nullableString(5000)
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasNone = value.certificates.includes("none");
    const hasOtherCertificates = value.certificates.some((certificate) => certificate !== "none");

    if (hasNone && hasOtherCertificates) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "none certificate cannot be combined with other certificates",
        path: ["certificates"]
      });
    }
    if (value.certificates.includes("other") && !value.certificate_other) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "certificate_other is required when other certificate is selected",
        path: ["certificate_other"]
      });
    }
    if (!value.certificates.includes("other") && value.certificate_other) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "certificate_other is only allowed when other certificate is selected",
        path: ["certificate_other"]
      });
    }
  });

export const teacherWorkFormatUpdateSchema = z
  .object({
    available_weekdays: z.array(teacherWeekdayEnum).max(7),
    time_slots: nullableString(2000),
    max_lessons_per_day: z.number().int().min(0).max(20).nullable(),
    max_lessons_per_week: z.number().int().min(0).max(80).nullable(),
    lesson_types: z.array(teacherLessonTypeEnum).max(2),
    lesson_durations: z.array(teacherLessonDurationEnum).max(3)
  })
  .strict();

export const teacherMethodologyStyleUpdateSchema = z
  .object({
    teaching_approach: teacherTeachingApproachEnum.nullable(),
    teaching_materials: z.array(teacherTeachingMaterialEnum).max(3),
    teaching_features: nullableString(5000)
  })
  .strict();

export const teacherOperationalInfoUpdateSchema = z
  .object({
    status: teacherOperationalStatusEnum,
    start_date: nullableDateString,
    cooperation_type: teacherCooperationTypeEnum,
    lesson_rate_amount: z.number().min(0).nullable(),
    currency: teacherCurrencyEnum
  })
  .strict();

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

const notificationTargetRolesSchema = z
  .array(notificationTargetRoleEnum)
  .min(1)
  .max(5)
  .refine((roles) => {
    if (!roles.includes("all")) return true;
    return roles.length === 1;
  }, "target_roles with 'all' cannot include other roles")
  .transform((roles) => Array.from(new Set(roles)));

const adminNotificationShape = z
  .object({
    title: z.string().trim().min(1).max(240),
    body: z.string().trim().min(1).max(6000),
    type: notificationTypeEnum.optional().default("update"),
    is_active: z.boolean().optional().default(true),
    target_roles: notificationTargetRolesSchema.optional().default(["all"]),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
    expires_at: z.string().datetime({ offset: true }).nullable().optional()
  })
  .strict();

function validateNotificationDates(value: { published_at?: string | null; expires_at?: string | null }, ctx: z.RefinementCtx) {
    if (!value.published_at || !value.expires_at) return;
    if (new Date(value.expires_at).getTime() <= new Date(value.published_at).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "expires_at must be later than published_at",
        path: ["expires_at"]
      });
    }
}

export const adminNotificationCreateSchema = adminNotificationShape.superRefine(validateNotificationDates);

export const adminNotificationUpdateSchema = adminNotificationShape
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" })
  .superRefine(validateNotificationDates);
