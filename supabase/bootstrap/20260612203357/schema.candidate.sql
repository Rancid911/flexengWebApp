-- DRAFT BASELINE CANDIDATE.
-- DO NOT APPLY TO EXISTING SUPABASE CLOUD PROJECT.
-- Intended only for clean local/self-hosted bootstrap rehearsal.
-- This file is non-active and must not be placed into supabase/migrations.

--
-- PostgreSQL database dump
--

\restrict 6OdxpYawweYHra1uOT0NUOQfdRC4EoI6z8DzgCRRrqqHvs5zOhJQ586FvUBuT6k

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_private;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: can_access_student(uuid); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.can_access_student(p_student_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select
    app_private.is_own_student(p_student_id)
    or app_private.is_assigned_teacher(p_student_id)
    or app_private.has_permission('students.view', 'all');
$$;


--
-- Name: FUNCTION can_access_student(p_student_id uuid); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.can_access_student(p_student_id uuid) IS 'RLS helper smoke check: denies unrelated teachers; allows own student, assigned teacher, or students.view/all.';


--
-- Name: can_view_payment(uuid); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.can_view_payment(p_student_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select
    app_private.is_own_student(p_student_id)
    or (
      app_private.is_assigned_teacher(p_student_id)
      and app_private.has_permission('billing.view', 'assigned')
    )
    or app_private.has_permission('billing.view', 'all');
$$;


--
-- Name: current_profile_id(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.current_profile_id() RETURNS uuid
    LANGUAGE sql STABLE
    SET search_path TO 'app_private', 'public', 'pg_temp'
    AS $$
  select auth.uid();
$$;


--
-- Name: current_teacher_id(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.current_teacher_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select t.id
  from public.teachers t
  where t.profile_id = auth.uid()
  limit 1;
$$;


--
-- Name: has_permission(text, text); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.has_permission(p_permission_key text, p_required_scope text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp
      on rp.role_id = ur.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = p_permission_key
      and (
        p_required_scope is null
        or rp.scope = p_required_scope
        or rp.scope = 'all'
      )
  );
$$;


--
-- Name: FUNCTION has_permission(p_permission_key text, p_required_scope text); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.has_permission(p_permission_key text, p_required_scope text) IS 'RLS helper smoke checks: profile.view/own for seeded student role; students.view/all for admin and manager roles.';


--
-- Name: is_assigned_teacher(uuid); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.is_assigned_teacher(p_student_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.students s
    join public.teachers t
      on t.id = s.primary_teacher_id
    where s.id = p_student_id
      and t.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.student_course_enrollments sce
    join public.teachers t
      on t.id = sce.assigned_teacher_id
    where sce.student_id = p_student_id
      and sce.status = 'active'
      and t.profile_id = auth.uid()
  );
$$;


--
-- Name: FUNCTION is_assigned_teacher(p_student_id uuid); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.is_assigned_teacher(p_student_id uuid) IS 'True when the current teacher is linked to the student either as students.primary_teacher_id or through an active student_course_enrollments.assigned_teacher_id row.';


--
-- Name: is_own_student(uuid); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.is_own_student(p_student_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.profile_id = auth.uid()
  );
$$;


--
-- Name: FUNCTION is_own_student(p_student_id uuid); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.is_own_student(p_student_id uuid) IS 'RLS helper smoke check: true only when students.profile_id = auth.uid().';


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: admin_dashboard_metrics(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_dashboard_metrics(period_anchor timestamp with time zone DEFAULT now()) RETURNS TABLE(revenue_month numeric, new_payments_7d bigint, active_students_7d bigint, active_teachers_7d bigint, avg_check_month numeric, currency text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'app_private', 'pg_temp'
    AS $$
begin
  if not app_private.has_permission('roles.view', 'all') then
    raise exception 'admin_dashboard_metrics requires roles.view:all'
      using errcode = '42501';
  end if;

  return query
  with bounds as (
    select
      period_anchor as anchor_utc,
      (date_trunc('month', period_anchor at time zone 'Europe/Moscow') at time zone 'Europe/Moscow') as month_start_utc,
      ((date_trunc('month', period_anchor at time zone 'Europe/Moscow') + interval '1 month') at time zone 'Europe/Moscow') as month_end_utc,
      (period_anchor - interval '7 day') as last_7d_utc
  ),
  month_payments as (
    select
      coalesce(sum(pt.amount), 0)::numeric(14,2) as revenue_month,
      count(*)::bigint as month_count,
      coalesce(max(pt.currency), 'RUB')::text as currency
    from public.payment_transactions pt
    cross join bounds b
    where pt.status = 'succeeded'
      and pt.paid_at is not null
      and pt.paid_at >= b.month_start_utc
      and pt.paid_at < b.month_end_utc
  ),
  payments_7d as (
    select count(*)::bigint as new_payments_7d
    from public.payment_transactions pt
    cross join bounds b
    where pt.status = 'succeeded'
      and pt.paid_at is not null
      and pt.paid_at >= b.last_7d_utc
      and pt.paid_at <= b.anchor_utc
  ),
  students_7d as (
    select count(distinct sta.student_id)::bigint as active_students_7d
    from public.student_test_attempts sta
    cross join bounds b
    where sta.started_at >= b.last_7d_utc
      and sta.started_at <= b.anchor_utc
  ),
  teachers_active as (
    select count(distinct sce.assigned_teacher_id)::bigint as active_teachers_7d
    from public.student_course_enrollments sce
    where sce.status = 'active'
      and sce.assigned_teacher_id is not null
  )
  select
    mp.revenue_month,
    p7.new_payments_7d,
    s7.active_students_7d,
    ta.active_teachers_7d,
    case
      when mp.month_count = 0 then 0::numeric(14,2)
      else round((mp.revenue_month / mp.month_count)::numeric, 2)::numeric(14,2)
    end as avg_check_month,
    mp.currency
  from month_payments mp
  cross join payments_7d p7
  cross join students_7d s7
  cross join teachers_active ta;
end;
$$;


--
-- Name: FUNCTION admin_dashboard_metrics(period_anchor timestamp with time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.admin_dashboard_metrics(period_anchor timestamp with time zone) IS 'Admin dashboard aggregate RPC. API guards are defense in depth; direct DB execution requires DB-backed roles.view:all until admin.dashboard.read is seeded.';


--
-- Name: admin_list_payment_control(integer, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_payment_control(p_threshold_lessons integer DEFAULT 1, p_query text DEFAULT ''::text, p_filter text DEFAULT 'all'::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 20) RETURNS TABLE(student_id uuid, profile_id uuid, first_name text, last_name text, email text, phone text, billing_mode text, available_lesson_count integer, debt_lesson_count integer, debt_money_amount numeric, money_remainder_amount numeric, lesson_price_amount numeric, effective_lesson_price_amount numeric, billing_currency text, billing_not_configured boolean, requires_attention boolean, billing_is_negative boolean, total_count bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'app_private', 'pg_temp'
    AS $$
  with authorized as (
    select
      app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all') as ok
  ),
  rows as (
    select *
    from public.admin_payment_control_summary_rows(
      greatest(coalesce(p_threshold_lessons, 1), 0),
      coalesce(p_query, ''),
      coalesce(p_filter, 'all')
    )
  )
  select
    rows.student_id,
    rows.profile_id,
    rows.first_name,
    rows.last_name,
    rows.email,
    rows.phone,
    rows.billing_mode,
    rows.available_lesson_count,
    rows.debt_lesson_count,
    rows.debt_money_amount,
    rows.money_remainder_amount,
    rows.lesson_price_amount,
    rows.effective_lesson_price_amount,
    rows.billing_currency,
    rows.billing_not_configured,
    rows.requires_attention,
    rows.billing_is_negative,
    count(*) over() as total_count
  from rows, authorized
  where authorized.ok
  order by
    rows.sort_priority asc,
    rows.available_lesson_count asc,
    lower(concat_ws(' ', coalesce(rows.first_name, ''), coalesce(rows.last_name, ''), coalesce(rows.email, ''))) asc
  offset greatest(coalesce(p_page, 1) - 1, 0) * greatest(coalesce(p_page_size, 20), 1)
  limit greatest(coalesce(p_page_size, 20), 1);
$$;


--
-- Name: admin_payment_control_stats(integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_payment_control_stats(p_threshold_lessons integer DEFAULT 1, p_query text DEFAULT ''::text, p_filter text DEFAULT 'all'::text) RETURNS TABLE(total_students bigint, attention_students bigint, debt_students bigint, one_lesson_left_students bigint, unconfigured_students bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'app_private', 'pg_temp'
    AS $$
  with authorized as (
    select
      app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all') as ok
  )
  select
    count(*)::bigint as total_students,
    count(*) filter (where rows.requires_attention)::bigint as attention_students,
    count(*) filter (where rows.billing_is_negative)::bigint as debt_students,
    count(*) filter (
      where not rows.billing_is_negative
        and not rows.billing_not_configured
        and rows.available_lesson_count <= 1
    )::bigint as one_lesson_left_students,
    count(*) filter (where rows.billing_not_configured)::bigint as unconfigured_students
  from public.admin_payment_control_summary_rows(
    greatest(coalesce(p_threshold_lessons, 1), 0),
    coalesce(p_query, ''),
    coalesce(p_filter, 'all')
  ) as rows,
  authorized
  where authorized.ok;
$$;


--
-- Name: admin_payment_control_summary_rows(integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_payment_control_summary_rows(p_threshold_lessons integer DEFAULT 1, p_query text DEFAULT ''::text, p_filter text DEFAULT 'all'::text) RETURNS TABLE(student_id uuid, profile_id uuid, first_name text, last_name text, email text, phone text, billing_mode text, available_lesson_count integer, debt_lesson_count integer, debt_money_amount numeric, money_remainder_amount numeric, lesson_price_amount numeric, effective_lesson_price_amount numeric, billing_currency text, billing_not_configured boolean, requires_attention boolean, billing_is_negative boolean, sort_priority integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  with filtered_students as (
    select
      s.id as student_id,
      p.id as profile_id,
      p.first_name,
      p.last_name,
      p.email,
      p.phone
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where p.role = 'student'
      and (
        nullif(trim(coalesce(p_query, '')), '') is null
        or lower(
          coalesce(p.first_name, '') || ' ' ||
          coalesce(p.last_name, '') || ' ' ||
          coalesce(p.email, '') || ' ' ||
          coalesce(p.phone, '')
        ) like '%' || lower(trim(coalesce(p_query, ''))) || '%'
      )
  ),
  ledger_totals as (
    select
      l.student_id,
      coalesce(
        sum(
          case
            when l.unit_type = 'lesson' and l.entry_direction = 'credit' then coalesce(l.lesson_units, 0)
            when l.unit_type = 'lesson' and l.entry_direction = 'debit' then -coalesce(l.lesson_units, 0)
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when l.unit_type = 'money' and l.entry_direction = 'credit' then coalesce(l.money_amount, 0)
            when l.unit_type = 'money' and l.entry_direction = 'debit' then -coalesce(l.money_amount, 0)
            else 0
          end
        ),
        0
      )::numeric(12,2) as remaining_money_amount
    from public.student_billing_ledger l
    join filtered_students fs on fs.student_id = l.student_id
    group by l.student_id
  ),
  latest_price as (
    select distinct on (l.student_id)
      l.student_id,
      l.effective_lesson_price_amount::numeric(12,2) as effective_lesson_price_amount
    from public.student_billing_ledger l
    join filtered_students fs on fs.student_id = l.student_id
    where l.effective_lesson_price_amount is not null
      and l.effective_lesson_price_amount > 0
    order by l.student_id, l.created_at desc
  ),
  merged as (
    select
      fs.student_id,
      fs.profile_id,
      fs.first_name,
      fs.last_name,
      fs.email,
      fs.phone,
      sba.billing_mode,
      sba.currency as account_currency,
      sba.lesson_price_amount::numeric(12,2) as account_lesson_price_amount,
      coalesce(lt.remaining_lesson_units, 0) as remaining_lesson_units,
      coalesce(lt.remaining_money_amount, 0)::numeric(12,2) as remaining_money_amount,
      lp.effective_lesson_price_amount
    from filtered_students fs
    left join public.student_billing_accounts sba on sba.student_id = fs.student_id
    left join ledger_totals lt on lt.student_id = fs.student_id
    left join latest_price lp on lp.student_id = fs.student_id
  ),
  computed as (
    select
      merged.student_id,
      merged.profile_id,
      merged.first_name,
      merged.last_name,
      merged.email,
      merged.phone,
      merged.billing_mode,
      coalesce(merged.account_currency, 'RUB') as billing_currency,
      merged.account_lesson_price_amount as lesson_price_amount,
      merged.effective_lesson_price_amount,
      (merged.billing_mode is null) as billing_not_configured,
      (
        (merged.billing_mode = 'package_lessons' and merged.remaining_lesson_units < 0)
        or (merged.billing_mode = 'per_lesson_price' and merged.remaining_money_amount < 0)
      ) as billing_is_negative,
      case
        when merged.billing_mode = 'package_lessons'
          then greatest(merged.remaining_lesson_units, 0)
        when merged.billing_mode = 'per_lesson_price'
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then floor(
            greatest(merged.remaining_money_amount, 0)
            / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::integer
        else 0
      end as available_lesson_count,
      case
        when merged.billing_mode = 'package_lessons' and merged.remaining_lesson_units < 0
          then abs(merged.remaining_lesson_units)
        when merged.billing_mode = 'per_lesson_price'
          and merged.remaining_money_amount < 0
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then ceil(
            abs(merged.remaining_money_amount)
            / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::integer
        else 0
      end as debt_lesson_count,
      case
        when merged.remaining_money_amount < 0
          then abs(merged.remaining_money_amount)::numeric(12,2)
        else 0::numeric(12,2)
      end as debt_money_amount,
      case
        when merged.billing_mode = 'per_lesson_price'
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then (
            greatest(merged.remaining_money_amount, 0)
            - floor(
              greatest(merged.remaining_money_amount, 0)
              / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
            ) * coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::numeric(12,2)
        else 0::numeric(12,2)
      end as money_remainder_amount
    from merged
  ),
  filtered as (
    select
      computed.*,
      (
        computed.billing_not_configured
        or computed.billing_is_negative
        or computed.available_lesson_count <= greatest(coalesce(p_threshold_lessons, 1), 0)
      ) as requires_attention,
      case
        when computed.billing_is_negative then 0
        when computed.billing_not_configured then 1
        when computed.available_lesson_count <= 1 then 2
        else 3
      end as sort_priority
    from computed
    where case coalesce(p_filter, 'all')
      when 'attention' then (
        computed.billing_not_configured
        or computed.billing_is_negative
        or computed.available_lesson_count <= greatest(coalesce(p_threshold_lessons, 1), 0)
      )
      when 'debt' then computed.billing_is_negative
      when 'one_lesson' then (
        not computed.billing_is_negative
        and not computed.billing_not_configured
        and computed.available_lesson_count <= 1
      )
      when 'unconfigured' then computed.billing_not_configured
      else true
    end
  )
  select
    filtered.student_id,
    filtered.profile_id,
    filtered.first_name,
    filtered.last_name,
    filtered.email,
    filtered.phone,
    filtered.billing_mode,
    filtered.available_lesson_count,
    filtered.debt_lesson_count,
    filtered.debt_money_amount,
    filtered.money_remainder_amount,
    filtered.lesson_price_amount,
    filtered.effective_lesson_price_amount,
    filtered.billing_currency,
    filtered.billing_not_configured,
    filtered.requires_attention,
    filtered.billing_is_negative,
    filtered.sort_priority
  from filtered;
$$;


--
-- Name: apply_user_provisioning(uuid, text, jsonb, jsonb, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_user_provisioning(p_user_id uuid, p_email text, p_user_meta_data jsonb, p_app_meta_data jsonb, p_email_confirmed_at timestamp with time zone, p_confirmed_at timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_source text := coalesce(nullif(p_app_meta_data ->> 'provision_source', ''), 'public_signup');
  v_role text;
  v_role_id uuid;
  v_is_confirmed boolean := p_email_confirmed_at is not null or p_confirmed_at is not null;
begin
  if v_source not in ('public_signup', 'admin_create', 'invite') then
    raise exception 'Invalid provision_source: %', v_source
      using errcode = '22023';
  end if;

  if v_source = 'invite' then
    -- Invite acceptance will get an explicit provisioning path later.
    return;
  end if;

  if v_source = 'public_signup' and not v_is_confirmed then
    return;
  end if;

  if v_source = 'admin_create' then
    v_role := nullif(p_app_meta_data ->> 'provision_role', '');
    if v_role is null then
      raise exception 'admin_create provisioning requires provision_role'
        using errcode = '22023';
    end if;
  else
    v_role := coalesce(nullif(p_app_meta_data ->> 'provision_role', ''), 'student');
  end if;

  if v_role not in ('student', 'teacher', 'manager', 'admin') then
    raise exception 'Invalid provision_role: %', v_role
      using errcode = '22023';
  end if;

  select r.id
    into v_role_id
  from public.roles r
  where r.key = v_role;

  if v_role_id is null then
    raise exception 'Provisioning role is not configured: %', v_role
      using errcode = '23503';
  end if;

  if v_role = 'student' then
    if exists (
      select 1
      from public.teachers
      where profile_id = p_user_id
    ) then
      raise exception 'Cannot provision user % as student because teacher identity already exists', p_user_id
        using errcode = '23514';
    end if;
  elsif v_role = 'teacher' then
    if exists (
      select 1
      from public.students
      where profile_id = p_user_id
    ) then
      raise exception 'Cannot provision user % as teacher because student identity already exists', p_user_id
        using errcode = '23514';
    end if;
  elsif exists (
    select 1
    from public.students
    where profile_id = p_user_id
  ) or exists (
    select 1
    from public.teachers
    where profile_id = p_user_id
  ) then
    raise exception 'Cannot provision user % as % because linked student/teacher identity already exists', p_user_id, v_role
      using errcode = '23514';
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    status
  )
  values (
    p_user_id,
    p_email,
    coalesce(p_user_meta_data ->> 'first_name', ''),
    coalesce(p_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(p_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(p_email, ''), '@', 1)
    ),
    v_role,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status;

  delete from public.user_roles
  where user_id = p_user_id
    and role_id <> v_role_id;

  insert into public.user_roles (user_id, role_id)
  values (p_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;

  if v_role = 'student' then
    insert into public.students (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'teacher' then
    insert into public.teachers (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  end if;
end;
$$;


--
-- Name: backfill_search_documents(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.backfill_search_documents() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row record;
begin
  delete from public.search_documents
  where entity_type in (
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
  );

  for v_row in select id from public.blog_categories loop
    perform public.sync_search_document_blog_category(v_row.id);
  end loop;

  for v_row in select id from public.blog_posts loop
    perform public.sync_search_document_blog_post(v_row.id);
  end loop;

  for v_row in select id from public.courses loop
    perform public.sync_search_document_course(v_row.id);
  end loop;

  for v_row in select id from public.course_modules loop
    perform public.sync_search_document_course_module(v_row.id);
  end loop;

  for v_row in select id from public.lessons loop
    perform public.sync_search_document_lesson(v_row.id);
  end loop;

  for v_row in select id from public.tests loop
    perform public.sync_search_document_test(v_row.id);
  end loop;

  if to_regclass('public.homework_assignments') is not null then
    for v_row in select id from public.homework_assignments loop
      perform public.sync_search_document_homework_assignment(v_row.id);
    end loop;
  end if;

  if to_regclass('public.student_words') is not null then
    for v_row in select id from public.student_words loop
      perform public.sync_search_document_student_word(v_row.id);
    end loop;
  end if;

  for v_row in select id from public.profiles loop
    perform public.sync_search_document_profile(v_row.id);
  end loop;

  if to_regclass('public.notifications') is not null then
    for v_row in select id from public.notifications loop
      perform public.sync_search_document_notification(v_row.id);
    end loop;
  end if;
end;
$$;


--
-- Name: create_current_student_payment_transaction(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_current_student_payment_transaction(p_transaction_id uuid, p_plan_id uuid, p_return_url text, p_idempotence_key text) RETURNS TABLE(transaction_id uuid, amount numeric, currency text, title text, description text, receipt_label text, student_id uuid, user_id uuid, customer_email text, plan_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_student record;
  v_plan record;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select
    s.id as student_id,
    p.id as profile_id,
    p.email
  into v_student
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = v_user_id
  limit 1;

  if v_student.student_id is null then
    raise exception 'Current student profile not found';
  end if;

  select
    pp.id,
    pp.title,
    pp.description,
    pp.amount,
    pp.currency,
    pp.yookassa_product_label,
    pp.is_active
  into v_plan
  from public.payment_plans pp
  where pp.id = p_plan_id
    and pp.is_active = true
  limit 1;

  if v_plan.id is null then
    raise exception 'Payment plan not found';
  end if;

  insert into public.payment_transactions (
    id,
    student_id,
    amount,
    currency,
    status,
    description,
    provider,
    plan_id,
    return_url,
    idempotence_key,
    raw_status,
    metadata
  )
  values (
    p_transaction_id,
    v_student.student_id,
    coalesce(v_plan.amount, 0),
    coalesce(v_plan.currency, 'RUB'),
    'pending',
    coalesce(v_plan.description, v_plan.title),
    'yookassa',
    v_plan.id,
    p_return_url,
    p_idempotence_key,
    'pending',
    jsonb_build_object(
      'user_id', v_user_id,
      'student_id', v_student.student_id,
      'plan_id', v_plan.id
    )
  );

  return query
  select
    p_transaction_id,
    coalesce(v_plan.amount, 0)::numeric,
    coalesce(v_plan.currency, 'RUB')::text,
    v_plan.title::text,
    v_plan.description::text,
    coalesce(v_plan.yookassa_product_label, v_plan.title)::text,
    v_student.student_id::uuid,
    v_user_id,
    coalesce(v_student.email, '')::text,
    v_plan.id::uuid;
end;
$$;


--
-- Name: create_public_crm_lead(text, text, text, text, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text DEFAULT NULL::text, p_source text DEFAULT NULL::text, p_page_url text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(id uuid, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_lead_id uuid;
  v_status text := 'new_request';
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'Lead name is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_phone, '')), '') is null then
    raise exception 'Lead phone is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is null then
    raise exception 'Lead email is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_form_type, '')), '') is null then
    raise exception 'Lead form_type is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) is distinct from 'object' then
    raise exception 'Lead metadata must be a JSON object' using errcode = '22023';
  end if;

  insert into public.crm_leads (
    name,
    phone,
    email,
    comment,
    source,
    form_type,
    page_url,
    metadata,
    status
  )
  values (
    btrim(p_name),
    btrim(p_phone),
    lower(btrim(p_email)),
    nullif(btrim(coalesce(p_comment, '')), ''),
    nullif(btrim(coalesce(p_source, '')), ''),
    btrim(p_form_type),
    nullif(btrim(coalesce(p_page_url, '')), ''),
    v_metadata,
    v_status
  )
  returning crm_leads.id into v_lead_id;

  insert into public.crm_lead_status_history (
    lead_id,
    from_status,
    to_status,
    changed_by
  )
  values (
    v_lead_id,
    null,
    v_status,
    null
  );

  return query select v_lead_id, v_status;
end;
$$;


--
-- Name: FUNCTION create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb) IS 'Narrow public lead intake RPC. Inserts a CRM lead and initial status history row without exposing anon table policies.';


--
-- Name: current_student_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_student_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select s.id
  from public.students s
  where s.profile_id = auth.uid()
  limit 1;
$$;


--
-- Name: current_teacher_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_teacher_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select t.id
  from public.teachers t
  where t.profile_id = auth.uid()
  limit 1;
$$;


--
-- Name: delete_search_document(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_search_document(p_entity_type text, p_entity_id uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  delete from public.search_documents
  where entity_type = p_entity_type
    and entity_id = p_entity_id;
$$;


--
-- Name: enforce_profile_auth_identity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_profile_auth_identity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_auth_email text;
  v_provision_role text;
begin
  select
    lower(btrim(u.email)),
    coalesce(nullif(u.raw_app_meta_data ->> 'provision_role', ''), 'student')
  into v_auth_email, v_provision_role
  from auth.users u
  where u.id = new.id;

  if v_auth_email is null then
    raise exception 'Profile must reference an Auth user with an email'
      using errcode = '23503';
  end if;

  new.email := lower(btrim(new.email));
  if new.email is distinct from v_auth_email then
    raise exception 'Profile email must match Auth email'
      using errcode = '23514';
  end if;

  if (tg_op = 'INSERT' or new.role is distinct from old.role)
     and new.role is distinct from v_provision_role then
    raise exception 'Profile role must match Auth provision_role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;


--
-- Name: enforce_user_role_matches_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_user_role_matches_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_profile_role text;
  v_role_key text;
begin
  select p.role into v_profile_role
  from public.profiles p
  where p.id = new.user_id;

  select r.key into v_role_key
  from public.roles r
  where r.id = new.role_id;

  if v_profile_role is null or v_role_key is null or v_profile_role is distinct from v_role_key then
    raise exception 'RBAC role must match profile role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;


--
-- Name: get_accessible_profile_labels(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_accessible_profile_labels(p_profile_ids uuid[]) RETURNS TABLE(profile_id uuid, display_name text, first_name text, last_name text, role text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_profile_ids uuid[] := coalesce(p_profile_ids, array[]::uuid[]);
begin
  if cardinality(v_profile_ids) = 0 then
    return;
  end if;

  if cardinality(v_profile_ids) > 200 then
    raise exception 'Too many profile ids requested';
  end if;

  return query
  with requested_profiles as (
    select distinct requested.profile_id
    from unnest(v_profile_ids) as requested(profile_id)
    where requested.profile_id is not null
  )
  select
    p.id as profile_id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.role
  from requested_profiles rp
  join public.profiles p
    on p.id = rp.profile_id
  where
    p.id = auth.uid()
    or app_private.has_permission('users.view', 'all')
    or exists (
      select 1
      from public.students s
      where s.profile_id = p.id
        and app_private.can_access_student(s.id)
    )
    or exists (
      select 1
      from public.teacher_student_notes n
      where n.created_by_profile_id = p.id
        and app_private.can_access_student(n.student_id)
        and (
          app_private.is_assigned_teacher(n.student_id)
          or app_private.has_permission('students.view', 'all')
        )
    );
end;
$$;


--
-- Name: FUNCTION get_accessible_profile_labels(p_profile_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_accessible_profile_labels(p_profile_ids uuid[]) IS 'Returns minimal profile labels for current user, staff-visible users, accessible student profiles, and note authors on teacher/staff-accessible students.';


--
-- Name: get_accessible_student_billing_summary(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_accessible_student_billing_summary(p_student_id uuid, p_recent_entries_limit integer DEFAULT 8) RETURNS TABLE(account jsonb, remaining_lesson_units integer, remaining_money_amount numeric, effective_lesson_price_amount numeric, effective_lesson_price_currency text, recent_entries jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  with authorized as (
    select p_student_id as student_id
    where app_private.can_view_payment(p_student_id)
  ),
  normalized_limit as (
    select least(greatest(coalesce(p_recent_entries_limit, 8), 0), 50) as value
  ),
  ledger as (
    select
      l.id,
      l.student_id,
      l.entry_direction,
      l.unit_type,
      l.lesson_units,
      l.money_amount,
      l.reason,
      l.payment_transaction_id,
      l.schedule_lesson_id,
      l.payment_plan_id,
      l.effective_lesson_price_amount,
      l.effective_lesson_price_currency,
      l.description,
      l.created_at
    from public.student_billing_ledger l
    join authorized a on a.student_id = l.student_id
  ),
  balances as (
    select
      coalesce(
        sum(
          case
            when unit_type = 'lesson' and entry_direction = 'credit' then coalesce(lesson_units, 0)
            when unit_type = 'lesson' and entry_direction = 'debit' then -coalesce(lesson_units, 0)
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when unit_type = 'money' and entry_direction = 'credit' then coalesce(money_amount, 0)
            when unit_type = 'money' and entry_direction = 'debit' then -coalesce(money_amount, 0)
            else 0
          end
        ),
        0
      )::numeric(12,2) as remaining_money_amount
    from ledger
  ),
  latest_price as (
    select
      effective_lesson_price_amount,
      effective_lesson_price_currency
    from ledger
    where effective_lesson_price_amount is not null
      and effective_lesson_price_amount > 0
    order by created_at desc
    limit 1
  ),
  billing_account as (
    select to_jsonb(a.*) as account
    from public.student_billing_accounts a
    join authorized au on au.student_id = a.student_id
    limit 1
  ),
  recent as (
    select coalesce(jsonb_agg(to_jsonb(r.*) order by r.created_at desc), '[]'::jsonb) as entries
    from (
      select *
      from ledger
      order by created_at desc
      limit (select value from normalized_limit)
    ) r
  )
  select
    billing_account.account,
    balances.remaining_lesson_units,
    balances.remaining_money_amount,
    latest_price.effective_lesson_price_amount,
    latest_price.effective_lesson_price_currency,
    recent.entries as recent_entries
  from authorized
  cross join balances
  cross join recent
  left join billing_account on true
  left join latest_price on true;
$$;


--
-- Name: get_linked_actor_scope(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_linked_actor_scope(p_profile_id uuid) RETURNS TABLE(student_id uuid, teacher_id uuid, accessible_student_ids uuid[])
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  with authorized_profile as (
    select p_profile_id as id
    where p_profile_id = auth.uid()
  ),
  linked_student as (
    select s.id
    from public.students s
    join authorized_profile ap
      on ap.id = s.profile_id
    limit 1
  ),
  linked_teacher as (
    select t.id
    from public.teachers t
    join authorized_profile ap
      on ap.id = t.profile_id
    limit 1
  ),
  teacher_accessible_students as (
    select lt.id as teacher_id, s.id as student_id
    from linked_teacher lt
    join public.students s
      on s.primary_teacher_id = lt.id
    union
    select lt.id as teacher_id, sce.student_id
    from linked_teacher lt
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = lt.id
     and sce.status = 'active'
     and sce.student_id is not null
  ),
  teacher_scope as (
    select
      lt.id as teacher_id,
      coalesce(
        array_agg(distinct tas.student_id) filter (where tas.student_id is not null),
        '{}'::uuid[]
      ) as accessible_student_ids
    from linked_teacher lt
    left join teacher_accessible_students tas
      on tas.teacher_id = lt.id
    group by lt.id
  )
  select
    (select id from linked_student) as student_id,
    teacher_scope.teacher_id,
    case
      when teacher_scope.teacher_id is null then null
      else teacher_scope.accessible_student_ids
    end as accessible_student_ids
  from teacher_scope
  union all
  select
    (select id from linked_student) as student_id,
    null::uuid as teacher_id,
    null::uuid[] as accessible_student_ids
  where exists (select 1 from authorized_profile)
    and not exists (select 1 from teacher_scope)
  limit 1;
$$;


--
-- Name: FUNCTION get_linked_actor_scope(p_profile_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_linked_actor_scope(p_profile_id uuid) IS 'Returns student/teacher links and teacher-accessible student ids for the authenticated profile, including primary teacher and active enrollment assignments.';


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select role
  from public.profiles
  where id = auth.uid()
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    audience text DEFAULT 'mixed'::text NOT NULL,
    level_from text,
    level_to text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT courses_audience_check CHECK ((audience = ANY (ARRAY['adults'::text, 'kids'::text, 'mixed'::text])))
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    lesson_type text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    duration_minutes integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lessons_lesson_type_check CHECK ((lesson_type = ANY (ARRAY['theory'::text, 'practice'::text, 'video'::text, 'live'::text, 'quiz'::text, 'flashcards'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    display_name text,
    avatar_url text,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    phone text,
    timezone text DEFAULT 'UTC'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    birth_date date,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text, 'manager'::text]))),
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'blocked'::text])))
);


--
-- Name: student_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    activity_type text NOT NULL,
    entity_type text,
    entity_id uuid,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    assigned_teacher_id uuid,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_course_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: student_lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    progress_percent numeric(5,2) DEFAULT 0 NOT NULL,
    time_spent_seconds integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_position jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_lesson_progress_progress_percent_check CHECK (((progress_percent >= (0)::numeric) AND (progress_percent <= (100)::numeric))),
    CONSTRAINT student_lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: student_test_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    test_id uuid NOT NULL,
    score numeric(5,2),
    correct_answers integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    time_spent_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    recommended_level text,
    recommended_band_label text,
    placement_summary jsonb,
    CONSTRAINT student_test_attempts_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'passed'::text, 'failed'::text])))
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    birth_date date,
    english_level text,
    target_level text,
    learning_goal text,
    preferred_language text DEFAULT 'ru'::text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    primary_teacher_id uuid
);


--
-- Name: student_dashboard_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.student_dashboard_view WITH (security_invoker='true') AS
 WITH active_enrollment AS (
         SELECT DISTINCT ON (e.student_id) e.student_id,
            e.course_id,
            c.title AS course_title
           FROM (public.student_course_enrollments e
             JOIN public.courses c ON ((c.id = e.course_id)))
          WHERE (e.status = 'active'::text)
          ORDER BY e.student_id, e.started_at DESC NULLS LAST, e.created_at DESC
        ), course_lessons AS (
         SELECT ae_1.student_id,
            l.id AS lesson_id,
            cm.id AS module_id
           FROM ((active_enrollment ae_1
             JOIN public.course_modules cm ON ((cm.course_id = ae_1.course_id)))
             JOIN public.lessons l ON ((l.module_id = cm.id)))
        ), lesson_stats AS (
         SELECT cl.student_id,
            (count(cl.lesson_id))::integer AS total_lessons,
            (count(slp.lesson_id) FILTER (WHERE (slp.status = 'completed'::text)))::integer AS completed_lessons,
            (COALESCE(sum(slp.time_spent_seconds), (0)::bigint))::integer AS total_study_time_seconds,
            max(slp.completed_at) AS last_completed_at
           FROM (course_lessons cl
             LEFT JOIN public.student_lesson_progress slp ON (((slp.student_id = cl.student_id) AND (slp.lesson_id = cl.lesson_id))))
          GROUP BY cl.student_id
        ), module_stats AS (
         SELECT ae_1.student_id,
            (count(DISTINCT cm.id))::integer AS total_modules_count,
            (count(DISTINCT cm.id) FILTER (WHERE (NOT (EXISTS ( SELECT 1
                   FROM (public.lessons l
                     LEFT JOIN public.student_lesson_progress slp ON (((slp.lesson_id = l.id) AND (slp.student_id = ae_1.student_id))))
                  WHERE ((l.module_id = cm.id) AND (slp.status IS DISTINCT FROM 'completed'::text)))))))::integer AS completed_modules_count
           FROM (active_enrollment ae_1
             JOIN public.course_modules cm ON ((cm.course_id = ae_1.course_id)))
          GROUP BY ae_1.student_id
        ), test_stats AS (
         SELECT sta.student_id,
            (count(*) FILTER (WHERE (sta.status = ANY (ARRAY['submitted'::text, 'passed'::text, 'failed'::text]))))::integer AS tests_completed_count
           FROM public.student_test_attempts sta
          GROUP BY sta.student_id
        ), last_test AS (
         SELECT DISTINCT ON (sta.student_id) sta.student_id,
            sta.score AS last_test_score
           FROM public.student_test_attempts sta
          WHERE (sta.status = ANY (ARRAY['submitted'::text, 'passed'::text, 'failed'::text]))
          ORDER BY sta.student_id, COALESCE(sta.submitted_at, sta.created_at) DESC
        ), last_completed_lesson AS (
         SELECT DISTINCT ON (slp.student_id) slp.student_id,
            l.title AS last_completed_lesson_title
           FROM (public.student_lesson_progress slp
             JOIN public.lessons l ON ((l.id = slp.lesson_id)))
          WHERE (slp.status = 'completed'::text)
          ORDER BY slp.student_id, slp.completed_at DESC NULLS LAST
        ), last_activity AS (
         SELECT sal.student_id,
            max(sal.created_at) AS last_activity_at
           FROM public.student_activity_log sal
          GROUP BY sal.student_id
        )
 SELECT s.id AS student_id,
    p.display_name,
    p.avatar_url,
    ae.course_id AS current_course_id,
    ae.course_title AS current_course_title,
        CASE
            WHEN (COALESCE(ls.total_lessons, 0) = 0) THEN (0)::numeric
            ELSE round((((COALESCE(ls.completed_lessons, 0))::numeric / (ls.total_lessons)::numeric) * (100)::numeric), 2)
        END AS overall_progress_percent,
    COALESCE(ms.completed_modules_count, 0) AS completed_modules_count,
    COALESCE(ms.total_modules_count, 0) AS total_modules_count,
    COALESCE(ts.tests_completed_count, 0) AS tests_completed_count,
    0 AS current_streak_days,
    COALESCE(ls.total_study_time_seconds, 0) AS total_study_time_seconds,
    lt.last_test_score,
    lcl.last_completed_lesson_title,
    la.last_activity_at
   FROM ((((((((public.students s
     JOIN public.profiles p ON ((p.id = s.profile_id)))
     LEFT JOIN active_enrollment ae ON ((ae.student_id = s.id)))
     LEFT JOIN lesson_stats ls ON ((ls.student_id = s.id)))
     LEFT JOIN module_stats ms ON ((ms.student_id = s.id)))
     LEFT JOIN test_stats ts ON ((ts.student_id = s.id)))
     LEFT JOIN last_test lt ON ((lt.student_id = s.id)))
     LEFT JOIN last_completed_lesson lcl ON ((lcl.student_id = s.id)))
     LEFT JOIN last_activity la ON ((la.student_id = s.id)));


--
-- Name: VIEW student_dashboard_view; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.student_dashboard_view IS 'Legacy student dashboard aggregate view. Kept closed to direct anon/authenticated API access; use application services/RPCs instead.';


--
-- Name: get_my_student_dashboard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_student_dashboard() RETURNS SETOF public.student_dashboard_view
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select *
  from public.student_dashboard_view
  where student_id = public.current_student_id()
$$;


--
-- Name: get_my_student_dashboard_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_student_dashboard_summary() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
with current_student as (
  select s.id
  from public.students s
  where s.profile_id = auth.uid()
  limit 1
),
placement_test as (
  select t.id, t.title
  from public.tests t
  where t.assessment_kind = 'placement'
    and t.is_published = true
  order by t.created_at desc
  limit 1
),
placement_assignment as (
  select ha.id, ha.title, ha.status, ha.due_at, pt.id as test_id, pt.title as test_title
  from public.homework_assignments ha
  join current_student cs on cs.id = ha.student_id
  join public.homework_items hi on hi.assignment_id = ha.id
  join placement_test pt on pt.id = hi.source_id
  where hi.source_type = 'test'
  order by ha.created_at desc
  limit 1
),
active_homework as (
  select ha.id, ha.title, ha.status, ha.due_at
  from public.homework_assignments ha
  join current_student cs on cs.id = ha.student_id
  where ha.status in ('not_started', 'in_progress', 'overdue')
    and not exists (
      select 1
      from public.homework_items hi
      join placement_test pt on pt.id = hi.source_id
      where hi.assignment_id = ha.id
        and hi.source_type = 'test'
    )
),
homework_summary as (
  select
    count(*) as active_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', preview.id,
            'title', preview.title,
            'status', preview.status,
            'dueAt', preview.due_at
          )
          order by preview.due_at asc nulls last, preview.id asc
        )
        from (
          select ah.id, ah.title, ah.status, ah.due_at
          from active_homework ah
          order by ah.due_at asc nulls last, ah.id asc
          limit 2
        ) preview
      ),
      '[]'::jsonb
    ) as preview_rows
  from active_homework
),
word_counts as (
  select
    count(*) filter (where sw.status in ('learning', 'review', 'difficult')) as learning_count,
    count(*) filter (
      where sw.status in ('learning', 'review', 'difficult')
        and (sw.next_review_at is null or sw.next_review_at <= now())
    ) as due_review_count,
    count(*) filter (where sw.status = 'mastered') as mastered_count
  from public.student_words sw
  join current_student cs on cs.id = sw.student_id
),
progress_rows as (
  select
    slp.status,
    slp.progress_percent,
    slp.updated_at,
    slp.lesson_id,
    l.title as lesson_title,
    l.duration_minutes as lesson_duration_minutes,
    l.module_id as lesson_module_id
  from public.student_lesson_progress slp
  join current_student cs on cs.id = slp.student_id
  left join public.lessons l on l.id = slp.lesson_id
  order by slp.updated_at desc
  limit 6
),
progress_summary as (
  select
    coalesce(
      (
        select jsonb_build_object(
          'status', pr.status,
          'progressPercent', pr.progress_percent,
          'updatedAt', pr.updated_at,
          'lessonId', pr.lesson_id,
          'lesson', jsonb_build_object(
            'title', pr.lesson_title,
            'durationMinutes', pr.lesson_duration_minutes,
            'moduleId', pr.lesson_module_id
          )
        )
        from progress_rows pr
        order by (pr.status = 'in_progress') desc, pr.updated_at desc
        limit 1
      ),
      null
    ) as latest_progress,
    coalesce(round(avg(pr.progress_percent))::int, 0) as average_progress,
    count(*) filter (where pr.status = 'in_progress') as active_progress_count
  from progress_rows pr
),
active_courses as (
  select sce.status, c.title as course_title
  from public.student_course_enrollments sce
  join current_student cs on cs.id = sce.student_id
  left join public.courses c on c.id = sce.course_id
  where sce.status = 'active'
  order by sce.created_at desc
  limit 4
),
course_summary as (
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'status', ac.status,
          'course', jsonb_build_object('title', ac.course_title)
        )
      ) filter (where ac.status is not null),
      '[]'::jsonb
    ) as active_courses,
    count(*) as active_count
  from active_courses ac
),
recent_attempt_rows as (
  select sta.status, sta.score, sta.created_at, sta.submitted_at, t.assessment_kind
  from public.student_test_attempts sta
  join current_student cs on cs.id = sta.student_id
  left join public.tests t on t.id = sta.test_id
  order by sta.created_at desc
  limit 20
),
attempt_summary as (
  select
    count(*) filter (
      where rar.status <> 'in_progress'
        and coalesce(rar.assessment_kind, '') <> 'placement'
    ) as submitted_count,
    coalesce(
      round(
        avg(rar.score) filter (
          where rar.status <> 'in_progress'
            and coalesce(rar.assessment_kind, '') <> 'placement'
        )
      )::int,
      0
    ) as average_score
  from recent_attempt_rows rar
),
lesson_stats_7d as (
  select count(*) as completed_count
  from public.lesson_attendance la
  join public.student_schedule_lessons ssl on ssl.id = la.schedule_lesson_id
  join current_student cs on cs.id = la.student_id
  where la.status = 'completed'
    and ssl.status <> 'canceled'
    and ssl.ends_at <= now()
    and ssl.ends_at >= now() - interval '7 days'
),
test_stats_7d as (
  select count(*) as submitted_count
  from public.student_test_attempts sta
  join current_student cs on cs.id = sta.student_id
  left join public.tests t on t.id = sta.test_id
  where sta.status <> 'in_progress'
    and coalesce(t.assessment_kind, '') <> 'placement'
    and sta.submitted_at <= now()
    and sta.submitted_at >= now() - interval '7 days'
),
schedule_rows as (
  select
    ssl.id,
    ssl.student_id,
    ssl.teacher_id,
    ssl.title,
    ssl.starts_at,
    ssl.ends_at,
    ssl.meeting_url,
    ssl.comment,
    ssl.status,
    ssl.created_at,
    ssl.updated_at,
    coalesce(
      (
        select teacher_options.label
        from public.get_schedule_teacher_options(array[ssl.teacher_id]) teacher_options
        where teacher_options.id = ssl.teacher_id
        limit 1
      ),
      'Преподаватель'
    ) as teacher_name
  from public.student_schedule_lessons ssl
  join current_student cs on cs.id = ssl.student_id
  where ssl.status = 'scheduled'
    and ssl.starts_at >= now()
  order by ssl.starts_at asc
  limit 3
),
schedule_summary as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sr.id,
        'studentId', sr.student_id,
        'studentName', 'Вы',
        'teacherId', sr.teacher_id,
        'teacherName', sr.teacher_name,
        'title', sr.title,
        'startsAt', sr.starts_at,
        'endsAt', sr.ends_at,
        'meetingUrl', sr.meeting_url,
        'comment', sr.comment,
        'status', sr.status,
        'createdAt', sr.created_at,
        'updatedAt', sr.updated_at,
        'attendanceStatus', null,
        'hasOutcome', false,
        'studentVisibleOutcome', null
      )
      order by sr.starts_at asc
    ),
    '[]'::jsonb
  ) as upcoming_lessons
  from schedule_rows sr
)
select
  case
    when not exists (select 1 from current_student) then null
    else jsonb_build_object(
      'homework', jsonb_build_object(
        'activeCount', coalesce((select hs.active_count from homework_summary hs), 0),
        'previewRows', coalesce((select hs.preview_rows from homework_summary hs), '[]'::jsonb)
      ),
      'wordCounts', jsonb_build_object(
        'learningCount', coalesce((select wc.learning_count from word_counts wc), 0),
        'dueReviewCount', coalesce((select wc.due_review_count from word_counts wc), 0),
        'masteredCount', coalesce((select wc.mastered_count from word_counts wc), 0)
      ),
      'stats7d', jsonb_build_object(
        'completedTeacherLessons', coalesce((select ls.completed_count from lesson_stats_7d ls), 0),
        'submittedTests', coalesce((select ts.submitted_count from test_stats_7d ts), 0)
      ),
      'progress', jsonb_build_object(
        'latest', (select ps.latest_progress from progress_summary ps),
        'averageProgress', coalesce((select ps.average_progress from progress_summary ps), 0),
        'activeProgressCount', coalesce((select ps.active_progress_count from progress_summary ps), 0),
        'activeCourses', coalesce((select cs.active_courses from course_summary cs), '[]'::jsonb),
        'activeCourseCount', coalesce((select cs.active_count from course_summary cs), 0)
      ),
      'attempts', jsonb_build_object(
        'submittedCount', coalesce((select ats.submitted_count from attempt_summary ats), 0),
        'averageScore', coalesce((select ats.average_score from attempt_summary ats), 0)
      ),
      'schedule', jsonb_build_object(
        'upcomingLessons', coalesce((select ss.upcoming_lessons from schedule_summary ss), '[]'::jsonb)
      ),
      'placementTest', (
        select jsonb_build_object(
          'assigned', true,
          'completed', pa.status = 'completed',
          'testId', pa.test_id,
          'title', coalesce(pa.test_title, pa.title, 'Placement Test'),
          'dueAt', pa.due_at,
          'status', pa.status
        )
        from placement_assignment pa
      )
    )
  end;
$$;


--
-- Name: get_schedule_student_options(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_schedule_student_options(p_student_ids uuid[] DEFAULT NULL::uuid[]) RETURNS TABLE(id uuid, label text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select
    s.id,
    coalesce(
      nullif(p.display_name, ''),
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      p.email,
      'Ученик'
    ) as label
  from public.students s
  left join public.profiles p on p.id = s.profile_id
  where (p_student_ids is null or s.id = any(p_student_ids))
    and (
      app_private.can_access_student(s.id)
      or app_private.has_permission('students.view', 'all')
      or app_private.has_permission('schedule.view', 'all')
    )
  order by s.created_at asc;
$$;


--
-- Name: FUNCTION get_schedule_student_options(p_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_schedule_student_options(p_student_ids uuid[]) IS 'Returns schedule student option labels visible to the current actor, using app_private.can_access_student and all-scoped staff permissions.';


--
-- Name: get_schedule_teacher_options(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_schedule_teacher_options(p_teacher_ids uuid[] DEFAULT NULL::uuid[]) RETURNS TABLE(id uuid, label text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select
    t.id,
    coalesce(
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      nullif(p.display_name, ''),
      p.email,
      'Преподаватель'
    ) as label
  from public.teachers t
  left join public.profiles p on p.id = t.profile_id
  where (p_teacher_ids is null or t.id = any(p_teacher_ids))
    and (
      t.profile_id = auth.uid()
      or app_private.has_permission('teachers.view', 'all')
      or app_private.has_permission('schedule.view', 'all')
      or exists (
        select 1
        from public.student_schedule_lessons ssl
        where ssl.teacher_id = t.id
          and app_private.can_access_student(ssl.student_id)
      )
    )
  order by t.created_at asc;
$$;


--
-- Name: FUNCTION get_schedule_teacher_options(p_teacher_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_schedule_teacher_options(p_teacher_ids uuid[]) IS 'Returns schedule-visible teacher labels, preferring first_name + last_name over display_name role placeholders.';


--
-- Name: get_student_billing_summary_aggregates(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_billing_summary_aggregates(p_student_id uuid) RETURNS TABLE(remaining_lesson_units integer, remaining_money_amount numeric, effective_lesson_price_amount numeric, effective_lesson_price_currency text)
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  with ledger as (
    select
      entry_direction,
      unit_type,
      coalesce(lesson_units, 0) as lesson_units,
      coalesce(money_amount, 0)::numeric(12,2) as money_amount,
      effective_lesson_price_amount,
      effective_lesson_price_currency,
      created_at
    from public.student_billing_ledger
    where student_id = p_student_id
  ),
  balances as (
    select
      coalesce(
        sum(
          case
            when unit_type = 'lesson' and entry_direction = 'credit' then lesson_units
            when unit_type = 'lesson' and entry_direction = 'debit' then -lesson_units
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when unit_type = 'money' and entry_direction = 'credit' then money_amount
            when unit_type = 'money' and entry_direction = 'debit' then -money_amount
            else 0
          end
        ),
        0
      )::numeric(12,2) as remaining_money_amount
    from ledger
  ),
  latest_price as (
    select
      effective_lesson_price_amount,
      effective_lesson_price_currency
    from ledger
    where effective_lesson_price_amount is not null
      and effective_lesson_price_amount > 0
    order by created_at desc
    limit 1
  )
  select
    balances.remaining_lesson_units,
    balances.remaining_money_amount,
    latest_price.effective_lesson_price_amount,
    latest_price.effective_lesson_price_currency
  from balances
  left join latest_price on true;
$$;


--
-- Name: get_student_dashboard_payment_reminder_inputs(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_dashboard_payment_reminder_inputs(p_student_id uuid) RETURNS TABLE(settings_enabled boolean, threshold_lessons integer, billing_account jsonb, billing_ledger jsonb, next_scheduled_lesson_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_student_id is null then
    return;
  end if;

  if not (
    app_private.is_own_student(p_student_id)
    or app_private.can_view_payment(p_student_id)
  ) then
    return;
  end if;

  return query
  with reminder_settings as (
    select
      s.enabled,
      s.threshold_lessons
    from public.admin_payment_reminder_settings s
    where s.id = true
    limit 1
  ),
  account_data as (
    select jsonb_build_object(
      'id', a.id,
      'student_id', a.student_id,
      'billing_mode', a.billing_mode,
      'lesson_price_amount', a.lesson_price_amount,
      'currency', a.currency,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ) as data
    from public.student_billing_accounts a
    where a.student_id = p_student_id
    limit 1
  ),
  ledger_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'student_id', l.student_id,
          'entry_direction', l.entry_direction,
          'unit_type', l.unit_type,
          'lesson_units', l.lesson_units,
          'money_amount', l.money_amount,
          'reason', l.reason,
          'payment_transaction_id', l.payment_transaction_id,
          'schedule_lesson_id', l.schedule_lesson_id,
          'payment_plan_id', l.payment_plan_id,
          'effective_lesson_price_amount', l.effective_lesson_price_amount,
          'effective_lesson_price_currency', l.effective_lesson_price_currency,
          'description', l.description,
          'created_at', l.created_at
        )
        order by l.created_at desc
      ),
      '[]'::jsonb
    ) as data
    from public.student_billing_ledger l
    where l.student_id = p_student_id
  ),
  next_lesson as (
    select sl.starts_at
    from public.student_schedule_lessons sl
    where sl.student_id = p_student_id
      and sl.status = 'scheduled'
      and sl.starts_at >= now()
      and sl.starts_at <= now() + interval '7 days'
    order by sl.starts_at asc
    limit 1
  )
  select
    coalesce((select rs.enabled from reminder_settings rs), true) as settings_enabled,
    coalesce((select rs.threshold_lessons from reminder_settings rs), 1) as threshold_lessons,
    (select ad.data from account_data ad) as billing_account,
    (select ld.data from ledger_data ld) as billing_ledger,
    (select nl.starts_at from next_lesson nl) as next_scheduled_lesson_at;
end;
$$;


--
-- Name: FUNCTION get_student_dashboard_payment_reminder_inputs(p_student_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_student_dashboard_payment_reminder_inputs(p_student_id uuid) IS 'Returns minimal, actor-scoped inputs for the student dashboard payment reminder popup.';


--
-- Name: get_teacher_roster_active_homework_counts(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_roster_active_homework_counts(p_student_ids uuid[]) RETURNS TABLE(student_id uuid, active_homework_count integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_student_ids uuid[] := coalesce(p_student_ids, array[]::uuid[]);
begin
  if cardinality(v_student_ids) = 0 then
    return;
  end if;

  if cardinality(v_student_ids) > 200 then
    raise exception 'Too many student ids requested';
  end if;

  return query
  with requested_students as (
    select distinct requested.student_id
    from unnest(v_student_ids) as requested(student_id)
    where requested.student_id is not null
  )
  select
    h.student_id,
    count(*)::integer as active_homework_count
  from requested_students rs
  join public.homework_assignments h
    on h.student_id = rs.student_id
  where h.status in ('not_started', 'in_progress', 'overdue')
    and app_private.can_access_student(h.student_id)
  group by h.student_id;
end;
$$;


--
-- Name: FUNCTION get_teacher_roster_active_homework_counts(p_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_teacher_roster_active_homework_counts(p_student_ids uuid[]) IS 'Returns active homework counts for student rows visible to the current roster actor.';


--
-- Name: get_teacher_student_profile_summaries(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_teacher_student_profile_summaries(p_student_ids uuid[]) RETURNS TABLE(student_id uuid, profile_id uuid, display_name text, first_name text, last_name text, email text, phone text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_student_ids uuid[] := coalesce(p_student_ids, array[]::uuid[]);
begin
  if cardinality(v_student_ids) = 0 then
    return;
  end if;

  if cardinality(v_student_ids) > 200 then
    raise exception 'Too many student ids requested';
  end if;

  return query
  with requested_students as (
    select distinct requested.student_id
    from unnest(v_student_ids) as requested(student_id)
    where requested.student_id is not null
  )
  select
    s.id as student_id,
    p.id as profile_id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.email,
    p.phone
  from requested_students rs
  join public.students s
    on s.id = rs.student_id
  join public.profiles p
    on p.id = s.profile_id
  where
    app_private.is_assigned_teacher(s.id)
    or app_private.has_permission('students.view', 'all');
end;
$$;


--
-- Name: FUNCTION get_teacher_student_profile_summaries(p_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_teacher_student_profile_summaries(p_student_ids uuid[]) IS 'Returns limited profile labels for teacher-assigned or staff-visible student roster rows.';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  perform public.apply_user_provisioning(
    new.id,
    new.email,
    new.raw_user_meta_data,
    new.raw_app_meta_data,
    new.email_confirmed_at,
    new.confirmed_at
  );
  return new;
exception
  when others then
    raise exception 'User provisioning failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;


--
-- Name: handle_user_confirmation_provisioning(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_confirmation_provisioning() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
  ) or (
    old.confirmed_at is null
    and new.confirmed_at is not null
  ) then
    perform public.apply_user_provisioning(
      new.id,
      new.email,
      new.raw_user_meta_data,
      new.raw_app_meta_data,
      new.email_confirmed_at,
      new.confirmed_at
    );
  end if;

  return new;
exception
  when others then
    raise exception 'User confirmation provisioning failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;


--
-- Name: handle_user_provision_metadata_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_provision_metadata_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if (old.raw_app_meta_data ->> 'provision_role')
      is distinct from
     (new.raw_app_meta_data ->> 'provision_role')
     or
     (old.raw_app_meta_data ->> 'provision_source')
      is distinct from
     (new.raw_app_meta_data ->> 'provision_source') then
    perform public.apply_user_provisioning(
      new.id,
      new.email,
      new.raw_user_meta_data,
      new.raw_app_meta_data,
      new.email_confirmed_at,
      new.confirmed_at
    );
  end if;

  return new;
exception
  when others then
    raise exception 'User provisioning metadata reconciliation failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;


--
-- Name: is_admin_or_manager(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_manager() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'manager')
  );
$$;


--
-- Name: is_teacher(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_teacher() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    join public.teachers t on t.profile_id = p.id
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
$$;


--
-- Name: load_current_student_payment_transaction_status(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.load_current_student_payment_transaction_status(p_transaction_id uuid) RETURNS TABLE(id uuid, student_id uuid, status text, provider_payment_id text, created_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select
    pt.id,
    pt.student_id,
    pt.status,
    pt.provider_payment_id,
    pt.created_at
  from public.payment_transactions pt
  join public.students s on s.id = pt.student_id
  where pt.id = p_transaction_id
    and s.profile_id = auth.uid()
  limit 1;
$$;


--
-- Name: prevent_dual_linked_identity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_dual_linked_identity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.role = case when tg_table_name = 'students' then 'student' else 'teacher' end
  ) then
    raise exception 'Linked identity must match profile role'
      using errcode = '23514';
  end if;

  if tg_table_name = 'students' and exists (
    select 1 from public.teachers t where t.profile_id = new.profile_id
  ) then
    raise exception 'Profile already has a teacher identity'
      using errcode = '23514';
  end if;

  if tg_table_name = 'teachers' and exists (
    select 1 from public.students s where s.profile_id = new.profile_id
  ) then
    raise exception 'Profile already has a student identity'
      using errcode = '23514';
  end if;

  return new;
end;
$$;


--
-- Name: search_documents_query(text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_documents_query(p_query text, p_limit integer DEFAULT 25, p_section text DEFAULT 'all'::text) RETURNS TABLE(id uuid, entity_type text, entity_id uuid, title text, subtitle text, body text, href text, section text, icon text, badge text, role_scope text[], visibility text, owner_student_id uuid, course_id uuid, is_published boolean, meta jsonb, updated_at timestamp with time zone, rank double precision)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_tsq tsquery;
begin
  if char_length(v_query) < 2 then
    return;
  end if;

  begin
    v_tsq := websearch_to_tsquery('simple', v_query);
  exception
    when others then
      v_tsq := plainto_tsquery('simple', v_query);
  end;

  return query
  select
    sd.id,
    sd.entity_type,
    sd.entity_id,
    sd.title,
    sd.subtitle,
    sd.body,
    sd.href,
    sd.section,
    sd.icon,
    sd.badge,
    sd.role_scope,
    sd.visibility,
    sd.owner_student_id,
    sd.course_id,
    sd.is_published,
    sd.meta,
    sd.updated_at,
    (
      case when lower(sd.title) = lower(v_query) then 100 else 0 end +
      case when lower(sd.title) like lower(v_query) || '%' then 25 else 0 end +
      case
        when sd.section = 'homework' then 14
        when sd.section = 'practice' then 12
        when sd.section = 'words' then 10
        when sd.section = 'admin' then 8
        when sd.section = 'blog' then 6
        else 0
      end +
      case
        when sd.search_vector @@ v_tsq then ts_rank_cd(sd.search_vector, v_tsq) * 10
        else 0
      end +
      case when sd.updated_at >= now() - interval '14 days' then 1 else 0 end
    )::double precision as rank
  from public.search_documents sd
  where (p_section = 'all' or sd.section = p_section)
    and (
      sd.search_vector @@ v_tsq
      or sd.title ilike '%' || v_query || '%'
      or coalesce(sd.subtitle, '') ilike '%' || v_query || '%'
      or coalesce(sd.body, '') ilike '%' || v_query || '%'
    )
  order by rank desc, sd.updated_at desc
  limit v_limit;
end;
$$;


--
-- Name: FUNCTION search_documents_query(p_query text, p_limit integer, p_section text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.search_documents_query(p_query text, p_limit integer, p_section text) IS 'Legacy unscoped search RPC kept for compatibility; prefer search_documents_query_for_actor.';


--
-- Name: search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer DEFAULT 25, p_section text DEFAULT 'all'::text, p_is_authenticated boolean DEFAULT false, p_role text DEFAULT NULL::text, p_capabilities text[] DEFAULT ARRAY[]::text[], p_student_id uuid DEFAULT NULL::uuid, p_teacher_id uuid DEFAULT NULL::uuid, p_accessible_student_ids uuid[] DEFAULT ARRAY[]::uuid[]) RETURNS TABLE(id uuid, entity_type text, entity_id uuid, title text, subtitle text, body text, href text, section text, icon text, badge text, role_scope text[], visibility text, owner_student_id uuid, course_id uuid, is_published boolean, meta jsonb, updated_at timestamp with time zone, rank double precision)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'app_private', 'pg_temp'
    AS $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_tsq tsquery;
  v_actor_id uuid := auth.uid();
  v_student_id uuid;
  v_teacher_id uuid;
  v_accessible_student_ids uuid[] := array[]::uuid[];
  v_actor_roles text[] := array[]::text[];
  v_actor_scopes text[] := array[]::text[];
  v_staff_search_expansion boolean := false;
begin
  perform p_is_authenticated, p_role, p_capabilities, p_student_id, p_teacher_id, p_accessible_student_ids;

  if char_length(v_query) < 2 then
    return;
  end if;

  if v_actor_id is not null then
    select s.id into v_student_id
    from public.students s
    where s.profile_id = v_actor_id
    limit 1;

    select t.id into v_teacher_id
    from public.teachers t
    where t.profile_id = v_actor_id
    limit 1;

    if v_teacher_id is not null then
      select coalesce(array_agg(distinct s.id) filter (where s.id is not null), array[]::uuid[])
      into v_accessible_student_ids
      from public.students s
      where s.primary_teacher_id = v_teacher_id;
    end if;

    select coalesce(array_agg(distinct r.key order by r.key), array[]::text[])
    into v_actor_roles
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = v_actor_id;

    v_staff_search_expansion :=
      app_private.has_permission('students.view', 'all')
      or app_private.has_permission('students.manage', 'all')
      or app_private.has_permission('student_progress.view', 'all')
      or app_private.has_permission('content.manage', 'all')
      or app_private.has_permission('crm.leads.view', 'all')
      or app_private.has_permission('crm.leads.manage', 'all')
      or app_private.has_permission('users.view', 'all')
      or app_private.has_permission('users.manage', 'all')
      or app_private.has_permission('teachers.view', 'all')
      or app_private.has_permission('teachers.manage', 'all')
      or app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all')
      or app_private.has_permission('notifications.manage', 'all')
      or app_private.has_permission('word_cards.manage', 'all');
  end if;

  v_actor_scopes := v_actor_roles;

  if v_student_id is not null and not ('student' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'student');
  end if;

  if v_teacher_id is not null and not ('teacher' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'teacher');
  end if;

  if v_staff_search_expansion and not ('staff_admin' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'staff_admin');
  end if;

  begin
    v_tsq := websearch_to_tsquery('simple', v_query);
  exception
    when others then
      v_tsq := plainto_tsquery('simple', v_query);
  end;

  return query
  select
    sd.id,
    sd.entity_type,
    sd.entity_id,
    sd.title,
    sd.subtitle,
    sd.body,
    sd.href,
    sd.section,
    sd.icon,
    sd.badge,
    sd.role_scope,
    sd.visibility,
    sd.owner_student_id,
    sd.course_id,
    sd.is_published,
    sd.meta,
    sd.updated_at,
    (
      case when lower(sd.title) = lower(v_query) then 100 else 0 end +
      case when lower(sd.title) like lower(v_query) || '%' then 25 else 0 end +
      case
        when sd.section = 'homework' then 14
        when sd.section = 'practice' then 12
        when sd.section = 'words' then 10
        when sd.section = 'admin' then 8
        when sd.section = 'blog' then 6
        else 0
      end +
      case when sd.search_vector @@ v_tsq then ts_rank_cd(sd.search_vector, v_tsq) * 10 else 0 end +
      case when sd.updated_at >= now() - interval '14 days' then 1 else 0 end
    )::double precision as rank
  from public.search_documents sd
  where (p_section = 'all' or sd.section = p_section)
    and (
      sd.search_vector @@ v_tsq
      or sd.title ilike '%' || v_query || '%'
      or coalesce(sd.subtitle, '') ilike '%' || v_query || '%'
      or coalesce(sd.body, '') ilike '%' || v_query || '%'
    )
    and (
      (sd.visibility = 'public' and sd.is_published = true)
      or (
        sd.visibility = 'role'
        and v_actor_id is not null
        and (
          'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(sd.role_scope, array[]::text[]) && v_actor_scopes
          or v_staff_search_expansion
        )
      )
      or (
        sd.visibility = 'student_owned'
        and (
          v_staff_search_expansion
          or (v_student_id is not null and sd.owner_student_id = v_student_id)
          or (v_teacher_id is not null and sd.owner_student_id = any(v_accessible_student_ids))
        )
      )
      or (
        sd.visibility = 'enrollment'
        and sd.is_published = true
        and v_actor_id is not null
        and (
          v_staff_search_expansion
          or v_student_id is not null
          or v_teacher_id is not null
          or 'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(sd.role_scope, array[]::text[]) && v_actor_scopes
        )
      )
    )
  order by rank desc, sd.updated_at desc
  limit v_limit;
end;
$$;


--
-- Name: FUNCTION search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]) IS 'Actor-scoped search RPC. Privileged visibility is derived from auth.uid() and DB RBAC/linked identities; caller-supplied role/capability parameters are compatibility-only.';


--
-- Name: set_search_document_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_search_document_vector() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.body, '')), 'C');
  return new;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: submit_practice_test_attempt(uuid, jsonb, boolean, timestamp with time zone, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_practice_test_attempt(p_test_id uuid, p_answers jsonb, p_allow_partial boolean, p_started_at timestamp with time zone, p_submitted_at timestamp with time zone, p_time_spent_seconds integer) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  v_student_id uuid;
  v_assessment_kind text;
  v_scoring_profile jsonb;
  v_passing_score integer;
  v_total_questions integer;
  v_correct_answers integer;
  v_score integer;
  v_passed boolean;
  v_attempt_id uuid;
  v_answers jsonb;
  v_review_answers jsonb;
  v_default_scoring_profile jsonb := jsonb_build_object(
    'kind', 'placement_v1',
    'bands', jsonb_build_array(
      jsonb_build_object('key', 'beginner', 'label', 'Beginner', 'minScore', 0, 'maxScore', 6),
      jsonb_build_object('key', 'elementary', 'label', 'Elementary', 'minScore', 7, 'maxScore', 20),
      jsonb_build_object('key', 'pre_intermediate', 'label', 'Pre-Intermediate', 'minScore', 21, 'maxScore', 34),
      jsonb_build_object('key', 'intermediate', 'label', 'Intermediate', 'minScore', 35, 'maxScore', 48),
      jsonb_build_object('key', 'upper_intermediate', 'label', 'Upper-Intermediate', 'minScore', 49, 'maxScore', 62),
      jsonb_build_object('key', 'advanced', 'label', 'Advanced', 'minScore', 63, 'maxScore', 70)
    )
  );
  v_effective_scoring_profile jsonb;
  v_recommended_level text;
  v_recommended_band_label text;
  v_section_scores jsonb := '[]'::jsonb;
  v_placement_summary jsonb;
  v_band jsonb;
  v_band_span integer;
  v_band_margin integer;
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN:Authenticated student required'
      using errcode = 'P0001';
  end if;

  select s.id
    into v_student_id
  from public.students s
  where s.profile_id = auth.uid()
    and not exists (
      select 1
      from public.teachers teacher
      where teacher.profile_id = auth.uid()
    )
  limit 1;

  if v_student_id is null
    or not app_private.has_permission('homework.submit', 'own') then
    raise exception 'FORBIDDEN:Real student with homework.submit:own required'
      using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'INCOMPLETE_ATTEMPT:Answers must be an array'
      using errcode = 'P0001';
  end if;

  select
    case when t.assessment_kind = 'placement' then 'placement' else 'regular' end,
    t.scoring_profile,
    t.passing_score
  into
    v_assessment_kind,
    v_scoring_profile,
    v_passing_score
  from public.tests t
  where t.id = p_test_id;

  if not found then
    raise exception 'TEST_LOAD_FAILED:Failed to load test for grading'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.test_questions q
    where q.test_id = p_test_id
      and coalesce(q.question_type, 'unknown') <> 'single_choice'
  ) then
    raise exception 'UNSUPPORTED_QUESTION_TYPE:This activity contains unsupported question types'
      using errcode = 'P0001';
  end if;

  select count(*)
    into v_total_questions
  from public.test_questions q
  where q.test_id = p_test_id;

  if v_total_questions = 0 then
    raise exception 'EMPTY_TEST:This activity does not contain any questions'
      using errcode = 'P0001';
  end if;

  begin
    with raw_answers as (
      select
        answer.ordinality,
        (answer.value ->> 'questionId')::uuid as question_id,
        (answer.value ->> 'optionId')::uuid as option_id
      from jsonb_array_elements(p_answers) with ordinality as answer(value, ordinality)
    ),
    normalized_answers as (
      select distinct on (raw.question_id)
        raw.question_id,
        raw.option_id
      from raw_answers raw
      order by raw.question_id, raw.ordinality desc
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'questionId', normalized.question_id,
          'optionId', normalized.option_id
        )
        order by normalized.question_id
      ),
      '[]'::jsonb
    )
    into v_answers
    from normalized_answers normalized;
  exception
    when invalid_text_representation or null_value_not_allowed then
      raise exception 'INVALID_OPTION:Selected option does not belong to the question'
        using errcode = 'P0001';
  end;

  if not (coalesce(p_allow_partial, false) and v_assessment_kind = 'placement') then
    if jsonb_array_length(v_answers) <> v_total_questions
      or exists (
        select 1
        from public.test_questions q
        where q.test_id = p_test_id
          and not exists (
            select 1
            from jsonb_to_recordset(v_answers)
              as answer("questionId" uuid, "optionId" uuid)
            where answer."questionId" = q.id
          )
      ) then
      raise exception 'INCOMPLETE_ATTEMPT:All questions must be answered before submission'
        using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_answers)
      as answer("questionId" uuid, "optionId" uuid)
    join public.test_questions q
      on q.id = answer."questionId"
     and q.test_id = p_test_id
    where not exists (
      select 1
      from public.test_question_options option_row
      where option_row.id = answer."optionId"
        and option_row.question_id = q.id
    )
  ) then
    raise exception 'INVALID_OPTION:Selected option does not belong to the question'
      using errcode = 'P0001';
  end if;

  with graded_answers as (
    select
      q.id as question_id,
      answer."optionId" as selected_option_id,
      coalesce(selected_option.is_correct, false) as is_correct,
      q.placement_band,
      q.sort_order
    from public.test_questions q
    left join jsonb_to_recordset(v_answers)
      as answer("questionId" uuid, "optionId" uuid)
      on answer."questionId" = q.id
    left join public.test_question_options selected_option
      on selected_option.id = answer."optionId"
     and selected_option.question_id = q.id
    where q.test_id = p_test_id
  )
  select
    count(*) filter (where graded.is_correct),
    jsonb_agg(
      jsonb_build_object(
        'questionId', graded.question_id,
        'selectedOptionId', graded.selected_option_id,
        'isCorrect', graded.is_correct,
        'placementBand', graded.placement_band
      )
      order by graded.sort_order, graded.question_id
    )
  into
    v_correct_answers,
    v_review_answers
  from graded_answers graded;

  v_score := round((v_correct_answers::numeric / v_total_questions::numeric) * 100)::integer;
  v_passed := v_score >= v_passing_score;

  if v_assessment_kind = 'placement' then
    if jsonb_typeof(v_scoring_profile) = 'object'
      and v_scoring_profile ->> 'kind' = 'placement_v1'
      and jsonb_typeof(v_scoring_profile -> 'bands') = 'array'
      and not exists (
        select 1
        from jsonb_array_elements(v_scoring_profile -> 'bands') profile_band
        where profile_band ->> 'key' not in (
          'beginner',
          'elementary',
          'pre_intermediate',
          'intermediate',
          'upper_intermediate',
          'advanced'
        )
          or jsonb_typeof(profile_band -> 'label') is distinct from 'string'
          or jsonb_typeof(profile_band -> 'minScore') is distinct from 'number'
          or jsonb_typeof(profile_band -> 'maxScore') is distinct from 'number'
      ) then
      v_effective_scoring_profile := v_scoring_profile;
    else
      v_effective_scoring_profile := v_default_scoring_profile;
    end if;

    select profile_band
      into v_band
    from jsonb_array_elements(v_effective_scoring_profile -> 'bands') profile_band
    where v_correct_answers between
      (profile_band ->> 'minScore')::integer
      and (profile_band ->> 'maxScore')::integer
    limit 1;

    if v_band is null then
      select profile_band
        into v_band
      from jsonb_array_elements(v_effective_scoring_profile -> 'bands')
        with ordinality as band(profile_band, ordinal)
      order by band.ordinal desc
      limit 1;
    end if;

    if v_band is null then
      raise exception 'TEST_LOAD_FAILED:Placement scoring profile has no bands'
        using errcode = 'P0001';
    end if;

    v_recommended_level := v_band ->> 'label';
    v_band_span :=
      (v_band ->> 'maxScore')::integer
      - (v_band ->> 'minScore')::integer
      + 1;
    v_band_margin := greatest(2, floor(v_band_span::numeric / 3)::integer);

    if v_correct_answers <= (v_band ->> 'minScore')::integer + v_band_margin - 1
      and v_correct_answers > (v_band ->> 'minScore')::integer then
      v_recommended_band_label := 'Lower part of ' || v_recommended_level;
    elsif v_correct_answers >= (v_band ->> 'maxScore')::integer - v_band_margin + 1
      and v_correct_answers < (v_band ->> 'maxScore')::integer then
      v_recommended_band_label := 'Upper part of ' || v_recommended_level;
    else
      v_recommended_band_label := v_recommended_level;
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'key', profile_band ->> 'key',
          'label', profile_band ->> 'label',
          'correctAnswers', (
            select count(*)
            from jsonb_to_recordset(v_review_answers)
              as review(
                "questionId" uuid,
                "selectedOptionId" uuid,
                "isCorrect" boolean,
                "placementBand" text
              )
            where review."placementBand" = profile_band ->> 'key'
              and review."isCorrect"
          ),
          'totalQuestions', (
            select count(*)
            from jsonb_to_recordset(v_review_answers)
              as review(
                "questionId" uuid,
                "selectedOptionId" uuid,
                "isCorrect" boolean,
                "placementBand" text
              )
            where review."placementBand" = profile_band ->> 'key'
          )
        )
        order by band.ordinal
      ),
      '[]'::jsonb
    )
    into v_section_scores
    from jsonb_array_elements(v_effective_scoring_profile -> 'bands')
      with ordinality as band(profile_band, ordinal);

    v_placement_summary := jsonb_build_object(
      'recommendedLevel', v_recommended_level,
      'recommendedBandLabel', v_recommended_band_label,
      'sectionScores', v_section_scores
    );
  end if;

  begin
    insert into public.student_test_attempts (
      student_id,
      test_id,
      score,
      correct_answers,
      total_questions,
      status,
      recommended_level,
      recommended_band_label,
      placement_summary,
      started_at,
      submitted_at,
      time_spent_seconds
    )
    values (
      v_student_id,
      p_test_id,
      v_score,
      v_correct_answers,
      v_total_questions,
      case when v_passed then 'passed' else 'failed' end,
      v_recommended_level,
      v_recommended_band_label,
      v_placement_summary,
      p_started_at,
      p_submitted_at,
      greatest(0, coalesce(p_time_spent_seconds, 0))
    )
    returning id into v_attempt_id;
  exception
    when others then
      raise exception 'ATTEMPT_CREATE_FAILED:%', sqlerrm
        using errcode = 'P0001';
  end;

  begin
    insert into public.student_test_answers (
      attempt_id,
      question_id,
      selected_option_id,
      answer_text,
      is_correct
    )
    select
      v_attempt_id,
      review."questionId",
      review."selectedOptionId",
      null,
      review."isCorrect"
    from jsonb_to_recordset(v_review_answers)
      as review(
        "questionId" uuid,
        "selectedOptionId" uuid,
        "isCorrect" boolean,
        "placementBand" text
      );
  exception
    when others then
      raise exception 'ATTEMPT_ANSWERS_SAVE_FAILED:%', sqlerrm
        using errcode = 'P0001';
  end;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'score', v_score,
    'correctAnswers', v_correct_answers,
    'totalQuestions', v_total_questions,
    'passed', v_passed,
    'assessmentKind', v_assessment_kind,
    'recommendedLevel', v_recommended_level,
    'recommendedBandLabel', v_recommended_band_label,
    'sectionScores', v_section_scores,
    'answers', (
      select jsonb_agg(
        jsonb_build_object(
          'questionId', review."questionId",
          'selectedOptionId', review."selectedOptionId",
          'isCorrect', review."isCorrect"
        )
      )
      from jsonb_to_recordset(v_review_answers)
        as review(
          "questionId" uuid,
          "selectedOptionId" uuid,
          "isCorrect" boolean,
          "placementBand" text
        )
    )
  );
end;
$$;


--
-- Name: sync_auth_user_email_to_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_auth_user_email_to_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if old.email is distinct from new.email then
    update public.profiles
    set email = lower(btrim(new.email))
    where id = new.id;
  end if;

  return new;
end;
$$;


--
-- Name: sync_search_document_blog_category(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_blog_category(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.blog_categories%rowtype;
begin
  select * into v_row from public.blog_categories where id = p_id;
  if not found then
    perform public.delete_search_document('blog_category', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'blog_category',
    v_row.id,
    v_row.name,
    'Категория блога',
    v_row.name,
    '/articles?category=' || v_row.slug,
    'blog',
    'folder',
    'Категория',
    array['all']::text[],
    'public',
    null,
    null,
    v_row.is_active,
    jsonb_build_object('slug', v_row.slug),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_blog_post(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_blog_post(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.blog_posts%rowtype;
begin
  select * into v_row from public.blog_posts where id = p_id;
  if not found then
    perform public.delete_search_document('blog_post', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'blog_post',
    v_row.id,
    v_row.title,
    coalesce(v_row.excerpt, 'Статья блога'),
    coalesce(v_row.excerpt, '') || ' ' || left(coalesce(v_row.content, ''), 4000),
    '/articles/' || v_row.slug,
    'blog',
    'file-text',
    case when v_row.status = 'published' then 'Статья' else 'Черновик' end,
    array['all']::text[],
    'public',
    null,
    null,
    v_row.status = 'published',
    jsonb_build_object('slug', v_row.slug, 'status', v_row.status),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_course(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_course(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.courses%rowtype;
begin
  select * into v_row from public.courses where id = p_id;
  if not found then
    perform public.delete_search_document('course', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'course',
    v_row.id,
    v_row.title,
    coalesce(v_row.description, 'Курс практики'),
    coalesce(v_row.description, ''),
    '/practice/topics/' || v_row.slug,
    'practice',
    'graduation-cap',
    'Курс',
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_row.id,
    v_row.is_published,
    jsonb_build_object('slug', v_row.slug),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_course_module(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_course_module(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_module from public.course_modules where id = p_id;
  if not found then
    perform public.delete_search_document('course_module', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('course_module', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'course_module',
    v_module.id,
    v_module.title,
    coalesce(v_module.description, v_course.title),
    coalesce(v_module.description, ''),
    '/practice/topics/' || v_course.slug || '/' || v_module.id::text,
    'practice',
    'layers',
    'Подтема',
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'course_title', v_course.title),
    v_module.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_homework_assignment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_homework_assignment(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.homework_assignments%rowtype;
begin
  select * into v_row from public.homework_assignments where id = p_id;
  if not found then
    perform public.delete_search_document('homework_assignment', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'homework_assignment',
    v_row.id,
    v_row.title,
    coalesce(v_row.description, 'Домашнее задание'),
    coalesce(v_row.description, '') || ' ' || coalesce(v_row.status, ''),
    '/homework/' || v_row.id::text,
    'homework',
    'clipboard-list',
    'Домашнее задание',
    array['student', 'admin']::text[],
    'student_owned',
    v_row.student_id,
    null,
    true,
    jsonb_build_object('status', v_row.status, 'due_at', v_row.due_at),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_lesson(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_lesson(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_lesson public.lessons%rowtype;
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_lesson from public.lessons where id = p_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  select * into v_module from public.course_modules where id = v_lesson.module_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('lesson', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'lesson',
    v_lesson.id,
    v_lesson.title,
    coalesce(v_lesson.description, v_module.title),
    coalesce(v_lesson.description, ''),
    '/practice/activity/lesson_' || v_lesson.id::text,
    'practice',
    'book-open',
    case when v_lesson.lesson_type = 'flashcards' then 'Карточки' else 'Урок' end,
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_lesson.is_published and v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'module_id', v_module.id, 'lesson_type', v_lesson.lesson_type),
    v_lesson.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_notification(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_notification(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.notifications%rowtype;
begin
  select * into v_row from public.notifications where id = p_id;
  if not found then
    perform public.delete_search_document('notification', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'notification',
    v_row.id,
    v_row.title,
    v_row.type,
    coalesce(v_row.body, ''),
    '/admin',
    'admin',
    'bell',
    'Уведомление',
    array['admin']::text[],
    'role',
    null,
    null,
    v_row.is_active,
    jsonb_build_object('type', v_row.type, 'target_roles', v_row.target_roles),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_profile(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.profiles%rowtype;
begin
  select * into v_row from public.profiles where id = p_id;
  if not found then
    perform public.delete_search_document('profile', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'profile',
    v_row.id,
    coalesce(v_row.display_name, trim(coalesce(v_row.first_name, '') || ' ' || coalesce(v_row.last_name, '')), coalesce(v_row.email, 'Пользователь')),
    coalesce(v_row.email, 'Пользователь платформы'),
    coalesce(v_row.email, '') || ' ' || coalesce(v_row.phone, '') || ' ' || coalesce(v_row.role, ''),
    '/admin',
    'admin',
    'user',
    case
      when v_row.role = 'admin' then 'Админ'
      when v_row.role = 'teacher' then 'Преподаватель'
      when v_row.role = 'manager' then 'Менеджер'
      else 'Студент'
    end,
    array['admin']::text[],
    'role',
    null,
    null,
    true,
    jsonb_build_object('role', v_row.role, 'email', v_row.email),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_student_word(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_student_word(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.student_words%rowtype;
begin
  select * into v_row from public.student_words where id = p_id;
  if not found then
    perform public.delete_search_document('student_word', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'student_word',
    v_row.id,
    v_row.term,
    v_row.translation,
    coalesce(v_row.term, '') || ' ' || coalesce(v_row.translation, '') || ' ' || coalesce(v_row.status, ''),
    '/words/my',
    'words',
    'languages',
    'Слово',
    array['student', 'admin']::text[],
    'student_owned',
    v_row.student_id,
    null,
    true,
    jsonb_build_object('status', v_row.status, 'source_type', v_row.source_type),
    v_row.updated_at
  );
end;
$$;


--
-- Name: sync_search_document_test(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_document_test(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_test public.tests%rowtype;
  v_module public.course_modules%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_test from public.tests where id = p_id;
  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  if v_test.module_id is not null then
    select * into v_module from public.course_modules where id = v_test.module_id;
  elsif v_test.lesson_id is not null then
    select cm.*
    into v_module
    from public.lessons l
    join public.course_modules cm on cm.id = l.module_id
    where l.id = v_test.lesson_id;
  end if;

  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  select * into v_course from public.courses where id = v_module.course_id;
  if not found then
    perform public.delete_search_document('test', p_id);
    return;
  end if;

  perform public.upsert_search_document(
    'test',
    v_test.id,
    v_test.title,
    coalesce(v_test.description, v_module.title),
    coalesce(v_test.description, ''),
    '/practice/activity/test_' || v_test.id::text,
    'practice',
    case when v_test.activity_type = 'trainer' then 'brain' else 'clipboard-list' end,
    case when v_test.activity_type = 'trainer' then 'Тренажёр' else 'Тест' end,
    array['student', 'teacher', 'manager', 'admin']::text[],
    'enrollment',
    null,
    v_course.id,
    v_test.is_published and v_module.is_published and v_course.is_published,
    jsonb_build_object('course_slug', v_course.slug, 'module_id', v_module.id, 'activity_type', v_test.activity_type),
    v_test.updated_at
  );
end;
$$;


--
-- Name: touch_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_payment_entities_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_payment_entities_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_student_billing_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_student_billing_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_student_cabinet_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_student_cabinet_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_student_schedule_lessons_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_student_schedule_lessons_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_teacher_workspace_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_teacher_workspace_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: trg_sync_search_document_blog_category(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_blog_category() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_blog_category(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_blog_post(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_blog_post() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_blog_post(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_course(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_course() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_course(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_course_module(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_course_module() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_course_module(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_homework_assignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_homework_assignment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_homework_assignment(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_lesson(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_lesson() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_lesson(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_notification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_notification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_notification(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_profile(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_student_word(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_student_word() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_student_word(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: trg_sync_search_document_test(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_search_document_test() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
        begin
          perform public.sync_search_document_test(coalesce(new.id, old.id));
          return coalesce(new, old);
        end;
        $$;


--
-- Name: update_current_student_payment_transaction_provider_state(uuid, text, jsonb, text, text, timestamp with time zone, text, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_current_student_payment_transaction_provider_state(p_transaction_id uuid, p_provider_payment_id text, p_provider_payload jsonb, p_status text, p_raw_status text, p_paid_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_confirmation_url text DEFAULT NULL::text, p_payment_method_id text DEFAULT NULL::text, p_is_reusable_payment_method boolean DEFAULT NULL::boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_updated integer;
begin
  update public.payment_transactions pt
  set
    provider_payment_id = coalesce(p_provider_payment_id, pt.provider_payment_id),
    provider_payload = p_provider_payload,
    status = p_status,
    raw_status = p_raw_status,
    paid_at = p_paid_at,
    confirmation_url = p_confirmation_url,
    payment_method_id = p_payment_method_id,
    is_reusable_payment_method = p_is_reusable_payment_method,
    updated_at = now()
  from public.students s
  where pt.id = p_transaction_id
    and s.id = pt.student_id
    and s.profile_id = auth.uid();

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Payment transaction not found';
  end if;
end;
$$;


--
-- Name: upsert_search_document(text, uuid, text, text, text, text, text, text, text, text[], text, uuid, uuid, boolean, jsonb, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_search_document(p_entity_type text, p_entity_id uuid, p_title text, p_subtitle text, p_body text, p_href text, p_section text, p_icon text, p_badge text, p_role_scope text[], p_visibility text, p_owner_student_id uuid, p_course_id uuid, p_is_published boolean, p_meta jsonb, p_updated_at timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.search_documents (
    entity_type,
    entity_id,
    title,
    subtitle,
    body,
    href,
    section,
    icon,
    badge,
    role_scope,
    visibility,
    owner_student_id,
    course_id,
    is_published,
    meta,
    updated_at
  )
  values (
    p_entity_type,
    p_entity_id,
    p_title,
    p_subtitle,
    p_body,
    p_href,
    p_section,
    p_icon,
    p_badge,
    p_role_scope,
    p_visibility,
    p_owner_student_id,
    p_course_id,
    p_is_published,
    coalesce(p_meta, '{}'::jsonb),
    coalesce(p_updated_at, now())
  )
  on conflict (entity_type, entity_id) do update
  set
    title = excluded.title,
    subtitle = excluded.subtitle,
    body = excluded.body,
    href = excluded.href,
    section = excluded.section,
    icon = excluded.icon,
    badge = excluded.badge,
    role_scope = excluded.role_scope,
    visibility = excluded.visibility,
    owner_student_id = excluded.owner_student_id,
    course_id = excluded.course_id,
    is_published = excluded.is_published,
    meta = excluded.meta,
    updated_at = excluded.updated_at;
end;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(c.column_name order by c.ordinal_position),
            '{}'::text[]
        )
        from
            information_schema.columns c
        where
            format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                format('%I.%I', c.table_schema, c.table_name)::regclass,
                c.column_name,
                'SELECT'
            );
    table_col_names text[] = coalesce(
            array_agg(pa.attname),
            '{}'::text[]
        )
        from
            pg_attribute pa
        where
            pa.attrelid = new.entity
            and pa.attnum > 0;
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        -- Filtered column is valid
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        -- Type is sanitized and safe for string interpolation
        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;
        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        else
            -- raises an exception if value is not coercable to type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    -- Validate that selected_columns reference columns the role can SELECT
    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint on
    -- (subscription_id, entity, filters) can't be tricked by a different filter order
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are
    -- treated as the same subscription group in apply_rls
    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: admin_payment_reminder_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_payment_reminder_settings (
    id boolean DEFAULT true NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    threshold_lessons integer DEFAULT 1 NOT NULL,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_payment_reminder_settings_singleton_check CHECK ((id = true)),
    CONSTRAINT admin_payment_reminder_settings_threshold_lessons_check CHECK ((threshold_lessons >= 0))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id uuid NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    action text NOT NULL,
    before jsonb,
    after jsonb,
    CONSTRAINT audit_log_action_check CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])))
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_categories_slug_check CHECK ((slug ~ '^[a-z0-9-]+$'::text))
);


--
-- Name: blog_post_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_post_tags (
    post_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image_url text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    author_name text,
    category_id uuid,
    reading_time_min integer,
    views_count integer DEFAULT 0 NOT NULL,
    seo_title text,
    seo_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_posts_reading_time_min_check CHECK (((reading_time_min IS NULL) OR (reading_time_min > 0))),
    CONSTRAINT blog_posts_slug_check CHECK ((slug ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT blog_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT blog_posts_views_count_check CHECK ((views_count >= 0))
);


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_tags_slug_check CHECK ((slug ~ '^[a-z0-9-]+$'::text))
);


--
-- Name: crm_lead_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lead_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    body text NOT NULL,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_lead_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lead_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_lead_status_history_from_status_check CHECK (((from_status IS NULL) OR (from_status = ANY (ARRAY['new_request'::text, 'not_reached'::text, 'contact_established'::text, 'not_fit'::text, 'consultation_scheduled'::text, 'consultation_no_show'::text, 'consultation_done'::text, 'thinking'::text, 'contract_sent'::text, 'contract_signed'::text, 'awaiting_payment'::text])))),
    CONSTRAINT crm_lead_status_history_to_status_check CHECK ((to_status = ANY (ARRAY['new_request'::text, 'not_reached'::text, 'contact_established'::text, 'not_fit'::text, 'consultation_scheduled'::text, 'consultation_no_show'::text, 'consultation_done'::text, 'thinking'::text, 'contract_sent'::text, 'contract_signed'::text, 'awaiting_payment'::text])))
);


--
-- Name: crm_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    source text,
    form_type text NOT NULL,
    page_url text,
    comment text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'new_request'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    viewed_at timestamp with time zone,
    viewed_by uuid,
    CONSTRAINT crm_leads_status_check CHECK ((status = ANY (ARRAY['new_request'::text, 'not_reached'::text, 'contact_established'::text, 'not_fit'::text, 'consultation_scheduled'::text, 'consultation_no_show'::text, 'consultation_done'::text, 'thinking'::text, 'contract_sent'::text, 'contract_signed'::text, 'awaiting_payment'::text])))
);


--
-- Name: crm_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_settings (
    id boolean DEFAULT true NOT NULL,
    background_image_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by_profile_id uuid,
    CONSTRAINT crm_settings_singleton_check CHECK ((id = true))
);


--
-- Name: homework_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homework_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    assigned_by_profile_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'not_started'::text NOT NULL,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_lesson_id uuid,
    CONSTRAINT homework_assignments_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'overdue'::text])))
);


--
-- Name: homework_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homework_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    source_type text NOT NULL,
    source_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    required boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT homework_items_source_type_check CHECK ((source_type = ANY (ARRAY['lesson'::text, 'test'::text])))
);


--
-- Name: lesson_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    status text NOT NULL,
    marked_by_profile_id uuid,
    marked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lesson_attendance_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'missed_by_student'::text, 'missed_by_teacher'::text, 'canceled'::text])))
);


--
-- Name: lesson_outcomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_outcomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    summary text NOT NULL,
    covered_topics text,
    mistakes_summary text,
    next_steps text,
    visible_to_student boolean DEFAULT true NOT NULL,
    created_by_profile_id uuid,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_user_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_user_state (
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp with time zone,
    dismissed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_user_state_dismiss_requires_read CHECK (((dismissed_at IS NULL) OR (read_at IS NOT NULL)))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    target_roles text[] DEFAULT ARRAY['all'::text] NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    target_user_ids uuid[],
    CONSTRAINT notifications_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 6000))),
    CONSTRAINT notifications_expires_after_published CHECK (((expires_at IS NULL) OR (expires_at > published_at))),
    CONSTRAINT notifications_target_roles_all_alone CHECK (((NOT ('all'::text = ANY (target_roles))) OR (cardinality(target_roles) = 1))),
    CONSTRAINT notifications_target_roles_not_empty CHECK ((cardinality(target_roles) >= 1)),
    CONSTRAINT notifications_target_roles_valid CHECK ((target_roles <@ ARRAY['all'::text, 'student'::text, 'teacher'::text, 'manager'::text, 'admin'::text])),
    CONSTRAINT notifications_title_check CHECK (((char_length(title) >= 1) AND (char_length(title) <= 240))),
    CONSTRAINT notifications_type_valid CHECK ((type = ANY (ARRAY['maintenance'::text, 'update'::text, 'news'::text, 'assignments'::text])))
);


--
-- Name: payment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    badge text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    yookassa_product_label text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    billing_credit_type text,
    credit_lesson_units integer,
    credit_money_amount numeric(12,2),
    CONSTRAINT payment_plans_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_plans_billing_credit_type_check CHECK ((billing_credit_type = ANY (ARRAY['lesson'::text, 'money'::text]))),
    CONSTRAINT payment_plans_credit_lesson_units_check CHECK (((credit_lesson_units IS NULL) OR (credit_lesson_units > 0))),
    CONSTRAINT payment_plans_credit_money_amount_check CHECK (((credit_money_amount IS NULL) OR (credit_money_amount > (0)::numeric))),
    CONSTRAINT payment_plans_credit_payload_check CHECK (((billing_credit_type IS NULL) OR ((billing_credit_type = 'lesson'::text) AND (credit_lesson_units IS NOT NULL) AND (credit_money_amount IS NULL)) OR ((billing_credit_type = 'money'::text) AND (credit_money_amount IS NOT NULL) AND (credit_lesson_units IS NULL))))
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    status text NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    provider text DEFAULT 'manual'::text NOT NULL,
    provider_payment_id text,
    plan_id uuid,
    confirmation_url text,
    return_url text,
    payment_method_id text,
    is_reusable_payment_method boolean,
    raw_status text,
    provider_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    idempotence_key text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT payment_transactions_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payment_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text, 'canceled'::text])))
);


--
-- Name: payment_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    provider_event_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    description text,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT permissions_key_check CHECK ((key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$'::text))
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    scope text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT role_permissions_scope_check CHECK ((scope = ANY (ARRAY['own'::text, 'assigned'::text, 'all'::text, 'own_demo'::text, 'public'::text, 'service_only'::text])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT roles_key_check CHECK ((key = ANY (ARRAY['student'::text, 'teacher'::text, 'manager'::text, 'admin'::text])))
);


--
-- Name: search_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    body text,
    href text NOT NULL,
    section text DEFAULT 'other'::text NOT NULL,
    icon text,
    badge text,
    role_scope text[] DEFAULT ARRAY['all'::text] NOT NULL,
    visibility text NOT NULL,
    owner_student_id uuid,
    course_id uuid,
    is_published boolean DEFAULT true NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    search_vector tsvector,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT search_documents_role_scope_not_empty CHECK ((cardinality(role_scope) >= 1)),
    CONSTRAINT search_documents_visibility_check CHECK ((visibility = ANY (ARRAY['public'::text, 'role'::text, 'student_owned'::text, 'enrollment'::text])))
);


--
-- Name: student_billing_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_billing_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    billing_mode text NOT NULL,
    lesson_price_amount numeric(12,2),
    currency text DEFAULT 'RUB'::text NOT NULL,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_billing_accounts_billing_mode_check CHECK ((billing_mode = ANY (ARRAY['package_lessons'::text, 'per_lesson_price'::text]))),
    CONSTRAINT student_billing_accounts_lesson_price_amount_check CHECK (((lesson_price_amount IS NULL) OR (lesson_price_amount >= (0)::numeric))),
    CONSTRAINT student_billing_accounts_lesson_price_check CHECK ((((billing_mode = 'package_lessons'::text) AND (lesson_price_amount IS NULL)) OR ((billing_mode = 'per_lesson_price'::text) AND (lesson_price_amount IS NOT NULL))))
);


--
-- Name: student_billing_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_billing_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    entry_direction text NOT NULL,
    unit_type text NOT NULL,
    lesson_units integer,
    money_amount numeric(12,2),
    reason text NOT NULL,
    payment_transaction_id uuid,
    schedule_lesson_id uuid,
    payment_plan_id uuid,
    created_by_profile_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    effective_lesson_price_amount numeric(12,2),
    effective_lesson_price_currency text,
    CONSTRAINT student_billing_ledger_effective_lesson_price_amount_check CHECK (((effective_lesson_price_amount IS NULL) OR (effective_lesson_price_amount > (0)::numeric))),
    CONSTRAINT student_billing_ledger_entry_direction_check CHECK ((entry_direction = ANY (ARRAY['credit'::text, 'debit'::text]))),
    CONSTRAINT student_billing_ledger_lesson_units_check CHECK (((lesson_units IS NULL) OR (lesson_units > 0))),
    CONSTRAINT student_billing_ledger_money_amount_check CHECK (((money_amount IS NULL) OR (money_amount > (0)::numeric))),
    CONSTRAINT student_billing_ledger_payload_check CHECK ((((unit_type = 'lesson'::text) AND (lesson_units IS NOT NULL) AND (money_amount IS NULL)) OR ((unit_type = 'money'::text) AND (money_amount IS NOT NULL) AND (lesson_units IS NULL)))),
    CONSTRAINT student_billing_ledger_reason_check CHECK ((reason = ANY (ARRAY['payment'::text, 'lesson_charge'::text, 'manual_adjustment'::text, 'refund'::text]))),
    CONSTRAINT student_billing_ledger_unit_type_check CHECK ((unit_type = ANY (ARRAY['lesson'::text, 'money'::text])))
);


--
-- Name: student_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_favorites_entity_type_check CHECK ((entity_type = ANY (ARRAY['course'::text, 'module'::text, 'test'::text])))
);


--
-- Name: student_homework_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_homework_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    homework_item_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_homework_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: student_mistakes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_mistakes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    attempt_id uuid,
    test_id uuid,
    question_id uuid NOT NULL,
    course_id uuid,
    module_id uuid,
    mistake_count integer DEFAULT 1 NOT NULL,
    last_mistake_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_mistakes_mistake_count_check CHECK ((mistake_count >= 1))
);


--
-- Name: student_payment_reminder_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_payment_reminder_state (
    student_id uuid NOT NULL,
    current_status text DEFAULT 'none'::text NOT NULL,
    last_status_changed_at timestamp with time zone,
    last_notification_sent_at timestamp with time zone,
    last_popup_shown_at timestamp with time zone,
    last_threshold_lessons integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_payment_reminder_state_current_status_check CHECK ((current_status = ANY (ARRAY['none'::text, 'low_balance'::text, 'debt'::text]))),
    CONSTRAINT student_payment_reminder_state_last_threshold_lessons_check CHECK (((last_threshold_lessons IS NULL) OR (last_threshold_lessons >= 0)))
);


--
-- Name: student_schedule_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_schedule_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    title text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    meeting_url text,
    comment text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_by_profile_id uuid,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_schedule_lessons_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'canceled'::text, 'completed'::text]))),
    CONSTRAINT student_schedule_lessons_time_check CHECK ((ends_at > starts_at))
);


--
-- Name: student_test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_test_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option_id uuid,
    answer_text text,
    is_correct boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_word_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_word_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_word_id uuid NOT NULL,
    student_id uuid NOT NULL,
    result text NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_word_reviews_result_check CHECK ((result = ANY (ARRAY['again'::text, 'hard'::text, 'good'::text, 'easy'::text])))
);


--
-- Name: student_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_words (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    term text NOT NULL,
    translation text NOT NULL,
    source_type text NOT NULL,
    source_entity_id uuid,
    status text DEFAULT 'new'::text NOT NULL,
    next_review_at timestamp with time zone,
    last_reviewed_at timestamp with time zone,
    ease_factor numeric DEFAULT 2.5 NOT NULL,
    interval_days integer DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    topic_slug text,
    topic_title text,
    example_sentence text,
    example_translation text,
    catalog_slug text,
    known_streak integer DEFAULT 0 NOT NULL,
    hard_count integer DEFAULT 0 NOT NULL,
    unknown_count integer DEFAULT 0 NOT NULL,
    difficult_marked_at timestamp with time zone,
    CONSTRAINT student_words_source_type_check CHECK ((source_type = ANY (ARRAY['manual'::text, 'mistake'::text, 'homework'::text, 'test'::text]))),
    CONSTRAINT student_words_status_check CHECK ((status = ANY (ARRAY['new'::text, 'learning'::text, 'review'::text, 'difficult'::text, 'mastered'::text])))
);


--
-- Name: teacher_dossiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_dossiers (
    teacher_id uuid NOT NULL,
    patronymic text,
    internal_role text DEFAULT 'teacher'::text NOT NULL,
    timezone text DEFAULT 'Europe/Moscow'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by_profile_id uuid,
    english_proficiency text,
    specializations text[] DEFAULT ARRAY[]::text[] NOT NULL,
    teaching_experience_years integer,
    education_level text,
    certificates text[] DEFAULT ARRAY['none'::text] NOT NULL,
    target_audiences text[] DEFAULT ARRAY[]::text[] NOT NULL,
    certificate_other text,
    teacher_bio text,
    available_weekdays text[] DEFAULT ARRAY[]::text[] NOT NULL,
    time_slots text,
    max_lessons_per_day integer,
    max_lessons_per_week integer,
    lesson_types text[] DEFAULT ARRAY[]::text[] NOT NULL,
    lesson_durations text[] DEFAULT ARRAY[]::text[] NOT NULL,
    operational_status text DEFAULT 'active'::text NOT NULL,
    start_date date,
    cooperation_type text DEFAULT 'freelance'::text NOT NULL,
    lesson_rate_amount numeric(12,2),
    currency text DEFAULT 'RUB'::text NOT NULL,
    teaching_approach text,
    teaching_materials text[] DEFAULT ARRAY[]::text[] NOT NULL,
    teaching_features text,
    CONSTRAINT teacher_dossiers_available_weekdays_check CHECK (((available_weekdays <@ ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text, 'saturday'::text, 'sunday'::text]) AND (cardinality(available_weekdays) <= 7))),
    CONSTRAINT teacher_dossiers_certificates_check CHECK ((((cardinality(certificates) >= 1) AND (cardinality(certificates) <= 5)) AND (certificates <@ ARRAY['none'::text, 'ielts'::text, 'celta'::text, 'tesol'::text, 'other'::text]) AND ((NOT ('none'::text = ANY (certificates))) OR (cardinality(certificates) = 1)) AND ((('other'::text = ANY (certificates)) AND (NULLIF(btrim(COALESCE(certificate_other, ''::text)), ''::text) IS NOT NULL)) OR ((NOT ('other'::text = ANY (certificates))) AND (NULLIF(btrim(COALESCE(certificate_other, ''::text)), ''::text) IS NULL))))),
    CONSTRAINT teacher_dossiers_cooperation_type_check CHECK ((cooperation_type = ANY (ARRAY['freelance'::text, 'staff'::text]))),
    CONSTRAINT teacher_dossiers_currency_check CHECK ((currency = 'RUB'::text)),
    CONSTRAINT teacher_dossiers_education_level_check CHECK (((education_level IS NULL) OR (education_level = ANY (ARRAY['higher_linguistic'::text, 'higher'::text, 'secondary'::text])))),
    CONSTRAINT teacher_dossiers_english_proficiency_check CHECK (((english_proficiency IS NULL) OR (english_proficiency = ANY (ARRAY['B2'::text, 'C1'::text, 'C2'::text, 'native'::text])))),
    CONSTRAINT teacher_dossiers_internal_role_check CHECK ((internal_role = ANY (ARRAY['teacher'::text, 'senior_teacher'::text, 'methodologist'::text]))),
    CONSTRAINT teacher_dossiers_lesson_durations_check CHECK (((lesson_durations <@ ARRAY['30'::text, '60'::text, '90'::text]) AND (cardinality(lesson_durations) <= 3))),
    CONSTRAINT teacher_dossiers_lesson_rate_amount_check CHECK (((lesson_rate_amount IS NULL) OR (lesson_rate_amount >= (0)::numeric))),
    CONSTRAINT teacher_dossiers_lesson_types_check CHECK (((lesson_types <@ ARRAY['individual'::text, 'group'::text]) AND (cardinality(lesson_types) <= 2))),
    CONSTRAINT teacher_dossiers_max_lessons_per_day_check CHECK (((max_lessons_per_day IS NULL) OR ((max_lessons_per_day >= 0) AND (max_lessons_per_day <= 20)))),
    CONSTRAINT teacher_dossiers_max_lessons_per_week_check CHECK (((max_lessons_per_week IS NULL) OR ((max_lessons_per_week >= 0) AND (max_lessons_per_week <= 80)))),
    CONSTRAINT teacher_dossiers_operational_status_check CHECK ((operational_status = ANY (ARRAY['active'::text, 'inactive'::text, 'on_vacation'::text]))),
    CONSTRAINT teacher_dossiers_specializations_check CHECK (((specializations <@ ARRAY['general_english'::text, 'business_english'::text, 'it_english'::text, 'exam_preparation'::text, 'speaking'::text, 'grammar'::text]) AND (cardinality(specializations) <= 6))),
    CONSTRAINT teacher_dossiers_target_audiences_check CHECK (((target_audiences <@ ARRAY['adults'::text, 'children'::text, 'teenagers'::text, 'beginners'::text, 'intermediate'::text, 'advanced'::text, 'it_specialists'::text, 'entrepreneurs'::text, 'interview_preparation'::text, 'relocation'::text]) AND (cardinality(target_audiences) <= 15))),
    CONSTRAINT teacher_dossiers_teacher_bio_length_check CHECK (((teacher_bio IS NULL) OR (length(teacher_bio) <= 5000))),
    CONSTRAINT teacher_dossiers_teaching_approach_check CHECK (((teaching_approach IS NULL) OR (teaching_approach = ANY (ARRAY['conversational'::text, 'grammar'::text, 'mixed'::text])))),
    CONSTRAINT teacher_dossiers_teaching_experience_years_check CHECK (((teaching_experience_years IS NULL) OR ((teaching_experience_years >= 0) AND (teaching_experience_years <= 60)))),
    CONSTRAINT teacher_dossiers_teaching_features_length_check CHECK (((teaching_features IS NULL) OR (length(teaching_features) <= 5000))),
    CONSTRAINT teacher_dossiers_teaching_materials_check CHECK (((teaching_materials <@ ARRAY['own_materials'::text, 'textbooks'::text, 'platform'::text]) AND (cardinality(teaching_materials) <= 3))),
    CONSTRAINT teacher_dossiers_time_slots_length_check CHECK (((time_slots IS NULL) OR (length(time_slots) <= 2000))),
    CONSTRAINT teacher_dossiers_timezone_check CHECK ((timezone = ANY (ARRAY['Europe/Moscow'::text, 'Europe/London'::text, 'Europe/Berlin'::text, 'Asia/Dubai'::text, 'Asia/Yerevan'::text, 'Asia/Tbilisi'::text, 'Asia/Almaty'::text])))
);


--
-- Name: teacher_student_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    body text NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    created_by_profile_id uuid,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teacher_student_notes_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'manager_visible'::text])))
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    bio text,
    specialization text[] DEFAULT '{}'::text[],
    hourly_rate numeric(10,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_question_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_question_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    question_type text NOT NULL,
    prompt text NOT NULL,
    explanation text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    placement_band text,
    CONSTRAINT test_questions_placement_band_check CHECK (((placement_band IS NULL) OR (placement_band = ANY (ARRAY['beginner'::text, 'elementary'::text, 'pre_intermediate'::text, 'intermediate'::text, 'upper_intermediate'::text, 'advanced'::text])))),
    CONSTRAINT test_questions_question_type_check CHECK ((question_type = ANY (ARRAY['single_choice'::text, 'multi_choice'::text, 'text_input'::text, 'matching'::text])))
);


--
-- Name: tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid,
    module_id uuid,
    title text NOT NULL,
    description text,
    passing_score integer DEFAULT 70 NOT NULL,
    time_limit_minutes integer,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    activity_type text DEFAULT 'test'::text NOT NULL,
    estimated_duration_minutes integer,
    cefr_level text,
    drill_topic_key text,
    drill_kind text,
    lesson_reinforcement boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    assessment_kind text DEFAULT 'regular'::text NOT NULL,
    scoring_profile jsonb,
    CONSTRAINT tests_activity_type_check CHECK ((activity_type = ANY (ARRAY['trainer'::text, 'test'::text]))),
    CONSTRAINT tests_assessment_kind_check CHECK ((assessment_kind = ANY (ARRAY['regular'::text, 'placement'::text]))),
    CONSTRAINT tests_cefr_level_check CHECK (((cefr_level IS NULL) OR (cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text])))),
    CONSTRAINT tests_check CHECK (((lesson_id IS NOT NULL) OR (module_id IS NOT NULL))),
    CONSTRAINT tests_drill_kind_check CHECK (((drill_kind IS NULL) OR (drill_kind = ANY (ARRAY['grammar'::text, 'vocabulary'::text, 'mixed'::text])))),
    CONSTRAINT tests_passing_score_check CHECK (((passing_score >= 0) AND (passing_score <= 100)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: word_card_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.word_card_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    set_id uuid NOT NULL,
    term text NOT NULL,
    translation text NOT NULL,
    example_sentence text NOT NULL,
    example_translation text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: word_card_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.word_card_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    topic_slug text NOT NULL,
    topic_title text NOT NULL,
    cefr_level text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT word_card_sets_cefr_level_check CHECK ((cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_payment_reminder_settings
    ADD CONSTRAINT admin_payment_reminder_settings_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_post_tags blog_post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (post_id, tag_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug);


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: crm_lead_comments crm_lead_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_comments
    ADD CONSTRAINT crm_lead_comments_pkey PRIMARY KEY (id);


--
-- Name: crm_lead_status_history crm_lead_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_status_history
    ADD CONSTRAINT crm_lead_status_history_pkey PRIMARY KEY (id);


--
-- Name: crm_leads crm_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_pkey PRIMARY KEY (id);


--
-- Name: crm_settings crm_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_settings
    ADD CONSTRAINT crm_settings_pkey PRIMARY KEY (id);


--
-- Name: homework_assignments homework_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_assignments
    ADD CONSTRAINT homework_assignments_pkey PRIMARY KEY (id);


--
-- Name: homework_items homework_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_items
    ADD CONSTRAINT homework_items_pkey PRIMARY KEY (id);


--
-- Name: lesson_attendance lesson_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_pkey PRIMARY KEY (id);


--
-- Name: lesson_attendance lesson_attendance_schedule_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_schedule_lesson_id_key UNIQUE (schedule_lesson_id);


--
-- Name: lesson_outcomes lesson_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_pkey PRIMARY KEY (id);


--
-- Name: lesson_outcomes lesson_outcomes_schedule_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_schedule_lesson_id_key UNIQUE (schedule_lesson_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: notification_user_state notification_user_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_user_state
    ADD CONSTRAINT notification_user_state_pkey PRIMARY KEY (notification_id, user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_plans payment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_webhook_events payment_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: payment_webhook_events payment_webhook_events_provider_provider_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_provider_provider_event_id_key UNIQUE (provider, provider_event_id);


--
-- Name: permissions permissions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_key_key UNIQUE (key);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_phone_format_check; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_phone_format_check CHECK (((phone IS NULL) OR (btrim(phone) = ''::text) OR (phone ~ '^\+7[0-9]{10}$'::text))) NOT VALID;


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id, scope);


--
-- Name: roles roles_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_key_key UNIQUE (key);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: search_documents search_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_documents
    ADD CONSTRAINT search_documents_pkey PRIMARY KEY (id);


--
-- Name: search_documents search_documents_unique_entity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_documents
    ADD CONSTRAINT search_documents_unique_entity UNIQUE (entity_type, entity_id);


--
-- Name: student_activity_log student_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_activity_log
    ADD CONSTRAINT student_activity_log_pkey PRIMARY KEY (id);


--
-- Name: student_billing_accounts student_billing_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_accounts
    ADD CONSTRAINT student_billing_accounts_pkey PRIMARY KEY (id);


--
-- Name: student_billing_accounts student_billing_accounts_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_accounts
    ADD CONSTRAINT student_billing_accounts_student_id_key UNIQUE (student_id);


--
-- Name: student_billing_ledger student_billing_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_pkey PRIMARY KEY (id);


--
-- Name: student_course_enrollments student_course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: student_favorites student_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_favorites
    ADD CONSTRAINT student_favorites_pkey PRIMARY KEY (id);


--
-- Name: student_favorites student_favorites_student_id_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_favorites
    ADD CONSTRAINT student_favorites_student_id_entity_type_entity_id_key UNIQUE (student_id, entity_type, entity_id);


--
-- Name: student_homework_progress student_homework_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_homework_progress
    ADD CONSTRAINT student_homework_progress_pkey PRIMARY KEY (id);


--
-- Name: student_homework_progress student_homework_progress_student_id_homework_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_homework_progress
    ADD CONSTRAINT student_homework_progress_student_id_homework_item_id_key UNIQUE (student_id, homework_item_id);


--
-- Name: student_lesson_progress student_lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lesson_progress
    ADD CONSTRAINT student_lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: student_lesson_progress student_lesson_progress_student_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lesson_progress
    ADD CONSTRAINT student_lesson_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);


--
-- Name: student_mistakes student_mistakes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_pkey PRIMARY KEY (id);


--
-- Name: student_mistakes student_mistakes_student_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_student_id_question_id_key UNIQUE (student_id, question_id);


--
-- Name: student_payment_reminder_state student_payment_reminder_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payment_reminder_state
    ADD CONSTRAINT student_payment_reminder_state_pkey PRIMARY KEY (student_id);


--
-- Name: student_schedule_lessons student_schedule_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_schedule_lessons
    ADD CONSTRAINT student_schedule_lessons_pkey PRIMARY KEY (id);


--
-- Name: student_test_answers student_test_answers_attempt_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_answers
    ADD CONSTRAINT student_test_answers_attempt_id_question_id_key UNIQUE (attempt_id, question_id);


--
-- Name: student_test_answers student_test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_answers
    ADD CONSTRAINT student_test_answers_pkey PRIMARY KEY (id);


--
-- Name: student_test_attempts student_test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_attempts
    ADD CONSTRAINT student_test_attempts_pkey PRIMARY KEY (id);


--
-- Name: student_word_reviews student_word_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_word_reviews
    ADD CONSTRAINT student_word_reviews_pkey PRIMARY KEY (id);


--
-- Name: student_words student_words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_words
    ADD CONSTRAINT student_words_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_profile_id_key UNIQUE (profile_id);


--
-- Name: teacher_dossiers teacher_dossiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_dossiers
    ADD CONSTRAINT teacher_dossiers_pkey PRIMARY KEY (teacher_id);


--
-- Name: teacher_student_notes teacher_student_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_student_notes
    ADD CONSTRAINT teacher_student_notes_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_profile_id_key UNIQUE (profile_id);


--
-- Name: test_question_options test_question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_question_options
    ADD CONSTRAINT test_question_options_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: word_card_items word_card_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_card_items
    ADD CONSTRAINT word_card_items_pkey PRIMARY KEY (id);


--
-- Name: word_card_sets word_card_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_card_sets
    ADD CONSTRAINT word_card_sets_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: audit_log_actor_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_actor_user_id_idx ON public.audit_log USING btree (actor_user_id);


--
-- Name: audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_created_at_idx ON public.audit_log USING btree (created_at DESC);


--
-- Name: audit_log_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_entity_idx ON public.audit_log USING btree (entity, entity_id);


--
-- Name: crm_lead_comments_lead_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_lead_comments_lead_created_at_idx ON public.crm_lead_comments USING btree (lead_id, created_at DESC);


--
-- Name: crm_lead_status_history_lead_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_lead_status_history_lead_created_at_idx ON public.crm_lead_status_history USING btree (lead_id, created_at DESC);


--
-- Name: crm_leads_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_created_at_idx ON public.crm_leads USING btree (created_at DESC);


--
-- Name: crm_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_status_created_at_idx ON public.crm_leads USING btree (status, created_at DESC);


--
-- Name: crm_leads_unread_new_requests_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_unread_new_requests_idx ON public.crm_leads USING btree (status, viewed_at, created_at DESC) WHERE (viewed_at IS NULL);


--
-- Name: homework_assignments_schedule_lesson_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX homework_assignments_schedule_lesson_idx ON public.homework_assignments USING btree (schedule_lesson_id);


--
-- Name: homework_assignments_student_status_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX homework_assignments_student_status_due_idx ON public.homework_assignments USING btree (student_id, status, due_at DESC);


--
-- Name: idx_blog_post_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_tags_tag_id ON public.blog_post_tags USING btree (tag_id);


--
-- Name: idx_blog_posts_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_category_id ON public.blog_posts USING btree (category_id);


--
-- Name: idx_blog_posts_status_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_status_published_at ON public.blog_posts USING btree (status, published_at DESC);


--
-- Name: idx_blog_posts_title_excerpt_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_title_excerpt_fts ON public.blog_posts USING gin (to_tsvector('simple'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(excerpt, ''::text)) || ' '::text) || COALESCE(content, ''::text))));


--
-- Name: idx_course_modules_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_modules_course_id ON public.course_modules USING btree (course_id);


--
-- Name: idx_enrollments_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_course_id ON public.student_course_enrollments USING btree (course_id);


--
-- Name: idx_enrollments_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_student_id ON public.student_course_enrollments USING btree (student_id);


--
-- Name: idx_enrollments_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_teacher_id ON public.student_course_enrollments USING btree (assigned_teacher_id);


--
-- Name: idx_lessons_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);


--
-- Name: idx_student_activity_log_activity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_activity_log_activity_type ON public.student_activity_log USING btree (activity_type);


--
-- Name: idx_student_activity_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_activity_log_created_at ON public.student_activity_log USING btree (created_at DESC);


--
-- Name: idx_student_activity_log_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_activity_log_student_id ON public.student_activity_log USING btree (student_id);


--
-- Name: idx_student_lesson_progress_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_lesson_progress_lesson_id ON public.student_lesson_progress USING btree (lesson_id);


--
-- Name: idx_student_lesson_progress_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_lesson_progress_status ON public.student_lesson_progress USING btree (status);


--
-- Name: idx_student_lesson_progress_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_lesson_progress_student_id ON public.student_lesson_progress USING btree (student_id);


--
-- Name: idx_student_schedule_lessons_status_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_schedule_lessons_status_starts_at ON public.student_schedule_lessons USING btree (status, starts_at DESC);


--
-- Name: idx_student_schedule_lessons_student_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_schedule_lessons_student_starts_at ON public.student_schedule_lessons USING btree (student_id, starts_at DESC);


--
-- Name: idx_student_schedule_lessons_teacher_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_schedule_lessons_teacher_starts_at ON public.student_schedule_lessons USING btree (teacher_id, starts_at DESC);


--
-- Name: idx_student_test_answers_attempt_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_test_answers_attempt_id ON public.student_test_answers USING btree (attempt_id);


--
-- Name: idx_student_test_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_test_attempts_status ON public.student_test_attempts USING btree (status);


--
-- Name: idx_student_test_attempts_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_test_attempts_student_id ON public.student_test_attempts USING btree (student_id);


--
-- Name: idx_student_test_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_test_attempts_submitted_at ON public.student_test_attempts USING btree (submitted_at DESC);


--
-- Name: idx_student_test_attempts_test_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_test_attempts_test_id ON public.student_test_attempts USING btree (test_id);


--
-- Name: idx_test_question_options_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_question_options_question_id ON public.test_question_options USING btree (question_id);


--
-- Name: idx_test_questions_test_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_questions_test_id ON public.test_questions USING btree (test_id);


--
-- Name: idx_tests_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tests_lesson_id ON public.tests USING btree (lesson_id);


--
-- Name: idx_tests_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tests_module_id ON public.tests USING btree (module_id);


--
-- Name: lesson_attendance_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_attendance_schedule_idx ON public.lesson_attendance USING btree (schedule_lesson_id);


--
-- Name: lesson_attendance_student_marked_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_attendance_student_marked_idx ON public.lesson_attendance USING btree (student_id, marked_at DESC);


--
-- Name: lesson_outcomes_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_outcomes_schedule_idx ON public.lesson_outcomes USING btree (schedule_lesson_id);


--
-- Name: notification_user_state_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_user_state_user_idx ON public.notification_user_state USING btree (user_id, dismissed_at, read_at);


--
-- Name: notifications_active_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_active_published_idx ON public.notifications USING btree (is_active, published_at DESC);


--
-- Name: notifications_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_expires_idx ON public.notifications USING btree (expires_at);


--
-- Name: payment_plans_active_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_plans_active_sort_idx ON public.payment_plans USING btree (is_active, sort_order, created_at DESC);


--
-- Name: payment_transactions_idempotence_key_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_transactions_idempotence_key_uidx ON public.payment_transactions USING btree (idempotence_key) WHERE (idempotence_key IS NOT NULL);


--
-- Name: payment_transactions_provider_payment_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_transactions_provider_payment_id_uidx ON public.payment_transactions USING btree (provider, provider_payment_id) WHERE (provider_payment_id IS NOT NULL);


--
-- Name: payment_transactions_status_paid_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_transactions_status_paid_at_idx ON public.payment_transactions USING btree (status, paid_at DESC);


--
-- Name: payment_transactions_student_paid_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_transactions_student_paid_at_idx ON public.payment_transactions USING btree (student_id, paid_at DESC);


--
-- Name: profiles_email_normalized_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_email_normalized_uidx ON public.profiles USING btree (lower(btrim(email)));


--
-- Name: profiles_student_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_student_search_trgm_idx ON public.profiles USING gin (lower(((((((COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text)) || ' '::text) || COALESCE(email, ''::text)) || ' '::text) || COALESCE(phone, ''::text))) extensions.gin_trgm_ops) WHERE (role = 'student'::text);


--
-- Name: role_permissions_permission_scope_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permissions_permission_scope_idx ON public.role_permissions USING btree (permission_id, scope);


--
-- Name: search_documents_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_documents_course_idx ON public.search_documents USING btree (course_id, updated_at DESC);


--
-- Name: search_documents_search_vector_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_documents_search_vector_idx ON public.search_documents USING gin (search_vector);


--
-- Name: search_documents_section_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_documents_section_updated_idx ON public.search_documents USING btree (section, updated_at DESC);


--
-- Name: search_documents_visibility_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_documents_visibility_owner_idx ON public.search_documents USING btree (visibility, owner_student_id, updated_at DESC);


--
-- Name: student_billing_accounts_mode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_billing_accounts_mode_idx ON public.student_billing_accounts USING btree (billing_mode, student_id);


--
-- Name: student_billing_ledger_latest_price_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_billing_ledger_latest_price_idx ON public.student_billing_ledger USING btree (student_id, created_at DESC) WHERE (effective_lesson_price_amount IS NOT NULL);


--
-- Name: student_billing_ledger_lesson_charge_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_billing_ledger_lesson_charge_uidx ON public.student_billing_ledger USING btree (schedule_lesson_id) WHERE ((schedule_lesson_id IS NOT NULL) AND (reason = 'lesson_charge'::text));


--
-- Name: student_billing_ledger_payment_credit_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_billing_ledger_payment_credit_uidx ON public.student_billing_ledger USING btree (payment_transaction_id) WHERE ((payment_transaction_id IS NOT NULL) AND (reason = 'payment'::text));


--
-- Name: student_billing_ledger_reason_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_billing_ledger_reason_idx ON public.student_billing_ledger USING btree (student_id, reason, created_at DESC);


--
-- Name: student_billing_ledger_student_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_billing_ledger_student_created_idx ON public.student_billing_ledger USING btree (student_id, created_at DESC);


--
-- Name: student_course_enrollments_teacher_status_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_course_enrollments_teacher_status_student_idx ON public.student_course_enrollments USING btree (assigned_teacher_id, status, student_id);


--
-- Name: student_favorites_student_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_favorites_student_type_idx ON public.student_favorites USING btree (student_id, entity_type, created_at DESC);


--
-- Name: student_homework_progress_student_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_homework_progress_student_assignment_idx ON public.student_homework_progress USING btree (student_id, assignment_id, status);


--
-- Name: student_lesson_progress_student_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_lesson_progress_student_updated_idx ON public.student_lesson_progress USING btree (student_id, updated_at DESC);


--
-- Name: student_mistakes_student_last_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_mistakes_student_last_idx ON public.student_mistakes USING btree (student_id, last_mistake_at DESC);


--
-- Name: student_payment_reminder_state_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_payment_reminder_state_status_idx ON public.student_payment_reminder_state USING btree (current_status, updated_at DESC);


--
-- Name: student_schedule_lessons_student_status_starts_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_schedule_lessons_student_status_starts_idx ON public.student_schedule_lessons USING btree (student_id, status, starts_at);


--
-- Name: student_test_attempts_student_started_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_test_attempts_student_started_idx ON public.student_test_attempts USING btree (student_id, started_at DESC);


--
-- Name: student_word_reviews_student_reviewed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_word_reviews_student_reviewed_idx ON public.student_word_reviews USING btree (student_id, reviewed_at DESC);


--
-- Name: student_words_student_catalog_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_words_student_catalog_slug_idx ON public.student_words USING btree (student_id, catalog_slug) WHERE (catalog_slug IS NOT NULL);


--
-- Name: student_words_student_status_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_words_student_status_review_idx ON public.student_words USING btree (student_id, status, next_review_at);


--
-- Name: student_words_student_topic_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_words_student_topic_status_idx ON public.student_words USING btree (student_id, topic_slug, status, next_review_at);


--
-- Name: students_primary_teacher_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX students_primary_teacher_idx ON public.students USING btree (primary_teacher_id);


--
-- Name: students_profile_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX students_profile_id_idx ON public.students USING btree (profile_id);


--
-- Name: teacher_student_notes_student_teacher_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX teacher_student_notes_student_teacher_created_idx ON public.teacher_student_notes USING btree (student_id, teacher_id, created_at DESC);


--
-- Name: teachers_profile_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX teachers_profile_id_idx ON public.teachers USING btree (profile_id);


--
-- Name: test_questions_placement_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX test_questions_placement_band_idx ON public.test_questions USING btree (placement_band) WHERE (placement_band IS NOT NULL);


--
-- Name: tests_activity_level_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tests_activity_level_published_idx ON public.tests USING btree (activity_type, cefr_level, is_published, sort_order, created_at DESC);


--
-- Name: tests_activity_type_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tests_activity_type_published_idx ON public.tests USING btree (activity_type, is_published, created_at DESC);


--
-- Name: tests_assessment_kind_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tests_assessment_kind_published_idx ON public.tests USING btree (assessment_kind, is_published, created_at DESC);


--
-- Name: tests_drill_topic_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tests_drill_topic_key_idx ON public.tests USING btree (drill_topic_key) WHERE (drill_topic_key IS NOT NULL);


--
-- Name: uq_active_enrollment_per_student_course; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_enrollment_per_student_course ON public.student_course_enrollments USING btree (student_id, course_id) WHERE (status = 'active'::text);


--
-- Name: uq_course_modules_course_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_course_modules_course_sort ON public.course_modules USING btree (course_id, sort_order);


--
-- Name: uq_lessons_module_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_lessons_module_sort ON public.lessons USING btree (module_id, sort_order);


--
-- Name: uq_test_question_options_question_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_test_question_options_question_sort ON public.test_question_options USING btree (question_id, sort_order);


--
-- Name: uq_test_questions_test_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_test_questions_test_sort ON public.test_questions USING btree (test_id, sort_order);


--
-- Name: user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_role_id_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_roles_user_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_roles_user_id_uidx ON public.user_roles USING btree (user_id);


--
-- Name: word_card_items_set_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX word_card_items_set_order_idx ON public.word_card_items USING btree (set_id, sort_order);


--
-- Name: word_card_sets_published_topic_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX word_card_sets_published_topic_level_idx ON public.word_card_sets USING btree (is_published, topic_slug, cefr_level, sort_order, created_at DESC);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_confirmed; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_confirmed AFTER UPDATE OF email_confirmed_at, confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmation_provisioning();


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: users on_auth_user_email_updated; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_email_updated AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_email_to_profile();


--
-- Name: users on_auth_user_provision_metadata_updated; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_provision_metadata_updated AFTER UPDATE OF raw_app_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_provision_metadata_update();


--
-- Name: admin_payment_reminder_settings trg_admin_payment_reminder_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_admin_payment_reminder_settings_updated_at BEFORE UPDATE ON public.admin_payment_reminder_settings FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: blog_categories trg_blog_categories_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_categories_set_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: blog_posts trg_blog_posts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: blog_tags trg_blog_tags_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_tags_set_updated_at BEFORE UPDATE ON public.blog_tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: course_modules trg_course_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_course_modules_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: courses trg_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: crm_leads trg_crm_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: crm_settings trg_crm_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_settings_updated_at BEFORE UPDATE ON public.crm_settings FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: profiles trg_enforce_profile_auth_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_profile_auth_identity BEFORE INSERT OR UPDATE OF email, role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_auth_identity();


--
-- Name: user_roles trg_enforce_user_role_matches_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_user_role_matches_profile BEFORE INSERT OR UPDATE OF user_id, role_id ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.enforce_user_role_matches_profile();


--
-- Name: student_course_enrollments trg_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.student_course_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: homework_assignments trg_homework_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_homework_assignments_updated_at BEFORE UPDATE ON public.homework_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: lesson_attendance trg_lesson_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lesson_attendance_updated_at BEFORE UPDATE ON public.lesson_attendance FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: lesson_outcomes trg_lesson_outcomes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lesson_outcomes_updated_at BEFORE UPDATE ON public.lesson_outcomes FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: lessons trg_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notifications trg_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.touch_notifications_updated_at();


--
-- Name: payment_plans trg_payment_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.touch_payment_entities_updated_at();


--
-- Name: payment_transactions trg_payment_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.touch_payment_entities_updated_at();


--
-- Name: permissions trg_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: students trg_prevent_dual_student_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_dual_student_identity BEFORE INSERT OR UPDATE OF profile_id ON public.students FOR EACH ROW EXECUTE FUNCTION public.prevent_dual_linked_identity();


--
-- Name: teachers trg_prevent_dual_teacher_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_dual_teacher_identity BEFORE INSERT OR UPDATE OF profile_id ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.prevent_dual_linked_identity();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: roles trg_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: search_documents trg_search_documents_vector; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_documents_vector BEFORE INSERT OR UPDATE ON public.search_documents FOR EACH ROW EXECUTE FUNCTION public.set_search_document_vector();


--
-- Name: blog_categories trg_search_sync_blog_categories; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_blog_categories AFTER INSERT OR DELETE OR UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_blog_category();


--
-- Name: blog_posts trg_search_sync_blog_posts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_blog_posts AFTER INSERT OR DELETE OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_blog_post();


--
-- Name: course_modules trg_search_sync_course_modules; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_course_modules AFTER INSERT OR DELETE OR UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_course_module();


--
-- Name: courses trg_search_sync_courses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_courses AFTER INSERT OR DELETE OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_course();


--
-- Name: homework_assignments trg_search_sync_homework_assignments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_homework_assignments AFTER INSERT OR DELETE OR UPDATE ON public.homework_assignments FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_homework_assignment();


--
-- Name: lessons trg_search_sync_lessons; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_lessons AFTER INSERT OR DELETE OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_lesson();


--
-- Name: notifications trg_search_sync_notifications; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_notifications AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_notification();


--
-- Name: profiles trg_search_sync_profiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_profiles AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_profile();


--
-- Name: student_words trg_search_sync_student_words; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_student_words AFTER INSERT OR DELETE OR UPDATE ON public.student_words FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_student_word();


--
-- Name: tests trg_search_sync_tests; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_sync_tests AFTER INSERT OR DELETE OR UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.trg_sync_search_document_test();


--
-- Name: student_billing_accounts trg_student_billing_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_billing_accounts_updated_at BEFORE UPDATE ON public.student_billing_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_student_billing_updated_at();


--
-- Name: student_homework_progress trg_student_homework_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_homework_progress_updated_at BEFORE UPDATE ON public.student_homework_progress FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: student_lesson_progress trg_student_lesson_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_lesson_progress_updated_at BEFORE UPDATE ON public.student_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: student_mistakes trg_student_mistakes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_mistakes_updated_at BEFORE UPDATE ON public.student_mistakes FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: student_payment_reminder_state trg_student_payment_reminder_state_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_payment_reminder_state_updated_at BEFORE UPDATE ON public.student_payment_reminder_state FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: student_schedule_lessons trg_student_schedule_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_schedule_lessons_updated_at BEFORE UPDATE ON public.student_schedule_lessons FOR EACH ROW EXECUTE FUNCTION public.touch_student_schedule_lessons_updated_at();


--
-- Name: student_words trg_student_words_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_words_updated_at BEFORE UPDATE ON public.student_words FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: students trg_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: teacher_dossiers trg_teacher_dossiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_teacher_dossiers_updated_at BEFORE UPDATE ON public.teacher_dossiers FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: teacher_student_notes trg_teacher_student_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_teacher_student_notes_updated_at BEFORE UPDATE ON public.teacher_student_notes FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_workspace_updated_at();


--
-- Name: teachers trg_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tests trg_tests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: word_card_items trg_word_card_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_word_card_items_updated_at BEFORE UPDATE ON public.word_card_items FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: word_card_sets trg_word_card_sets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_word_card_sets_updated_at BEFORE UPDATE ON public.word_card_sets FOR EACH ROW EXECUTE FUNCTION public.touch_student_cabinet_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_payment_reminder_settings
    ADD CONSTRAINT admin_payment_reminder_settings_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: blog_post_tags blog_post_tags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE SET NULL;


--
-- Name: course_modules course_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: crm_lead_comments crm_lead_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_comments
    ADD CONSTRAINT crm_lead_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_lead_comments crm_lead_comments_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_comments
    ADD CONSTRAINT crm_lead_comments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: crm_lead_status_history crm_lead_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_status_history
    ADD CONSTRAINT crm_lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_lead_status_history crm_lead_status_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lead_status_history
    ADD CONSTRAINT crm_lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: crm_leads crm_leads_viewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_viewed_by_fkey FOREIGN KEY (viewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_settings crm_settings_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_settings
    ADD CONSTRAINT crm_settings_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: homework_assignments homework_assignments_assigned_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_assignments
    ADD CONSTRAINT homework_assignments_assigned_by_profile_id_fkey FOREIGN KEY (assigned_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: homework_assignments homework_assignments_schedule_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_assignments
    ADD CONSTRAINT homework_assignments_schedule_lesson_id_fkey FOREIGN KEY (schedule_lesson_id) REFERENCES public.student_schedule_lessons(id) ON DELETE SET NULL;


--
-- Name: homework_assignments homework_assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_assignments
    ADD CONSTRAINT homework_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: homework_items homework_items_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework_items
    ADD CONSTRAINT homework_items_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.homework_assignments(id) ON DELETE CASCADE;


--
-- Name: lesson_attendance lesson_attendance_marked_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_marked_by_profile_id_fkey FOREIGN KEY (marked_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: lesson_attendance lesson_attendance_schedule_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_schedule_lesson_id_fkey FOREIGN KEY (schedule_lesson_id) REFERENCES public.student_schedule_lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_attendance lesson_attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: lesson_attendance lesson_attendance_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: lesson_outcomes lesson_outcomes_created_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: lesson_outcomes lesson_outcomes_schedule_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_schedule_lesson_id_fkey FOREIGN KEY (schedule_lesson_id) REFERENCES public.student_schedule_lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_outcomes lesson_outcomes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: lesson_outcomes lesson_outcomes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: lesson_outcomes lesson_outcomes_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcomes
    ADD CONSTRAINT lesson_outcomes_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;


--
-- Name: notification_user_state notification_user_state_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_user_state
    ADD CONSTRAINT notification_user_state_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_user_state notification_user_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_user_state
    ADD CONSTRAINT notification_user_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.payment_plans(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: search_documents search_documents_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_documents
    ADD CONSTRAINT search_documents_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: search_documents search_documents_owner_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_documents
    ADD CONSTRAINT search_documents_owner_student_id_fkey FOREIGN KEY (owner_student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_activity_log student_activity_log_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_activity_log
    ADD CONSTRAINT student_activity_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_billing_accounts student_billing_accounts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_accounts
    ADD CONSTRAINT student_billing_accounts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_billing_accounts student_billing_accounts_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_accounts
    ADD CONSTRAINT student_billing_accounts_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_billing_ledger student_billing_ledger_created_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_billing_ledger student_billing_ledger_payment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_payment_plan_id_fkey FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id) ON DELETE SET NULL;


--
-- Name: student_billing_ledger student_billing_ledger_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id) ON DELETE SET NULL;


--
-- Name: student_billing_ledger student_billing_ledger_schedule_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_schedule_lesson_id_fkey FOREIGN KEY (schedule_lesson_id) REFERENCES public.student_schedule_lessons(id) ON DELETE SET NULL;


--
-- Name: student_billing_ledger student_billing_ledger_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_ledger
    ADD CONSTRAINT student_billing_ledger_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_course_enrollments student_course_enrollments_assigned_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_assigned_teacher_id_fkey FOREIGN KEY (assigned_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: student_course_enrollments student_course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: student_course_enrollments student_course_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_favorites student_favorites_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_favorites
    ADD CONSTRAINT student_favorites_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_homework_progress student_homework_progress_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_homework_progress
    ADD CONSTRAINT student_homework_progress_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.homework_assignments(id) ON DELETE CASCADE;


--
-- Name: student_homework_progress student_homework_progress_homework_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_homework_progress
    ADD CONSTRAINT student_homework_progress_homework_item_id_fkey FOREIGN KEY (homework_item_id) REFERENCES public.homework_items(id) ON DELETE CASCADE;


--
-- Name: student_homework_progress student_homework_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_homework_progress
    ADD CONSTRAINT student_homework_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_lesson_progress student_lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lesson_progress
    ADD CONSTRAINT student_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: student_lesson_progress student_lesson_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lesson_progress
    ADD CONSTRAINT student_lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_mistakes student_mistakes_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_test_attempts(id) ON DELETE SET NULL;


--
-- Name: student_mistakes student_mistakes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: student_mistakes student_mistakes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE SET NULL;


--
-- Name: student_mistakes student_mistakes_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.test_questions(id) ON DELETE CASCADE;


--
-- Name: student_mistakes student_mistakes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_mistakes student_mistakes_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_mistakes
    ADD CONSTRAINT student_mistakes_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE SET NULL;


--
-- Name: student_payment_reminder_state student_payment_reminder_state_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_payment_reminder_state
    ADD CONSTRAINT student_payment_reminder_state_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_schedule_lessons student_schedule_lessons_created_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_schedule_lessons
    ADD CONSTRAINT student_schedule_lessons_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_schedule_lessons student_schedule_lessons_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_schedule_lessons
    ADD CONSTRAINT student_schedule_lessons_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_schedule_lessons student_schedule_lessons_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_schedule_lessons
    ADD CONSTRAINT student_schedule_lessons_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE RESTRICT;


--
-- Name: student_schedule_lessons student_schedule_lessons_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_schedule_lessons
    ADD CONSTRAINT student_schedule_lessons_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_test_answers student_test_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_answers
    ADD CONSTRAINT student_test_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_test_attempts(id) ON DELETE CASCADE;


--
-- Name: student_test_answers student_test_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_answers
    ADD CONSTRAINT student_test_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.test_questions(id) ON DELETE CASCADE;


--
-- Name: student_test_answers student_test_answers_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_answers
    ADD CONSTRAINT student_test_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.test_question_options(id) ON DELETE SET NULL;


--
-- Name: student_test_attempts student_test_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_attempts
    ADD CONSTRAINT student_test_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_test_attempts student_test_attempts_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_attempts
    ADD CONSTRAINT student_test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: student_word_reviews student_word_reviews_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_word_reviews
    ADD CONSTRAINT student_word_reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_word_reviews student_word_reviews_student_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_word_reviews
    ADD CONSTRAINT student_word_reviews_student_word_id_fkey FOREIGN KEY (student_word_id) REFERENCES public.student_words(id) ON DELETE CASCADE;


--
-- Name: student_words student_words_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_words
    ADD CONSTRAINT student_words_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_primary_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_primary_teacher_id_fkey FOREIGN KEY (primary_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: students students_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: teacher_dossiers teacher_dossiers_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_dossiers
    ADD CONSTRAINT teacher_dossiers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: teacher_dossiers teacher_dossiers_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_dossiers
    ADD CONSTRAINT teacher_dossiers_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: teacher_student_notes teacher_student_notes_created_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_student_notes
    ADD CONSTRAINT teacher_student_notes_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: teacher_student_notes teacher_student_notes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_student_notes
    ADD CONSTRAINT teacher_student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: teacher_student_notes teacher_student_notes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_student_notes
    ADD CONSTRAINT teacher_student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: teacher_student_notes teacher_student_notes_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_student_notes
    ADD CONSTRAINT teacher_student_notes_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: teachers teachers_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: test_question_options test_question_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_question_options
    ADD CONSTRAINT test_question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.test_questions(id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: tests tests_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: tests tests_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: word_card_items word_card_items_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_card_items
    ADD CONSTRAINT word_card_items_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.word_card_sets(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_payment_reminder_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_payment_reminder_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_payment_reminder_settings_delete_manage ON public.admin_payment_reminder_settings FOR DELETE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_payment_reminder_settings_insert_manage ON public.admin_payment_reminder_settings FOR INSERT TO authenticated WITH CHECK (((id = true) AND app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_payment_reminder_settings_select_manage ON public.admin_payment_reminder_settings FOR SELECT TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: admin_payment_reminder_settings admin_payment_reminder_settings_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_payment_reminder_settings_update_manage ON public.admin_payment_reminder_settings FOR UPDATE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text)) WITH CHECK (((id = true) AND app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_log_roles_view_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_roles_view_all ON public.audit_log FOR SELECT TO authenticated USING (app_private.has_permission('roles.view'::text, 'all'::text));


--
-- Name: blog_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_categories blog_categories_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_categories_delete_manage ON public.blog_categories FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_categories blog_categories_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_categories_insert_manage ON public.blog_categories FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_categories blog_categories_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_categories_select_public ON public.blog_categories FOR SELECT USING (true);


--
-- Name: blog_categories blog_categories_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_categories_update_manage ON public.blog_categories FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_post_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_post_tags blog_post_tags_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_post_tags_delete_manage ON public.blog_post_tags FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_post_tags blog_post_tags_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_post_tags_insert_manage ON public.blog_post_tags FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_post_tags blog_post_tags_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_post_tags_select_manage ON public.blog_post_tags FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_post_tags blog_post_tags_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_post_tags_select_public ON public.blog_post_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.blog_posts bp
  WHERE ((bp.id = blog_post_tags.post_id) AND (bp.status = 'published'::text)))));


--
-- Name: blog_post_tags blog_post_tags_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_post_tags_update_manage ON public.blog_post_tags FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts blog_posts_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_delete_manage ON public.blog_posts FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_posts blog_posts_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_insert_manage ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_posts blog_posts_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_select_manage ON public.blog_posts FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_posts blog_posts_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_select_public ON public.blog_posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: blog_posts blog_posts_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_update_manage ON public.blog_posts FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_tags blog_tags_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_tags_delete_manage ON public.blog_tags FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_tags blog_tags_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_tags_insert_manage ON public.blog_tags FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: blog_tags blog_tags_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_tags_select_public ON public.blog_tags FOR SELECT USING (true);


--
-- Name: blog_tags blog_tags_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_tags_update_manage ON public.blog_tags FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: course_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: course_modules course_modules_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_delete_manage ON public.course_modules FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: course_modules course_modules_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_insert_manage ON public.course_modules FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: course_modules course_modules_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_select_manage ON public.course_modules FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: course_modules course_modules_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_select_policy ON public.course_modules FOR SELECT USING (((is_published = true) OR public.is_admin_or_manager()));


--
-- Name: course_modules course_modules_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_select_public ON public.course_modules FOR SELECT USING (((is_published = true) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = course_modules.course_id) AND (c.is_published = true))))));


--
-- Name: course_modules course_modules_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_update_manage ON public.course_modules FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: courses courses_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_delete_manage ON public.courses FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: courses courses_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_insert_manage ON public.courses FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: courses courses_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_select_manage ON public.courses FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: courses courses_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_select_policy ON public.courses FOR SELECT USING (((is_published = true) OR public.is_admin_or_manager()));


--
-- Name: courses courses_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_select_public ON public.courses FOR SELECT USING ((is_published = true));


--
-- Name: courses courses_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_update_manage ON public.courses FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: crm_lead_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lead_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_lead_comments crm_lead_comments_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_comments_delete_manage ON public.crm_lead_comments FOR DELETE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_lead_comments crm_lead_comments_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_comments_insert_manage ON public.crm_lead_comments FOR INSERT TO authenticated WITH CHECK ((app_private.has_permission('crm.leads.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE (l.id = crm_lead_comments.lead_id)))));


--
-- Name: crm_lead_comments crm_lead_comments_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_comments_select_access ON public.crm_lead_comments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE ((l.id = crm_lead_comments.lead_id) AND (app_private.has_permission('crm.leads.view'::text, 'all'::text) OR app_private.has_permission('crm.leads.manage'::text, 'all'::text))))));


--
-- Name: crm_lead_comments crm_lead_comments_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_comments_update_manage ON public.crm_lead_comments FOR UPDATE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text)) WITH CHECK ((app_private.has_permission('crm.leads.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE (l.id = crm_lead_comments.lead_id)))));


--
-- Name: crm_lead_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lead_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_lead_status_history crm_lead_status_history_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_status_history_delete_manage ON public.crm_lead_status_history FOR DELETE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_lead_status_history crm_lead_status_history_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_status_history_insert_manage ON public.crm_lead_status_history FOR INSERT TO authenticated WITH CHECK ((app_private.has_permission('crm.leads.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE (l.id = crm_lead_status_history.lead_id)))));


--
-- Name: crm_lead_status_history crm_lead_status_history_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_status_history_select_access ON public.crm_lead_status_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE ((l.id = crm_lead_status_history.lead_id) AND (app_private.has_permission('crm.leads.view'::text, 'all'::text) OR app_private.has_permission('crm.leads.manage'::text, 'all'::text))))));


--
-- Name: crm_lead_status_history crm_lead_status_history_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_lead_status_history_update_manage ON public.crm_lead_status_history FOR UPDATE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text)) WITH CHECK ((app_private.has_permission('crm.leads.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.crm_leads l
  WHERE (l.id = crm_lead_status_history.lead_id)))));


--
-- Name: crm_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_leads crm_leads_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_leads_delete_manage ON public.crm_leads FOR DELETE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_leads crm_leads_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_leads_insert_manage ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_leads crm_leads_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_leads_select_access ON public.crm_leads FOR SELECT TO authenticated USING ((app_private.has_permission('crm.leads.view'::text, 'all'::text) OR app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: crm_leads crm_leads_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_leads_update_manage ON public.crm_leads FOR UPDATE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_settings crm_settings_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_settings_delete_manage ON public.crm_settings FOR DELETE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text));


--
-- Name: crm_settings crm_settings_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_settings_insert_manage ON public.crm_settings FOR INSERT TO authenticated WITH CHECK (((id = true) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: crm_settings crm_settings_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_settings_select_access ON public.crm_settings FOR SELECT TO authenticated USING ((app_private.has_permission('crm.leads.view'::text, 'all'::text) OR app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: crm_settings crm_settings_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_settings_update_manage ON public.crm_settings FOR UPDATE TO authenticated USING (app_private.has_permission('crm.leads.manage'::text, 'all'::text)) WITH CHECK (((id = true) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: student_course_enrollments enrollments_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY enrollments_select_policy ON public.student_course_enrollments FOR SELECT USING (((student_id = public.current_student_id()) OR (assigned_teacher_id = public.current_teacher_id()) OR public.is_admin_or_manager()));


--
-- Name: homework_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: homework_assignments homework_assignments_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_assignments_delete_access ON public.homework_assignments FOR DELETE TO authenticated USING ((app_private.is_own_student(student_id) OR (app_private.is_assigned_teacher(student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text)));


--
-- Name: homework_assignments homework_assignments_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_assignments_insert_access ON public.homework_assignments FOR INSERT TO authenticated WITH CHECK ((app_private.is_own_student(student_id) OR (app_private.is_assigned_teacher(student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text)));


--
-- Name: homework_assignments homework_assignments_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_assignments_select_access ON public.homework_assignments FOR SELECT TO authenticated USING ((app_private.can_access_student(student_id) OR app_private.has_permission('homework.view'::text, 'all'::text)));


--
-- Name: homework_assignments homework_assignments_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_assignments_update_access ON public.homework_assignments FOR UPDATE TO authenticated USING ((app_private.is_own_student(student_id) OR (app_private.is_assigned_teacher(student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text))) WITH CHECK ((app_private.is_own_student(student_id) OR (app_private.is_assigned_teacher(student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text)));


--
-- Name: homework_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.homework_items ENABLE ROW LEVEL SECURITY;

--
-- Name: homework_items homework_items_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_items_delete_access ON public.homework_items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = homework_items.assignment_id) AND (app_private.is_own_student(ha.student_id) OR (app_private.is_assigned_teacher(ha.student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text))))));


--
-- Name: homework_items homework_items_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_items_insert_access ON public.homework_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = homework_items.assignment_id) AND (app_private.is_own_student(ha.student_id) OR (app_private.is_assigned_teacher(ha.student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text))))));


--
-- Name: homework_items homework_items_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_items_select_access ON public.homework_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = homework_items.assignment_id) AND (app_private.can_access_student(ha.student_id) OR app_private.has_permission('homework.view'::text, 'all'::text))))));


--
-- Name: homework_items homework_items_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homework_items_update_access ON public.homework_items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = homework_items.assignment_id) AND (app_private.is_own_student(ha.student_id) OR (app_private.is_assigned_teacher(ha.student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = homework_items.assignment_id) AND (app_private.is_own_student(ha.student_id) OR (app_private.is_assigned_teacher(ha.student_id) AND app_private.has_permission('homework.assign'::text, 'assigned'::text)) OR app_private.has_permission('homework.assign'::text, 'all'::text))))));


--
-- Name: lesson_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_attendance lesson_attendance_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attendance_delete_access ON public.lesson_attendance FOR DELETE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: lesson_attendance lesson_attendance_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attendance_insert_access ON public.lesson_attendance FOR INSERT TO authenticated WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: lesson_attendance lesson_attendance_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attendance_select_access ON public.lesson_attendance FOR SELECT TO authenticated USING ((app_private.is_own_student(student_id) OR ((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('schedule.view'::text, 'all'::text)));


--
-- Name: lesson_attendance lesson_attendance_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attendance_update_access ON public.lesson_attendance FOR UPDATE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text))) WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: lesson_outcomes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_outcomes ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_outcomes lesson_outcomes_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_outcomes_delete_access ON public.lesson_outcomes FOR DELETE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: lesson_outcomes lesson_outcomes_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_outcomes_insert_access ON public.lesson_outcomes FOR INSERT TO authenticated WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: lesson_outcomes lesson_outcomes_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_outcomes_select_access ON public.lesson_outcomes FOR SELECT TO authenticated USING ((((visible_to_student = true) AND app_private.is_own_student(student_id)) OR ((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('schedule.view'::text, 'all'::text)));


--
-- Name: lesson_outcomes lesson_outcomes_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_outcomes_update_access ON public.lesson_outcomes FOR UPDATE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text))) WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: student_lesson_progress lesson_progress_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_progress_insert_policy ON public.student_lesson_progress FOR INSERT WITH CHECK (((student_id = public.current_student_id()) OR public.is_admin_or_manager()));


--
-- Name: student_lesson_progress lesson_progress_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_progress_select_own ON public.student_lesson_progress FOR SELECT USING ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.profile_id = auth.uid()))));


--
-- Name: student_lesson_progress lesson_progress_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_progress_select_policy ON public.student_lesson_progress FOR SELECT USING (((student_id = public.current_student_id()) OR public.is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM public.student_course_enrollments e
  WHERE ((e.student_id = student_lesson_progress.student_id) AND (e.assigned_teacher_id = public.current_teacher_id()))))));


--
-- Name: student_lesson_progress lesson_progress_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_progress_update_policy ON public.student_lesson_progress FOR UPDATE USING (((student_id = public.current_student_id()) OR public.is_admin_or_manager())) WITH CHECK (((student_id = public.current_student_id()) OR public.is_admin_or_manager()));


--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons lessons_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_delete_manage ON public.lessons FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: lessons lessons_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_insert_manage ON public.lessons FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: lessons lessons_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select_manage ON public.lessons FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: lessons lessons_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select_policy ON public.lessons FOR SELECT USING (((is_published = true) OR public.is_admin_or_manager()));


--
-- Name: lessons lessons_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select_public ON public.lessons FOR SELECT USING (((is_published = true) AND (EXISTS ( SELECT 1
   FROM (public.course_modules cm
     JOIN public.courses c ON ((c.id = cm.course_id)))
  WHERE ((cm.id = lessons.module_id) AND (cm.is_published = true) AND (c.is_published = true))))));


--
-- Name: lessons lessons_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_update_manage ON public.lessons FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: notification_user_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_user_state ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_user_state notification_user_state_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_user_state_insert_own ON public.notification_user_state FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: notification_user_state notification_user_state_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_user_state_select_own ON public.notification_user_state FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: notification_user_state notification_user_state_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_user_state_update_own ON public.notification_user_state FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_delete_manage ON public.notifications FOR DELETE TO authenticated USING (app_private.has_permission('notifications.manage'::text, 'all'::text));


--
-- Name: notifications notifications_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_insert_manage ON public.notifications FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('notifications.manage'::text, 'all'::text));


--
-- Name: notifications notifications_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_select_access ON public.notifications FOR SELECT TO authenticated USING ((app_private.has_permission('notifications.manage'::text, 'all'::text) OR ((is_active = true) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now())) AND (EXISTS ( SELECT 1
   FROM public.profiles current_profile
  WHERE ((current_profile.id = auth.uid()) AND (notifications.published_at >= current_profile.created_at)))) AND ((auth.uid() = ANY (COALESCE(target_user_ids, ARRAY[]::uuid[]))) OR ('all'::text = ANY (target_roles)) OR (EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.key = ANY (notifications.target_roles)))))))));


