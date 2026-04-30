"use client";

import type { FollowupDrawerProps } from "@/app/(workspace)/(shared-zone)/schedule/schedule-staff-section-types";
import { dashboardControlClassName, dashboardTextareaClassName } from "@/components/ui/control-tokens";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StatusMessage } from "@/components/ui/status-message";
import { Textarea } from "@/components/ui/textarea";

type FollowupHomeworkSectionProps = Pick<
  FollowupDrawerProps,
  | "activeFollowupLesson"
  | "followupSnapshot"
  | "followupState"
  | "homeworkTestOptions"
  | "homeworkTestOptionsLoading"
  | "loadHomeworkTestOptions"
  | "setFollowupState"
  | "setShowAllHomeworkLevels"
  | "showAllHomeworkLevels"
>;

export function FollowupHomeworkSection({
  activeFollowupLesson,
  followupSnapshot,
  followupState,
  homeworkTestOptions,
  homeworkTestOptionsLoading,
  loadHomeworkTestOptions,
  setFollowupState,
  setShowAllHomeworkLevels,
  showAllHomeworkLevels
}: FollowupHomeworkSectionProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[#dfe9fb] bg-[#fbfdff] p-4">
      <div>
        <h3 className="text-base font-black text-slate-900">Домашнее задание после урока</h3>
        <p className="mt-1 text-sm text-slate-600">Если заполнить этот блок, ученику будет создано новое homework assignment.</p>
      </div>

      <FormField className="space-y-2" label="Название задания" labelClassName="text-sm font-semibold text-slate-700">
        <Input value={followupState.homeworkTitle} onChange={(event) => setFollowupState((current) => ({ ...current, homeworkTitle: event.target.value }))} className={dashboardControlClassName} placeholder="Например: Homework after speaking club" />
      </FormField>

      <FormField className="space-y-2" label="Описание" labelClassName="text-sm font-semibold text-slate-700">
        <Textarea value={followupState.homeworkDescription} onChange={(event) => setFollowupState((current) => ({ ...current, homeworkDescription: event.target.value }))} rows={3} className={dashboardTextareaClassName} placeholder="Что именно нужно сделать до следующего урока." />
      </FormField>

      <FormField className="space-y-2" label="Дедлайн" labelClassName="text-sm font-semibold text-slate-700">
        <Input type="datetime-local" value={followupState.homeworkDueAt} onChange={(event) => setFollowupState((current) => ({ ...current, homeworkDueAt: event.target.value ? new Date(event.target.value).toISOString() : "" }))} className={dashboardControlClassName} />
      </FormField>

      <CheckboxField className="rounded-[1.2rem] border-[#dbe5f4] bg-white px-4 py-3 text-sm font-semibold text-slate-700" label="Показать материалы всех уровней">
        <input
          type="checkbox"
          checked={showAllHomeworkLevels}
          onChange={(event) => {
            const nextValue = event.target.checked;
            setShowAllHomeworkLevels(nextValue);
            if (activeFollowupLesson) {
              void loadHomeworkTestOptions(activeFollowupLesson, nextValue);
            }
          }}
        />
      </CheckboxField>

      <div className="space-y-3 rounded-[1.25rem] border border-[#dfe9fb] bg-white px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Назначить drills / tests</p>
          <p className="mt-1 text-xs text-slate-500">По умолчанию показаны материалы уровня ученика. Преподаватель может расширить список и назначить активность вне уровня.</p>
        </div>
        {homeworkTestOptionsLoading ? <StatusMessage>Загружаю доступные материалы…</StatusMessage> : null}
        {!homeworkTestOptionsLoading && homeworkTestOptions.length === 0 ? <StatusMessage>Подходящих материалов пока нет.</StatusMessage> : null}
        {!homeworkTestOptionsLoading ? (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {homeworkTestOptions.map((option) => {
              const checked = followupState.homeworkTestIds.includes(option.id);
              return (
                <label key={option.id} className="flex items-start gap-3 rounded-[1rem] border border-[#e4ebf7] px-3 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setFollowupState((current) => ({
                        ...current,
                        homeworkTestIds: event.target.checked ? [...current.homeworkTestIds, option.id] : current.homeworkTestIds.filter((item) => item !== option.id)
                      }))
                    }
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{option.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {option.assessmentKind === "placement"
                        ? "Placement · диагностика уровня"
                        : `${option.activityType === "trainer" ? "Тренажёр" : "Тест"} · ${option.cefrLevel ?? "без уровня"} · ${option.drillTopicKey ?? "без темы"}`}
                      {option.drillKind ? ` · ${option.drillKind}` : ""}
                      {option.lessonReinforcement ? " · post-lesson" : ""}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      {followupSnapshot?.homeworkAssignment ? <FollowupHomeworkSnapshot followupSnapshot={followupSnapshot} /> : null}
    </div>
  );
}

function FollowupHomeworkSnapshot({ followupSnapshot }: Pick<FollowupDrawerProps, "followupSnapshot">) {
  const homeworkAssignment = followupSnapshot?.homeworkAssignment;
  if (!homeworkAssignment) return null;

  return (
    <div className="space-y-3 rounded-[1.25rem] border border-[#eadcff] bg-[linear-gradient(135deg,#faf5ff_0%,#f5f3ff_100%)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-9 items-center rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">Homework</span>
        <span className="inline-flex min-h-9 items-center rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {homeworkAssignment.completedRequiredCount} из {homeworkAssignment.requiredCount} обязательных выполнено
        </span>
        <span className="inline-flex min-h-9 items-center rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {homeworkAssignment.status === "completed" ? "Завершено" : homeworkAssignment.status === "overdue" ? "Просрочено" : homeworkAssignment.status === "in_progress" ? "В работе" : "Не начато"}
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{homeworkAssignment.title}</p>
        {homeworkAssignment.description ? <p className="mt-1 text-sm text-slate-600">{homeworkAssignment.description}</p> : null}
      </div>
      {homeworkAssignment.items.length > 0 ? (
        <div className="space-y-2">
          {homeworkAssignment.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-white/70 bg-white/80 px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.assessmentKind === "placement" ? "Placement test" : item.activityType === "trainer" ? "Тренажёр" : item.activityType === "test" ? "Тест" : item.sourceType}
                  {item.required ? " · обязательно" : " · опционально"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {item.status === "completed" ? "Завершено" : item.status === "in_progress" ? "В работе" : "Не начато"}
                </span>
                {item.lastScore != null ? <span className="inline-flex min-h-8 items-center rounded-full bg-[#ede9fe] px-3 py-1 text-[#6d28d9]">{item.lastScore}%</span> : null}
                {item.assessmentKind === "placement" && item.recommendedLevel ? <span className="inline-flex min-h-8 items-center rounded-full bg-white px-3 py-1 text-slate-700">{item.recommendedLevel}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
