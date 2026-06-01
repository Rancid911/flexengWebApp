begin;

do $$
begin
  if to_regclass('public.student_dashboard_view') is not null then
    alter view public.student_dashboard_view set (security_invoker = true);

    revoke all on public.student_dashboard_view from anon;
    revoke all on public.student_dashboard_view from authenticated;

    comment on view public.student_dashboard_view
      is 'Legacy student dashboard aggregate view. Kept closed to direct anon/authenticated API access; use application services/RPCs instead.';
  end if;
end;
$$;

commit;