--
-- Name: notifications notifications_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_update_manage ON public.notifications FOR UPDATE TO authenticated USING (app_private.has_permission('notifications.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('notifications.manage'::text, 'all'::text));


--
-- Name: payment_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_plans payment_plans_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_plans_delete_manage ON public.payment_plans FOR DELETE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_plans payment_plans_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_plans_insert_manage ON public.payment_plans FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_plans payment_plans_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_plans_select_access ON public.payment_plans FOR SELECT TO authenticated USING (((is_active = true) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: payment_plans payment_plans_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_plans_update_manage ON public.payment_plans FOR UPDATE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions payment_transactions_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_transactions_delete_manage ON public.payment_transactions FOR DELETE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_transactions payment_transactions_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_transactions_insert_manage ON public.payment_transactions FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_transactions payment_transactions_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_transactions_select_access ON public.payment_transactions FOR SELECT TO authenticated USING ((((student_id IS NOT NULL) AND app_private.is_own_student(student_id) AND app_private.has_permission('payments.view'::text, 'own'::text)) OR app_private.has_permission('payments.view'::text, 'all'::text)));


--
-- Name: payment_transactions payment_transactions_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_transactions_update_manage ON public.payment_transactions FOR UPDATE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: payment_webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions permissions_authenticated_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permissions_authenticated_select ON public.permissions FOR SELECT TO authenticated USING (true);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own_or_users_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own_or_users_view ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR app_private.has_permission('users.view'::text, 'all'::text)));


--
-- Name: profiles profiles_update_own_or_users_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own_or_users_manage ON public.profiles FOR UPDATE TO authenticated USING (((id = auth.uid()) OR app_private.has_permission('users.manage'::text, 'all'::text))) WITH CHECK (((id = auth.uid()) OR app_private.has_permission('users.manage'::text, 'all'::text)));


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_select_own_grants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_permissions_select_own_grants ON public.role_permissions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role_id = role_permissions.role_id)))));


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_authenticated_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_authenticated_select ON public.roles FOR SELECT TO authenticated USING (true);


