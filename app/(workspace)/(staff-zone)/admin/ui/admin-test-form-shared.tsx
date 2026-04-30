"use client";

import type { ReactNode } from "react";

import type { TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";

export type MaterialKind = "trainer" | "final_test" | "placement";

export const materialKindOptions: Array<{ value: MaterialKind; label: string }> = [
  { value: "trainer", label: "Тренажёр" },
  { value: "final_test", label: "Финальный тест" },
  { value: "placement", label: "Placement-тест" }
];

export function getMaterialKind(form: TestsForm): MaterialKind {
  if (form.assessment_kind === "placement") return "placement";
  return form.activity_type === "trainer" ? "trainer" : "final_test";
}

export function applyMaterialKind(prev: TestsForm, value: MaterialKind): TestsForm {
  if (value === "trainer") {
    return {
      ...prev,
      activity_type: "trainer",
      assessment_kind: "regular"
    };
  }
  if (value === "placement") {
    return {
      ...prev,
      activity_type: "test",
      assessment_kind: "placement"
    };
  }
  return {
    ...prev,
    activity_type: "test",
    assessment_kind: "regular"
  };
}

export function DrawerSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
