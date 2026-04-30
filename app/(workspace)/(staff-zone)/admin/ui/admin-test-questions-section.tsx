"use client";

import {
  placementBandOptions,
  type TestQuestionForm,
  type TestsForm
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { DrawerSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-shared";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function QuestionsSummary({ count }: { count: number }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{count} шт.</span>;
}

export function AdminTestQuestionsSection({
  addQuestion,
  form,
  moveQuestion,
  removeQuestion,
  updateQuestion
}: {
  addQuestion: () => void;
  form: TestsForm;
  moveQuestion: (questionClientId: string, direction: -1 | 1) => void;
  removeQuestion: (questionClientId: string) => void;
  updateQuestion: (questionClientId: string, updater: (question: TestQuestionForm) => TestQuestionForm) => void;
}) {
  return (
    <DrawerSection title="Вопросы и ответы" description="У каждого вопроса всегда 4 варианта ответа и только 1 правильный.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuestionsSummary count={form.questions.length} />
        <Button type="button" variant="secondary" onClick={addQuestion}>
          Добавить вопрос
        </Button>
      </div>

      <div className="space-y-4">
        {form.questions.map((question, questionIndex) => (
          <div key={question.clientId} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Вопрос {questionIndex + 1}</p>
                {form.has_attempts && question.id ? (
                  <p className="text-xs text-slate-500">У этого материала уже есть попытки. Существующие вопросы нельзя удалять.</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveQuestion(question.clientId, -1)} disabled={questionIndex === 0}>
                  Выше
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveQuestion(question.clientId, 1)}
                  disabled={questionIndex === form.questions.length - 1}
                >
                  Ниже
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(question.clientId)}
                  disabled={Boolean(form.has_attempts && question.id)}
                >
                  Удалить вопрос
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField className="lg:col-span-2" label="Текст вопроса">
                <Textarea
                  value={question.prompt}
                  onChange={(event) => updateQuestion(question.clientId, (prev) => ({ ...prev, prompt: event.target.value }))}
                  rows={3}
                  placeholder="Введите формулировку вопроса"
                  required
                />
              </FormField>
              <FormField className={cn(form.assessment_kind === "placement" ? "" : "lg:col-span-2")} label="Пояснение">
                <Textarea
                  value={question.explanation}
                  onChange={(event) => updateQuestion(question.clientId, (prev) => ({ ...prev, explanation: event.target.value }))}
                  rows={2}
                  placeholder="Необязательная подсказка или пояснение"
                />
              </FormField>
              {form.assessment_kind === "placement" ? (
                <FormField label="Уровень блока">
                  <Select
                    value={question.placementBand}
                    onChange={(event) =>
                      updateQuestion(question.clientId, (prev) => ({
                        ...prev,
                        placementBand: event.target.value as TestQuestionForm["placementBand"]
                      }))
                    }
                  >
                    <option value="">Выберите уровень</option>
                    {placementBandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {question.options.map((option, optionIndex) => (
                <div key={option.clientId} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name={`admin-test-question-${question.clientId}-correct`}
                      checked={option.isCorrect}
                      onChange={() =>
                        updateQuestion(question.clientId, (prev) => ({
                          ...prev,
                          options: prev.options.map((item, index) => ({
                            ...item,
                            isCorrect: index === optionIndex
                          })) as TestQuestionForm["options"]
                        }))
                      }
                      className="mt-2 h-4 w-4"
                    />
                    <FormField className="min-w-0 flex-1" label={`Вариант ${optionIndex + 1}`} hint={option.isCorrect ? "Правильный ответ" : undefined}>
                      <Input
                        data-testid={`admin-test-option-input-${questionIndex + 1}-${optionIndex + 1}`}
                        value={option.optionText}
                        onChange={(event) =>
                          updateQuestion(question.clientId, (prev) => ({
                            ...prev,
                            options: prev.options.map((item, index) =>
                              index === optionIndex ? { ...item, optionText: event.target.value } : item
                            ) as TestQuestionForm["options"]
                          }))
                        }
                        placeholder={`Введите текст варианта ${optionIndex + 1}`}
                        required
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DrawerSection>
  );
}
