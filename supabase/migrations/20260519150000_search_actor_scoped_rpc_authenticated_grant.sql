begin;

alter table if exists public.search_documents enable row level security;

comment on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])
  is 'Actor-scoped search RPC for server-mediated search; callable by authenticated server clients.';

revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from public;
revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from anon;
grant execute on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) to authenticated;

commit;
