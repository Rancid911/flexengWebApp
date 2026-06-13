begin;

alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.word_card_sets enable row level security;
alter table public.word_card_items enable row level security;

drop policy if exists blog_categories_public_read on public.blog_categories;
drop policy if exists blog_categories_select_public on public.blog_categories;
drop policy if exists blog_categories_select_manage on public.blog_categories;
drop policy if exists blog_categories_insert_manage on public.blog_categories;
drop policy if exists blog_categories_update_manage on public.blog_categories;
drop policy if exists blog_categories_delete_manage on public.blog_categories;

create policy blog_categories_select_public
on public.blog_categories
for select
to public
using (true);

create policy blog_categories_insert_manage
on public.blog_categories
for insert
to authenticated
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_categories_update_manage
on public.blog_categories
for update
to authenticated
using (app_private.has_permission('content.manage', 'all'))
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_categories_delete_manage
on public.blog_categories
for delete
to authenticated
using (app_private.has_permission('content.manage', 'all'));

drop policy if exists blog_tags_public_read on public.blog_tags;
drop policy if exists blog_tags_select_public on public.blog_tags;
drop policy if exists blog_tags_insert_manage on public.blog_tags;
drop policy if exists blog_tags_update_manage on public.blog_tags;
drop policy if exists blog_tags_delete_manage on public.blog_tags;

create policy blog_tags_select_public
on public.blog_tags
for select
to public
using (true);

create policy blog_tags_insert_manage
on public.blog_tags
for insert
to authenticated
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_tags_update_manage
on public.blog_tags
for update
to authenticated
using (app_private.has_permission('content.manage', 'all'))
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_tags_delete_manage
on public.blog_tags
for delete
to authenticated
using (app_private.has_permission('content.manage', 'all'));

drop policy if exists blog_posts_public_read_published on public.blog_posts;
drop policy if exists blog_posts_select_public on public.blog_posts;
drop policy if exists blog_posts_select_manage on public.blog_posts;
drop policy if exists blog_posts_insert_manage on public.blog_posts;
drop policy if exists blog_posts_update_manage on public.blog_posts;
drop policy if exists blog_posts_delete_manage on public.blog_posts;

create policy blog_posts_select_public
on public.blog_posts
for select
to public
using (status = 'published');

create policy blog_posts_select_manage
on public.blog_posts
for select
to authenticated
using (app_private.has_permission('content.manage', 'all'));

create policy blog_posts_insert_manage
on public.blog_posts
for insert
to authenticated
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_posts_update_manage
on public.blog_posts
for update
to authenticated
using (app_private.has_permission('content.manage', 'all'))
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_posts_delete_manage
on public.blog_posts
for delete
to authenticated
using (app_private.has_permission('content.manage', 'all'));

drop policy if exists blog_post_tags_public_read_published on public.blog_post_tags;
drop policy if exists blog_post_tags_select_public on public.blog_post_tags;
drop policy if exists blog_post_tags_select_manage on public.blog_post_tags;
drop policy if exists blog_post_tags_insert_manage on public.blog_post_tags;
drop policy if exists blog_post_tags_update_manage on public.blog_post_tags;
drop policy if exists blog_post_tags_delete_manage on public.blog_post_tags;

create policy blog_post_tags_select_public
on public.blog_post_tags
for select
to public
using (
  exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.post_id
      and bp.status = 'published'
  )
);

create policy blog_post_tags_select_manage
on public.blog_post_tags
for select
to authenticated
using (app_private.has_permission('content.manage', 'all'));

create policy blog_post_tags_insert_manage
on public.blog_post_tags
for insert
to authenticated
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_post_tags_update_manage
on public.blog_post_tags
for update
to authenticated
using (app_private.has_permission('content.manage', 'all'))
with check (app_private.has_permission('content.manage', 'all'));

create policy blog_post_tags_delete_manage
on public.blog_post_tags
for delete
to authenticated
using (app_private.has_permission('content.manage', 'all'));

drop policy if exists word_card_sets_select_published on public.word_card_sets;
drop policy if exists word_card_sets_select_public on public.word_card_sets;
drop policy if exists word_card_sets_select_manage on public.word_card_sets;
drop policy if exists word_card_sets_insert_manage on public.word_card_sets;
drop policy if exists word_card_sets_update_manage on public.word_card_sets;
drop policy if exists word_card_sets_delete_manage on public.word_card_sets;

