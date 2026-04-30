import type { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, paginated } from "@/lib/admin/http";
import type { PaginatedResponse, AdminWordCardSetDetailDto, AdminWordCardSetDto } from "@/lib/admin/types";
import { adminWordCardSetCreateSchema, adminWordCardSetUpdateSchema } from "@/lib/admin/validation";
import { toWordCardSetDetailDto, toWordCardSetDto } from "@/lib/admin/word-card-sets";
import { createAdminWordCardSetRepository } from "@/lib/admin/word-card-sets.repository";

type AdminActor = { userId: string };
type AdminWordCardSetCreateInput = z.infer<typeof adminWordCardSetCreateSchema>;
type AdminWordCardSetUpdateInput = z.infer<typeof adminWordCardSetUpdateSchema>;

type ListInput = {
  page: number;
  pageSize: number;
  q?: string;
};

function toItemPayload(setId: string, cards: AdminWordCardSetCreateInput["cards"] | NonNullable<AdminWordCardSetUpdateInput["cards"]>) {
  return cards.map((card, index) => ({
    set_id: setId,
    term: card.term,
    translation: card.translation,
    example_sentence: card.example_sentence,
    example_translation: card.example_translation,
    sort_order: card.sort_order ?? index
  }));
}

export async function listAdminWordCardSets({ page, pageSize, q }: ListInput): Promise<PaginatedResponse<AdminWordCardSetDto>> {
  const repository = createAdminWordCardSetRepository();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await repository.list({ from, to, q });
  if (error) throw new AdminHttpError(500, "WORD_CARD_SETS_FETCH_FAILED", "Failed to fetch word card sets", error.message);

  return paginated((data ?? []).map((item) => toWordCardSetDto(item as Record<string, unknown>)), count ?? 0, page, pageSize);
}

export async function getAdminWordCardSet(id: string): Promise<AdminWordCardSetDetailDto> {
  const repository = createAdminWordCardSetRepository();
  const { data, error } = await repository.loadDetail(id);
  if (error) throw new AdminHttpError(404, "WORD_CARD_SET_NOT_FOUND", "Word card set not found", error.message);
  return toWordCardSetDetailDto(data as Record<string, unknown>);
}

export async function createAdminWordCardSet(actor: AdminActor, input: AdminWordCardSetCreateInput): Promise<AdminWordCardSetDetailDto> {
  const repository = createAdminWordCardSetRepository();
  const { cards, ...setPayload } = input;

  if (setPayload.sort_order == null) {
    const { data, error } = await repository.loadNextSortOrder();
    if (error) throw new AdminHttpError(500, "WORD_CARD_SORT_FETCH_FAILED", "Failed to calculate sort order", error.message);
    setPayload.sort_order = Number(data?.[0]?.sort_order ?? -1) + 1;
  }

  const { data: createdSet, error: setError } = await repository.createSet(setPayload);
  if (setError) throw new AdminHttpError(500, "WORD_CARD_SET_CREATE_FAILED", "Failed to create word card set", setError.message);

  const createdSetId = String(createdSet.id);
  const { error: itemsError } = await repository.insertItems(toItemPayload(createdSetId, cards));
  if (itemsError) {
    await repository.deleteSet(createdSetId);
    throw new AdminHttpError(500, "WORD_CARD_ITEMS_CREATE_FAILED", "Failed to create word card items", itemsError.message);
  }

  const { data: detail, error: detailError } = await repository.loadDetail(createdSetId);
  if (detailError) throw new AdminHttpError(500, "WORD_CARD_SET_FETCH_FAILED", "Failed to load created word card set", detailError.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "word_card_sets",
    entityId: createdSetId,
    action: "create",
    after: detail
  });

  return toWordCardSetDetailDto(detail as Record<string, unknown>);
}

export async function updateAdminWordCardSet(actor: AdminActor, id: string, input: AdminWordCardSetUpdateInput): Promise<AdminWordCardSetDetailDto> {
  const repository = createAdminWordCardSetRepository();
  const { data: before, error: beforeError } = await repository.loadDetail(id);
  if (beforeError) throw new AdminHttpError(404, "WORD_CARD_SET_NOT_FOUND", "Word card set not found", beforeError.message);

  const { cards, ...setPatch } = input;
  if (setPatch.is_published && !cards && (!Array.isArray(before.word_card_items) || before.word_card_items.length < 5)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid word card set payload", {
      fieldErrors: {
        cards: ["published word card set requires at least 5 cards"]
      }
    });
  }

  if (Object.keys(setPatch).length > 0) {
    const { error: updateError } = await repository.updateSet(id, setPatch);
    if (updateError) throw new AdminHttpError(500, "WORD_CARD_SET_UPDATE_FAILED", "Failed to update word card set", updateError.message);
  }

  if (cards) {
    const { error: deleteItemsError } = await repository.deleteItemsBySetId(id);
    if (deleteItemsError) throw new AdminHttpError(500, "WORD_CARD_ITEMS_DELETE_FAILED", "Failed to replace word card items", deleteItemsError.message);

    const { error: insertItemsError } = await repository.insertItems(toItemPayload(id, cards));
    if (insertItemsError) throw new AdminHttpError(500, "WORD_CARD_ITEMS_UPDATE_FAILED", "Failed to update word card items", insertItemsError.message);
  }

  const { data: after, error: afterError } = await repository.loadDetail(id);
  if (afterError) throw new AdminHttpError(500, "WORD_CARD_SET_FETCH_FAILED", "Failed to load updated word card set", afterError.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "word_card_sets",
    entityId: id,
    action: "update",
    before,
    after
  });

  return toWordCardSetDetailDto(after as Record<string, unknown>);
}

export async function deleteAdminWordCardSet(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminWordCardSetRepository();
  const { data: before, error: beforeError } = await repository.loadRaw(id);
  if (beforeError) throw new AdminHttpError(404, "WORD_CARD_SET_NOT_FOUND", "Word card set not found", beforeError.message);

  const { error } = await repository.deleteSet(id);
  if (error) throw new AdminHttpError(500, "WORD_CARD_SET_DELETE_FAILED", "Failed to delete word card set", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "word_card_sets",
    entityId: id,
    action: "delete",
    before
  });

  return { ok: true };
}
