begin;

create or replace function public.get_schedule_teacher_options(p_teacher_ids uuid[] default null)
returns table (
  id uuid,
  label text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id,
    coalesce(
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      nullif(p.display_name, ''),
      p.email,
      'Преподаватель'
    ) as label
  from public.teachers t
  left join public.profiles p on p.id = t.profile_id
  where (p_teacher_ids is null or t.id = any(p_teacher_ids))
    and (
      t.profile_id = auth.uid()
      or app_private.has_permission('teachers.view', 'all')
      or app_private.has_permission('schedule.view', 'all')
      or exists (
        select 1
        from public.student_schedule_lessons ssl
        where ssl.teacher_id = t.id
          and app_private.can_access_student(ssl.student_id)
      )
    )
  order by t.created_at asc;
$$;

revoke all on function public.get_schedule_teacher_options(uuid[]) from public;
revoke all on function public.get_schedule_teacher_options(uuid[]) from anon;
grant execute on function public.get_schedule_teacher_options(uuid[]) to authenticated;

comment on function public.get_schedule_teacher_options(uuid[]) is
  'Returns schedule-visible teacher labels, preferring first_name + last_name over display_name role placeholders.';

commit;
