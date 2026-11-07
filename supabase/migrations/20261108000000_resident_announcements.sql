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
  publish_at timestamptz NOT NULL DEFAULT '-infinity'::timestamptz,
  previous_id uuid,
  document_id uuid,
  FOREIGN KEY (tenant_id, document_id) REFERENCES app.document_objects (tenant_id,id),
  UNIQUE (tenant_id, previous_id),
  FOREIGN KEY (tenant_id, previous_id) REFERENCES app.resident_announcements (tenant_id,id),
  CHECK (expires_at > publish_at),
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
  p_expires_at timestamptz, p_reason text, p_publish_at timestamptz DEFAULT NULL, p_previous uuid DEFAULT NULL, p_document uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  actor uuid := app.require_admin(p_tenant, p_reason);
  announcement uuid;
  operation_id uuid;
  payload jsonb := jsonb_build_object('community', p_community, 'property', p_property,
    'title', p_title, 'body', p_body, 'expires_at', p_expires_at, 'reason', p_reason, 'publish_at', p_publish_at, 'previous', p_previous, 'document', p_document);
BEGIN
  IF NOT app.start_access(p_tenant, actor, 'announcement.publish', payload) THEN
    RETURN (SELECT (result->>'announcement_id')::uuid FROM app.operation_requests
      WHERE tenant_id = p_tenant AND operation_requests.operation = 'announcement.publish'
      AND idempotency_key = current_setting('request.headers')::jsonb->>'idempotency-key');
  END IF;

  IF p_previous IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.resident_announcements a WHERE a.tenant_id=p_tenant AND a.id=p_previous
      AND a.community_id=p_community AND a.property_id IS NOT DISTINCT FROM p_property
      AND a.publish_at <= coalesce(p_publish_at,statement_timestamp())
  ) THEN RAISE EXCEPTION 'Invalid previous announcement' USING ERRCODE='22023'; END IF;
  IF p_publish_at IS NOT NULL AND (NOT isfinite(p_publish_at) OR p_publish_at < statement_timestamp()) THEN
    RAISE EXCEPTION 'Invalid publication schedule' USING ERRCODE='22023';
  END IF;

  IF p_document IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.document_objects d WHERE d.tenant_id=p_tenant AND d.id=p_document
      AND d.community_id=p_community AND d.property_id IS NOT DISTINCT FROM p_property
      AND d.purpose='general' AND d.scan_status='clean'
  ) THEN RAISE EXCEPTION 'Invalid announcement attachment' USING ERRCODE='22023'; END IF;

  INSERT INTO app.resident_announcements
    (tenant_id, community_id, property_id, author_id, title, body, expires_at, publish_at, previous_id, document_id)
    VALUES (p_tenant, p_community, p_property, actor, btrim(p_title), btrim(p_body), p_expires_at, coalesce(p_publish_at,statement_timestamp()), p_previous, p_document)
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
RETURNS TABLE(id uuid, title text, body text, property_id uuid, created_at timestamptz, expires_at timestamptz, document_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT a.id, a.title, a.body, a.property_id, a.created_at, a.expires_at,
    (SELECT d.id FROM app.document_objects d WHERE d.tenant_id=a.tenant_id AND d.id=a.document_id
      AND app.document_access(d.object_path))
    FROM app.resident_announcements a
    WHERE a.tenant_id = p_tenant AND a.community_id = p_community
      AND a.expires_at > statement_timestamp()
      AND a.publish_at <= statement_timestamp()
      AND NOT EXISTS (SELECT 1 FROM app.resident_announcements successor
        WHERE successor.tenant_id=a.tenant_id AND successor.previous_id=a.id
          AND successor.publish_at <= statement_timestamp())
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

REVOKE ALL ON FUNCTION public.enclavix_announcement_publish(uuid, uuid, uuid, text, text, timestamptz, text, timestamptz, uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enclavix_announcement_feed(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_announcement_publish(uuid, uuid, uuid, text, text, timestamptz, text, timestamptz, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enclavix_announcement_feed(uuid, uuid) TO authenticated;

CREATE TABLE app.announcement_acknowledgments (
  tenant_id uuid NOT NULL,
  announcement_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (tenant_id, announcement_id, membership_id),
  FOREIGN KEY (tenant_id, announcement_id) REFERENCES app.resident_announcements(tenant_id,id),
  FOREIGN KEY (tenant_id, membership_id) REFERENCES app.memberships(tenant_id,id)
);
ALTER TABLE app.announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.announcement_acknowledgments FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.enclavix_announcement_ack(p_tenant uuid,p_community uuid,p_announcement uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
  actor := app.member(p_tenant);
  IF actor IS NULL OR NOT app.role_at(p_tenant,'resident',p_community) OR NOT EXISTS (
    SELECT 1 FROM public.enclavix_announcement_feed(p_tenant,p_community) f WHERE f.id=p_announcement
  ) THEN RAISE EXCEPTION 'Acknowledgment denied' USING ERRCODE='42501'; END IF;
  INSERT INTO app.announcement_acknowledgments(tenant_id,announcement_id,membership_id)
    VALUES(p_tenant,p_announcement,actor) ON CONFLICT DO NOTHING;
  RETURN (SELECT acknowledged_at FROM app.announcement_acknowledgments
    WHERE tenant_id=p_tenant AND announcement_id=p_announcement AND membership_id=actor);
END $$;
REVOKE ALL ON FUNCTION public.enclavix_announcement_ack(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_announcement_ack(uuid,uuid,uuid) TO authenticated;
