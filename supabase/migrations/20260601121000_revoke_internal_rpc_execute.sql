begin;

do $$
declare
  v_function regprocedure;
  v_functions text[] := array[
    'public.backfill_search_documents()',
    'public.upsert_search_document(text, uuid, text, text, text, text, text, text, text, text[], text, uuid, uuid, boolean, jsonb, timestamptz)',
    'public.delete_search_document(text, uuid)',
    'public.sync_search_document_blog_category(uuid)',
    'public.sync_search_document_blog_post(uuid)',
    'public.sync_search_document_course(uuid)',
    'public.sync_search_document_course_module(uuid)',
    'public.sync_search_document_homework_assignment(uuid)',
    'public.sync_search_document_lesson(uuid)',
    'public.sync_search_document_notification(uuid)',
    'public.sync_search_document_profile(uuid)',
    'public.sync_search_document_student_word(uuid)',
    'public.sync_search_document_test(uuid)',
    'public.handle_new_user()',
    'public.search_documents_query(text, integer, text)'
  ];
  v_signature text;
begin
  foreach v_signature in array v_functions loop
    v_function := to_regprocedure(v_signature);

    if v_function is not null then
      execute format('revoke all on function %s from public', v_function);
      execute format('revoke all on function %s from anon', v_function);
      execute format('revoke all on function %s from authenticated', v_function);
    end if;
  end loop;
end;
$$;

commit;
