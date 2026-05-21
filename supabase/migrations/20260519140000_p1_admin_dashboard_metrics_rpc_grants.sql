begin;

revoke all on function public.admin_dashboard_metrics(timestamptz) from public;
revoke all on function public.admin_dashboard_metrics(timestamptz) from anon;
grant execute on function public.admin_dashboard_metrics(timestamptz) to authenticated;

comment on function public.admin_dashboard_metrics(timestamptz)
  is 'Returns admin dashboard aggregate metrics. Application layer must require admin.dashboard.read before execution.';

commit;
