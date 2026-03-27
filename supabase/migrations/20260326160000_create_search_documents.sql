begin;

create table if not exists public.search_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  subtitle text,
  body text,
  href text not null,
  section text not null default 'other',
  icon text,
  badge text,
  role_scope text[] not null default array['all']::text[],
  visibility text not null check (visibility in ('public', 'role', 'student_owned', 'enrollment')),
  owner_student_id uuid references public.students(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  is_published boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  search_vector tsvector,
  updated_at timestamptz not null default now(),
  constraint search_documents_role_scope_not_empty check (cardinality(role_scope) >= 1),
  constraint search_documents_unique_entity unique (entity_type, entity_id)
);

create index if not exists search_documents_search_vector_idx
  on public.search_documents
  using gin (search_vector);

create index if not exists search_documents_section_updated_idx
  on public.search_documents (section, updated_at desc);

create index if not exists search_documents_visibility_owner_idx
  on public.search_documents (visibility, owner_student_id, updated_at desc);

create index if not exists search_documents_course_idx
  on public.search_documents (course_id, updated_at desc);

alter table public.search_documents enable row level security;

create or replace function public.set_search_document_vector()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.body, '')), 'C');
  return new;
end;
$$;

drop trigger if exists trg_search_documents_vector on public.search_documents;
create trigger trg_search_documents_vector
before insert or update on public.search_documents
for each row execute function public.set_search_document_vector();

