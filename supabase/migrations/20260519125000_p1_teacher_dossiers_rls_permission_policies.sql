begin;

insert into public.role_permissions (role_id, permission_id, scope)
select r.id, p.id, 'all'
from public.roles r
join public.permissions p
  on p.key = 'teachers.manage'
where r.key = 'manager'
on conflict (role_id, permission_id, scope) do nothing;

alter table public.teacher_dossiers enable row level security;

drop policy if exists teacher_dossiers_select_access on public.teacher_dossiers;
drop policy if exists teacher_dossiers_insert_manage on public.teacher_dossiers;
drop policy if exists teacher_dossiers_update_manage on public.teacher_dossiers;
drop policy if exists teacher_dossiers_delete_manage on public.teacher_dossiers;

create policy teacher_dossiers_select_access
on public.teacher_dossiers
for select
to authenticated
using (
  app_private.has_permission('teachers.view', 'all')
  or app_private.has_permission('teachers.manage', 'all')
);

create policy teacher_dossiers_insert_manage
on public.teacher_dossiers
for insert
to authenticated
with check (
  app_private.has_permission('teachers.manage', 'all')
  and exists (
    select 1
    from public.teachers t
    where t.id = teacher_dossiers.teacher_id
  )
);

create policy teacher_dossiers_update_manage
on public.teacher_dossiers
for update
to authenticated
using (app_private.has_permission('teachers.manage', 'all'))
with check (
  app_private.has_permission('teachers.manage', 'all')
  and exists (
    select 1
    from public.teachers t
    where t.id = teacher_dossiers.teacher_id
  )
);

create policy teacher_dossiers_delete_manage
on public.teacher_dossiers
for delete
to authenticated
using (app_private.has_permission('teachers.manage', 'all'));

commit;
