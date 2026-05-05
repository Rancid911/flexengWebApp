import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Star
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { requireStaffAdminPage } from "@/lib/admin/auth";
import {
  DEFAULT_TEACHER_CERTIFICATES,
  DEFAULT_TEACHER_COOPERATION_TYPE,
  DEFAULT_TEACHER_CURRENCY,
  DEFAULT_TEACHER_INTERNAL_ROLE,
  DEFAULT_TEACHER_OPERATIONAL_STATUS,
  DEFAULT_TEACHER_TIMEZONE,
  getTeacherInternalRoleLabel,
  type TeacherCertificate,
  type TeacherCooperationType,
  type TeacherCurrency,
  type TeacherEducationLevel,
  type TeacherEnglishProficiency,
  type TeacherInternalRole,
  type TeacherLessonDuration,
  type TeacherLessonType,
  type TeacherOperationalStatus,
  type TeacherSpecialization,
  type TeacherTargetAudience,
  type TeacherTeachingApproach,
  type TeacherTeachingMaterial,
  type TeacherTimezone,
  type TeacherWeekday
} from "@/lib/admin/teacher-dossier-options";
import {
  getAdminTeacherDisplayName,
  getAdminTeacherInitials,
  loadAdminTeacherProfilePageData,
  toNullableAdminTeacherNumber
} from "@/lib/admin/teacher-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TeacherBasicInfoCard, type TeacherBasicInfoDto } from "./teacher-basic-info-card";
import { TeacherMethodologyStyleCard, type TeacherMethodologyStyleDto } from "./teacher-methodology-style-card";
import { TeacherOperationalInfoCard, type TeacherOperationalInfoDto } from "./teacher-operational-info-card";
import { TeacherProfessionalInfoCard, type TeacherProfessionalInfoDto } from "./teacher-professional-info-card";
import { TeacherWorkFormatCard, type TeacherWorkFormatDto } from "./teacher-work-format-card";

