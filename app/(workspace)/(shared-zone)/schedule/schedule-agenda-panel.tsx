"use client";

import { Loader2, Plus } from "lucide-react";

import { StaffLessonCard } from "@/app/(workspace)/(shared-zone)/schedule/schedule-components";
import type { ScheduleAgendaPanelProps } from "@/app/(workspace)/(shared-zone)/schedule/schedule-staff-section-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardControlClassName } from "@/components/ui/control-tokens";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { StatusMessage } from "@/components/ui/status-message";
import type { StaffScheduleLessonDto } from "@/lib/schedule/types";

export function ScheduleAgendaPanel({
  actionError,
  filters,
  groupedLessons,
  isLoading,
  referenceNow,
  saving,
  students,
  teacherLocked,
  teachers,
  ensureStudentCatalogLoaded,
  ensureTeacherCatalogLoaded,
  handleStatusAction,
  openCreateDrawer,
  openEditDrawer,
  openFollowupDrawer,
  setFilters
}: ScheduleAgendaPanelProps) {
  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Агенда уроков</h2>
            <p className="mt-1 text-sm text-slate-600">
              {teacherLocked ? "Показываем только ваших учеников и ваши уроки." : "Фильтруйте список по ученику, преподавателю, статусу и дате."}
            </p>
          </div>
          <Button type="button" onClick={openCreateDrawer} className="h-11 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]">
            <Plus className="mr-2 h-4 w-4" />
            Назначить урок
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <FormField className="space-y-2" label="Ученик" labelClassName="text-sm font-semibold text-slate-700">
            <Select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} onFocus={ensureStudentCatalogLoaded} className={dashboardControlClassName}>
              <option value="">Все ученики</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField className="space-y-2" label="Преподаватель" labelClassName="text-sm font-semibold text-slate-700">
            <Select value={filters.teacherId} onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))} onFocus={ensureTeacherCatalogLoaded} disabled={teacherLocked} className={dashboardControlClassName}>
              {!teacherLocked ? <option value="">Все преподаватели</option> : null}
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField className="space-y-2" label="Статус" labelClassName="text-sm font-semibold text-slate-700">
            <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as typeof current.status }))} className={dashboardControlClassName}>
              <option value="all">Все статусы</option>
              <option value="scheduled">Запланирован</option>
              <option value="completed">Проведён</option>
              <option value="canceled">Отменён</option>
            </Select>
          </FormField>

          <FormField className="space-y-2" label="С даты" labelClassName="text-sm font-semibold text-slate-700">
            <DateField value={filters.dateFrom} onChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))} />
          </FormField>

          <FormField className="space-y-2" label="По дату" labelClassName="text-sm font-semibold text-slate-700">
            <DateField value={filters.dateTo} onChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))} />
          </FormField>
        </div>

        {actionError ? <StatusMessage>{actionError}</StatusMessage> : null}

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Обновляю расписание…
          </div>
        ) : groupedLessons.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d7e4f5] bg-[#f8fbff] px-5 py-10 text-sm text-slate-600">
            По текущим фильтрам занятий нет. Назначьте первый урок или измените фильтры.
          </div>
        ) : (
          groupedLessons.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">{group.label}</h3>
                <span className="text-sm text-slate-500">{group.lessons.length} урока</span>
              </div>
              <div className="grid gap-4">
                {group.lessons.map((lesson) => (
                  <StaffLessonCard key={lesson.id} lesson={lesson as StaffScheduleLessonDto} onEdit={openEditDrawer} onComplete={handleStatusAction} onFollowup={openFollowupDrawer} referenceNow={referenceNow} loading={saving} />
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