--
-- Name: search_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: student_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: student_activity_log student_activity_log_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_activity_log_insert_policy ON public.student_activity_log FOR INSERT WITH CHECK (((student_id = public.current_student_id()) OR public.is_admin_or_manager()));


--
-- Name: student_activity_log student_activity_log_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_activity_log_select_policy ON public.student_activity_log FOR SELECT USING (((student_id = public.current_student_id()) OR public.is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM public.student_course_enrollments e
  WHERE ((e.student_id = student_activity_log.student_id) AND (e.assigned_teacher_id = public.current_teacher_id()))))));


--
-- Name: student_billing_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_billing_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: student_billing_accounts student_billing_accounts_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_accounts_delete_manage ON public.student_billing_accounts FOR DELETE TO authenticated USING ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_billing_accounts student_billing_accounts_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_accounts_insert_manage ON public.student_billing_accounts FOR INSERT TO authenticated WITH CHECK ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_billing_accounts student_billing_accounts_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_accounts_select_access ON public.student_billing_accounts FOR SELECT TO authenticated USING (app_private.can_view_payment(student_id));


--
-- Name: student_billing_accounts student_billing_accounts_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_accounts_update_manage ON public.student_billing_accounts FOR UPDATE TO authenticated USING ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text))) WITH CHECK ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_billing_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_billing_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: student_billing_ledger student_billing_ledger_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_ledger_delete_manage ON public.student_billing_ledger FOR DELETE TO authenticated USING ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_billing_ledger student_billing_ledger_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_ledger_insert_manage ON public.student_billing_ledger FOR INSERT TO authenticated WITH CHECK ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_billing_ledger student_billing_ledger_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_ledger_select_access ON public.student_billing_ledger FOR SELECT TO authenticated USING (app_private.can_view_payment(student_id));


