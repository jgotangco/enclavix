ALTER TABLE app.resident_tickets ADD UNIQUE (tenant_id,id);
ALTER TABLE app.document_objects DROP CONSTRAINT document_objects_purpose_check;
ALTER TABLE app.document_objects
  ADD COLUMN ticket_id uuid,
  ADD CONSTRAINT document_ticket_fk FOREIGN KEY (tenant_id,ticket_id) REFERENCES app.resident_tickets(tenant_id,id),
  ADD CONSTRAINT document_purpose_check CHECK (purpose IN ('general','payment_proof','ticket_attachment')),
  ADD CONSTRAINT document_ticket_purpose CHECK ((purpose='ticket_attachment') = (ticket_id IS NOT NULL));

CREATE FUNCTION app.ticket_attachment_access(t uuid,ticket uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT EXISTS(SELECT 1 FROM app.resident_tickets r WHERE r.tenant_id=t AND r.id=ticket
    AND (app.role_at(t,'association_admin') OR (r.requester_id=app.member(t)
      AND app.role_at(t,'resident',r.community_id) AND app.property_access(t,r.property_id))))
$$;
REVOKE ALL ON FUNCTION app.ticket_attachment_access(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION app.document_access(path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.document_objects d WHERE d.object_path=path AND d.scan_status='clean' AND d.purpose='general'
 AND (app.role_at(d.tenant_id,'association_admin',d.community_id) OR
 (d.property_id IS NOT NULL AND app.property_access(d.tenant_id,d.property_id) AND
 (d.audience='property_occupants' OR (d.audience='property_owners' AND EXISTS(
 SELECT 1 FROM app.property_relationships x JOIN app.memberships m ON m.tenant_id=x.tenant_id AND m.person_id=x.person_id
 WHERE x.tenant_id=d.tenant_id AND x.property_id=d.property_id AND m.id=app.member(d.tenant_id)
 AND x.valid_from<=statement_timestamp() AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())
 AND (x.kind='owner' OR (x.kind='representative' AND EXISTS(SELECT 1 FROM app.property_relationships o
 WHERE o.tenant_id=x.tenant_id AND o.property_id=x.property_id AND o.person_id=x.represented_person_id AND o.kind='owner'
 AND o.valid_from<=statement_timestamp() AND (o.valid_until IS NULL OR o.valid_until>statement_timestamp())))))))))) OR EXISTS (SELECT 1 FROM app.document_objects d WHERE d.object_path=path
   AND d.purpose='ticket_attachment' AND d.scan_status='clean'
   AND app.ticket_attachment_access(d.tenant_id,d.ticket_id))
$$;

ALTER TABLE app.document_objects
  ADD COLUMN previous_version_id uuid,
  ADD CONSTRAINT document_previous_version FOREIGN KEY (tenant_id, previous_version_id)
    REFERENCES app.document_objects (tenant_id, id);
CREATE UNIQUE INDEX document_single_successor ON app.document_objects (tenant_id, previous_version_id)
  WHERE scan_status <> 'rejected';

CREATE FUNCTION public.enclavix_document_reserve(
  p_tenant uuid, p_community uuid, p_property uuid, p_previous uuid, p_title text,
  p_audience text, p_hash text, p_size integer, p_type text, p_reason text, p_ticket uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid;
  ticket app.resident_tickets;
  doc app.document_objects;
  result jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
  IF p_ticket IS NULL OR app.role_at(p_tenant,'association_admin') THEN
    actor := app.require_admin(p_tenant,p_reason);
  ELSE
    actor := app.member(p_tenant);
    IF actor IS NULL OR NOT app.ticket_attachment_access(p_tenant,p_ticket) THEN
      RAISE EXCEPTION 'Attachment access denied' USING ERRCODE='42501';
    END IF;
  END IF;
  IF p_ticket IS NOT NULL THEN
    SELECT * INTO ticket FROM app.resident_tickets WHERE tenant_id=p_tenant AND id=p_ticket;
    IF ticket.id IS NULL OR ticket.community_id IS DISTINCT FROM p_community
      OR ticket.property_id IS DISTINCT FROM p_property OR p_previous IS NOT NULL
      OR p_audience IS DISTINCT FROM 'association_admin' THEN
      RAISE EXCEPTION 'Invalid attachment scope' USING ERRCODE='22023';
    END IF;
  END IF;
  IF p_community IS NULL OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$'
    OR p_size IS NULL OR p_size NOT BETWEEN 1 AND 5242880
    OR p_type IS NULL OR p_type NOT IN ('application/pdf', 'image/png', 'image/jpeg')
    OR p_audience IS NULL OR p_audience NOT IN ('association_admin','property_owners','property_occupants')
    OR (p_property IS NULL AND p_audience <> 'association_admin') THEN
    RAISE EXCEPTION 'Invalid document metadata' USING ERRCODE='22023';
  END IF;
  IF NOT app.start_access(p_tenant, actor, 'document.reserve',
    jsonb_build_array(p_community,p_property,p_previous,p_title,p_audience,p_hash,p_size,p_type,p_reason,p_ticket)) THEN
    RETURN app.registry_replay(p_tenant, 'document.reserve');
  END IF;
  IF p_previous IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.document_objects d WHERE d.tenant_id=p_tenant AND d.id=p_previous
      AND d.community_id=p_community AND d.property_id IS NOT DISTINCT FROM p_property
      AND d.audience=p_audience AND d.purpose='general' AND d.scan_status='clean'
  ) THEN
    RAISE EXCEPTION 'Invalid previous version' USING ERRCODE='22023';
  END IF;
  IF (SELECT count(*) FROM app.document_objects d WHERE d.tenant_id=p_tenant
      AND d.uploaded_by_membership_id=actor AND d.created_at>statement_timestamp()-interval '1 hour') >= 20 THEN
    RAISE EXCEPTION 'Upload limit reached' USING ERRCODE='23514';
  END IF;
  INSERT INTO app.document_objects (tenant_id,community_id,property_id,previous_version_id,
    uploaded_by_membership_id,display_name,audience,sha256,size_bytes,content_type,ticket_id,purpose)
  VALUES (p_tenant,p_community,p_property,p_previous,actor,btrim(p_title),p_audience,p_hash,p_size,p_type,p_ticket,
    CASE WHEN p_ticket IS NULL THEN 'general' ELSE 'ticket_attachment' END)
  RETURNING * INTO doc;
  result := jsonb_build_object('id',doc.id,'object_path',doc.object_path);
  PERFORM app.finance_finish(p_tenant,actor,'document.reserve',result,p_reason);
  RETURN result;
END $$;

CREATE FUNCTION public.enclavix_document_complete(p_tenant uuid,p_document uuid,p_hash text,p_clean boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  doc app.document_objects;
BEGIN
  SELECT * INTO doc FROM app.document_objects
    WHERE tenant_id=p_tenant AND id=p_document AND purpose IN ('general','ticket_attachment') AND sha256=p_hash FOR UPDATE;
  IF doc.id IS NULL OR p_clean IS NULL OR doc.scan_status NOT IN ('pending','clean') THEN
    RETURN false;
  END IF;
  IF doc.scan_status='clean' AND p_clean THEN RETURN true; END IF;
  UPDATE app.document_objects SET scan_status=CASE WHEN p_clean THEN 'clean'::app.scan_status ELSE 'rejected'::app.scan_status END
    WHERE tenant_id=p_tenant AND id=p_document;
  INSERT INTO app.audit_events(tenant_id,actor_membership_id,event_type,outcome,details)
    VALUES(p_tenant,doc.uploaded_by_membership_id,'document.scan','succeeded',
      jsonb_build_object('document_id',p_document,'clean',p_clean));
  RETURN p_clean;
END $$;

CREATE FUNCTION public.enclavix_documents(p_tenant uuid,p_community uuid,p_ticket uuid DEFAULT NULL)
RETURNS TABLE(id uuid, display_name text, previous_version_id uuid, scan_status app.scan_status, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT d.id,d.display_name,d.previous_version_id,d.scan_status,d.created_at
  FROM app.document_objects d
  WHERE d.tenant_id=p_tenant AND d.community_id=p_community AND (
      (p_ticket IS NULL AND d.purpose='general'
        AND (app.document_access(d.object_path) OR app.role_at(p_tenant,'association_admin',p_community)))
      OR (p_ticket IS NOT NULL AND d.ticket_id=p_ticket AND app.ticket_attachment_access(p_tenant,p_ticket)
        AND (d.scan_status='clean' OR d.uploaded_by_membership_id=app.member(p_tenant)))
    )
  ORDER BY d.created_at DESC,d.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_document_reserve(uuid,uuid,uuid,uuid,text,text,text,integer,text,text,uuid),
  public.enclavix_document_complete(uuid,uuid,text,boolean), public.enclavix_documents(uuid,uuid,uuid)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_document_reserve(uuid,uuid,uuid,uuid,text,text,text,integer,text,text,uuid),
  public.enclavix_documents(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enclavix_document_complete(uuid,uuid,text,boolean) TO service_role;

CREATE FUNCTION public.enclavix_document_release(p_tenant uuid,p_document uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid := app.member(p_tenant);
BEGIN
  IF actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM app.document_objects d WHERE d.tenant_id=p_tenant AND d.id=p_document
      AND app.document_access(d.object_path)
  ) THEN RETURN false; END IF;
  INSERT INTO app.audit_events(tenant_id,actor_membership_id,event_type,outcome,details)
    VALUES(p_tenant,actor,'document.download','succeeded',jsonb_build_object('document_id',p_document));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.enclavix_document_release(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_document_release(uuid,uuid) TO authenticated;
