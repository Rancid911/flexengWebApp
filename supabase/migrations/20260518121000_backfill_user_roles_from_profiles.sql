begin;

insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
join public.roles r on r.key = p.role
where p.role is not null
on conflict (user_id, role_id) do nothing;

do $$
begin
  if exists (
    select 1
    from public.profiles p
    left join public.roles r on r.key = p.role
    where p.role is not null
      and r.id is null
  ) then
    raise exception 'RBAC backfill failed: profiles.role contains values missing from public.roles';
  end if;

  if exists (
    select 1
    from public.profiles p
    join public.roles r on r.key = p.role
    left join public.user_roles ur
      on ur.user_id = p.id
     and ur.role_id = r.id
    where p.role is not null
      and ur.user_id is null
  ) then
    raise exception 'RBAC backfill failed: some profiles are missing mirrored user_roles rows';
  end if;
end $$;

commit;
