export const teacherInternalRoleOptions = [
  { value: "teacher", label: "Teacher" },
  { value: "senior_teacher", label: "Senior Teacher" },
  { value: "methodologist", label: "Methodologist" }
] as const;

export const teacherTimezoneOptions = [
  { value: "Europe/Moscow", label: "Europe/Moscow" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Yerevan", label: "Asia/Yerevan" },
  { value: "Asia/Tbilisi", label: "Asia/Tbilisi" },
  { value: "Asia/Almaty", label: "Asia/Almaty" }
] as const;

export type TeacherInternalRole = (typeof teacherInternalRoleOptions)[number]["value"];
export type TeacherTimezone = (typeof teacherTimezoneOptions)[number]["value"];

export const DEFAULT_TEACHER_INTERNAL_ROLE: TeacherInternalRole = "teacher";
export const DEFAULT_TEACHER_TIMEZONE: TeacherTimezone = "Europe/Moscow";

export function getTeacherInternalRoleLabel(value: string | null | undefined) {
  return teacherInternalRoleOptions.find((option) => option.value === value)?.label ?? "Teacher";
}

export const teacherEnglishProficiencyOptions = [
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "native", label: "Native" }
] as const;

export const teacherSpecializationOptions = [
  { value: "general_english", label: "General English" },
  { value: "business_english", label: "Business English" },
  { value: "it_english", label: "IT English" },
  { value: "exam_preparation", label: "Exam Preparation" },
  { value: "speaking", label: "Speaking" },
  { value: "grammar", label: "Grammar" }
] as const;

export const teacherEducationLevelOptions = [
  { value: "higher_linguistic", label: "Высшее лингвистическое" },
  { value: "higher", label: "Высшее" },
  { value: "secondary", label: "Среднее" }
] as const;

export const teacherCertificateOptions = [
  { value: "none", label: "Нет" },
  { value: "ielts", label: "IELTS" },
  { value: "celta", label: "CELTA" },
  { value: "tesol", label: "TESOL" },
  { value: "other", label: "Другой" }
] as const;

export const teacherTargetAudienceOptions = [
  { value: "adults", label: "Взрослые" },
  { value: "children", label: "Дети" },
  { value: "teenagers", label: "Подростки" },
  { value: "beginners", label: "Начинающие (A1-A2)" },
  { value: "intermediate", label: "Средний уровень (B1-B2)" },
  { value: "advanced", label: "Продвинутый (C1+)" },
  { value: "it_specialists", label: "IT-специалисты" },
  { value: "entrepreneurs", label: "Предприниматели" },
  { value: "interview_preparation", label: "Подготовка к собеседованиям" },
  { value: "relocation", label: "Переезд и релокация" }
] as const;

export const teacherWeekdayOptions = [
  { value: "monday", label: "Понедельник" },
  { value: "tuesday", label: "Вторник" },
  { value: "wednesday", label: "Среда" },
  { value: "thursday", label: "Четверг" },
  { value: "friday", label: "Пятница" },
  { value: "saturday", label: "Суббота" },
  { value: "sunday", label: "Воскресенье" }
] as const;

export const teacherLessonTypeOptions = [
  { value: "individual", label: "Индивидуальные" },
  { value: "group", label: "Групповые" }
] as const;

export const teacherLessonDurationOptions = [
  { value: "30", label: "30 минут" },
  { value: "60", label: "60 минут" },
  { value: "90", label: "90 минут" }
] as const;

export const teacherTeachingApproachOptions = [
  { value: "conversational", label: "Разговорный" },
  { value: "grammar", label: "Грамматический" },
  { value: "mixed", label: "Смешанный" }
] as const;

export const teacherTeachingMaterialOptions = [
  { value: "own_materials", label: "Свои" },
  { value: "textbooks", label: "Учебники" },
  { value: "platform", label: "Платформа" }
] as const;

export const teacherOperationalStatusOptions = [
  { value: "active", label: "Активный" },
  { value: "inactive", label: "Неактивный" },
  { value: "on_vacation", label: "В отпуске" }
] as const;

export const teacherCooperationTypeOptions = [
  { value: "freelance", label: "Фриланс" },
  { value: "staff", label: "Штат" }
] as const;

export const teacherCurrencyOptions = [{ value: "RUB", label: "Рубли" }] as const;

export type TeacherEnglishProficiency = (typeof teacherEnglishProficiencyOptions)[number]["value"];
export type TeacherSpecialization = (typeof teacherSpecializationOptions)[number]["value"];
export type TeacherEducationLevel = (typeof teacherEducationLevelOptions)[number]["value"];
export type TeacherCertificate = (typeof teacherCertificateOptions)[number]["value"];
export type TeacherTargetAudience = (typeof teacherTargetAudienceOptions)[number]["value"];
export type TeacherWeekday = (typeof teacherWeekdayOptions)[number]["value"];
export type TeacherLessonType = (typeof teacherLessonTypeOptions)[number]["value"];
export type TeacherLessonDuration = (typeof teacherLessonDurationOptions)[number]["value"];
export type TeacherTeachingApproach = (typeof teacherTeachingApproachOptions)[number]["value"];
export type TeacherTeachingMaterial = (typeof teacherTeachingMaterialOptions)[number]["value"];
export type TeacherOperationalStatus = (typeof teacherOperationalStatusOptions)[number]["value"];
export type TeacherCooperationType = (typeof teacherCooperationTypeOptions)[number]["value"];
export type TeacherCurrency = (typeof teacherCurrencyOptions)[number]["value"];

export const DEFAULT_TEACHER_CERTIFICATES: TeacherCertificate[] = ["none"];
export const DEFAULT_TEACHER_OPERATIONAL_STATUS: TeacherOperationalStatus = "active";
export const DEFAULT_TEACHER_COOPERATION_TYPE: TeacherCooperationType = "freelance";
export const DEFAULT_TEACHER_CURRENCY: TeacherCurrency = "RUB";
