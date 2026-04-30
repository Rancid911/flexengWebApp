import { describe, expect, it } from "vitest";

import { buildStudentDashboardSummaryBlocks } from "@/lib/dashboard/student-dashboard";
import { buildHomeworkOverviewSummary } from "@/lib/homework/queries";
import { buildPracticeOverviewSummary } from "@/lib/practice/queries";
import { buildWordsOverviewSummary } from "@/lib/words/queries";

describe("student experience contracts", () => {
  it("projects student dashboard core data into stable summary blocks", () => {
    const summary = buildStudentDashboardSummaryBlocks({
      lessonOfTheDay: {
        title: "Speaking",
        description: "Continue",
        duration: "15 минут",
        progress: 40,
        sectionsCount: 2
      },
      progress: {
        value: 60,
        label: "steady"
      },
      heroStats: [{ label: "Точность", value: "80%" }],
      homeworkCards: [{ id: "hw-1", title: "Homework", subtitle: "soon", status: "Не начато", statusTone: "muted" }],
      activeHomeworkCount: 3,
      recommendationCards: [{ id: "rec-1", title: "Repeat", subtitle: "mistakes", href: "/practice/topics/grammar/module-1" }],
      nextBestAction: {
        label: "Важно",
        title: "Сделайте домашнее задание",
        description: "desc",
        primaryLabel: "Open",
        primaryHref: "/homework"
      },
      summaryStats: [],
      nextScheduledLesson: null,
      upcomingScheduleLessons: []
    });

    expect(summary.homeworkSummaryPreview.activeHomeworkCount).toBe(3);
    expect(summary.recommendationsSummary[0]?.id).toBe("rec-1");
  });

  it("builds homework overview summary from list ownership only", () => {
    const summary = buildHomeworkOverviewSummary([
      { id: "1", title: "A", description: null, status: "not_started", dueAt: "2026-04-10T10:00:00.000Z", itemCount: 1 },
      { id: "2", title: "B", description: null, status: "overdue", dueAt: "2026-04-08T10:00:00.000Z", itemCount: 2 },
      { id: "3", title: "C", description: null, status: "completed", dueAt: "2026-04-07T10:00:00.000Z", itemCount: 3 }
    ]);

    expect(summary.activeCount).toBe(1);
    expect(summary.overdueCount).toBe(1);
    expect(summary.nearestDueTitle).toBe("B");
  });

  it("builds practice overview summary from recommendation and topic feeds", () => {
    const summary = buildPracticeOverviewSummary(
      [
        { id: "lesson_1", title: "Continue", reason: "40%" },
        { id: "module_2", title: "Repeat", reason: "mistakes" }
      ],
      [
        { id: "topic-1", slug: "speaking", title: "Speaking", description: null, moduleCount: 3, progressPercent: 50 },
        { id: "topic-2", slug: "grammar", title: "Grammar", description: null, moduleCount: 2, progressPercent: 0 }
      ]
    );

    expect(summary.doNowId).toBe("lesson_1");
    expect(summary.continueTopicSlug).toBe("speaking");
    expect(summary.weakSpotId).toBe("module_2");
  });

  it("builds words overview summary separately from list pages", () => {
    const summary = buildWordsOverviewSummary({
      words: [
        { status: "new" },
        { status: "learning" },
        { status: "mastered" }
      ],
      reviewWords: [{ id: "review-1" }],
      newWords: [{ id: "new-1" }, { id: "new-2" }]
    });

    expect(summary.totalWords).toBe(3);
    expect(summary.reviewCount).toBe(1);
    expect(summary.newCount).toBe(2);
    expect(summary.activeCount).toBe(2);
    expect(summary.difficultCount).toBe(0);
    expect(summary.masteredCount).toBe(1);
  });
});
