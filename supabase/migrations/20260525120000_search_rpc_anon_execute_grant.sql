begin;

-- Hybrid /api/search allows guest public search. This grant is intentionally
-- narrow to the hardened actor-scoped RPC signature: unauthenticated calls have
-- auth.uid() = null, and privileged/private expansion is derived inside the
-- function from auth.uid() + DB RBAC rather than caller-supplied parameters.
grant execute on function public.search_documents_query_for_actor(
  text,
  integer,
  text,
  boolean,
  text,
  text[],
  uuid,
  uuid,
  uuid[]
) to anon;

commit;
