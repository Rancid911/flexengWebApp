import { toAvatarMediaUrl } from "@/lib/media/urls";
import { createClient } from "@/lib/supabase/server";

export type AdminTeacherProfileRelation = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

export type AdminTeacherProfileRow = {
  id: string;
  profile_id: string;
  profiles: AdminTeacherProfileRelation | AdminTeacherProfileRelation[] | null;
};

export type AdminTeacherDossierRow = {
  teacher_id: string;
  patronymic: string | null;
  internal_role: string | null;
  timezone: string | null;
  english_proficiency: string | null;
  specializations: string[] | null;
  teaching_experience_years: number | null;
  education_level: string | null;
  certificates: string[] | null;
  target_audiences: string[] | null;
  certificate_other: string | null;
  teacher_bio: string | null;
  available_weekdays: string[] | null;
  time_slots: string | null;
  max_lessons_per_day: number | null;
  max_lessons_per_week: number | null;
  lesson_types: string[] | null;
  lesson_durations: string[] | null;
  teaching_approach: string | null;
  teaching_materials: string[] | null;
  teaching_features: string | null;
  operational_status: string | null;
  start_date: string | null;
  cooperation_type: string | null;
  lesson_rate_amount: number | string | null;
  currency: string | null;
};

export function readAdminTeacherProfileRelation(row: AdminTeacherProfileRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
  if (!profile) return null;
  return {
    ...profile,
    avatar_url: toAvatarMediaUrl(profile.id, profile.avatar_url)
  };
}

export function getAdminTeacherDisplayName(profile: AdminTeacherProfileRelation | null, fallback: string) {
  if (!profile) return fallback;
  const displayName = profile.display_name?.trim();
  if (displayName) return displayName;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email || fallback;
}

export function getAdminTeacherInitials(displayName: string) {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "T";
}

export function toNullableAdminTeacherNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function loadAdminTeacherProfilePageData(teacherId: string) {
  const supabase = await createClient();
  const response = await supabase
    .from("teachers")
    .select("id, profile_id, profiles!inner(id, display_name, first_name, last_name, email, phone, avatar_url, created_at)")
    .eq("id", teacherId)
    .maybeSingle();

  if (response.error) {
    throw new Error(`Failed to fetch teacher profile: ${response.error.message}`);
  }
  if (!response.data) {
    return null;
  }

  const teacher = response.data as AdminTeacherProfileRow;
  const dossierResponse = await supabase
    .from("teacher_dossiers")
    .select(
      "teacher_id, patronymic, internal_role, timezone, english_proficiency, specializations, teaching_experience_years, education_level, certificates, target_audiences, certificate_other, teacher_bio, available_weekdays, time_slots, max_lessons_per_day, max_lessons_per_week, lesson_types, lesson_durations, teaching_approach, teaching_materials, teaching_features, operational_status, start_date, cooperation_type, lesson_rate_amount, currency"
    )
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  return {
    teacher,
    profile: readAdminTeacherProfileRelation(teacher),
    dossier: dossierResponse.error ? null : (dossierResponse.data as AdminTeacherDossierRow | null)
  };
}
