-- =============================================================================
-- Standalone Test Auth Scaffolding (Test-only fixture)
--
-- This file is NOT part of deployable production migrations.
-- It is used only in standalone/disposable test databases (e.g. CI plain Postgres)
-- where the Supabase GoTrue Auth service is not running.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    instance_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    aud VARCHAR(255) DEFAULT 'authenticated',
    role VARCHAR(255) DEFAULT 'authenticated',
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    raw_app_meta_data JSONB DEFAULT '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Minimal relational shape used by S02; real sessions are provisioned by GoTrue in CI.
ALTER TABLE auth.users ADD COLUMN banned_until timestamptz;
CREATE TABLE auth.sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), not_after timestamptz
);
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
