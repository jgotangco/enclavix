CREATE TABLE app.resident_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  community_id uuid NOT NULL,
  property_id uuid,
  author_id uuid NOT NULL,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 8000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, community_id) REFERENCES app.communities (tenant_id, id),
  FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties (tenant_id, community_id, id),
  FOREIGN KEY (tenant_id, author_id) REFERENCES app.memberships (tenant_id, id),
  CHECK (expires_at > created_at)
);

ALTER TABLE app.resident_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.resident_announcements FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX resident_announcements_feed ON app.resident_announcements (tenant_id, community_id, created_at DESC, id DESC);

CREATE FUNCTION public.enclavix_announcement_publish(
  p_tenant uuid, p_community uuid, p_property uuid, p_title text, p_body text,
  p_expires_at timestamptz, p_reason text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  actor uuid := app.require_admin(p_tenant, p_reason);
  announcement uuid;
  operation_id uuid;
  payload jsonb := jsonb_build_object('community', p_community, 'property', p_property,
    'title', p_title, 'body', p_body, 'expires_at', p_expires_at, 'reason', p_reason);
BEGIN
  IF NOT app.start_access(p_tenant, actor, 'announcement.publish', payload) THEN
    RETURN (SELECT (result->>'announcement_id')::uuid FROM app.operation_requests
      WHERE tenant_id = p_tenant AND operation_requests.operation = 'announcement.publish'
      AND idempotency_key = current_setting('request.headers')::jsonb->>'idempotency-key');
  END IF;

  INSERT INTO app.resident_announcements
    (tenant_id, community_id, property_id, author_id, title, body, expires_at)
    VALUES (p_tenant, p_community, p_property, actor, btrim(p_title), btrim(p_body), p_expires_at)
    RETURNING id INTO announcement;

  PERFORM app.record_access(p_tenant, actor, 'announcement.publish',
    jsonb_build_object('announcement_id', announcement, 'community_id', p_community, 'reason', p_reason));
  operation_id := current_setting('enclavix.operation_id')::uuid;
  UPDATE app.operation_requests SET result = jsonb_build_object('announcement_id', announcement)
    WHERE tenant_id = p_tenant AND id = operation_id;
  RETURN announcement;
END;
$$;

CREATE FUNCTION public.enclavix_announcement_feed(p_tenant uuid, p_community uuid)
RETURNS TABLE(id uuid, title text, body text, property_id uuid, created_at timestamptz, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT a.id, a.title, a.body, a.property_id, a.created_at, a.expires_at
    FROM app.resident_announcements a
    WHERE a.tenant_id = p_tenant AND a.community_id = p_community
      AND a.expires_at > statement_timestamp()
      AND (
        app.role_at(p_tenant, 'association_admin', p_community)
        OR (app.role_at(p_tenant, 'resident', p_community) AND (
          (a.property_id IS NOT NULL AND app.property_access(p_tenant, a.property_id))
          OR (a.property_id IS NULL AND EXISTS (
            SELECT 1 FROM app.properties p
            WHERE p.tenant_id = p_tenant AND p.community_id = p_community
              AND app.property_access(p_tenant, p.id)
          ))
        ))
      )
    ORDER BY a.created_at DESC, a.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_announcement_publish(uuid, uuid, uuid, text, text, timestamptz, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enclavix_announcement_feed(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_announcement_publish(uuid, uuid, uuid, text, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enclavix_announcement_feed(uuid, uuid) TO authenticated;
