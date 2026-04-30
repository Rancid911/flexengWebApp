create table if not exists public.teacher_dossiers (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  patronymic text,
  internal_role text not null default 'teacher',
  timezone text not null default 'Europe/Moscow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  constraint teacher_dossiers_internal_role_check check (internal_role in ('teacher', 'senior_teacher', 'methodologist')),
  constraint teacher_dossiers_timezone_check check (
    timezone in (
      'Europe/Moscow',
      'Europe/London',
      'Europe/Berlin',
      'Asia/Dubai',
      'Asia/Yerevan',
      'Asia/Tbilisi',
      'Asia/Almaty'
    )
  )
);

drop trigger if exists trg_teacher_dossiers_updated_at on public.teacher_dossiers;
create trigger trg_teacher_dossiers_updated_at
before update on public.teacher_dossiers
for each row execute function public.touch_teacher_workspace_updated_at();
