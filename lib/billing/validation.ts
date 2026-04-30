import { z } from "zod";

export const studentBillingModeSchema = z.enum(["package_lessons", "per_lesson_price"]);
export const studentBillingUnitTypeSchema = z.enum(["lesson", "money"]);
export const studentBillingDirectionSchema = z.enum(["credit", "debit"]);

const nullableTrimmedString = z.preprocess(
  (value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().max(500).nullable().optional()
);

export const studentBillingSettingsSchema = z
  .object({
    billingMode: studentBillingModeSchema.nullable().optional(),
    lessonPriceAmount: z.number().min(0).nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (value.billingMode === "per_lesson_price" && (value.lessonPriceAmount == null || value.lessonPriceAmount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lessonPriceAmount is required for per_lesson_price mode",
        path: ["lessonPriceAmount"]
      });
    }

    if (value.billingMode === "package_lessons" && value.lessonPriceAmount != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lessonPriceAmount is not allowed for package mode",
        path: ["lessonPriceAmount"]
      });
    }
  });

export const studentBillingAdjustmentSchema = z.object({
  unitType: studentBillingUnitTypeSchema,
  direction: studentBillingDirectionSchema,
  value: z.number().positive(),
  description: nullableTrimmedString
});
