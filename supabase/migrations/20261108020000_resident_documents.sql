ALTER TABLE app.document_objects
  ADD COLUMN previous_version_id uuid,
  ADD CONSTRAINT document_previous_version FOREIGN KEY (tenant_id, previous_version_id)
    REFERENCES app.document_objects (tenant_id, id);
CREATE UNIQUE INDEX document_single_successor ON app.document_objects (tenant_id, previous_version_id)
  WHERE scan_status <> 'rejected';

CREATE FUNCTION public.enclavix_document_reserve(
  p_tenant uuid, p_community uuid, p_property uuid, p_previous uuid, p_title text,
  p_audience text, p_hash text, p_size integer, p_type text, p_reason text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid := app.require_admin(p_tenant, p_reason);
  doc app.document_objects;
  result jsonb;
BEGIN
  IF p_community IS NULL OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$'
    OR p_size IS NULL OR p_size NOT BETWEEN 1 AND 5242880
    OR p_type IS NULL OR p_type NOT IN ('application/pdf', 'image/png', 'image/jpeg')
    OR p_audience IS NULL OR p_audience NOT IN ('association_admin','property_owners','property_occupants')
    OR (p_property IS NULL AND p_audience <> 'association_admin') THEN
    RAISE EXCEPTION 'Invalid document metadata' USING ERRCODE='22023';
  END IF;
  IF NOT app.start_access(p_tenant, actor, 'document.reserve',
    jsonb_build_array(p_community,p_property,p_previous,p_title,p_audience,p_hash,p_size,p_type,p_reason)) THEN
    RETURN app.registry_replay(p_tenant, 'document.reserve');
  END IF;
  IF p_previous IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.document_objects d WHERE d.tenant_id=p_tenant AND d.id=p_previous
      AND d.community_id=p_community AND d.property_id IS NOT DISTINCT FROM p_property
      AND d.audience=p_audience AND d.purpose='general' AND d.scan_status='clean'
  ) THEN
    RAISE EXCEPTION 'Invalid previous version' USING ERRCODE='22023';
  END IF;
  INSERT INTO app.document_objects (tenant_id,community_id,property_id,previous_version_id,
    uploaded_by_membership_id,display_name,audience,sha256,size_bytes,content_type)
  VALUES (p_tenant,p_community,p_property,p_previous,actor,btrim(p_title),p_audience,p_hash,p_size,p_type)
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
    WHERE tenant_id=p_tenant AND id=p_document AND purpose='general' AND sha256=p_hash FOR UPDATE;
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

CREATE FUNCTION public.enclavix_documents(p_tenant uuid,p_community uuid)
RETURNS TABLE(id uuid, display_name text, previous_version_id uuid, scan_status app.scan_status, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT d.id,d.display_name,d.previous_version_id,d.scan_status,d.created_at
  FROM app.document_objects d
  WHERE d.tenant_id=p_tenant AND d.community_id=p_community AND d.purpose='general'
    AND (app.document_access(d.object_path) OR app.role_at(p_tenant,'association_admin',p_community))
  ORDER BY d.created_at DESC,d.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_document_reserve(uuid,uuid,uuid,uuid,text,text,text,integer,text,text),
  public.enclavix_document_complete(uuid,uuid,text,boolean), public.enclavix_documents(uuid,uuid)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_document_reserve(uuid,uuid,uuid,uuid,text,text,text,integer,text,text),
  public.enclavix_documents(uuid,uuid) TO authenticated;
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
