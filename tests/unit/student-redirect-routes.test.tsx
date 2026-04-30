import { describe, expect, it, vi } from "vitest";

import AssignmentsPage from "@/app/(workspace)/(student-zone)/assignments/page";
import FlashcardsPage from "@/app/(workspace)/(student-zone)/flashcards/page";
import LearningPage from "@/app/(workspace)/(student-zone)/learning/page";
import TestsPage from "@/app/(workspace)/(student-zone)/tests/page";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args)
}));

describe("student redirect routes", () => {
  it("keeps learning as a redirect-only compatibility route", () => {
    LearningPage();
    expect(redirectMock).toHaveBeenCalledWith("/practice");
  });

  it("keeps assignments as a redirect-only compatibility route", () => {
    AssignmentsPage();
    expect(redirectMock).toHaveBeenCalledWith("/homework");
  });

  it("keeps flashcards as a redirect-only compatibility route", () => {
    FlashcardsPage();
    expect(redirectMock).toHaveBeenCalledWith("/words");
  });

  it("keeps tests as a redirect-only compatibility route", () => {
    TestsPage();
    expect(redirectMock).toHaveBeenCalledWith("/practice");
  });
});
