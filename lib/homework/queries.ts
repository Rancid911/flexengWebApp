import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

export type HomeworkListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  itemCount: number;
};

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

export async function getHomeworkAssignments(status?: "active" | "completed" | "overdue") {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("homework_assignments")
    .select("id, title, description, status, due_at, homework_items(id)")
    .eq("student_id", profile.studentId)
    .order("due_at", { ascending: true });

  if (status === "active") {
    query = query.in("status", ["not_started", "in_progress"]);
  } else if (status === "completed") {
    query = query.eq("status", "completed");
  } else if (status === "overdue") {
    query = query.eq("status", "overdue");
  }

  const { data, error } = await query;
  if (error) {
    if (isSchemaMissing(error.message)) return [];
    return [];
  }

  return (data ?? []).map(
    (item): HomeworkListItem => ({
      id: String(item.id),
      title: item.title ?? "Домашнее задание",
      description: item.description ?? null,
      status: String(item.status ?? "not_started"),
      dueAt: item.due_at ?? null,
      itemCount: Array.isArray(item.homework_items) ? item.homework_items.length : 0
    })
  );
}

export async function getHomeworkAssignmentDetail(id: string) {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homework_assignments")
    .select("id, title, description, status, due_at, completed_at, homework_items(id, source_type, source_id, sort_order, required)")
    .eq("student_id", profile.studentId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isSchemaMissing(error.message)) return null;
    return null;
  }

  return data;
}
