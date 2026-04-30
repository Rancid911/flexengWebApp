-- Расширение teacher_dossiers под блок "Методика и стиль".
-- Можно запускать в Supabase SQL Editor повторно.

alter table public.teacher_dossiers
  add column if not exists teaching_approach text,
  add column if not exists teaching_materials text[] not null default array[]::text[],
  add column if not exists teaching_features text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_teaching_approach_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_teaching_approach_check
      check (
        teaching_approach is null
        or teaching_approach in ('conversational', 'grammar', 'mixed')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_teaching_materials_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_teaching_materials_check
      check (
        teaching_materials <@ array['own_materials', 'textbooks', 'platform']::text[]
        and cardinality(teaching_materials) <= 3
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_teaching_features_length_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_teaching_features_length_check
      check (teaching_features is null or length(teaching_features) <= 5000);
  end if;
end $$;
