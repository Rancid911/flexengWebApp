-- DRAFT BASELINE CANDIDATE.
-- DO NOT APPLY TO EXISTING SUPABASE CLOUD PROJECT.
-- Intended only for clean local/self-hosted bootstrap rehearsal.
-- This file is non-active and must not be placed into supabase/migrations.

-- PARTIAL CANDIDATE: only storage bucket rows with exact migration sources
-- are executable below. RBAC and singleton rows remain review TODOs.
--
-- Snapshot verification on 2026-06-13 confirmed that the schema-only dump
-- contains no data statements. The following required candidates therefore
-- remain unresolved and must be captured separately:
--   * fixed roles, permissions, and role_permissions seed rows;
--   * required singleton rows such as crm_settings and
--     admin_payment_reminder_settings, after confirming their startup needs.
--
-- user_roles, students, teachers, and any environment-specific assignments
-- are not reference data and must not be added here.
--
-- Review and add only deterministic system/reference rows required for a
-- clean application bootstrap. Candidate groups:
--   * required storage.buckets rows (currently avatars and crm-assets);
--   * fixed RBAC roles, permissions, and role-permission mappings;
--   * system constants or singleton configuration rows required at startup.
--
-- Before adding a row, verify that it is required, stable at the cutoff, and
-- safe to reproduce in every environment.
--
-- RBAC source to review:
--   supabase/migrations/20260518120000_add_minimal_rbac_schema.sql
-- Additional role_permissions sources must be included through the cutoff.
--
-- Singleton sources to review:
--   supabase/migrations/20260424180000_create_crm_settings.sql
--   migration(s) that define admin_payment_reminder_settings defaults
--
-- Never include:
--   * auth.users or application user identities;
--   * student or teacher records;
--   * payment/provider/webhook records;
--   * practice attempts, answers, progress, or mistakes;
--   * personal data;
--   * uploaded Storage objects or object payloads;
--   * credentials, tokens, or environment-specific secrets.

-- Exact application bucket rows from:
--   20260322220500_add_settings_avatar_policies.sql
--   20260424180000_create_crm_settings.sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('crm-assets', 'crm-assets', true)
on conflict (id) do update set public = excluded.public;
