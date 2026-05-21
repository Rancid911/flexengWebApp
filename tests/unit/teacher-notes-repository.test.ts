import { describe, expect, it, vi } from "vitest";

import { createTeacherNotesRepository } from "@/lib/teacher-workspace/notes.repository";

describe("teacher notes repository", () => {
  it("loads profile labels through the scoped RPC", async () => {
    const rpcMock = vi.fn(async () => ({
      data: [
        {
          profile_id: "author-1",
          display_name: "Author One",
          first_name: null,
          last_name: null,
          role: "manager"
        }
      ],
      error: null
    }));
    const fromMock = vi.fn();
    const repository = createTeacherNotesRepository({
      from: fromMock,
      rpc: rpcMock
    } as never);

    const response = await repository.loadProfiles(["author-1"]);

    expect(response.data).toEqual([
      expect.objectContaining({
        profile_id: "author-1",
        display_name: "Author One",
        role: "manager"
      })
    ]);
    expect(rpcMock).toHaveBeenCalledWith("get_accessible_profile_labels", {
      p_profile_ids: ["author-1"]
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not call the profile-label RPC when there are no profile ids", async () => {
    const rpcMock = vi.fn();
    const repository = createTeacherNotesRepository({
      from: vi.fn(),
      rpc: rpcMock
    } as never);

    const response = await repository.loadProfiles([]);

    expect(response).toEqual({ data: [], error: null });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
