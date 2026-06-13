begin;

do $$
declare
  v_function regprocedure;
  v_functions text[] := array[
    'public.current_student_id()',
    'public.current_teacher_id()',
    'public.get_my_role()',
    'public.is_admin_or_manager()',
    'public.is_teacher()'
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
