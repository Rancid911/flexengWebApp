import { describe, expect, it, vi } from "vitest";

import { createTeacherStudentRosterRepository } from "@/lib/teacher-workspace/student-roster.repository";

describe("teacher student roster repository", () => {
  it("loads roster profile labels through the scoped RPC", async () => {
    const rpcMock = vi.fn(async () => ({
      data: [
        {
          student_id: "student-1",
          profile_id: "profile-1",
          display_name: "Student One",
          first_name: null,
          last_name: null,
          email: "student@example.com",
          phone: null
        }
      ],
      error: null
    }));
    const fromMock = vi.fn();
    const repository = createTeacherStudentRosterRepository({
      rpc: rpcMock,
      from: fromMock
    } as never);

    const response = await repository.loadProfileSummaries(["student-1"]);

    expect(response.data).toEqual([
      expect.objectContaining({
        student_id: "student-1",
        profile_id: "profile-1",
        display_name: "Student One"
      })
    ]);
    expect(rpcMock).toHaveBeenCalledWith("get_teacher_student_profile_summaries", {
      p_student_ids: ["student-1"]
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not call the RPC when there are no student ids", async () => {
    const rpcMock = vi.fn();
    const repository = createTeacherStudentRosterRepository({
      rpc: rpcMock,
      from: vi.fn()
    } as never);

    const response = await repository.loadProfileSummaries([]);

    expect(response).toEqual({ data: [], error: null });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("loads active homework counts through the scoped RPC", async () => {
    const rpcMock = vi.fn(async () => ({
      data: [{ student_id: "student-1", active_homework_count: 2 }],
      error: null
    }));
    const fromMock = vi.fn();
    const repository = createTeacherStudentRosterRepository({
      rpc: rpcMock,
      from: fromMock
    } as never);

    const response = await repository.loadActiveHomeworkCounts(["student-1"]);

    expect(response.data).toEqual([{ student_id: "student-1", active_homework_count: 2 }]);
    expect(rpcMock).toHaveBeenCalledWith("get_teacher_roster_active_homework_counts", {
      p_student_ids: ["student-1"]
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not call the homework count RPC when there are no student ids", async () => {
    const rpcMock = vi.fn();
    const repository = createTeacherStudentRosterRepository({
      rpc: rpcMock,
      from: vi.fn()
    } as never);

    const response = await repository.loadActiveHomeworkCounts([]);

    expect(response).toEqual({ data: [], error: null });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
