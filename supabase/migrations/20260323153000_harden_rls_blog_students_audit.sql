-- Security hardening:
-- 1) Public blog tables: read-only for published content via RLS.
-- 2) Students table: users can only read/write own row.
-- 3) Audit log: readable only by admins.

-- Blog tables
alter table if exists public.blog_categories enable row level security;
alter table if exists public.blog_tags enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.blog_post_tags enable row level security;

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read
on public.blog_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists blog_tags_public_read on public.blog_tags;
create policy blog_tags_public_read
on public.blog_tags
for select
to anon, authenticated
using (true);

drop policy if exists blog_posts_public_read_published on public.blog_posts;
create policy blog_posts_public_read_published
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists blog_post_tags_public_read_published on public.blog_post_tags;
create policy blog_post_tags_public_read_published
on public.blog_post_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.post_id
      and bp.status = 'published'
  )
);

-- Students table (if present in project schema)
do $$
begin
  if to_regclass('public.students') is not null then
    execute 'alter table public.students enable row level security';

    execute 'drop policy if exists students_select_own on public.students';
    execute $policy$
      create policy students_select_own
      on public.students
      for select
      to authenticated
      using (profile_id = auth.uid())
    $policy$;

    execute 'drop policy if exists students_insert_own on public.students';
    execute $policy$
      create policy students_insert_own
      on public.students
      for insert
      to authenticated
      with check (profile_id = auth.uid())
    $policy$;

    execute 'drop policy if exists students_update_own on public.students';
    execute $policy$
      create policy students_update_own
      on public.students
      for update
      to authenticated
      using (profile_id = auth.uid())
      with check (profile_id = auth.uid())
    $policy$;
  end if;
end $$;

-- Audit log table (if present in project schema)
do $$
begin
  if to_regclass('public.audit_log') is not null then
    execute 'alter table public.audit_log enable row level security';

    execute 'drop policy if exists audit_log_admin_read on public.audit_log';
    execute $policy$
      create policy audit_log_admin_read
      on public.audit_log
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
    $policy$;
  end if;
end $$;
