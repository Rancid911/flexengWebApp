"use client";

import { Loader2, RefreshCcw } from "lucide-react";

import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import { FollowupHomeworkSection } from "@/app/(workspace)/(shared-zone)/schedule/schedule-followup-homework-section";
import type { FollowupDrawerProps } from "@/app/(workspace)/(shared-zone)/schedule/schedule-staff-section-types";
import { Button } from "@/components/ui/button";
import { dashboardControlClassName, dashboardTextareaClassName } from "@/components/ui/control-tokens";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import { Textarea } from "@/components/ui/textarea";
import type { LessonAttendanceStatus } from "@/lib/schedule/types";
import { getAttendanceStatusLabel, hasLessonEnded } from "@/lib/schedule/utils";

export function FollowupDrawer({
  actionError,
  activeFollowupLesson,
  followupDrawerOpen,
  followupSnapshot,
  followupState,
  homeworkTestOptions,
  homeworkTestOptionsLoading,
  referenceNow,
  saving,
  showAllHomeworkLevels,
  handleFollowupSubmit,
  loadHomeworkTestOptions,
  setActiveFollowupLesson,
  setFollowupDrawerOpen,
  setFollowupState,
  setShowAllHomeworkLevels
}: FollowupDrawerProps) {
  return (
    <AdminDrawer
      open={followupDrawerOpen}
      title="Итоги урока"
      onClose={() => {
        setFollowupDrawerOpen(false);
        setActiveFollowupLesson(null);
      }}
      widthClass="max-w-2xl"
    >
      <form className="space-y-4" onSubmit={handleFollowupSubmit}>
        <FormField className="space-y-2" label="Посещаемость" labelClassName="text-sm font-semibold text-slate-700">
          <Select value={followupState.attendanceStatus} onChange={(event) => setFollowupState((current) => ({ ...current, attendanceStatus: event.target.value as LessonAttendanceStatus }))} className={dashboardControlClassName}>
            <option value="completed" disabled={activeFollowupLesson ? !hasLessonEnded(activeFollowupLesson.endsAt, referenceNow) : false}>{getAttendanceStatusLabel("completed")}</option>
            <option value="missed_by_student">{getAttendanceStatusLabel("missed_by_student")}</option>
            <option value="missed_by_teacher">{getAttendanceStatusLabel("missed_by_teacher")}</option>
            <option value="canceled">{getAttendanceStatusLabel("canceled")}</option>
            <option value="scheduled">{getAttendanceStatusLabel("scheduled")}</option>
          </Select>
        </FormField>

        <FormField className="space-y-2" label="Краткий итог урока" labelClassName="text-sm font-semibold text-slate-700">
          <Textarea value={followupState.summary} onChange={(event) => setFollowupState((current) => ({ ...current, summary: event.target.value }))} rows={4} className={dashboardTextareaClassName} placeholder="Что получилось, на что обратить внимание и что делаем дальше." required />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField className="space-y-2" label="Что прошли" labelClassName="text-sm font-semibold text-slate-700">
            <Textarea value={followupState.coveredTopics} onChange={(event) => setFollowupState((current) => ({ ...current, coveredTopics: event.target.value }))} rows={4} className={dashboardTextareaClassName} placeholder="Например: speaking prompts, present perfect, interview answers." />
          </FormField>
          <FormField className="space-y-2" label="Повторяющиеся ошибки" labelClassName="text-sm font-semibold text-slate-700">
            <Textarea value={followupState.mistakesSummary} onChange={(event) => setFollowupState((current) => ({ ...current, mistakesSummary: event.target.value }))} rows={4} className={dashboardTextareaClassName} placeholder="Что нужно закрепить до следующего занятия." />
          </FormField>
        </div>

        <FormField className="space-y-2" label="Следующие шаги для ученика" labelClassName="text-sm font-semibold text-slate-700">
          <Textarea value={followupState.nextSteps} onChange={(event) => setFollowupState((current) => ({ ...current, nextSteps: event.target.value }))} rows={3} className={dashboardTextareaClassName} placeholder="Например: повторить speaking notes и выполнить homework к четвергу." />
        </FormField>

        <CheckboxField className="rounded-[1.2rem] border-[#dbe5f4] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-slate-700" label="Показать итог ученику">
          <input type="checkbox" checked={followupState.visibleToStudent} onChange={(event) => setFollowupState((current) => ({ ...current, visibleToStudent: event.target.checked }))} />
        </CheckboxField>

        <FollowupHomeworkSection
          activeFollowupLesson={activeFollowupLesson}
          followupSnapshot={followupSnapshot}
          followupState={followupState}
          homeworkTestOptions={homeworkTestOptions}
          homeworkTestOptionsLoading={homeworkTestOptionsLoading}
          loadHomeworkTestOptions={loadHomeworkTestOptions}
          setFollowupState={setFollowupState}
          setShowAllHomeworkLevels={setShowAllHomeworkLevels}
          showAllHomeworkLevels={showAllHomeworkLevels}
        />

        {actionError ? <StatusMessage>{actionError}</StatusMessage> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">Сохранение итогов обновит посещаемость урока и опубликованный разбор для ученика.</div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setFollowupDrawerOpen(false)} className="rounded-2xl">Отмена</Button>
            <Button type="submit" disabled={saving} className="rounded-2xl bg-[#1f7aff] font-black text-white hover:bg-[#1669db]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Сохранить итог
            </Button>
          </div>
        </div>
      </form>
    </AdminDrawer>
  );
}