function formatHeroPhone(phone: string | null | undefined) {
  if (!phone) return null;
  const match = phone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  return `+7 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

function PlaceholderValue({ label = "Будет заполнено" }: { label?: string }) {
  return <span className="text-slate-400">{label}</span>;
}

function DossierField({
  label,
  value,
  placeholder = "Будет заполнено"
}: {
  label: string;
  value?: ReactNode;
  placeholder?: string;
}) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="min-h-[86px] rounded-xl border border-[#dfe9fb] bg-[#fbfdff] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p data-testid="teacher-dossier-readonly-value" className="mt-2 text-sm font-normal leading-6 text-slate-900">
        {hasValue ? value : <PlaceholderValue label={placeholder} />}
      </p>
    </div>
  );
}

function DossierSection({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1f7aff]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function TeacherDossierHero({
  displayName,
  initials,
  avatarUrl,
  email,
  phone
}: {
  displayName: string;
  initials: string;
  avatarUrl: string | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
}) {
  const formattedPhone = formatHeroPhone(phone);

  return (
    <section className="rounded-[2rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#0f172a_0%,#1f3d7a_55%,#2563eb_100%)] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
            <GraduationCap className="h-3.5 w-3.5" />
            Досье учителя
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">{displayName}</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#dbeafe] sm:text-base">
              Read-only профиль преподавателя с базовыми контактами и подготовленными блоками для профессиональных, операционных и юридических данных.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[220px] lg:max-w-xs lg:items-stretch">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <div className="flex items-center gap-3">
              <Avatar
                data-testid="teacher-hero-avatar"
                data-avatar-url={avatarUrl ?? ""}
                className="h-14 w-14 border border-white/25 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="border-white/25 bg-white/20 text-lg font-black text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-black">Teacher</p>
                <p className="truncate text-xs text-[#dbeafe]">{email ?? "Email не указан"}</p>
                <p className="truncate text-xs text-[#dbeafe]">{formattedPhone ?? "Телефон не указан"}</p>
              </div>
            </div>
          </div>
          <Link href="/admin/teachers" className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к учителям
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function AdminTeacherProfilePage({ params }: { params: Promise<{ teacherId: string }> }) {
  await requireStaffAdminPage();
  const { teacherId } = await params;
  const pageData = await loadAdminTeacherProfilePageData(teacherId);
  if (!pageData) {
    notFound();
  }

  const { teacher, profile, dossier } = pageData;
  const displayName = getAdminTeacherDisplayName(profile, "Преподаватель");
  const initials = getAdminTeacherInitials(displayName);
  const internalRole = (dossier?.internal_role || DEFAULT_TEACHER_INTERNAL_ROLE) as TeacherInternalRole;
  const timezone = (dossier?.timezone || DEFAULT_TEACHER_TIMEZONE) as TeacherTimezone;
  const basicInfo: TeacherBasicInfoDto = {
    teacherId: teacher.id,
    profileId: teacher.profile_id,
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    patronymic: dossier?.patronymic ?? null,
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    internalRole,
    internalRoleLabel: getTeacherInternalRoleLabel(internalRole),
    timezone
  };
  const professionalInfo: TeacherProfessionalInfoDto = {
    teacherId: teacher.id,
    englishProficiency: (dossier?.english_proficiency ?? "") as TeacherEnglishProficiency | "",
    specializations: (dossier?.specializations ?? []) as TeacherSpecialization[],
    teachingExperienceYears: toNullableAdminTeacherNumber(dossier?.teaching_experience_years),
    educationLevel: (dossier?.education_level ?? "") as TeacherEducationLevel | "",
    certificates: ((dossier?.certificates?.length ? dossier.certificates : DEFAULT_TEACHER_CERTIFICATES) as TeacherCertificate[]),
    targetAudiences: (dossier?.target_audiences ?? []) as TeacherTargetAudience[],
    certificateOther: dossier?.certificate_other ?? "",
    teacherBio: dossier?.teacher_bio ?? ""
  };
  const workFormat: TeacherWorkFormatDto = {
    teacherId: teacher.id,
    availableWeekdays: (dossier?.available_weekdays ?? []) as TeacherWeekday[],
    timeSlots: dossier?.time_slots ?? "",
    maxLessonsPerDay: toNullableAdminTeacherNumber(dossier?.max_lessons_per_day),
    maxLessonsPerWeek: toNullableAdminTeacherNumber(dossier?.max_lessons_per_week),
    lessonTypes: (dossier?.lesson_types ?? []) as TeacherLessonType[],
    lessonDurations: (dossier?.lesson_durations ?? []) as TeacherLessonDuration[]
  };
  const methodologyStyle: TeacherMethodologyStyleDto = {
    teacherId: teacher.id,
    teachingApproach: (dossier?.teaching_approach ?? "") as TeacherTeachingApproach | "",
    teachingMaterials: (dossier?.teaching_materials ?? []) as TeacherTeachingMaterial[],
    teachingFeatures: dossier?.teaching_features ?? ""
  };
  const operationalInfo: TeacherOperationalInfoDto = {
    teacherId: teacher.id,
    status: (dossier?.operational_status || DEFAULT_TEACHER_OPERATIONAL_STATUS) as TeacherOperationalStatus,
    startDate: dossier?.start_date ?? null,
    cooperationType: (dossier?.cooperation_type || DEFAULT_TEACHER_COOPERATION_TYPE) as TeacherCooperationType,
    lessonRateAmount: toNullableAdminTeacherNumber(dossier?.lesson_rate_amount),
    currency: (dossier?.currency || DEFAULT_TEACHER_CURRENCY) as TeacherCurrency
  };

  return (
    <div className="space-y-5 pb-8">
      <TeacherDossierHero displayName={displayName} initials={initials} avatarUrl={profile?.avatar_url} email={profile?.email} phone={profile?.phone} />

      <TeacherBasicInfoCard initialData={basicInfo} />

      <TeacherProfessionalInfoCard initialData={professionalInfo} />

      <TeacherWorkFormatCard initialData={workFormat} />

      <TeacherMethodologyStyleCard initialData={methodologyStyle} />

      <TeacherOperationalInfoCard initialData={operationalInfo} />

      <DossierSection icon={Star} title="Метрики" description="Будущие показатели качества, загрузки и удержания учеников.">
        <DossierField label="Проведено уроков" />
        <DossierField label="Активные ученики" />
        <DossierField label="Retention rate" />
        <DossierField label="Средний рейтинг" />
        <DossierField label="Процент отмен" />
      </DossierSection>

      <DossierSection
        icon={FileText}
        title="Юридические и документы"
        description="Раздел для договоров и юридических статусов без отображения паспортных или банковских данных."
      >
        <DossierField label="Договор" />
        <DossierField label="Налоговый статус" />
        <DossierField label="Реквизиты для оплаты" />
        <DossierField label="Документы" />
      </DossierSection>
    </div>
  );
}
