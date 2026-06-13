begin;

do $$
declare
  v_function regprocedure;
  v_signature text;
  v_public_functions text[] := array[
    'touch_student_schedule_lessons_updated_at',
    'get_student_billing_summary_aggregates',
    'touch_student_cabinet_updated_at',
    'touch_teacher_workspace_updated_at',
    'touch_student_billing_updated_at',
    'touch_updated_at',
    'touch_notifications_updated_at',
    'get_schedule_teacher_options',
    'set_search_document_vector',
    'trg_sync_search_document_blog_category',
    'trg_sync_search_document_blog_post',
    'trg_sync_search_document_course',
    'trg_sync_search_document_course_module',
    'trg_sync_search_document_lesson',
    'trg_sync_search_document_test',
    'trg_sync_search_document_homework_assignment',
    'trg_sync_search_document_student_word',
    'trg_sync_search_document_profile',
    'trg_sync_search_document_notification',
    'touch_payment_entities_updated_at',
    'set_updated_at',
    'get_my_student_dashboard',
    'admin_payment_control_summary_rows'
  ];
  v_private_functions text[] := array[
    'current_profile_id'
  ];
begin
  for v_signature in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(v_public_functions)
  loop
    v_function := to_regprocedure(v_signature);
    execute format('alter function %s set search_path = public, pg_temp', v_function);
  end loop;

  for v_signature in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app_private'
      and p.proname = any(v_private_functions)
  loop
    v_function := to_regprocedure(v_signature);
    execute format('alter function %s set search_path = app_private, public, pg_temp', v_function);
  end loop;
end;
$$;

commit;
