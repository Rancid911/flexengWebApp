begin;

do $$
declare
  v_name text;
  v_names text[] := array[
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
  ];
begin
  foreach v_name in array v_names loop
    execute format(
      $function$
        create or replace function public.trg_sync_search_document_%1$I()
        returns trigger
        language plpgsql
        security definer
        set search_path = ''
        as $body$
        begin
          perform public.sync_search_document_%1$I(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $body$
      $function$,
      v_name
    );

    execute format('revoke all on function public.trg_sync_search_document_%I() from public', v_name);
    execute format('revoke all on function public.trg_sync_search_document_%I() from anon', v_name);
    execute format('revoke all on function public.trg_sync_search_document_%I() from authenticated', v_name);
  end loop;
end;
$$;

commit;
