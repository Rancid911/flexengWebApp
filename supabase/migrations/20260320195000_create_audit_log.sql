create extension if not exists pgcrypto;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid not null,
  entity text not null,
  entity_id text not null,
  action text not null check (action in ('create', 'update', 'delete')),
  before jsonb,
  after jsonb
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_user_id_idx on public.audit_log (actor_user_id);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);
