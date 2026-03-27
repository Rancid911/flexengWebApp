import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

export async function getStudentWords() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_words")
    .select("id, term, translation, status, next_review_at, created_at")
    .eq("student_id", profile.studentId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isSchemaMissing(error.message)) return [];
    return [];
  }
  return data ?? [];
}

export async function getWordsForReview() {
  const words = await getStudentWords();
  const now = Date.now();
  return words.filter((item) => !item.next_review_at || new Date(item.next_review_at).getTime() <= now);
}

export async function getNewWords() {
  const words = await getStudentWords();
  return words.filter((item) => item.status === "new").slice(0, 50);
}
