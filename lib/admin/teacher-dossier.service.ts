import type { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError } from "@/lib/admin/http";
import {
  DEFAULT_TEACHER_INTERNAL_ROLE,
  DEFAULT_TEACHER_TIMEZONE,
  getTeacherInternalRoleLabel
} from "@/lib/admin/teacher-dossier-options";
import {
  createTeacherDossierRepository,
  type TeacherProfileRow
} from "@/lib/admin/teacher-dossier.repository";
import type { AdminActor } from "@/lib/admin/types";
import {
  teacherBasicInfoUpdateSchema,
  teacherMethodologyStyleUpdateSchema,
  teacherOperationalInfoUpdateSchema,
  teacherProfessionalInfoUpdateSchema,
  teacherWorkFormatUpdateSchema
} from "@/lib/admin/validation";
import { invalidateFullAppActorCache } from "@/lib/auth/request-context";

type TeacherBasicInfoInput = z.infer<typeof teacherBasicInfoUpdateSchema>;
type TeacherProfessionalInfoInput = z.infer<typeof teacherProfessionalInfoUpdateSchema>;
type TeacherMethodologyStyleInput = z.infer<typeof teacherMethodologyStyleUpdateSchema>;
type TeacherOperationalInfoInput = z.infer<typeof teacherOperationalInfoUpdateSchema>;
type TeacherWorkFormatInput = z.infer<typeof teacherWorkFormatUpdateSchema>;

type TeacherRepository = ReturnType<typeof createTeacherDossierRepository>;

function readTeacherProfile(row: TeacherProfileRow) {
  return Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
}

async function loadTeacher(repository: TeacherRepository, teacherId: string) {
  const teacherResponse = await repository.loadTeacher(teacherId);
  if (teacherResponse.error) {
    throw new AdminHttpError(500, "TEACHER_FETCH_FAILED", "Failed to load teacher", teacherResponse.error.message);
  }
  if (!teacherResponse.data) {
    throw new AdminHttpError(404, "TEACHER_NOT_FOUND", "Teacher not found");
  }
  return teacherResponse.data as { id: string };
}

async function loadTeacherWithProfile(repository: TeacherRepository, teacherId: string) {
  const teacherResponse = await repository.loadTeacherWithProfile(teacherId);
  if (teacherResponse.error) {
    throw new AdminHttpError(500, "TEACHER_FETCH_FAILED", "Failed to load teacher", teacherResponse.error.message);
  }
  if (!teacherResponse.data) {
    throw new AdminHttpError(404, "TEACHER_NOT_FOUND", "Teacher not found");
  }
  return teacherResponse.data as TeacherProfileRow;
}

async function loadDossierSnapshot(repository: TeacherRepository, teacherId: string, select: string) {
  const beforeResponse = await repository.loadDossierSnapshot(teacherId, select);
  if (beforeResponse.error) {
    throw new AdminHttpError(500, "TEACHER_DOSSIER_FETCH_FAILED", "Failed to load teacher dossier", beforeResponse.error.message);
  }
  return beforeResponse.data;
}

async function upsertDossier(repository: TeacherRepository, patch: Record<string, unknown>) {
  const dossierUpsert = await repository.upsertDossier(patch);
  if (dossierUpsert.error) {
    throw new AdminHttpError(500, "TEACHER_DOSSIER_UPDATE_FAILED", "Failed to update teacher dossier", dossierUpsert.error.message);
  }
}

export async function updateTeacherBasicInfo(actor: AdminActor, teacherId: string, input: TeacherBasicInfoInput) {
  const repository = createTeacherDossierRepository();
  const teacher = await loadTeacherWithProfile(repository, teacherId);
  const profile = readTeacherProfile(teacher);
  if (!profile) {
    throw new AdminHttpError(404, "TEACHER_PROFILE_NOT_FOUND", "Teacher profile not found");
  }

  const nextDisplayName = `${input.first_name} ${input.last_name}`.trim();
  const profilePatch = {
    first_name: input.first_name,
    last_name: input.last_name,
    display_name: nextDisplayName,
    email: input.email,
    phone: input.phone
  };

  const profileUpdate = await repository.updateProfile(teacher.profile_id, profilePatch);
  if (profileUpdate.error) {
    throw new AdminHttpError(500, "TEACHER_PROFILE_UPDATE_FAILED", "Failed to update teacher profile", profileUpdate.error.message);
  }

  if (input.email !== profile.email) {
    const authUpdate = await repository.updateAuthEmail(teacher.profile_id, input.email);
    if (authUpdate.error) {
      throw new AdminHttpError(500, "TEACHER_AUTH_UPDATE_FAILED", "Failed to update teacher auth email", authUpdate.error.message);
    }
  }

  await upsertDossier(repository, {
    teacher_id: teacher.id,
    patronymic: input.patronymic ?? null,
    internal_role: input.internal_role,
    timezone: input.timezone,
    updated_by_profile_id: actor.userId
  });

  const payload = {
    teacherId: teacher.id,
    profileId: teacher.profile_id,
    firstName: input.first_name,
    lastName: input.last_name,
    patronymic: input.patronymic ?? null,
    email: input.email,
    phone: input.phone,
    internalRole: input.internal_role || DEFAULT_TEACHER_INTERNAL_ROLE,
    internalRoleLabel: getTeacherInternalRoleLabel(input.internal_role || DEFAULT_TEACHER_INTERNAL_ROLE),
    timezone: input.timezone || DEFAULT_TEACHER_TIMEZONE
  };

  await writeAudit({
    actorUserId: actor.userId,
    entity: "teacher_dossiers",
    entityId: teacher.id,
    action: "update",
    before: { profile, dossier: null },
    after: payload
  });
  await invalidateFullAppActorCache(teacher.profile_id);

  return payload;
}