--
-- Name: student_billing_ledger student_billing_ledger_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_billing_ledger_update_manage ON public.student_billing_ledger FOR UPDATE TO authenticated USING ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text))) WITH CHECK ((app_private.has_permission('billing.adjust'::text, 'all'::text) OR app_private.has_permission('payments.manage'::text, 'all'::text)));


--
-- Name: student_course_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: student_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: student_favorites student_favorites_rw_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_favorites_rw_own ON public.student_favorites TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = student_favorites.student_id) AND (s.profile_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = student_favorites.student_id) AND (s.profile_id = auth.uid())))));


--
-- Name: student_homework_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_homework_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: student_homework_progress student_homework_progress_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_homework_progress_delete_own ON public.student_homework_progress FOR DELETE TO authenticated USING (app_private.is_own_student(student_id));


--
-- Name: student_homework_progress student_homework_progress_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_homework_progress_insert_own ON public.student_homework_progress FOR INSERT TO authenticated WITH CHECK ((app_private.is_own_student(student_id) AND (EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = student_homework_progress.assignment_id) AND (ha.student_id = student_homework_progress.student_id))))));


--
-- Name: student_homework_progress student_homework_progress_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_homework_progress_select_access ON public.student_homework_progress FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_homework_progress student_homework_progress_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_homework_progress_update_own ON public.student_homework_progress FOR UPDATE TO authenticated USING (app_private.is_own_student(student_id)) WITH CHECK ((app_private.is_own_student(student_id) AND (EXISTS ( SELECT 1
   FROM public.homework_assignments ha
  WHERE ((ha.id = student_homework_progress.assignment_id) AND (ha.student_id = student_homework_progress.student_id))))));


