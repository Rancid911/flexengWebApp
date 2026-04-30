"use client";

import { CalendarPlus2, Loader2 } from "lucide-react";

import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import type { LessonFormDrawerProps } from "@/app/(workspace)/(shared-zone)/schedule/schedule-staff-section-types";
import { Button } from "@/components/ui/button";
import { dashboardControlClassName, dashboardTextareaClassName } from "@/components/ui/control-tokens";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import { Textarea } from "@/components/ui/textarea";

export function LessonFormDrawer({
  actionError,
  canSubmit,
  createCatalogError,
  createCatalogLoading,
  drawerOpen,
  formState,
  saving,
  students,
  teacherLocked,
  teachers,
  ensureStudentCatalogLoaded,
  ensureTeacherCatalogLoaded,
  handleSubmit,
  setDrawerOpen,
  setFormState
}: LessonFormDrawerProps) {
  const isEditMode = Boolean(formState.id);

  return (
    <AdminDrawer open={drawerOpen} title={isEditMode ? "Редактировать урок" : "Новый урок"} onClose={() => setDrawerOpen(false)} widthClass="max-w-2xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField className="space-y-2" label="Ученик" labelClassName="text-sm font-semibold text-slate-700">
            <Select value={formState.studentId} onChange={(event) => setFormState((current) => ({ ...current, studentId: event.target.value }))} onFocus={ensureStudentCatalogLoaded} className={dashboardControlClassName} disabled={createCatalogLoading} required>
              <option value="">Выберите ученика</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField className="space-y-2" label="Преподаватель" labelClassName="text-sm font-semibold text-slate-700">
            <Select value={formState.teacherId} onChange={(event) => setFormState((current) => ({ ...current, teacherId: event.target.value }))} onFocus={ensureTeacherCatalogLoaded} disabled={teacherLocked || createCatalogLoading} className={dashboardControlClassName} required>
              {!teacherLocked ? <option value="">Выберите преподавателя</option> : null}
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField className="space-y-2" label="Название урока" labelClassName="text-sm font-semibold text-slate-700">
          <Input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} className={dashboardControlClassName} required />
        </FormField>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField className="space-y-2" label="Дата" labelClassName="text-sm font-semibold text-slate-700">
            <DateField value={formState.date} onChange={(value) => setFormState((current) => ({ ...current, date: value }))} />
          </FormField>
          <FormField className="space-y-2" label="Начало" labelClassName="text-sm font-semibold text-slate-700">
            <Input type="time" value={formState.startTime} onChange={(event) => setFormState((current) => ({ ...current, startTime: event.target.value }))} className={dashboardControlClassName} required />
          </FormField>
          <FormField className="space-y-2" label="Конец" labelClassName="text-sm font-semibold text-slate-700">
            <Input type="time" value={formState.endTime} onChange={(event) => setFormState((current) => ({ ...current, endTime: event.target.value }))} className={dashboardControlClassName} required />
          </FormField>
        </div>

        <FormField className="space-y-2" label="Ссылка на встречу" labelClassName="text-sm font-semibold text-slate-700">
          <Input type="url" value={formState.meetingUrl} onChange={(event) => setFormState((current) => ({ ...current, meetingUrl: event.target.value }))} className={dashboardControlClassName} placeholder="https://meet.google.com/..." />
        </FormField>

        <FormField className="space-y-2" label="Комментарий" labelClassName="text-sm font-semibold text-slate-700">
          <Textarea value={formState.comment} onChange={(event) => setFormState((current) => ({ ...current, comment: event.target.value }))} rows={4} className={dashboardTextareaClassName} placeholder="Например: подготовить speaking warm-up и ссылку на материалы." />
        </FormField>

        {!isEditMode && createCatalogLoading ? <StatusMessage>Загружаю список учеников и преподавателей…</StatusMessage> : null}
        {!isEditMode && !createCatalogLoading && createCatalogError ? <StatusMessage>{createCatalogError}</StatusMessage> : null}
        {actionError ? <StatusMessage>{actionError}</StatusMessage> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">Ученик увидит только будущие запланированные уроки.</div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="rounded-2xl">Отмена</Button>
            <Button type="submit" disabled={!canSubmit} className="rounded-2xl bg-[#1f7aff] font-black text-white hover:bg-[#1669db]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus2 className="mr-2 h-4 w-4" />}
              {isEditMode ? "Сохранить" : "Назначить урок"}
            </Button>
          </div>
        </div>
      </form>
    </AdminDrawer>
  );
}
