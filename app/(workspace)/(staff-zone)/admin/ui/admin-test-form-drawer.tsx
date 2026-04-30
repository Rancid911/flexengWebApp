"use client";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import {
  createEmptyQuestionForm,
  type TestQuestionForm,
  type TestsForm
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { AdminTestBasicSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-basic-section";
import { getMaterialKind } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-shared";
import { AdminTestPlacementSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-placement-section";
import { AdminTestQuestionsSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-questions-section";
import { AdminTestSettingsSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-settings-section";
import { Button } from "@/components/ui/button";
import type { CourseModuleOptionDto, CourseOptionDto } from "@/lib/admin/types";

type Props = {
  open: boolean;
  title: string;
  form: TestsForm;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
  submitLabel: string;
  submitting: boolean;
  formError: string;
  moduleOptions: CourseModuleOptionDto[];
  moduleOptionsError?: string;
  courseOptions: CourseOptionDto[];
  courseOptionsError?: string;
  onCreateModule: (input: { course_id: string; title: string; description: string | null; is_published: boolean }) => Promise<CourseModuleOptionDto>;
};

export function AdminTestFormDrawer({
  open,
  title,
  form,
  onClose,
  onSubmit,
  setForm,
  submitLabel,
  submitting,
  formError,
  moduleOptions,
  moduleOptionsError,
  courseOptions,
  courseOptionsError,
  onCreateModule
}: Props) {
  const materialKind = getMaterialKind(form);
  const isTrainer = form.activity_type === "trainer";
  const isPlacement = form.assessment_kind === "placement";
  const requiresModule = !isPlacement;

  const updateQuestion = (questionClientId: string, updater: (question: TestQuestionForm) => TestQuestionForm) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => (question.clientId === questionClientId ? updater(question) : question))
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestionForm()]
    }));
  };

  const removeQuestion = (questionClientId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((question) => question.clientId !== questionClientId)
    }));
  };

  const moveQuestion = (questionClientId: string, direction: -1 | 1) => {
    setForm((prev) => {
      const index = prev.questions.findIndex((question) => question.clientId === questionClientId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.questions.length) return prev;

      const nextQuestions = [...prev.questions];
      const [question] = nextQuestions.splice(index, 1);
      nextQuestions.splice(nextIndex, 0, question);
      return { ...prev, questions: nextQuestions };
    });
  };

  return (
    <AdminDrawer open={open} onClose={onClose} title={title} widthClass="max-w-[72rem]">
      <form className="space-y-4" onSubmit={onSubmit}>
        <AdminTestBasicSection
          courseOptions={courseOptions}
          courseOptionsError={courseOptionsError}
          form={form}
          isTrainer={isTrainer}
          materialKind={materialKind}
          moduleOptions={moduleOptions}
          moduleOptionsError={moduleOptionsError}
          onCreateModule={onCreateModule}
          requiresModule={requiresModule}
          setForm={setForm}
        />

        <AdminTestSettingsSection form={form} setForm={setForm} />

        <AdminTestQuestionsSection
          addQuestion={addQuestion}
          form={form}
          moveQuestion={moveQuestion}
          removeQuestion={removeQuestion}
          updateQuestion={updateQuestion}
        />

        {isPlacement ? <AdminTestPlacementSection form={form} setForm={setForm} /> : null}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-[#f8fafc]/95 px-1 pb-1 pt-4 backdrop-blur">
          {formError ? <p data-testid="admin-test-form-error" className="mr-auto max-w-2xl text-sm text-red-500">{formError}</p> : null}
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button data-testid="admin-test-submit" type="submit" disabled={submitting} className={adminPrimaryButtonClassName}>
            {submitting ? "Сохранение..." : submitLabel}
          </Button>
        </div>
      </form>
    </AdminDrawer>
  );
}