--
-- Name: student_lesson_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: student_lesson_progress student_lesson_progress_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_lesson_progress_delete_own ON public.student_lesson_progress FOR DELETE TO authenticated USING (app_private.is_own_student(student_id));


--
-- Name: student_lesson_progress student_lesson_progress_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_lesson_progress_insert_own ON public.student_lesson_progress FOR INSERT TO authenticated WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: student_lesson_progress student_lesson_progress_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_lesson_progress_select_access ON public.student_lesson_progress FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_lesson_progress student_lesson_progress_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_lesson_progress_update_own ON public.student_lesson_progress FOR UPDATE TO authenticated USING (app_private.is_own_student(student_id)) WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: student_mistakes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_mistakes ENABLE ROW LEVEL SECURITY;

--
-- Name: student_mistakes student_mistakes_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_mistakes_select_access ON public.student_mistakes FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_payment_reminder_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_payment_reminder_state ENABLE ROW LEVEL SECURITY;

--
-- Name: student_payment_reminder_state student_payment_reminder_state_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_payment_reminder_state_delete_manage ON public.student_payment_reminder_state FOR DELETE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: student_payment_reminder_state student_payment_reminder_state_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_payment_reminder_state_insert_manage ON public.student_payment_reminder_state FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: student_payment_reminder_state student_payment_reminder_state_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_payment_reminder_state_select_manage ON public.student_payment_reminder_state FOR SELECT TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: student_payment_reminder_state student_payment_reminder_state_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_payment_reminder_state_update_manage ON public.student_payment_reminder_state FOR UPDATE TO authenticated USING (app_private.has_permission('payments.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('payments.manage'::text, 'all'::text));


--
-- Name: student_schedule_lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_schedule_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: student_schedule_lessons student_schedule_lessons_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_schedule_lessons_delete_access ON public.student_schedule_lessons FOR DELETE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: student_schedule_lessons student_schedule_lessons_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_schedule_lessons_insert_access ON public.student_schedule_lessons FOR INSERT TO authenticated WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: student_schedule_lessons student_schedule_lessons_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_schedule_lessons_select_access ON public.student_schedule_lessons FOR SELECT TO authenticated USING ((app_private.can_access_student(student_id) OR app_private.has_permission('schedule.view'::text, 'all'::text)));


--
-- Name: student_schedule_lessons student_schedule_lessons_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_schedule_lessons_update_access ON public.student_schedule_lessons FOR UPDATE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text))) WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id) AND app_private.has_permission('schedule.manage'::text, 'assigned'::text)) OR app_private.has_permission('schedule.manage'::text, 'all'::text)));


