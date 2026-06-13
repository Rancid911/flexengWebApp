import { describe, expect, it, vi } from "vitest";

import { createTeacherStudentProfileRepository } from "@/lib/teacher-workspace/student-profile.repository";

describe("teacher student profile repository", () => {
  it("loads profile labels through the scoped RPC", async () => {
    const rpcMock = vi.fn(async () => ({
      data: [
        {
          profile_id: "profile-1",
          display_name: "Student One",
          first_name: null,
          last_name: null,
          role: "student"
        }
      ],
      error: null
    }));
    const fromMock = vi.fn();
    const repository = createTeacherStudentProfileRepository({
      from: fromMock,
      rpc: rpcMock
    } as never);

    const response = await repository.loadProfiles(["profile-1"]);

    expect(response.data).toEqual([
      expect.objectContaining({
        profile_id: "profile-1",
        display_name: "Student One",
        role: "student"
      })
    ]);
    expect(rpcMock).toHaveBeenCalledWith("get_accessible_profile_labels", {
      p_profile_ids: ["profile-1"]
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not call the profile-label RPC when there are no profile ids", async () => {
    const rpcMock = vi.fn();
    const repository = createTeacherStudentProfileRepository({
      from: vi.fn(),
      rpc: rpcMock
    } as never);

    const response = await repository.loadProfiles([]);

    expect(response).toEqual({ data: [], error: null });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
