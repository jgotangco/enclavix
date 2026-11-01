-- S01 additive foundation. app is deliberately NOT exposed by PostgREST.
-- Existing public prototype tables remain denied and are not migrated automatically.
CREATE SCHEMA app;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TYPE app.tenant_status AS ENUM ('onboarding', 'active', 'suspended', 'closed');
CREATE TYPE app.community_kind AS ENUM ('village', 'condominium');
CREATE TYPE app.location_kind AS ENUM ('phase', 'block', 'tower', 'floor');
CREATE TYPE app.property_kind AS ENUM ('lot', 'townhouse_unit', 'condominium_unit');
CREATE TYPE app.asset_kind AS ENUM ('parking', 'storage', 'amenity', 'elevator', 'gate');
CREATE TYPE app.person_kind AS ENUM ('individual', 'organization');
CREATE TYPE app.membership_status AS ENUM ('pending', 'active', 'suspended', 'revoked');
CREATE TYPE app.system_role AS ENUM ('association_admin', 'finance_preparer', 'finance_approver', 'guard', 'facilities_staff', 'board_reviewer', 'resident');
CREATE TYPE app.relationship_kind AS ENUM ('owner', 'tenant', 'occupant', 'representative');
CREATE TYPE app.allocation_kind AS ENUM ('ownership', 'use');
CREATE TYPE app.import_status AS ENUM ('staged', 'validated', 'approved', 'committed', 'failed', 'cancelled');
CREATE TYPE app.import_row_status AS ENUM ('pending', 'valid', 'invalid', 'approved', 'applied');
CREATE TYPE app.operation_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE app.delivery_status AS ENUM ('pending', 'processing', 'delivered', 'failed');
CREATE TYPE app.scan_status AS ENUM ('pending', 'quarantined', 'clean', 'rejected');

CREATE TABLE app.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_key text NOT NULL UNIQUE CHECK (tenant_key ~ '^[a-z][a-z0-9-]{2,62}$'),
    legal_name text NOT NULL CHECK (length(btrim(legal_name)) BETWEEN 1 AND 200),
    status app.tenant_status NOT NULL DEFAULT 'onboarding',
    currency text NOT NULL DEFAULT 'PHP' CHECK (currency ~ '^[A-Z]{3}$'),
    time_zone text NOT NULL DEFAULT 'Asia/Manila',
    locale text NOT NULL DEFAULT 'en-PH',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.communities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 80),
    name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
    kind app.community_kind NOT NULL,
    time_zone text NOT NULL DEFAULT 'Asia/Manila',
    structure_labels jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(structure_labels) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, code)
);

CREATE TABLE app.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    community_id uuid NOT NULL,
    parent_location_id uuid,
    kind app.location_kind NOT NULL,
    code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 80),
    label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 200),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, community_id, id),
    UNIQUE (tenant_id, community_id, code),
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id, parent_location_id) REFERENCES app.locations(tenant_id, community_id, id) ON DELETE RESTRICT,
    CHECK (parent_location_id IS NULL OR parent_location_id <> id)
);

CREATE TABLE app.properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    community_id uuid NOT NULL,
    location_id uuid,
    code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 80),
    label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 200),
    kind app.property_kind NOT NULL,
    lot_area_sqm numeric(12,2) CHECK (lot_area_sqm >= 0 AND lot_area_sqm <> 'NaN'::numeric),
    floor_area_sqm numeric(12,2) CHECK (floor_area_sqm >= 0 AND floor_area_sqm <> 'NaN'::numeric),
    ownership_share numeric(12,8) CHECK (ownership_share > 0 AND ownership_share <= 1),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, community_id, id),
    UNIQUE (tenant_id, community_id, code),
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id, location_id) REFERENCES app.locations(tenant_id, community_id, id) ON DELETE RESTRICT
);

CREATE TABLE app.assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    community_id uuid NOT NULL,
    location_id uuid,
    code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 80),
    label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 200),
    kind app.asset_kind NOT NULL,
    capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, community_id, id),
    UNIQUE (tenant_id, community_id, code),
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id, location_id) REFERENCES app.locations(tenant_id, community_id, id) ON DELETE RESTRICT
);

-- Tenant-scoped contact records. Linking an auth identity grants NO access by itself.
CREATE TABLE app.people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    kind app.person_kind NOT NULL DEFAULT 'individual',
    display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 200),
    contact_email text,
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, auth_user_id),
    CHECK (kind = 'individual' OR auth_user_id IS NULL)
);

CREATE TABLE app.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    person_id uuid NOT NULL,
    status app.membership_status NOT NULL DEFAULT 'pending',
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, person_id),
    FOREIGN KEY (tenant_id, person_id) REFERENCES app.people(tenant_id, id) ON DELETE RESTRICT,
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE app.membership_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    role app.system_role NOT NULL,
    community_id uuid,
    granted_by_membership_id uuid,
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, granted_by_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    CHECK (valid_until IS NULL OR valid_until > valid_from),
    CHECK (granted_by_membership_id IS NULL OR granted_by_membership_id <> membership_id)
);