--
-- Name: student_test_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_test_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: student_test_answers student_test_answers_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_answers_delete_own ON public.student_test_answers FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.student_test_attempts sta
  WHERE ((sta.id = student_test_answers.attempt_id) AND app_private.is_own_student(sta.student_id)))));


--
-- Name: student_test_answers student_test_answers_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_answers_insert_own ON public.student_test_answers FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.student_test_attempts sta
  WHERE ((sta.id = student_test_answers.attempt_id) AND app_private.is_own_student(sta.student_id)))));


--
-- Name: student_test_answers student_test_answers_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_answers_select_access ON public.student_test_answers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.student_test_attempts sta
  WHERE ((sta.id = student_test_answers.attempt_id) AND app_private.can_access_student(sta.student_id)))));


--
-- Name: student_test_answers student_test_answers_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_answers_update_own ON public.student_test_answers FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.student_test_attempts sta
  WHERE ((sta.id = student_test_answers.attempt_id) AND app_private.is_own_student(sta.student_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.student_test_attempts sta
  WHERE ((sta.id = student_test_answers.attempt_id) AND app_private.is_own_student(sta.student_id)))));


--
-- Name: student_test_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_test_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: student_test_attempts student_test_attempts_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_attempts_delete_own ON public.student_test_attempts FOR DELETE TO authenticated USING (app_private.is_own_student(student_id));


