import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, createRepositoryMock, writeAuditMock, repository } = vi.hoisted(() => {
  const repository = {
    loadNextSortOrder: vi.fn(),
    list: vi.fn(),
    listMaterials: vi.fn(),
    loadDetail: vi.fn(),
    loadRaw: vi.fn(),
    createSet: vi.fn(),
    updateSet: vi.fn(),
    deleteSet: vi.fn(),
    insertItems: vi.fn(),
    deleteItemsBySetId: vi.fn()
  };

  return {
    createClientMock: vi.fn(),
    createRepositoryMock: vi.fn(() => repository),
    writeAuditMock: vi.fn(),
    repository
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/admin/word-card-sets.repository", () => ({
  createAdminWordCardSetRepository: (...args: unknown[]) => createRepositoryMock(...args)
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAuditMock(...args)
}));

const cards = Array.from({ length: 5 }, (_, index) => ({
  term: `word ${index + 1}`,
  translation: `слово ${index + 1}`,
  example_sentence: `Example sentence ${index + 1}.`,
  example_translation: `Пример ${index + 1}.`,
  sort_order: index
}));

function makeSetRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "set-1",
    title: "Cafe words",
    description: null,
    topic_slug: "food",
    topic_title: "Еда",
    cefr_level: "A1",
    is_published: false,
    sort_order: 1,
    created_at: "2026-05-08T07:00:00.000Z",
    updated_at: "2026-05-08T07:00:00.000Z",
    word_card_items: cards.map((card, index) => ({ id: `card-${index + 1}`, ...card })),
    ...overrides
  };
}

describe("admin word card sets service", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createRepositoryMock.mockClear();
    writeAuditMock.mockReset();
    repository.loadNextSortOrder.mockReset();
    repository.list.mockReset();
    repository.listMaterials.mockReset();
    repository.loadDetail.mockReset();
    repository.loadRaw.mockReset();
    repository.createSet.mockReset();
    repository.updateSet.mockReset();
    repository.deleteSet.mockReset();
    repository.insertItems.mockReset();
    repository.deleteItemsBySetId.mockReset();
  });

  it("lists word-card sets through an injected user-scoped repository client", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.list.mockResolvedValue({
      data: [makeSetRow()],
      error: null,
      count: 1
    });

    const { listAdminWordCardSets } = await import("@/lib/admin/word-card-sets.service");
    const result = await listAdminWordCardSets({ page: 1, pageSize: 20, q: "food" });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.list).toHaveBeenCalledWith({ from: 0, to: 19, q: "food" });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: "set-1", title: "Cafe words" });
  });

  it("creates word-card sets through the user-scoped repository and keeps audit writes", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.loadNextSortOrder.mockResolvedValue({ data: [{ sort_order: 3 }], error: null });
    repository.createSet.mockResolvedValue({ data: { id: "set-1" }, error: null });
    repository.insertItems.mockResolvedValue({ error: null });
    repository.loadDetail.mockResolvedValue({ data: makeSetRow({ sort_order: 4 }), error: null });

    const { createAdminWordCardSet } = await import("@/lib/admin/word-card-sets.service");
    const result = await createAdminWordCardSet(
      { userId: "admin-1" },
      {
        title: "Cafe words",
        description: null,
        topic_slug: "food",
        topic_title: "Еда",
        cefr_level: "A1",
        is_published: false,
        cards
      }
    );

    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.createSet).toHaveBeenCalledWith(expect.objectContaining({ title: "Cafe words", sort_order: 4 }));
    expect(repository.insertItems).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ set_id: "set-1", term: "word 1" })]));
    expect(writeAuditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "word_card_sets" }));
    expect(result.id).toBe("set-1");
  });
});
