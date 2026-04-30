"use client";

import type { FormEventHandler } from "react";
import type { useStaffScheduleState } from "@/app/(workspace)/(shared-zone)/schedule/use-staff-schedule-state";

type StaffScheduleState = ReturnType<typeof useStaffScheduleState>;

export type ScheduleAgendaPanelProps = {
  actionError: StaffScheduleState["actionError"];
  filters: StaffScheduleState["filters"];
  groupedLessons: StaffScheduleState["groupedLessons"];
  isLoading: StaffScheduleState["isLoading"];
  referenceNow: StaffScheduleState["referenceNow"];
  saving: StaffScheduleState["saving"];
  students: StaffScheduleState["students"];
  teacherLocked: boolean;
  teachers: StaffScheduleState["teachers"];
  ensureStudentCatalogLoaded: StaffScheduleState["ensureStudentCatalogLoaded"];
  ensureTeacherCatalogLoaded: StaffScheduleState["ensureTeacherCatalogLoaded"];
  handleStatusAction: StaffScheduleState["handleStatusAction"];
  openCreateDrawer: StaffScheduleState["openCreateDrawer"];
  openEditDrawer: StaffScheduleState["openEditDrawer"];
  openFollowupDrawer: StaffScheduleState["openFollowupDrawer"];
  setFilters: StaffScheduleState["setFilters"];
};

export type LessonFormDrawerProps = {
  actionError: StaffScheduleState["actionError"];
  canSubmit: boolean;
  createCatalogError: StaffScheduleState["createCatalogError"];
  createCatalogLoading: StaffScheduleState["createCatalogLoading"];
  drawerOpen: StaffScheduleState["drawerOpen"];
  formState: StaffScheduleState["formState"];
  saving: StaffScheduleState["saving"];
  students: StaffScheduleState["students"];
  teacherLocked: boolean;
  teachers: StaffScheduleState["teachers"];
  ensureStudentCatalogLoaded: StaffScheduleState["ensureStudentCatalogLoaded"];
  ensureTeacherCatalogLoaded: StaffScheduleState["ensureTeacherCatalogLoaded"];
  handleSubmit: FormEventHandler<HTMLFormElement>;
  setDrawerOpen: StaffScheduleState["setDrawerOpen"];
  setFormState: StaffScheduleState["setFormState"];
};

export type FollowupDrawerProps = {
  actionError: StaffScheduleState["actionError"];
  activeFollowupLesson: StaffScheduleState["activeFollowupLesson"];
  followupDrawerOpen: StaffScheduleState["followupDrawerOpen"];
  followupSnapshot: StaffScheduleState["followupSnapshot"];
  followupState: StaffScheduleState["followupState"];
  homeworkTestOptions: StaffScheduleState["homeworkTestOptions"];
  homeworkTestOptionsLoading: StaffScheduleState["homeworkTestOptionsLoading"];
  referenceNow: StaffScheduleState["referenceNow"];
  saving: StaffScheduleState["saving"];
  showAllHomeworkLevels: StaffScheduleState["showAllHomeworkLevels"];
  handleFollowupSubmit: FormEventHandler<HTMLFormElement>;
  loadHomeworkTestOptions: StaffScheduleState["loadHomeworkTestOptions"];
  setActiveFollowupLesson: StaffScheduleState["setActiveFollowupLesson"];
  setFollowupDrawerOpen: StaffScheduleState["setFollowupDrawerOpen"];
  setFollowupState: StaffScheduleState["setFollowupState"];
  setShowAllHomeworkLevels: StaffScheduleState["setShowAllHomeworkLevels"];
};
