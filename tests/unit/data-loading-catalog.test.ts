import { describe, expect, it } from "vitest";

import { DATA_LOADING_CATALOG, STUDENT_EXPERIENCE_LOADING_CATALOG, TEACHER_EXPERIENCE_LOADING_CATALOG } from "@/lib/data-loading/catalog";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";

describe("data loading catalog", () => {
  it("keeps the required route inventory covered", () => {
    expect(DATA_LOADING_CATALOG.map((entry) => entry.route)).toEqual([
      "/dashboard",
      "/student-dashboard",
      "/schedule",
      "/admin/payments",
      "/settings/payments",
      "/students/[studentId]",
      "/progress/*",
      "/practice/*",
      "/homework/*",
      "/settings/profile",
      "/words/*",
      "/admin",
      "/search",
      "/learning",
      "/tests",
      "/assignments",
      "/flashcards"
    ]);
  });

  it("preserves descriptor values without reshaping them", () => {
    const descriptor = defineDataLoadingDescriptor({
      id: "sample",
      owner: "@/lib/example#sample",
      accessMode: "user_scoped",
      loadLevel: "page",
      shape: "summary",
      issues: ["duplicated_fetch"]
    });

    expect(descriptor).toEqual({
      id: "sample",
      owner: "@/lib/example#sample",
      accessMode: "user_scoped",
      loadLevel: "page",
      shape: "summary",
      issues: ["duplicated_fetch"]
    });
  });

  it("captures student critical render contracts and future RPC candidates", () => {
    expect(STUDENT_EXPERIENCE_LOADING_CATALOG.dashboardSummaryBlocks).toEqual([
      "lessonOfTheDay",
      "progress",
      "heroStats",
      "homeworkSummaryPreview",
      "recommendationsSummary",
      "nextBestAction",
      "schedulePreview"
    ]);
    expect(STUDENT_EXPERIENCE_LOADING_CATALOG.redirectOnlyRoutes).toEqual(["/learning", "/assignments", "/flashcards", "/tests"]);
    expect(STUDENT_EXPERIENCE_LOADING_CATALOG.routes.map((entry) => entry.route)).toEqual([
      "/dashboard",
      "/student-dashboard",
      "/homework",
      "/homework/[id]",
      "/practice",
      "/practice/recommended",
      "/practice/topics",
      "/practice/topics/[topic]",
      "/practice/topics/[topic]/[subtopic]",
      "/practice/mistakes",
      "/practice/favorites",
      "/practice/activity/[activityId]",
      "/progress/*",
      "/settings/payments",
      "/words/*",
      "/words/my",
      "/words/review",
      "/words/new"
    ]);
  });

  it("captures teacher actor model and route boundaries", () => {
    expect(TEACHER_EXPERIENCE_LOADING_CATALOG.actorModel.teacherScopeFields).toEqual(["teacherId", "accessibleStudentIds"]);
    expect(TEACHER_EXPERIENCE_LOADING_CATALOG.routes.map((entry) => entry.route)).toEqual(["/dashboard", "/schedule", "/students/[studentId]"]);
    expect(TEACHER_EXPERIENCE_LOADING_CATALOG.routes.find((entry) => entry.route === "/schedule")?.teacherWriteBlocks).toContain(
      "attendance/outcome/homework follow-up"
    );
  });
});