export async function updateTeacherProfessionalInfo(actor: AdminActor, teacherId: string, input: TeacherProfessionalInfoInput) {
  const repository = createTeacherDossierRepository();
  const teacher = await loadTeacher(repository, teacherId);
  const before = await loadDossierSnapshot(
    repository,
    teacher.id,
    "teacher_id, english_proficiency, specializations, teaching_experience_years, education_level, certificates, target_audiences, certificate_other, teacher_bio"
  );

  await upsertDossier(repository, {
    teacher_id: teacher.id,
    english_proficiency: input.english_proficiency,
    specializations: input.specializations,
    teaching_experience_years: input.teaching_experience_years,
    education_level: input.education_level,
    certificates: input.certificates,
    target_audiences: input.target_audiences,
    certificate_other: input.certificate_other ?? null,
    teacher_bio: input.teacher_bio ?? null,
    updated_by_profile_id: actor.userId
  });

  const payload = {
    teacherId: teacher.id,
    englishProficiency: input.english_proficiency ?? "",
    specializations: input.specializations,
    teachingExperienceYears: input.teaching_experience_years,
    educationLevel: input.education_level ?? "",
    certificates: input.certificates,
    targetAudiences: input.target_audiences,
    certificateOther: input.certificate_other ?? "",
    teacherBio: input.teacher_bio ?? ""
  };

  await writeAudit({ actorUserId: actor.userId, entity: "teacher_dossiers", entityId: teacher.id, action: "update", before, after: payload });
  return payload;
}

export async function updateTeacherMethodologyStyle(actor: AdminActor, teacherId: string, input: TeacherMethodologyStyleInput) {
  const repository = createTeacherDossierRepository();
  const teacher = await loadTeacher(repository, teacherId);
  const before = await loadDossierSnapshot(repository, teacher.id, "teacher_id, teaching_approach, teaching_materials, teaching_features");

  await upsertDossier(repository, {
    teacher_id: teacher.id,
    teaching_approach: input.teaching_approach,
    teaching_materials: input.teaching_materials,
    teaching_features: input.teaching_features ?? null,
    updated_by_profile_id: actor.userId
  });

  const payload = {
    teacherId: teacher.id,
    teachingApproach: input.teaching_approach ?? "",
    teachingMaterials: input.teaching_materials,
    teachingFeatures: input.teaching_features ?? ""
  };

  await writeAudit({ actorUserId: actor.userId, entity: "teacher_dossiers", entityId: teacher.id, action: "update", before, after: payload });
  return payload;
}

export async function updateTeacherOperationalInfo(actor: AdminActor, teacherId: string, input: TeacherOperationalInfoInput) {
  const repository = createTeacherDossierRepository();
  const teacher = await loadTeacher(repository, teacherId);
  const before = await loadDossierSnapshot(
    repository,
    teacher.id,
    "teacher_id, operational_status, start_date, cooperation_type, lesson_rate_amount, currency"
  );

  await upsertDossier(repository, {
    teacher_id: teacher.id,
    operational_status: input.status,
    start_date: input.start_date ?? null,
    cooperation_type: input.cooperation_type,
    lesson_rate_amount: input.lesson_rate_amount,
    currency: input.currency,
    updated_by_profile_id: actor.userId
  });

  const payload = {
    teacherId: teacher.id,
    status: input.status,
    startDate: input.start_date ?? null,
    cooperationType: input.cooperation_type,
    lessonRateAmount: input.lesson_rate_amount,
    currency: input.currency
  };

  await writeAudit({ actorUserId: actor.userId, entity: "teacher_dossiers", entityId: teacher.id, action: "update", before, after: payload });
  return payload;
}

export async function updateTeacherWorkFormat(actor: AdminActor, teacherId: string, input: TeacherWorkFormatInput) {
  const repository = createTeacherDossierRepository();
  const teacher = await loadTeacher(repository, teacherId);
  const before = await loadDossierSnapshot(
    repository,
    teacher.id,
    "teacher_id, available_weekdays, time_slots, max_lessons_per_day, max_lessons_per_week, lesson_types, lesson_durations"
  );

  await upsertDossier(repository, {
    teacher_id: teacher.id,
    available_weekdays: input.available_weekdays,
    time_slots: input.time_slots ?? null,
    max_lessons_per_day: input.max_lessons_per_day,
    max_lessons_per_week: input.max_lessons_per_week,
    lesson_types: input.lesson_types,
    lesson_durations: input.lesson_durations,
    updated_by_profile_id: actor.userId
  });

  const payload = {
    teacherId: teacher.id,
    availableWeekdays: input.available_weekdays,
    timeSlots: input.time_slots ?? "",
    maxLessonsPerDay: input.max_lessons_per_day,
    maxLessonsPerWeek: input.max_lessons_per_week,
    lessonTypes: input.lesson_types,
    lessonDurations: input.lesson_durations
  };

  await writeAudit({ actorUserId: actor.userId, entity: "teacher_dossiers", entityId: teacher.id, action: "update", before, after: payload });
  return payload;
}
