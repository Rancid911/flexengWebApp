-- Production-safe, read-only report for user contact and linked identity invariants.

with
profile_email_duplicates as (
  select lower(btrim(email)) as normalized_email, count(*) as row_count
  from public.profiles
  where nullif(btrim(email), '') is not null
  group by lower(btrim(email))
  having count(*) > 1
),
auth_email_duplicates as (
  select lower(btrim(email)) as normalized_email, count(*) as row_count
  from auth.users
  where nullif(btrim(email), '') is not null
  group by lower(btrim(email))
  having count(*) > 1
),
phone_duplicates as (
  select phone, count(*) as row_count, array_agg(role order by role) as roles
  from public.profiles
  where nullif(btrim(phone), '') is not null
  group by phone
  having count(*) > 1
),
role_counts as (
  select user_id, count(*) as row_count
  from public.user_roles
  group by user_id
)
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from profile_email_duplicates) as profile_email_duplicate_groups,
  (select count(*) from auth_email_duplicates) as auth_email_duplicate_groups,
  (
    select count(*)
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(btrim(p.email)) is distinct from lower(btrim(u.email))
  ) as auth_profile_email_mismatches,
  (select count(*) from phone_duplicates) as shared_phone_groups,
  (select coalesce(sum(row_count - 1), 0) from phone_duplicates) as extra_profiles_with_shared_phone,
  (
    select count(*)
    from public.profiles
    where nullif(btrim(phone), '') is not null
      and phone !~ '^\+7[0-9]{10}$'
  ) as noncanonical_phones,
  (
    select count(*)
    from public.students s
    join public.teachers t using (profile_id)
  ) as profiles_with_dual_identity,
  (select count(*) from role_counts where row_count > 1) as users_with_multiple_roles,
  (
    select count(*)
    from public.profiles p
    where not exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.key = p.role
    )
  ) as profiles_without_matching_rbac_role;

select phone, row_count, roles
from (
  select phone, count(*) as row_count, array_agg(role order by role) as roles
  from public.profiles
  where nullif(btrim(phone), '') is not null
  group by phone
  having count(*) > 1
) shared_phones
order by row_count desc, phone;