CREATE TABLE app.civic_designations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 100),
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE app.property_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    community_id uuid NOT NULL,
    property_id uuid NOT NULL,
    person_id uuid NOT NULL,
    represented_person_id uuid,
    kind app.relationship_kind NOT NULL,
    is_primary_contact boolean NOT NULL DEFAULT false,
    is_billing_responsible boolean NOT NULL DEFAULT false,
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties(tenant_id, community_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, person_id) REFERENCES app.people(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, represented_person_id) REFERENCES app.people(tenant_id, id) ON DELETE RESTRICT,
    CHECK (valid_until IS NULL OR valid_until > valid_from),
    CHECK ((kind = 'representative') = (represented_person_id IS NOT NULL)),
    CHECK (person_id <> represented_person_id)
);

CREATE TABLE app.asset_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    community_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    property_id uuid NOT NULL,
    kind app.allocation_kind NOT NULL,
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, community_id, asset_id) REFERENCES app.assets(tenant_id, community_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties(tenant_id, community_id, id) ON DELETE RESTRICT,
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE app.import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    community_id uuid,
    created_by_membership_id uuid NOT NULL,
    approved_by_membership_id uuid,
    idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 128),
    source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
    status app.import_status NOT NULL DEFAULT 'staged',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, idempotency_key),
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, created_by_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, approved_by_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE app.import_rows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    row_number integer NOT NULL CHECK (row_number > 0),
    record_kind text NOT NULL CHECK (record_kind IN ('property', 'person', 'membership', 'relationship', 'asset')),
    raw_payload jsonb NOT NULL CHECK (jsonb_typeof(raw_payload) = 'object'),
    validated_payload jsonb CHECK (jsonb_typeof(validated_payload) = 'object'),
    issues jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(issues) = 'array'),
    status app.import_row_status NOT NULL DEFAULT 'pending',
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, batch_id, row_number),
    FOREIGN KEY (tenant_id, batch_id) REFERENCES app.import_batches(tenant_id, id) ON DELETE RESTRICT
);

-- Infrastructure contracts only. No workers or financial posting API are enabled in S01.
CREATE TABLE app.operation_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    actor_membership_id uuid NOT NULL,
    operation text NOT NULL CHECK (operation ~ '^[a-z][a-z0-9_.]{1,99}$'),
    idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 128),
    request_sha256 text NOT NULL CHECK (request_sha256 ~ '^[a-f0-9]{64}$'),
    status app.operation_status NOT NULL DEFAULT 'pending',
    result jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, operation, idempotency_key),
    FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE app.outbox_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    sequence integer NOT NULL CHECK (sequence > 0),
    event_type text NOT NULL CHECK (event_type ~ '^[a-z][a-z0-9_.]{1,99}$'),
    payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
    status app.delivery_status NOT NULL DEFAULT 'pending',
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    available_at timestamptz NOT NULL DEFAULT now(),
    lease_token uuid,
    leased_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, operation_id, sequence),
    FOREIGN KEY (tenant_id, operation_id) REFERENCES app.operation_requests(tenant_id, id) ON DELETE RESTRICT,
    CHECK ((status = 'processing') = (lease_token IS NOT NULL AND leased_until IS NOT NULL)),
    CHECK ((lease_token IS NULL) = (leased_until IS NULL))
);

CREATE TABLE app.document_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    community_id uuid,
    property_id uuid,
    uploaded_by_membership_id uuid NOT NULL,
    storage_bucket text NOT NULL DEFAULT 'tenant-private' CHECK (storage_bucket = 'tenant-private'),
    object_path text GENERATED ALWAYS AS (tenant_id::text || '/' || id::text) STORED NOT NULL,
    display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 255),
    content_type text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    sha256 text CHECK (sha256 ~ '^[a-f0-9]{64}$'),
    scan_status app.scan_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (storage_bucket, object_path),
    FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties(tenant_id, community_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, uploaded_by_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    CHECK (property_id IS NULL OR community_id IS NOT NULL)
);

CREATE TABLE app.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE RESTRICT,
    actor_membership_id uuid NOT NULL,
    operation_id uuid,
    event_type text NOT NULL CHECK (event_type ~ '^[a-z][a-z0-9_.]{1,99}$'),
    outcome text NOT NULL CHECK (outcome IN ('succeeded', 'denied', 'failed')),
    details jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(details) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES app.memberships(tenant_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id, operation_id) REFERENCES app.operation_requests(tenant_id, id) ON DELETE RESTRICT
);

-- No security-definer functions or policy grants. Caller privileges remain authoritative.
CREATE FUNCTION app.validate_time_zone() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    PERFORM CURRENT_TIMESTAMP AT TIME ZONE NEW.time_zone;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tenants_time_zone BEFORE INSERT OR UPDATE ON app.tenants FOR EACH ROW EXECUTE FUNCTION app.validate_time_zone();
CREATE TRIGGER communities_time_zone BEFORE INSERT OR UPDATE ON app.communities FOR EACH ROW EXECUTE FUNCTION app.validate_time_zone();

