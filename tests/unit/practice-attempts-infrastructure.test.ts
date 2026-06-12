import { describe, expect, it, vi } from "vitest";

const {
  client,
  createClientMock,
  createRepositoryMock,
  syncHomeworkProgressMock
} = vi.hoisted(() => ({
  client: { id: "practice-client" },
  createClientMock: vi.fn(),
  createRepositoryMock: vi.fn(),
  syncHomeworkProgressMock: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

vi.mock("@/lib/practice/practice-attempts.repository", () => ({
  createPracticeAttemptsRepository: createRepositoryMock
}));

vi.mock("@/lib/homework/assignments.service", () => ({
  syncHomeworkProgressForCompletedTest: syncHomeworkProgressMock
}));

import { createPracticeAttemptsInfrastructure } from "@/lib/practice/practice-attempts.infrastructure";

describe("practice attempts infrastructure", () => {
  it("uses one user-scoped client for repository and homework sync", async () => {
    createClientMock.mockResolvedValue(client);
    createRepositoryMock.mockReturnValue({ kind: "repository" });
    const infrastructure = await createPracticeAttemptsInfrastructure();

    expect(infrastructure.repository).toEqual({ kind: "repository" });
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createRepositoryMock).toHaveBeenCalledWith(client);

    await infrastructure.syncHomeworkProgress(
      "student-1",
      "test-1",
      "2026-06-12T10:00:00.000Z",
      "2026-06-12T09:59:00.000Z"
    );
    expect(syncHomeworkProgressMock).toHaveBeenCalledWith(
      "student-1",
      "test-1",
      "2026-06-12T10:00:00.000Z",
      "2026-06-12T09:59:00.000Z",
      client
    );
  });
});

