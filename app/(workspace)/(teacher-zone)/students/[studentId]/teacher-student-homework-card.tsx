"use client";

import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

import { TeacherStudentProfileDrawer, EmptyBlock, getHomeworkStatusLabel } from "@/app/(workspace)/(teacher-zone)/students/[studentId]/teacher-student-profile-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardControlClassName, dashboardTextareaClassName } from "@/components/ui/control-tokens";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StatusMessage } from "@/components/ui/status-message";
import { Textarea } from "@/components/ui/textarea";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";
import type { TeacherAssignableTestOptionDto, TeacherStudentHomeworkDto } from "@/lib/teacher-workspace/types";

export function TeacherStudentStandaloneHomeworkCard({
  assignments,
  loading,
  error,
  drawerOpen,
  optionsLoading,
  options,
  searchValue,
  titleValue,
  descriptionValue,
  dueAtValue,
  selectedActivityIds,
  onOpen,
  onClose,
  onSearchChange,
  onTitleChange,
  onDescriptionChange,
  onDueAtChange,
  onToggleActivity,
  onSubmit,
  detailHref
}: {
  assignments: TeacherStudentHomeworkDto[];
  loading: boolean;
  error: string | null;
  drawerOpen: boolean;
  optionsLoading: boolean;
  options: TeacherAssignableTestOptionDto[];
  searchValue: string;
  titleValue: string;
  descriptionValue: string;
  dueAtValue: string;
  selectedActivityIds: string[];
  onOpen: () => void | Promise<void>;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDueAtChange: (value: string) => void;
  onToggleActivity: (activityId: string, checked: boolean) => void;
  onSubmit: () => void;
  detailHref: string;
}) {
  const visibleAssignments = assignments.slice(0, 2);

  return (
    <>
      <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1f7aff]">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Домашнее задание</h2>
                <p className="text-sm text-slate-600">Назначение homework вне урока из общего пула tests и drills.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void onOpen()}
              className="h-10 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]"
            >
              Назначить домашнее задание
            </Button>
          </div>
          <Link href={detailHref} className="inline-flex text-sm font-black text-[#1f7aff] hover:text-[#1669db]">
            Все домашние задания
          </Link>

          {error && !drawerOpen ? <StatusMessage>{error}</StatusMessage> : null}

          <div className="space-y-3">
            {visibleAssignments.length > 0 ? (
              visibleAssignments.map((assignment) => {
                const activityNames = assignment.items.slice(0, 2).map((item) => item.title).filter(Boolean);
                const extraCount = Math.max(assignment.items.length - activityNames.length, 0);
                return (
                  <div key={assignment.id} className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#fbfdff] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">{assignment.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {activityNames.join(" · ")}
                          {extraCount > 0 ? ` · ещё ${extraCount}` : ""}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                          {formatRuLongDateTime(assignment.createdAt) || "Без даты"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-700">{getHomeworkStatusLabel(assignment.status)}</span>
                        <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-[#1f7aff]">
                          {assignment.completedRequiredCount} из {assignment.requiredCount}
                        </span>
                      </div>
                    </div>
                    {assignment.description ? <p className="mt-3 text-sm text-slate-600">{assignment.description}</p> : null}
                  </div>
                );
              })
            ) : (
              <EmptyBlock text="Standalone homework пока не назначалось." />
            )}
          </div>
        </CardContent>
      </Card>

      <TeacherStudentProfileDrawer open={drawerOpen} title="Назначить домашнее задание" onClose={onClose}>
        <div className="space-y-4">
          <FormField className="space-y-2" label="Название" labelClassName="text-sm font-semibold text-slate-700">
            <Input
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              className={dashboardControlClassName}
              placeholder="Например: Homework after modal verbs"
            />
          </FormField>

          <FormField className="space-y-2" label="Описание" labelClassName="text-sm font-semibold text-slate-700">
            <Textarea
              value={descriptionValue}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
              className={dashboardTextareaClassName}
              placeholder="Что именно нужно сделать и на что обратить внимание."
            />
          </FormField>

          <FormField className="space-y-2" label="Дедлайн" labelClassName="text-sm font-semibold text-slate-700">
            <Input type="datetime-local" value={dueAtValue} onChange={(event) => onDueAtChange(event.target.value)} className={dashboardControlClassName} />
          </FormField>

          <div className="space-y-3 rounded-[1.5rem] border border-[#dfe9fb] bg-[#fbfdff] p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Выберите drills / tests</p>
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                className={dashboardControlClassName}
                placeholder="Поиск по названию, уровню или теме"
              />
            </div>
            {optionsLoading ? <StatusMessage>Загружаю доступные материалы…</StatusMessage> : null}
            {!optionsLoading && options.length === 0 ? <StatusMessage>Подходящих материалов пока нет.</StatusMessage> : null}
            {!optionsLoading ? (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {options.map((option) => {
                  const checked = selectedActivityIds.includes(option.id);
                  return (
                    <label key={option.id} className="flex items-start gap-3 rounded-[1rem] border border-[#e4ebf7] bg-white px-3 py-3 text-sm text-slate-700">
                      <input type="checkbox" checked={checked} onChange={(event) => onToggleActivity(option.id, event.target.checked)} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{option.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {option.activityType === "trainer" ? "Тренажёр" : "Тест"} · {option.cefrLevel ?? "без уровня"} · {option.drillTopicKey ?? "без темы"}
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

          {error ? <StatusMessage>{error}</StatusMessage> : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="h-10 rounded-2xl px-4 font-bold">
              Отмена
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading || selectedActivityIds.length === 0}
              className="h-10 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db] disabled:bg-[#bfdbfe] disabled:text-white"
            >
              {loading ? "Назначаем..." : "Назначить homework"}
            </Button>
          </div>
        </div>
      </TeacherStudentProfileDrawer>
    </>
  );
}