create policy word_card_sets_select_public
on public.word_card_sets
for select
to public
using (is_published = true);

create policy word_card_sets_select_manage
on public.word_card_sets
for select
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_sets_insert_manage
on public.word_card_sets
for insert
to authenticated
with check (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_sets_update_manage
on public.word_card_sets
for update
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'))
with check (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_sets_delete_manage
on public.word_card_sets
for delete
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'));

drop policy if exists word_card_items_select_published_set on public.word_card_items;
drop policy if exists word_card_items_select_public on public.word_card_items;
drop policy if exists word_card_items_select_manage on public.word_card_items;
drop policy if exists word_card_items_insert_manage on public.word_card_items;
drop policy if exists word_card_items_update_manage on public.word_card_items;
drop policy if exists word_card_items_delete_manage on public.word_card_items;

create policy word_card_items_select_public
on public.word_card_items
for select
to public
using (
  exists (
    select 1
    from public.word_card_sets s
    where s.id = word_card_items.set_id
      and s.is_published = true
  )
);

create policy word_card_items_select_manage
on public.word_card_items
for select
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_items_insert_manage
on public.word_card_items
for insert
to authenticated
with check (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_items_update_manage
on public.word_card_items
for update
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'))
with check (app_private.has_permission('word_cards.manage', 'all'));

create policy word_card_items_delete_manage
on public.word_card_items
for delete
to authenticated
using (app_private.has_permission('word_cards.manage', 'all'));

do $$
begin
  if to_regclass('public.courses') is not null then
    execute 'alter table public.courses enable row level security';
    execute 'drop policy if exists courses_select_public on public.courses';
    execute 'drop policy if exists courses_select_manage on public.courses';
    execute 'drop policy if exists courses_insert_manage on public.courses';
    execute 'drop policy if exists courses_update_manage on public.courses';
    execute 'drop policy if exists courses_delete_manage on public.courses';
    execute $sql$create policy courses_select_public on public.courses for select to public using (is_published = true)$sql$;
    execute $sql$create policy courses_select_manage on public.courses for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy courses_insert_manage on public.courses for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy courses_update_manage on public.courses for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy courses_delete_manage on public.courses for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;

  if to_regclass('public.course_modules') is not null then
    execute 'alter table public.course_modules enable row level security';
    execute 'drop policy if exists course_modules_select_public on public.course_modules';
    execute 'drop policy if exists course_modules_select_manage on public.course_modules';
    execute 'drop policy if exists course_modules_insert_manage on public.course_modules';
    execute 'drop policy if exists course_modules_update_manage on public.course_modules';
    execute 'drop policy if exists course_modules_delete_manage on public.course_modules';
    execute $sql$create policy course_modules_select_public on public.course_modules for select to public using (is_published = true and exists (select 1 from public.courses c where c.id = course_modules.course_id and c.is_published = true))$sql$;
    execute $sql$create policy course_modules_select_manage on public.course_modules for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy course_modules_insert_manage on public.course_modules for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy course_modules_update_manage on public.course_modules for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy course_modules_delete_manage on public.course_modules for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;

  if to_regclass('public.lessons') is not null then
    execute 'alter table public.lessons enable row level security';
    execute 'drop policy if exists lessons_select_public on public.lessons';
    execute 'drop policy if exists lessons_select_manage on public.lessons';
    execute 'drop policy if exists lessons_insert_manage on public.lessons';
    execute 'drop policy if exists lessons_update_manage on public.lessons';
    execute 'drop policy if exists lessons_delete_manage on public.lessons';
    execute $sql$create policy lessons_select_public on public.lessons for select to public using (is_published = true and exists (select 1 from public.course_modules cm join public.courses c on c.id = cm.course_id where cm.id = lessons.module_id and cm.is_published = true and c.is_published = true))$sql$;
    execute $sql$create policy lessons_select_manage on public.lessons for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy lessons_insert_manage on public.lessons for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy lessons_update_manage on public.lessons for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy lessons_delete_manage on public.lessons for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;

  if to_regclass('public.tests') is not null then
    execute 'alter table public.tests enable row level security';
    execute 'drop policy if exists tests_select_public on public.tests';
    execute 'drop policy if exists tests_select_manage on public.tests';
    execute 'drop policy if exists tests_insert_manage on public.tests';
    execute 'drop policy if exists tests_update_manage on public.tests';
    execute 'drop policy if exists tests_delete_manage on public.tests';
    execute $sql$create policy tests_select_public on public.tests for select to public using (is_published = true and ((lesson_id is null and module_id is null) or (lesson_id is not null and exists (select 1 from public.lessons l join public.course_modules cm on cm.id = l.module_id join public.courses c on c.id = cm.course_id where l.id = tests.lesson_id and l.is_published = true and cm.is_published = true and c.is_published = true)) or (lesson_id is null and module_id is not null and exists (select 1 from public.course_modules cm join public.courses c on c.id = cm.course_id where cm.id = tests.module_id and cm.is_published = true and c.is_published = true))))$sql$;
    execute $sql$create policy tests_select_manage on public.tests for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy tests_insert_manage on public.tests for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy tests_update_manage on public.tests for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy tests_delete_manage on public.tests for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;

  if to_regclass('public.test_questions') is not null then
    execute 'alter table public.test_questions enable row level security';
    execute 'drop policy if exists test_questions_select_public on public.test_questions';
    execute 'drop policy if exists test_questions_select_manage on public.test_questions';
    execute 'drop policy if exists test_questions_insert_manage on public.test_questions';
    execute 'drop policy if exists test_questions_update_manage on public.test_questions';
    execute 'drop policy if exists test_questions_delete_manage on public.test_questions';
    execute $sql$create policy test_questions_select_public on public.test_questions for select to public using (exists (select 1 from public.tests t where t.id = test_questions.test_id and t.is_published = true and ((t.lesson_id is null and t.module_id is null) or (t.lesson_id is not null and exists (select 1 from public.lessons l join public.course_modules cm on cm.id = l.module_id join public.courses c on c.id = cm.course_id where l.id = t.lesson_id and l.is_published = true and cm.is_published = true and c.is_published = true)) or (t.lesson_id is null and t.module_id is not null and exists (select 1 from public.course_modules cm join public.courses c on c.id = cm.course_id where cm.id = t.module_id and cm.is_published = true and c.is_published = true)))))$sql$;
    execute $sql$create policy test_questions_select_manage on public.test_questions for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_questions_insert_manage on public.test_questions for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_questions_update_manage on public.test_questions for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_questions_delete_manage on public.test_questions for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;

  if to_regclass('public.test_question_options') is not null then
    execute 'alter table public.test_question_options enable row level security';
    execute 'drop policy if exists test_question_options_select_public on public.test_question_options';
    execute 'drop policy if exists test_question_options_select_manage on public.test_question_options';
    execute 'drop policy if exists test_question_options_insert_manage on public.test_question_options';
    execute 'drop policy if exists test_question_options_update_manage on public.test_question_options';
    execute 'drop policy if exists test_question_options_delete_manage on public.test_question_options';
    execute $sql$create policy test_question_options_select_public on public.test_question_options for select to public using (exists (select 1 from public.test_questions q join public.tests t on t.id = q.test_id where q.id = test_question_options.question_id and t.is_published = true and ((t.lesson_id is null and t.module_id is null) or (t.lesson_id is not null and exists (select 1 from public.lessons l join public.course_modules cm on cm.id = l.module_id join public.courses c on c.id = cm.course_id where l.id = t.lesson_id and l.is_published = true and cm.is_published = true and c.is_published = true)) or (t.lesson_id is null and t.module_id is not null and exists (select 1 from public.course_modules cm join public.courses c on c.id = cm.course_id where cm.id = t.module_id and cm.is_published = true and c.is_published = true)))))$sql$;
    execute $sql$create policy test_question_options_select_manage on public.test_question_options for select to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_question_options_insert_manage on public.test_question_options for insert to authenticated with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_question_options_update_manage on public.test_question_options for update to authenticated using (app_private.has_permission('content.manage', 'all')) with check (app_private.has_permission('content.manage', 'all'))$sql$;
    execute $sql$create policy test_question_options_delete_manage on public.test_question_options for delete to authenticated using (app_private.has_permission('content.manage', 'all'))$sql$;
  end if;
end $$;

commit;