CREATE FUNCTION app.keep_identity() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE key text;
BEGIN
    FOREACH key IN ARRAY TG_ARGV LOOP
        IF to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key THEN
            RAISE EXCEPTION 'Identity and scope are immutable: %', key USING ERRCODE = '23514';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION app.validate_location() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE community_type app.community_kind; parent_type app.location_kind;
BEGIN
    SELECT kind INTO community_type FROM app.communities WHERE tenant_id = NEW.tenant_id AND id = NEW.community_id;
    IF community_type IS NULL THEN RAISE EXCEPTION 'Unknown scoped community' USING ERRCODE = '23503'; END IF;
    IF (community_type = 'village' AND NEW.kind NOT IN ('phase', 'block')) OR
       (community_type = 'condominium' AND NEW.kind NOT IN ('tower', 'floor')) THEN
        RAISE EXCEPTION 'Location kind does not match community' USING ERRCODE = '23514';
    END IF;
    IF NEW.parent_location_id IS NOT NULL THEN
        SELECT kind INTO parent_type FROM app.locations WHERE tenant_id = NEW.tenant_id AND community_id = NEW.community_id AND id = NEW.parent_location_id;
        IF parent_type IS NULL THEN RAISE EXCEPTION 'Unknown scoped parent' USING ERRCODE = '23503'; END IF;
        IF NOT ((NEW.kind = 'block' AND parent_type = 'phase') OR (NEW.kind = 'floor' AND parent_type = 'tower')) THEN
            RAISE EXCEPTION 'Invalid location hierarchy' USING ERRCODE = '23514';
        END IF;
    ELSIF NEW.kind = 'floor' THEN
        RAISE EXCEPTION 'A floor requires a tower' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER locations_hierarchy BEFORE INSERT ON app.locations FOR EACH ROW EXECUTE FUNCTION app.validate_location();
CREATE TRIGGER locations_identity BEFORE UPDATE ON app.locations FOR EACH ROW EXECUTE FUNCTION app.keep_identity('id', 'tenant_id', 'community_id', 'parent_location_id', 'kind');

CREATE FUNCTION app.validate_property_kind() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE community_type app.community_kind;
BEGIN
    SELECT kind INTO community_type FROM app.communities WHERE tenant_id = NEW.tenant_id AND id = NEW.community_id;
    IF community_type IS NULL THEN RAISE EXCEPTION 'Unknown scoped community' USING ERRCODE = '23503'; END IF;
    IF (community_type = 'condominium') <> (NEW.kind = 'condominium_unit') THEN
        RAISE EXCEPTION 'Property kind does not match community' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER properties_kind BEFORE INSERT OR UPDATE ON app.properties FOR EACH ROW EXECUTE FUNCTION app.validate_property_kind();

CREATE FUNCTION app.keep_audit() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    RAISE EXCEPTION 'Audit events are append only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON app.audit_events FOR EACH ROW EXECUTE FUNCTION app.keep_audit();

-- All tenant-owned rows have immutable scope, RLS, and no client privileges.
DO $$
DECLARE name text;
BEGIN
    FOR name IN SELECT tablename FROM pg_tables WHERE schemaname = 'app' LOOP
        EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', name);
        EXECUTE format('REVOKE ALL ON TABLE app.%I FROM PUBLIC', name);
        IF name NOT IN ('locations', 'audit_events') THEN
            IF name = 'tenants' THEN
                EXECUTE format('CREATE TRIGGER keep_identity BEFORE UPDATE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.keep_identity(''id'')', name);
            ELSIF name = 'communities' THEN
                EXECUTE format('CREATE TRIGGER keep_identity BEFORE UPDATE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.keep_identity(''id'', ''tenant_id'', ''kind'')', name);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'app' AND table_name = name AND column_name = 'community_id') THEN
                EXECUTE format('CREATE TRIGGER keep_identity BEFORE UPDATE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.keep_identity(''id'', ''tenant_id'', ''community_id'')', name);
            ELSE
                EXECUTE format('CREATE TRIGGER keep_identity BEFORE UPDATE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.keep_identity(''id'', ''tenant_id'')', name);
            END IF;
        END IF;
    END LOOP;
    -- Supabase default grants can name these roles explicitly; revoke those too.
    FOR name IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role') LOOP
        EXECUTE format('REVOKE ALL ON SCHEMA app FROM %I', name);
        EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app FROM %I', name);
        EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM %I', name);
    END LOOP;
END;
$$;

CREATE INDEX memberships_person ON app.memberships(tenant_id, person_id);
CREATE INDEX relationships_property ON app.property_relationships(tenant_id, property_id, valid_from);
CREATE INDEX relationships_person ON app.property_relationships(tenant_id, person_id, valid_from);
CREATE INDEX roles_membership ON app.membership_roles(tenant_id, membership_id, valid_from);
CREATE INDEX outbox_pending ON app.outbox_events(tenant_id, available_at) WHERE status IN ('pending', 'processing');
CREATE INDEX audit_by_time ON app.audit_events(tenant_id, created_at, id);