--
-- Name: student_test_attempts student_test_attempts_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_attempts_insert_own ON public.student_test_attempts FOR INSERT TO authenticated WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: student_test_attempts student_test_attempts_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_attempts_select_access ON public.student_test_attempts FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_test_attempts student_test_attempts_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_test_attempts_update_own ON public.student_test_attempts FOR UPDATE TO authenticated USING (app_private.is_own_student(student_id)) WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: student_word_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_word_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: student_word_reviews student_word_reviews_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_word_reviews_delete_own ON public.student_word_reviews FOR DELETE TO authenticated USING (app_private.is_own_student(student_id));


--
-- Name: student_word_reviews student_word_reviews_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_word_reviews_insert_own ON public.student_word_reviews FOR INSERT TO authenticated WITH CHECK ((app_private.is_own_student(student_id) AND (EXISTS ( SELECT 1
   FROM public.student_words sw
  WHERE ((sw.id = student_word_reviews.student_word_id) AND (sw.student_id = student_word_reviews.student_id))))));


--
-- Name: student_word_reviews student_word_reviews_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_word_reviews_select_access ON public.student_word_reviews FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_word_reviews student_word_reviews_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_word_reviews_update_own ON public.student_word_reviews FOR UPDATE TO authenticated USING (app_private.is_own_student(student_id)) WITH CHECK ((app_private.is_own_student(student_id) AND (EXISTS ( SELECT 1
   FROM public.student_words sw
  WHERE ((sw.id = student_word_reviews.student_word_id) AND (sw.student_id = student_word_reviews.student_id))))));


--
-- Name: student_words; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_words ENABLE ROW LEVEL SECURITY;

--
-- Name: student_words student_words_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_words_delete_own ON public.student_words FOR DELETE TO authenticated USING (app_private.is_own_student(student_id));


--
-- Name: student_words student_words_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_words_insert_own ON public.student_words FOR INSERT TO authenticated WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: student_words student_words_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_words_select_access ON public.student_words FOR SELECT TO authenticated USING (app_private.can_access_student(student_id));


--
-- Name: student_words student_words_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_words_update_own ON public.student_words FOR UPDATE TO authenticated USING (app_private.is_own_student(student_id)) WITH CHECK (app_private.is_own_student(student_id));


--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: students students_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY students_select_access ON public.students FOR SELECT TO authenticated USING (app_private.can_access_student(id));


--
-- Name: students students_update_own_or_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY students_update_own_or_manage ON public.students FOR UPDATE TO authenticated USING ((app_private.is_own_student(id) OR app_private.has_permission('students.manage'::text, 'all'::text))) WITH CHECK (((profile_id = auth.uid()) OR app_private.has_permission('students.manage'::text, 'all'::text)));


--
-- Name: teacher_dossiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_dossiers ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_dossiers teacher_dossiers_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_dossiers_delete_manage ON public.teacher_dossiers FOR DELETE TO authenticated USING (app_private.has_permission('teachers.manage'::text, 'all'::text));


--
-- Name: teacher_dossiers teacher_dossiers_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_dossiers_insert_manage ON public.teacher_dossiers FOR INSERT TO authenticated WITH CHECK ((app_private.has_permission('teachers.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE (t.id = teacher_dossiers.teacher_id)))));


--
-- Name: teacher_dossiers teacher_dossiers_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_dossiers_select_access ON public.teacher_dossiers FOR SELECT TO authenticated USING ((app_private.has_permission('teachers.view'::text, 'all'::text) OR app_private.has_permission('teachers.manage'::text, 'all'::text)));


--
-- Name: teacher_dossiers teacher_dossiers_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_dossiers_update_manage ON public.teacher_dossiers FOR UPDATE TO authenticated USING (app_private.has_permission('teachers.manage'::text, 'all'::text)) WITH CHECK ((app_private.has_permission('teachers.manage'::text, 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE (t.id = teacher_dossiers.teacher_id)))));


--
-- Name: teacher_student_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_student_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_student_notes teacher_student_notes_delete_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_student_notes_delete_access ON public.teacher_student_notes FOR DELETE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('students.manage'::text, 'all'::text)));


--
-- Name: teacher_student_notes teacher_student_notes_insert_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_student_notes_insert_access ON public.teacher_student_notes FOR INSERT TO authenticated WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('students.manage'::text, 'all'::text)));


--
-- Name: teacher_student_notes teacher_student_notes_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_student_notes_select_access ON public.teacher_student_notes FOR SELECT TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('students.view'::text, 'all'::text)));


--
-- Name: teacher_student_notes teacher_student_notes_update_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teacher_student_notes_update_access ON public.teacher_student_notes FOR UPDATE TO authenticated USING ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('students.manage'::text, 'all'::text))) WITH CHECK ((((teacher_id = app_private.current_teacher_id()) AND app_private.is_assigned_teacher(student_id)) OR app_private.has_permission('students.manage'::text, 'all'::text)));


--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers teachers_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teachers_delete_manage ON public.teachers FOR DELETE TO authenticated USING (app_private.has_permission('teachers.manage'::text, 'all'::text));


--
-- Name: teachers teachers_select_own_or_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teachers_select_own_or_view ON public.teachers FOR SELECT TO authenticated USING (((profile_id = auth.uid()) OR app_private.has_permission('teachers.view'::text, 'all'::text)));


--
-- Name: teachers teachers_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teachers_update_manage ON public.teachers FOR UPDATE TO authenticated USING (app_private.has_permission('teachers.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('teachers.manage'::text, 'all'::text));


--
-- Name: test_question_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_question_options ENABLE ROW LEVEL SECURITY;

--
-- Name: test_question_options test_question_options_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_delete_manage ON public.test_question_options FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_question_options test_question_options_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_insert_manage ON public.test_question_options FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_question_options test_question_options_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_select_manage ON public.test_question_options FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_question_options test_question_options_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_select_policy ON public.test_question_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.test_questions q
     JOIN public.tests t ON ((t.id = q.test_id)))
  WHERE ((q.id = test_question_options.question_id) AND ((t.is_published = true) OR public.is_admin_or_manager())))));


--
-- Name: test_question_options test_question_options_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_select_public ON public.test_question_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.test_questions q
     JOIN public.tests t ON ((t.id = q.test_id)))
  WHERE ((q.id = test_question_options.question_id) AND (t.is_published = true) AND (((t.lesson_id IS NULL) AND (t.module_id IS NULL)) OR ((t.lesson_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ((public.lessons l
             JOIN public.course_modules cm ON ((cm.id = l.module_id)))
             JOIN public.courses c ON ((c.id = cm.course_id)))
          WHERE ((l.id = t.lesson_id) AND (l.is_published = true) AND (cm.is_published = true) AND (c.is_published = true))))) OR ((t.lesson_id IS NULL) AND (t.module_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM (public.course_modules cm
             JOIN public.courses c ON ((c.id = cm.course_id)))
          WHERE ((cm.id = t.module_id) AND (cm.is_published = true) AND (c.is_published = true))))))))));


--
-- Name: test_question_options test_question_options_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_question_options_update_manage ON public.test_question_options FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: test_questions test_questions_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_delete_manage ON public.test_questions FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_questions test_questions_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_insert_manage ON public.test_questions FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_questions test_questions_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_select_manage ON public.test_questions FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: test_questions test_questions_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_select_policy ON public.test_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tests t
  WHERE ((t.id = test_questions.test_id) AND ((t.is_published = true) OR public.is_admin_or_manager())))));


--
-- Name: test_questions test_questions_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_select_public ON public.test_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tests t
  WHERE ((t.id = test_questions.test_id) AND (t.is_published = true) AND (((t.lesson_id IS NULL) AND (t.module_id IS NULL)) OR ((t.lesson_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ((public.lessons l
             JOIN public.course_modules cm ON ((cm.id = l.module_id)))
             JOIN public.courses c ON ((c.id = cm.course_id)))
          WHERE ((l.id = t.lesson_id) AND (l.is_published = true) AND (cm.is_published = true) AND (c.is_published = true))))) OR ((t.lesson_id IS NULL) AND (t.module_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM (public.course_modules cm
             JOIN public.courses c ON ((c.id = cm.course_id)))
          WHERE ((cm.id = t.module_id) AND (cm.is_published = true) AND (c.is_published = true))))))))));


--
-- Name: test_questions test_questions_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_questions_update_manage ON public.test_questions FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: tests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

--
-- Name: tests tests_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_delete_manage ON public.tests FOR DELETE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: tests tests_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_insert_manage ON public.tests FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: tests tests_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_select_manage ON public.tests FOR SELECT TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: tests tests_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_select_policy ON public.tests FOR SELECT USING (((is_published = true) OR public.is_admin_or_manager()));


--
-- Name: tests tests_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_select_public ON public.tests FOR SELECT USING (((is_published = true) AND (((lesson_id IS NULL) AND (module_id IS NULL)) OR ((lesson_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((public.lessons l
     JOIN public.course_modules cm ON ((cm.id = l.module_id)))
     JOIN public.courses c ON ((c.id = cm.course_id)))
  WHERE ((l.id = tests.lesson_id) AND (l.is_published = true) AND (cm.is_published = true) AND (c.is_published = true))))) OR ((lesson_id IS NULL) AND (module_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (public.course_modules cm
     JOIN public.courses c ON ((c.id = cm.course_id)))
  WHERE ((cm.id = tests.module_id) AND (cm.is_published = true) AND (c.is_published = true))))))));


--
-- Name: tests tests_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tests_update_manage ON public.tests FOR UPDATE TO authenticated USING (app_private.has_permission('content.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('content.manage'::text, 'all'::text));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: word_card_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.word_card_items ENABLE ROW LEVEL SECURITY;

--
-- Name: word_card_items word_card_items_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_items_delete_manage ON public.word_card_items FOR DELETE TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_items word_card_items_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_items_insert_manage ON public.word_card_items FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_items word_card_items_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_items_select_manage ON public.word_card_items FOR SELECT TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_items word_card_items_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_items_select_public ON public.word_card_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.word_card_sets s
  WHERE ((s.id = word_card_items.set_id) AND (s.is_published = true)))));


--
-- Name: word_card_items word_card_items_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_items_update_manage ON public.word_card_items FOR UPDATE TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.word_card_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: word_card_sets word_card_sets_delete_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_sets_delete_manage ON public.word_card_sets FOR DELETE TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_sets word_card_sets_insert_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_sets_insert_manage ON public.word_card_sets FOR INSERT TO authenticated WITH CHECK (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_sets word_card_sets_select_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_sets_select_manage ON public.word_card_sets FOR SELECT TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: word_card_sets word_card_sets_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_sets_select_public ON public.word_card_sets FOR SELECT USING ((is_published = true));


--
-- Name: word_card_sets word_card_sets_update_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_card_sets_update_manage ON public.word_card_sets FOR UPDATE TO authenticated USING (app_private.has_permission('word_cards.manage'::text, 'all'::text)) WITH CHECK (app_private.has_permission('word_cards.manage'::text, 'all'::text));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects avatars_delete_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects avatars_insert_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects avatars_select_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_select_own ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects avatars_update_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))) WITH CHECK (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: objects crm_assets_delete_manage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY crm_assets_delete_manage ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'crm-assets'::text) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: objects crm_assets_insert_manage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY crm_assets_insert_manage ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'crm-assets'::text) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: objects crm_assets_update_manage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY crm_assets_update_manage ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'crm-assets'::text) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text))) WITH CHECK (((bucket_id = 'crm-assets'::text) AND app_private.has_permission('crm.leads.manage'::text, 'all'::text)));


--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: SCHEMA app_private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA app_private TO authenticated;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_in(cstring) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_in(cstring) TO service_role;