create or replace function public.upsert_search_document(
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_subtitle text,
  p_body text,
  p_href text,
  p_section text,
  p_icon text,
  p_badge text,
  p_role_scope text[],
  p_visibility text,
  p_owner_student_id uuid,
  p_course_id uuid,
  p_is_published boolean,
  p_meta jsonb,
  p_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.search_documents (
    entity_type,
    entity_id,
    title,
    subtitle,
    body,
    href,
    section,
    icon,
    badge,
    role_scope,
    visibility,
    owner_student_id,
    course_id,
    is_published,
    meta,
    updated_at
  )
  values (
    p_entity_type,
    p_entity_id,
    p_title,
    p_subtitle,
    p_body,
    p_href,
    p_section,
    p_icon,
    p_badge,
    p_role_scope,
    p_visibility,
    p_owner_student_id,
    p_course_id,
    p_is_published,
    coalesce(p_meta, '{}'::jsonb),
    coalesce(p_updated_at, now())
  )
  on conflict (entity_type, entity_id) do update
  set
    title = excluded.title,
    subtitle = excluded.subtitle,
    body = excluded.body,
    href = excluded.href,
    section = excluded.section,
    icon = excluded.icon,
    badge = excluded.badge,
    role_scope = excluded.role_scope,
    visibility = excluded.visibility,
    owner_student_id = excluded.owner_student_id,
    course_id = excluded.course_id,
    is_published = excluded.is_published,
    meta = excluded.meta,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.delete_search_document(p_entity_type text, p_entity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.search_documents
  where entity_type = p_entity_type
    and entity_id = p_entity_id;
$$;

create or replace function public.sync_search_document_blog_category(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.blog_categories%rowtype;
begin
  select * into v_row from public.blog_categories where id = p_id;
  if not found then
    perform public.delete_search_document('blog_category', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'blog_category',
    v_row.id,
    v_row.name,
    'Категория блога',
    v_row.name,
    '/articles?category=' || v_row.slug,
    'blog',
    'folder',
    'Категория',
    array['all']::text[],
    'public',
    null,
    null,
    v_row.is_active,
    jsonb_build_object('slug', v_row.slug),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_blog_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.blog_posts%rowtype;
begin
  select * into v_row from public.blog_posts where id = p_id;
  if not found then
    perform public.delete_search_document('blog_post', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'blog_post',
    v_row.id,
    v_row.title,
    coalesce(v_row.excerpt, 'Статья блога'),
    coalesce(v_row.excerpt, '') || ' ' || left(coalesce(v_row.content, ''), 4000),
    '/articles/' || v_row.slug,
    'blog',
    'file-text',
    case when v_row.status = 'published' then 'Статья' else 'Черновик' end,
    array['all']::text[],
    'public',
    null,
    null,
    v_row.status = 'published',
    jsonb_build_object('slug', v_row.slug, 'status', v_row.status),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_course(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.courses%rowtype;
begin
  select * into v_row from public.courses where id = p_id;
  if not found then
    perform public.delete_search_document('course', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'course',
    v_row.id,
    v_row.title,
    coalesce(v_row.description, 'Курс практики'),
    coalesce(v_row.description, ''),
    '/practice/topics/' || v_row.slug,
    'practice',
    'graduation-cap',
    'Курс',
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_row.id,
    v_row.is_published,
    jsonb_build_object('slug', v_row.slug),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_course_module(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_module from public.course_modules where id = p_id;
  if not found then
    perform public.delete_search_document('course_module', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('course_module', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'course_module',
    v_module.id,
    v_module.title,
    coalesce(v_module.description, v_course.title),
    coalesce(v_module.description, ''),
    '/practice/topics/' || v_course.slug || '/' || v_module.id::text,
    'practice',
    'layers',
    'Подтема',
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'course_title', v_course.title),
    v_module.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_lesson(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson public.lessons%rowtype;
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_lesson from public.lessons where id = p_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  select * into v_module from public.course_modules where id = v_lesson.module_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'lesson',
    v_lesson.id,
    v_lesson.title,
    coalesce(v_lesson.description, v_module.title),
    coalesce(v_lesson.description, ''),
    '/practice/activity/lesson_' || v_lesson.id::text,
    'practice',
    'book-open',
    case when v_lesson.lesson_type = 'flashcards' then 'Карточки' else 'Урок' end,
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_lesson.is_published and v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'module_id', v_module.id, 'lesson_type', v_lesson.lesson_type),
    v_lesson.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_test(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_test public.tests%rowtype;
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_test from public.tests where id = p_id;
  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  if v_test.module_id is not null then
    select * into v_module from public.course_modules where id = v_test.module_id;
  elsif v_test.lesson_id is not null then
    select cm.*
    into v_module
    from public.lessons l
    join public.course_modules cm on cm.id = l.module_id
    where l.id = v_test.lesson_id;
  end if;

  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'test',
    v_test.id,
    v_test.title,
    coalesce(v_test.description, v_module.title),
    coalesce(v_test.description, ''),
    '/practice/activity/test_' || v_test.id::text,
    'practice',
    case when v_test.activity_type = 'trainer' then 'brain' else 'clipboard-list' end,
    case when v_test.activity_type = 'trainer' then 'Тренажёр' else 'Тест' end,
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_test.is_published and v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'module_id', v_module.id, 'activity_type', v_test.activity_type),
    v_test.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_homework_assignment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.homework_assignments%rowtype;
begin
  select * into v_row from public.homework_assignments where id = p_id;
  if not found then
    perform public.delete_search_document('homework_assignment', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'homework_assignment',
    v_row.id,
    v_row.title,
    coalesce(v_row.description, 'Домашнее задание'),
    coalesce(v_row.description, '') || ' ' || coalesce(v_row.status, ''),
    '/homework/' || v_row.id::text,
    'homework',
    'clipboard-list',
    'Домашнее задание',
    array['student', 'admin']::text[],
    'student_owned',
    v_row.student_id,
    null,
    true,
    jsonb_build_object('status', v_row.status, 'due_at', v_row.due_at),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_student_word(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.student_words%rowtype;
begin
  select * into v_row from public.student_words where id = p_id;
  if not found then
    perform public.delete_search_document('student_word', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'student_word',
    v_row.id,
    v_row.term,
    v_row.translation,
    coalesce(v_row.term, '') || ' ' || coalesce(v_row.translation, '') || ' ' || coalesce(v_row.status, ''),
    '/words/my',
    'words',
    'languages',
    'Слово',
    array['student', 'admin']::text[],
    'student_owned',
    v_row.student_id,
    null,
    true,
    jsonb_build_object('status', v_row.status, 'source_type', v_row.source_type),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_profile(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles%rowtype;
begin
  select * into v_row from public.profiles where id = p_id;
  if not found then
    perform public.delete_search_document('profile', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'profile',
    v_row.id,
    coalesce(v_row.display_name, trim(coalesce(v_row.first_name, '') || ' ' || coalesce(v_row.last_name, '')), coalesce(v_row.email, 'Пользователь')),
    coalesce(v_row.email, 'Пользователь платформы'),
    coalesce(v_row.email, '') || ' ' || coalesce(v_row.phone, '') || ' ' || coalesce(v_row.role, ''),
    '/admin',
    'admin',
    'user',
    case when v_row.role = 'admin' then 'Админ' when v_row.role = 'teacher' then 'Преподаватель' when v_row.role = 'manager' then 'Менеджер' else 'Студент' end,
    array['admin']::text[],
    'role',
    null,
    null,
    true,
    jsonb_build_object('role', v_row.role, 'email', v_row.email),
    v_row.updated_at
  );
end;
$$;

create or replace function public.sync_search_document_notification(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.notifications%rowtype;
begin
  select * into v_row from public.notifications where id = p_id;
  if not found then
    perform public.delete_search_document('notification', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'notification',
    v_row.id,
    v_row.title,
    v_row.type,
    coalesce(v_row.body, ''),
    '/admin',
    'admin',
    'bell',
    'Уведомление',
    array['admin']::text[],
    'role',
    null,
    null,
    v_row.is_active,
    jsonb_build_object('type', v_row.type, 'target_roles', v_row.target_roles),
    v_row.updated_at
  );
end;
$$;

create or replace function public.trg_sync_search_document_blog_category()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_blog_category(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_blog_post()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_blog_post(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_course()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_course(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_course_module()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_course_module(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_lesson()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_lesson(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_test()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_test(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_homework_assignment()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_homework_assignment(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_student_word()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_student_word(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_profile()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_profile(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_sync_search_document_notification()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_search_document_notification(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_search_sync_blog_categories on public.blog_categories;
create trigger trg_search_sync_blog_categories
after insert or update or delete on public.blog_categories
for each row execute function public.trg_sync_search_document_blog_category();

drop trigger if exists trg_search_sync_blog_posts on public.blog_posts;
create trigger trg_search_sync_blog_posts
after insert or update or delete on public.blog_posts
for each row execute function public.trg_sync_search_document_blog_post();

drop trigger if exists trg_search_sync_courses on public.courses;
create trigger trg_search_sync_courses
after insert or update or delete on public.courses
for each row execute function public.trg_sync_search_document_course();

drop trigger if exists trg_search_sync_course_modules on public.course_modules;
create trigger trg_search_sync_course_modules
after insert or update or delete on public.course_modules
for each row execute function public.trg_sync_search_document_course_module();

drop trigger if exists trg_search_sync_lessons on public.lessons;
create trigger trg_search_sync_lessons
after insert or update or delete on public.lessons
for each row execute function public.trg_sync_search_document_lesson();

drop trigger if exists trg_search_sync_tests on public.tests;
create trigger trg_search_sync_tests
after insert or update or delete on public.tests
for each row execute function public.trg_sync_search_document_test();

drop trigger if exists trg_search_sync_homework_assignments on public.homework_assignments;
create trigger trg_search_sync_homework_assignments
after insert or update or delete on public.homework_assignments
for each row execute function public.trg_sync_search_document_homework_assignment();

drop trigger if exists trg_search_sync_student_words on public.student_words;
create trigger trg_search_sync_student_words
after insert or update or delete on public.student_words
for each row execute function public.trg_sync_search_document_student_word();

drop trigger if exists trg_search_sync_profiles on public.profiles;
create trigger trg_search_sync_profiles
after insert or update or delete on public.profiles
for each row execute function public.trg_sync_search_document_profile();

drop trigger if exists trg_search_sync_notifications on public.notifications;
create trigger trg_search_sync_notifications
after insert or update or delete on public.notifications
for each row execute function public.trg_sync_search_document_notification();

create or replace function public.backfill_search_documents()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  delete from public.search_documents
  where entity_type in (
    'blog_category',
    'blog_post',
    'course',
    'course_module',
    'lesson',
    'test',
    'homework_assignment',
    'student_word',
    'profile',
    'notification'
  );

  for v_row in select id from public.blog_categories loop
    perform public.sync_search_document_blog_category(v_row.id);
  end loop;

  for v_row in select id from public.blog_posts loop
    perform public.sync_search_document_blog_post(v_row.id);
  end loop;

  for v_row in select id from public.courses loop
    perform public.sync_search_document_course(v_row.id);
  end loop;

  for v_row in select id from public.course_modules loop
    perform public.sync_search_document_course_module(v_row.id);
  end loop;

  for v_row in select id from public.lessons loop
    perform public.sync_search_document_lesson(v_row.id);
  end loop;

  for v_row in select id from public.tests loop
    perform public.sync_search_document_test(v_row.id);
  end loop;

  if to_regclass('public.homework_assignments') is not null then
    for v_row in select id from public.homework_assignments loop
      perform public.sync_search_document_homework_assignment(v_row.id);
    end loop;
  end if;

  if to_regclass('public.student_words') is not null then
    for v_row in select id from public.student_words loop
      perform public.sync_search_document_student_word(v_row.id);
    end loop;
  end if;

  for v_row in select id from public.profiles loop
    perform public.sync_search_document_profile(v_row.id);
  end loop;

  if to_regclass('public.notifications') is not null then
    for v_row in select id from public.notifications loop
      perform public.sync_search_document_notification(v_row.id);
    end loop;
  end if;
end;
$$;

create or replace function public.search_documents_query(
  p_query text,
  p_limit integer default 25,
  p_section text default 'all'
)
returns table (
  id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  body text,
  href text,
  section text,
  icon text,
  badge text,
  role_scope text[],
  visibility text,
  owner_student_id uuid,
  course_id uuid,
  is_published boolean,
  meta jsonb,
  updated_at timestamptz,
  rank double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_tsq tsquery;
begin
  if char_length(v_query) < 2 then
    return;
  end if;

  begin
    v_tsq := websearch_to_tsquery('simple', v_query);
  exception
    when others then
      v_tsq := plainto_tsquery('simple', v_query);
  end;

  return query
  select
    sd.id,
    sd.entity_type,
    sd.entity_id,
    sd.title,
    sd.subtitle,
    sd.body,
    sd.href,
    sd.section,
    sd.icon,
    sd.badge,
    sd.role_scope,
    sd.visibility,
    sd.owner_student_id,
    sd.course_id,
    sd.is_published,
    sd.meta,
    sd.updated_at,
    (
      case when lower(sd.title) = lower(v_query) then 100 else 0 end +
      case when lower(sd.title) like lower(v_query) || '%' then 25 else 0 end +
      case
        when sd.section = 'homework' then 14
        when sd.section = 'practice' then 12
        when sd.section = 'words' then 10
        when sd.section = 'admin' then 8
        when sd.section = 'blog' then 6
        else 0
      end +
      case
        when sd.search_vector @@ v_tsq then ts_rank_cd(sd.search_vector, v_tsq) * 10
        else 0
      end +
      case when sd.updated_at >= now() - interval '14 days' then 1 else 0 end
    )::double precision as rank
  from public.search_documents sd
  where (p_section = 'all' or sd.section = p_section)
    and (
      sd.search_vector @@ v_tsq
      or sd.title ilike '%' || v_query || '%'
      or coalesce(sd.subtitle, '') ilike '%' || v_query || '%'
      or coalesce(sd.body, '') ilike '%' || v_query || '%'
    )
  order by rank desc, sd.updated_at desc
  limit v_limit;
end;
$$;

select public.backfill_search_documents();

commit;
