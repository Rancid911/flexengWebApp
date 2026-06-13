import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentRealStudentWriteContextMock = vi.fn();
const createUserScopedWordsRepositoryMock = vi.fn();

vi.mock("@/lib/students/current-student", () => ({
  getCurrentRealStudentWriteContext: (...args: unknown[]) => getCurrentRealStudentWriteContextMock(...args),
  getCurrentStudentProfile: vi.fn()
}));

vi.mock("@/lib/words/words.repository", () => ({
  createUserScopedWordsRepository: () =>
    createUserScopedWordsRepositoryMock()
}));

describe("completeWordSession", () => {
  beforeEach(() => {
    getCurrentRealStudentWriteContextMock.mockReset();
    createUserScopedWordsRepositoryMock.mockReset();
  });

  it("denies teacher preview context before writing student word progress", async () => {
    getCurrentRealStudentWriteContextMock.mockRejectedValue(
      Object.assign(new Error("Real student write context required"), {
        status: 403,
        code: "FORBIDDEN",
        exposeDetails: true
      })
    );

    const { completeWordSession } = await import(
      "@/lib/words/words.service"
    );
    await expect(completeWordSession([{ wordId: "word-1", result: "known" }])).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN"
    });

    expect(createUserScopedWordsRepositoryMock).not.toHaveBeenCalled();
  });
});
