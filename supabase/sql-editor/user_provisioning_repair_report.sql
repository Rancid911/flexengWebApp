-- Production-safe, read-only report for user provisioning drift.

select
  p.id as profile_id,
  p.email,
  p.role as profile_role,
  s.id as student_id,
  t.id as teacher_id,
  coalesce(array_agg(distinct r.key) filter (where r.key is not null), array[]::text[]) as rbac_roles,
  case
    when p.role = 'student' and s.id is null and t.id is not null then 'student_profile_has_teacher_identity'
    when p.role = 'teacher' and t.id is null and s.id is not null then 'teacher_profile_has_student_identity'
    when s.id is not null and t.id is not null then 'multiple_linked_identities'
    when p.role = 'student' and s.id is null then 'missing_student_identity'
    when p.role = 'teacher' and t.id is null then 'missing_teacher_identity'
    when not exists (
      select 1
      from public.user_roles existing_ur
      join public.roles existing_r on existing_r.id = existing_ur.role_id
      where existing_ur.user_id = p.id
        and existing_r.key = p.role
    ) then 'missing_matching_rbac_role'
    else 'ok'
  end as provisioning_status
from public.profiles p
left join public.students s on s.profile_id = p.id
left join public.teachers t on t.profile_id = p.id
left join public.user_roles ur on ur.user_id = p.id
left join public.roles r on r.id = ur.role_id
group by p.id, p.email, p.role, s.id, t.id
having
  (p.role = 'student' and s.id is null and t.id is not null)
  or (p.role = 'teacher' and t.id is null and s.id is not null)
  or (s.id is not null and t.id is not null)
  or (p.role = 'student' and s.id is null)
  or (p.role = 'teacher' and t.id is null)
  or not exists (
    select 1
    from public.user_roles existing_ur
    join public.roles existing_r on existing_r.id = existing_ur.role_id
    where existing_ur.user_id = p.id
      and existing_r.key = p.role
  )
order by p.created_at, p.id;
