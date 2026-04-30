import { WORD_CARD_SET_DETAIL_SELECT } from "@/lib/admin/word-card-sets";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminWordCardSetRepositoryClient = ReturnType<typeof createAdminClient>;

export function createAdminWordCardSetRepository(client: AdminWordCardSetRepositoryClient = createAdminClient()) {
  return {
    async loadNextSortOrder() {
      return await client.from("word_card_sets").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    },

    async list({ from, to, q }: { from: number; to: number; q?: string }) {
      let query = client
        .from("word_card_sets")
        .select("*, word_card_items(id)", { count: "exact" })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,topic_slug.ilike.%${q}%,topic_title.ilike.%${q}%,cefr_level.ilike.%${q}%`);
      }

      return await query;
    },

    async listMaterials(q?: string) {
      let query = client
        .from("word_card_sets")
        .select("*, word_card_items(id)")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,topic_slug.ilike.%${q}%,topic_title.ilike.%${q}%,cefr_level.ilike.%${q}%`);
      }

      return await query;
    },

    async loadDetail(id: string) {
      return await client.from("word_card_sets").select(WORD_CARD_SET_DETAIL_SELECT).eq("id", id).single();
    },

    async loadRaw(id: string) {
      return await client.from("word_card_sets").select("*").eq("id", id).single();
    },

    async createSet(payload: Record<string, unknown>) {
      return await client.from("word_card_sets").insert(payload).select("*").single();
    },

    async updateSet(id: string, patch: Record<string, unknown>) {
      return await client.from("word_card_sets").update(patch).eq("id", id);
    },

    async deleteSet(id: string) {
      return await client.from("word_card_sets").delete().eq("id", id);
    },

    async insertItems(items: Array<Record<string, unknown>>) {
      return await client.from("word_card_items").insert(items);
    },

    async deleteItemsBySetId(setId: string) {
      return await client.from("word_card_items").delete().eq("set_id", setId);
    }
  };
}