--
-- Name: FUNCTION gtrgm_out(extensions.gtrgm); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_out(extensions.gtrgm) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_out(extensions.gtrgm) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_out(extensions.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_out(extensions.gtrgm) TO service_role;


--
-- Name: FUNCTION can_access_student(p_student_id uuid); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.can_access_student(p_student_id uuid) TO authenticated;


--
-- Name: FUNCTION can_view_payment(p_student_id uuid); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.can_view_payment(p_student_id uuid) TO authenticated;


--
-- Name: FUNCTION current_profile_id(); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.current_profile_id() TO authenticated;


--
-- Name: FUNCTION current_teacher_id(); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.current_teacher_id() TO authenticated;


--
-- Name: FUNCTION has_permission(p_permission_key text, p_required_scope text); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.has_permission(p_permission_key text, p_required_scope text) TO authenticated;


--
-- Name: FUNCTION is_assigned_teacher(p_student_id uuid); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.is_assigned_teacher(p_student_id uuid) TO authenticated;


--
-- Name: FUNCTION is_own_student(p_student_id uuid); Type: ACL; Schema: app_private; Owner: -
--

GRANT ALL ON FUNCTION app_private.is_own_student(p_student_id uuid) TO authenticated;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gin_extract_value_trgm(text, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gin_extract_value_trgm(text, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_compress(internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_compress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_decompress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_options(internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_options(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_same(extensions.gtrgm, extensions.gtrgm, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_same(extensions.gtrgm, extensions.gtrgm, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_same(extensions.gtrgm, extensions.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_same(extensions.gtrgm, extensions.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_same(extensions.gtrgm, extensions.gtrgm, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.gtrgm_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION extensions.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION extensions.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION extensions.gtrgm_union(internal, internal) TO service_role;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.set_limit(real) TO postgres;
GRANT ALL ON FUNCTION extensions.set_limit(real) TO anon;
GRANT ALL ON FUNCTION extensions.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION extensions.set_limit(real) TO service_role;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.show_limit() TO postgres;
GRANT ALL ON FUNCTION extensions.show_limit() TO anon;
GRANT ALL ON FUNCTION extensions.show_limit() TO authenticated;
GRANT ALL ON FUNCTION extensions.show_limit() TO service_role;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.show_trgm(text) TO postgres;
GRANT ALL ON FUNCTION extensions.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION extensions.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION extensions.show_trgm(text) TO service_role;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.similarity(text, text) TO service_role;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.similarity_dist(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.similarity_dist(text, text) TO service_role;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.strict_word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.strict_word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.strict_word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.strict_word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.strict_word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION extensions.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION extensions.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION extensions.word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: -
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: -
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION admin_dashboard_metrics(period_anchor timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_dashboard_metrics(period_anchor timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_dashboard_metrics(period_anchor timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.admin_dashboard_metrics(period_anchor timestamp with time zone) TO service_role;


--
-- Name: FUNCTION admin_list_payment_control(p_threshold_lessons integer, p_query text, p_filter text, p_page integer, p_page_size integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_list_payment_control(p_threshold_lessons integer, p_query text, p_filter text, p_page integer, p_page_size integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_list_payment_control(p_threshold_lessons integer, p_query text, p_filter text, p_page integer, p_page_size integer) TO authenticated;
GRANT ALL ON FUNCTION public.admin_list_payment_control(p_threshold_lessons integer, p_query text, p_filter text, p_page integer, p_page_size integer) TO service_role;


--
-- Name: FUNCTION admin_payment_control_stats(p_threshold_lessons integer, p_query text, p_filter text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_payment_control_stats(p_threshold_lessons integer, p_query text, p_filter text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_payment_control_stats(p_threshold_lessons integer, p_query text, p_filter text) TO authenticated;
GRANT ALL ON FUNCTION public.admin_payment_control_stats(p_threshold_lessons integer, p_query text, p_filter text) TO service_role;


--
-- Name: FUNCTION admin_payment_control_summary_rows(p_threshold_lessons integer, p_query text, p_filter text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_payment_control_summary_rows(p_threshold_lessons integer, p_query text, p_filter text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_payment_control_summary_rows(p_threshold_lessons integer, p_query text, p_filter text) TO service_role;


--
-- Name: FUNCTION apply_user_provisioning(p_user_id uuid, p_email text, p_user_meta_data jsonb, p_app_meta_data jsonb, p_email_confirmed_at timestamp with time zone, p_confirmed_at timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_user_provisioning(p_user_id uuid, p_email text, p_user_meta_data jsonb, p_app_meta_data jsonb, p_email_confirmed_at timestamp with time zone, p_confirmed_at timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_user_provisioning(p_user_id uuid, p_email text, p_user_meta_data jsonb, p_app_meta_data jsonb, p_email_confirmed_at timestamp with time zone, p_confirmed_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION backfill_search_documents(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.backfill_search_documents() FROM PUBLIC;
GRANT ALL ON FUNCTION public.backfill_search_documents() TO service_role;


--
-- Name: FUNCTION create_current_student_payment_transaction(p_transaction_id uuid, p_plan_id uuid, p_return_url text, p_idempotence_key text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_current_student_payment_transaction(p_transaction_id uuid, p_plan_id uuid, p_return_url text, p_idempotence_key text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_current_student_payment_transaction(p_transaction_id uuid, p_plan_id uuid, p_return_url text, p_idempotence_key text) TO authenticated;
GRANT ALL ON FUNCTION public.create_current_student_payment_transaction(p_transaction_id uuid, p_plan_id uuid, p_return_url text, p_idempotence_key text) TO service_role;


--
-- Name: FUNCTION create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb) TO service_role;
GRANT ALL ON FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_public_crm_lead(p_name text, p_phone text, p_email text, p_form_type text, p_comment text, p_source text, p_page_url text, p_metadata jsonb) TO authenticated;


--
-- Name: FUNCTION current_student_id(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_student_id() TO service_role;
GRANT ALL ON FUNCTION public.current_student_id() TO authenticated;


--
-- Name: FUNCTION current_teacher_id(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.current_teacher_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_teacher_id() TO service_role;
GRANT ALL ON FUNCTION public.current_teacher_id() TO authenticated;


--
-- Name: FUNCTION delete_search_document(p_entity_type text, p_entity_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_search_document(p_entity_type text, p_entity_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_search_document(p_entity_type text, p_entity_id uuid) TO service_role;


--
-- Name: FUNCTION enforce_profile_auth_identity(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.enforce_profile_auth_identity() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_profile_auth_identity() TO service_role;


--
-- Name: FUNCTION enforce_user_role_matches_profile(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.enforce_user_role_matches_profile() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_user_role_matches_profile() TO service_role;


--
-- Name: FUNCTION get_accessible_profile_labels(p_profile_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_accessible_profile_labels(p_profile_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_accessible_profile_labels(p_profile_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_accessible_profile_labels(p_profile_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_accessible_student_billing_summary(p_student_id uuid, p_recent_entries_limit integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_accessible_student_billing_summary(p_student_id uuid, p_recent_entries_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_accessible_student_billing_summary(p_student_id uuid, p_recent_entries_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_accessible_student_billing_summary(p_student_id uuid, p_recent_entries_limit integer) TO service_role;


--
-- Name: FUNCTION get_linked_actor_scope(p_profile_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_linked_actor_scope(p_profile_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_linked_actor_scope(p_profile_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_linked_actor_scope(p_profile_id uuid) TO service_role;


--
-- Name: FUNCTION get_my_role(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_role() TO service_role;
GRANT ALL ON FUNCTION public.get_my_role() TO authenticated;


--
-- Name: TABLE course_modules; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.course_modules TO anon;
GRANT ALL ON TABLE public.course_modules TO authenticated;
GRANT ALL ON TABLE public.course_modules TO service_role;


--
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


--
-- Name: TABLE lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lessons TO anon;
GRANT ALL ON TABLE public.lessons TO authenticated;
GRANT ALL ON TABLE public.lessons TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE student_activity_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_activity_log TO anon;
GRANT ALL ON TABLE public.student_activity_log TO authenticated;
GRANT ALL ON TABLE public.student_activity_log TO service_role;


--
-- Name: TABLE student_course_enrollments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_course_enrollments TO anon;
GRANT ALL ON TABLE public.student_course_enrollments TO authenticated;
GRANT ALL ON TABLE public.student_course_enrollments TO service_role;


--
-- Name: TABLE student_lesson_progress; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_lesson_progress TO anon;
GRANT ALL ON TABLE public.student_lesson_progress TO authenticated;
GRANT ALL ON TABLE public.student_lesson_progress TO service_role;


--
-- Name: TABLE student_test_attempts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_test_attempts TO authenticated;
GRANT ALL ON TABLE public.student_test_attempts TO service_role;


--
-- Name: TABLE students; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.students TO anon;
GRANT ALL ON TABLE public.students TO authenticated;
GRANT ALL ON TABLE public.students TO service_role;


--
-- Name: TABLE student_dashboard_view; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_dashboard_view TO service_role;


--
-- Name: FUNCTION get_my_student_dashboard(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_my_student_dashboard() TO anon;
GRANT ALL ON FUNCTION public.get_my_student_dashboard() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_student_dashboard() TO service_role;


--
-- Name: FUNCTION get_my_student_dashboard_summary(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_my_student_dashboard_summary() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_student_dashboard_summary() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_student_dashboard_summary() TO service_role;


--
-- Name: FUNCTION get_schedule_student_options(p_student_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_schedule_student_options(p_student_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_schedule_student_options(p_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_schedule_student_options(p_student_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_schedule_teacher_options(p_teacher_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_schedule_teacher_options(p_teacher_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_schedule_teacher_options(p_teacher_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_schedule_teacher_options(p_teacher_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_student_billing_summary_aggregates(p_student_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_student_billing_summary_aggregates(p_student_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_student_billing_summary_aggregates(p_student_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_student_billing_summary_aggregates(p_student_id uuid) TO service_role;


--
-- Name: FUNCTION get_student_dashboard_payment_reminder_inputs(p_student_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_student_dashboard_payment_reminder_inputs(p_student_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_dashboard_payment_reminder_inputs(p_student_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_student_dashboard_payment_reminder_inputs(p_student_id uuid) TO service_role;


--
-- Name: FUNCTION get_teacher_roster_active_homework_counts(p_student_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_teacher_roster_active_homework_counts(p_student_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_teacher_roster_active_homework_counts(p_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_teacher_roster_active_homework_counts(p_student_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_teacher_student_profile_summaries(p_student_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_teacher_student_profile_summaries(p_student_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_teacher_student_profile_summaries(p_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_teacher_student_profile_summaries(p_student_ids uuid[]) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_user_confirmation_provisioning(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_user_confirmation_provisioning() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_user_confirmation_provisioning() TO service_role;


--
-- Name: FUNCTION handle_user_provision_metadata_update(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_user_provision_metadata_update() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_user_provision_metadata_update() TO service_role;


--
-- Name: FUNCTION is_admin_or_manager(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_admin_or_manager() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin_or_manager() TO service_role;
GRANT ALL ON FUNCTION public.is_admin_or_manager() TO authenticated;


--
-- Name: FUNCTION is_teacher(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_teacher() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_teacher() TO service_role;
GRANT ALL ON FUNCTION public.is_teacher() TO authenticated;


--
-- Name: FUNCTION load_current_student_payment_transaction_status(p_transaction_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.load_current_student_payment_transaction_status(p_transaction_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.load_current_student_payment_transaction_status(p_transaction_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.load_current_student_payment_transaction_status(p_transaction_id uuid) TO service_role;


--
-- Name: FUNCTION prevent_dual_linked_identity(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.prevent_dual_linked_identity() FROM PUBLIC;
GRANT ALL ON FUNCTION public.prevent_dual_linked_identity() TO service_role;


--
-- Name: FUNCTION search_documents_query(p_query text, p_limit integer, p_section text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.search_documents_query(p_query text, p_limit integer, p_section text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.search_documents_query(p_query text, p_limit integer, p_section text) TO service_role;


--
-- Name: FUNCTION search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.search_documents_query_for_actor(p_query text, p_limit integer, p_section text, p_is_authenticated boolean, p_role text, p_capabilities text[], p_student_id uuid, p_teacher_id uuid, p_accessible_student_ids uuid[]) TO anon;


--
-- Name: FUNCTION set_search_document_vector(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_search_document_vector() TO anon;
GRANT ALL ON FUNCTION public.set_search_document_vector() TO authenticated;
GRANT ALL ON FUNCTION public.set_search_document_vector() TO service_role;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION submit_practice_test_attempt(p_test_id uuid, p_answers jsonb, p_allow_partial boolean, p_started_at timestamp with time zone, p_submitted_at timestamp with time zone, p_time_spent_seconds integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.submit_practice_test_attempt(p_test_id uuid, p_answers jsonb, p_allow_partial boolean, p_started_at timestamp with time zone, p_submitted_at timestamp with time zone, p_time_spent_seconds integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.submit_practice_test_attempt(p_test_id uuid, p_answers jsonb, p_allow_partial boolean, p_started_at timestamp with time zone, p_submitted_at timestamp with time zone, p_time_spent_seconds integer) TO authenticated;
GRANT ALL ON FUNCTION public.submit_practice_test_attempt(p_test_id uuid, p_answers jsonb, p_allow_partial boolean, p_started_at timestamp with time zone, p_submitted_at timestamp with time zone, p_time_spent_seconds integer) TO service_role;


--
-- Name: FUNCTION sync_auth_user_email_to_profile(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_auth_user_email_to_profile() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_auth_user_email_to_profile() TO service_role;


--
-- Name: FUNCTION sync_search_document_blog_category(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_blog_category(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_blog_category(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_blog_post(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_blog_post(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_blog_post(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_course(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_course(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_course(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_course_module(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_course_module(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_course_module(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_homework_assignment(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_homework_assignment(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_homework_assignment(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_lesson(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_lesson(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_lesson(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_notification(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_notification(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_notification(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_profile(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_profile(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_profile(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_student_word(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_student_word(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_student_word(p_id uuid) TO service_role;


--
-- Name: FUNCTION sync_search_document_test(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_search_document_test(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_search_document_test(p_id uuid) TO service_role;


--
-- Name: FUNCTION touch_notifications_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_notifications_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_notifications_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_notifications_updated_at() TO service_role;


--
-- Name: FUNCTION touch_payment_entities_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_payment_entities_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_payment_entities_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_payment_entities_updated_at() TO service_role;


--
-- Name: FUNCTION touch_student_billing_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_student_billing_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_student_billing_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_student_billing_updated_at() TO service_role;


--
-- Name: FUNCTION touch_student_cabinet_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_student_cabinet_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_student_cabinet_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_student_cabinet_updated_at() TO service_role;


--
-- Name: FUNCTION touch_student_schedule_lessons_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_student_schedule_lessons_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_student_schedule_lessons_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_student_schedule_lessons_updated_at() TO service_role;


--
-- Name: FUNCTION touch_teacher_workspace_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_teacher_workspace_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_teacher_workspace_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_teacher_workspace_updated_at() TO service_role;


--
-- Name: FUNCTION touch_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_updated_at() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_blog_category(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_blog_category() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_blog_category() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_blog_post(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_blog_post() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_blog_post() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_course(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_course() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_course() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_course_module(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_course_module() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_course_module() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_homework_assignment(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_homework_assignment() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_homework_assignment() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_lesson(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_lesson() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_lesson() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_notification(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_notification() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_notification() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_profile(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_profile() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_profile() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_student_word(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_student_word() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_student_word() TO service_role;


--
-- Name: FUNCTION trg_sync_search_document_test(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.trg_sync_search_document_test() FROM PUBLIC;
GRANT ALL ON FUNCTION public.trg_sync_search_document_test() TO service_role;


--
-- Name: FUNCTION update_current_student_payment_transaction_provider_state(p_transaction_id uuid, p_provider_payment_id text, p_provider_payload jsonb, p_status text, p_raw_status text, p_paid_at timestamp with time zone, p_confirmation_url text, p_payment_method_id text, p_is_reusable_payment_method boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_current_student_payment_transaction_provider_state(p_transaction_id uuid, p_provider_payment_id text, p_provider_payload jsonb, p_status text, p_raw_status text, p_paid_at timestamp with time zone, p_confirmation_url text, p_payment_method_id text, p_is_reusable_payment_method boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_current_student_payment_transaction_provider_state(p_transaction_id uuid, p_provider_payment_id text, p_provider_payload jsonb, p_status text, p_raw_status text, p_paid_at timestamp with time zone, p_confirmation_url text, p_payment_method_id text, p_is_reusable_payment_method boolean) TO service_role;


--
-- Name: FUNCTION upsert_search_document(p_entity_type text, p_entity_id uuid, p_title text, p_subtitle text, p_body text, p_href text, p_section text, p_icon text, p_badge text, p_role_scope text[], p_visibility text, p_owner_student_id uuid, p_course_id uuid, p_is_published boolean, p_meta jsonb, p_updated_at timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_search_document(p_entity_type text, p_entity_id uuid, p_title text, p_subtitle text, p_body text, p_href text, p_section text, p_icon text, p_badge text, p_role_scope text[], p_visibility text, p_owner_student_id uuid, p_course_id uuid, p_is_published boolean, p_meta jsonb, p_updated_at timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_search_document(p_entity_type text, p_entity_id uuid, p_title text, p_subtitle text, p_body text, p_href text, p_section text, p_icon text, p_badge text, p_role_scope text[], p_visibility text, p_owner_student_id uuid, p_course_id uuid, p_is_published boolean, p_meta jsonb, p_updated_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: -
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE admin_payment_reminder_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_payment_reminder_settings TO anon;
GRANT ALL ON TABLE public.admin_payment_reminder_settings TO authenticated;
GRANT ALL ON TABLE public.admin_payment_reminder_settings TO service_role;


--
-- Name: TABLE audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log TO anon;
GRANT ALL ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;


--
-- Name: TABLE blog_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_categories TO anon;
GRANT ALL ON TABLE public.blog_categories TO authenticated;
GRANT ALL ON TABLE public.blog_categories TO service_role;


--
-- Name: TABLE blog_post_tags; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_post_tags TO anon;
GRANT ALL ON TABLE public.blog_post_tags TO authenticated;
GRANT ALL ON TABLE public.blog_post_tags TO service_role;


--
-- Name: TABLE blog_posts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_posts TO anon;
GRANT ALL ON TABLE public.blog_posts TO authenticated;
GRANT ALL ON TABLE public.blog_posts TO service_role;


--
-- Name: TABLE blog_tags; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_tags TO anon;
GRANT ALL ON TABLE public.blog_tags TO authenticated;
GRANT ALL ON TABLE public.blog_tags TO service_role;


--
-- Name: TABLE crm_lead_comments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_lead_comments TO anon;
GRANT ALL ON TABLE public.crm_lead_comments TO authenticated;
GRANT ALL ON TABLE public.crm_lead_comments TO service_role;


--
-- Name: TABLE crm_lead_status_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_lead_status_history TO anon;
GRANT ALL ON TABLE public.crm_lead_status_history TO authenticated;
GRANT ALL ON TABLE public.crm_lead_status_history TO service_role;


--
-- Name: TABLE crm_leads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_leads TO anon;
GRANT ALL ON TABLE public.crm_leads TO authenticated;
GRANT ALL ON TABLE public.crm_leads TO service_role;


--
-- Name: TABLE crm_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_settings TO anon;
GRANT ALL ON TABLE public.crm_settings TO authenticated;
GRANT ALL ON TABLE public.crm_settings TO service_role;


--
-- Name: TABLE homework_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.homework_assignments TO anon;
GRANT ALL ON TABLE public.homework_assignments TO authenticated;
GRANT ALL ON TABLE public.homework_assignments TO service_role;


--
-- Name: TABLE homework_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.homework_items TO anon;
GRANT ALL ON TABLE public.homework_items TO authenticated;
GRANT ALL ON TABLE public.homework_items TO service_role;


--
-- Name: TABLE lesson_attendance; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_attendance TO anon;
GRANT ALL ON TABLE public.lesson_attendance TO authenticated;
GRANT ALL ON TABLE public.lesson_attendance TO service_role;


--
-- Name: TABLE lesson_outcomes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_outcomes TO anon;
GRANT ALL ON TABLE public.lesson_outcomes TO authenticated;
GRANT ALL ON TABLE public.lesson_outcomes TO service_role;


--
-- Name: TABLE notification_user_state; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notification_user_state TO anon;
GRANT ALL ON TABLE public.notification_user_state TO authenticated;
GRANT ALL ON TABLE public.notification_user_state TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE payment_plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_plans TO anon;
GRANT ALL ON TABLE public.payment_plans TO authenticated;
GRANT ALL ON TABLE public.payment_plans TO service_role;


--
-- Name: TABLE payment_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_transactions TO anon;
GRANT ALL ON TABLE public.payment_transactions TO authenticated;
GRANT ALL ON TABLE public.payment_transactions TO service_role;


--
-- Name: TABLE payment_webhook_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_webhook_events TO anon;
GRANT ALL ON TABLE public.payment_webhook_events TO authenticated;
GRANT ALL ON TABLE public.payment_webhook_events TO service_role;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.permissions TO anon;
GRANT ALL ON TABLE public.permissions TO authenticated;
GRANT ALL ON TABLE public.permissions TO service_role;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.role_permissions TO anon;
GRANT ALL ON TABLE public.role_permissions TO authenticated;
GRANT ALL ON TABLE public.role_permissions TO service_role;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.roles TO anon;
GRANT ALL ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;


--
-- Name: TABLE search_documents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.search_documents TO anon;
GRANT ALL ON TABLE public.search_documents TO authenticated;
GRANT ALL ON TABLE public.search_documents TO service_role;


--
-- Name: TABLE student_billing_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_billing_accounts TO anon;
GRANT ALL ON TABLE public.student_billing_accounts TO authenticated;
GRANT ALL ON TABLE public.student_billing_accounts TO service_role;


--
-- Name: TABLE student_billing_ledger; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_billing_ledger TO anon;
GRANT ALL ON TABLE public.student_billing_ledger TO authenticated;
GRANT ALL ON TABLE public.student_billing_ledger TO service_role;


--
-- Name: TABLE student_favorites; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_favorites TO anon;
GRANT ALL ON TABLE public.student_favorites TO authenticated;
GRANT ALL ON TABLE public.student_favorites TO service_role;


--
-- Name: TABLE student_homework_progress; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_homework_progress TO anon;
GRANT ALL ON TABLE public.student_homework_progress TO authenticated;
GRANT ALL ON TABLE public.student_homework_progress TO service_role;


--
-- Name: TABLE student_mistakes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_mistakes TO anon;
GRANT ALL ON TABLE public.student_mistakes TO authenticated;
GRANT ALL ON TABLE public.student_mistakes TO service_role;


--
-- Name: TABLE student_payment_reminder_state; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_payment_reminder_state TO anon;
GRANT ALL ON TABLE public.student_payment_reminder_state TO authenticated;
GRANT ALL ON TABLE public.student_payment_reminder_state TO service_role;


--
-- Name: TABLE student_schedule_lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_schedule_lessons TO anon;
GRANT ALL ON TABLE public.student_schedule_lessons TO authenticated;
GRANT ALL ON TABLE public.student_schedule_lessons TO service_role;


--
-- Name: TABLE student_test_answers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_test_answers TO authenticated;
GRANT ALL ON TABLE public.student_test_answers TO service_role;


--
-- Name: TABLE student_word_reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_word_reviews TO anon;
GRANT ALL ON TABLE public.student_word_reviews TO authenticated;
GRANT ALL ON TABLE public.student_word_reviews TO service_role;


--
-- Name: TABLE student_words; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_words TO anon;
GRANT ALL ON TABLE public.student_words TO authenticated;
GRANT ALL ON TABLE public.student_words TO service_role;


--
-- Name: TABLE teacher_dossiers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.teacher_dossiers TO anon;
GRANT ALL ON TABLE public.teacher_dossiers TO authenticated;
GRANT ALL ON TABLE public.teacher_dossiers TO service_role;


--
-- Name: TABLE teacher_student_notes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.teacher_student_notes TO anon;
GRANT ALL ON TABLE public.teacher_student_notes TO authenticated;
GRANT ALL ON TABLE public.teacher_student_notes TO service_role;


--
-- Name: TABLE teachers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.teachers TO anon;
GRANT ALL ON TABLE public.teachers TO authenticated;
GRANT ALL ON TABLE public.teachers TO service_role;


--
-- Name: TABLE test_question_options; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.test_question_options TO anon;
GRANT ALL ON TABLE public.test_question_options TO authenticated;
GRANT ALL ON TABLE public.test_question_options TO service_role;


--
-- Name: TABLE test_questions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.test_questions TO anon;
GRANT ALL ON TABLE public.test_questions TO authenticated;
GRANT ALL ON TABLE public.test_questions TO service_role;


--
-- Name: TABLE tests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tests TO anon;
GRANT ALL ON TABLE public.tests TO authenticated;
GRANT ALL ON TABLE public.tests TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE word_card_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.word_card_items TO anon;
GRANT ALL ON TABLE public.word_card_items TO authenticated;
GRANT ALL ON TABLE public.word_card_items TO service_role;


--
-- Name: TABLE word_card_sets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.word_card_sets TO anon;
GRANT ALL ON TABLE public.word_card_sets TO authenticated;
GRANT ALL ON TABLE public.word_card_sets TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: -
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: -
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: -
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: -
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict 6OdxpYawweYHra1uOT0NUOQfdRC4EoI6z8DzgCRRrqqHvs5zOhJQ586FvUBuT6k
