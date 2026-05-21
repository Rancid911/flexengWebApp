import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentRealStudentWriteContextMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/students/current-student", () => ({
  getCurrentRealStudentWriteContext: (...args: unknown[]) => getCurrentRealStudentWriteContextMock(...args),
  getCurrentStudentProfile: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

describe("completeWordSession", () => {
  beforeEach(() => {
    getCurrentRealStudentWriteContextMock.mockReset();
    createClientMock.mockReset();
  });

  it("denies teacher preview context before writing student word progress", async () => {
    getCurrentRealStudentWriteContextMock.mockRejectedValue(
      Object.assign(new Error("Real student write context required"), {
        status: 403,
        code: "FORBIDDEN",
        exposeDetails: true
      })
    );

    const { completeWordSession } = await import("@/lib/words/queries");
    await expect(completeWordSession([{ wordId: "word-1", result: "known" }])).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN"
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });
});
