CREATE TABLE app.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('access','correction','export','deletion')),
  detail text NOT NULL CHECK (length(btrim(detail)) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (tenant_id,requester_id) REFERENCES app.memberships(tenant_id,id)
);
ALTER TABLE app.privacy_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.privacy_requests FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX privacy_request_queue ON app.privacy_requests(tenant_id,created_at DESC,id DESC);

CREATE FUNCTION public.enclavix_privacy_write(p_tenant uuid,p_kind text,p_detail text,p_request uuid,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid;
  item uuid;
  event_name text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
  IF p_request IS NULL THEN
    actor := app.member(p_tenant);
    IF actor IS NULL THEN RAISE EXCEPTION 'Privacy request denied' USING ERRCODE='42501'; END IF;
    IF p_reason IS NOT NULL THEN RAISE EXCEPTION 'Unexpected reason' USING ERRCODE='22023'; END IF;
    event_name := 'privacy.submit';
  ELSE
    actor := app.require_admin(p_tenant,p_reason);
    IF p_kind IS NOT NULL OR p_detail IS NOT NULL THEN
      RAISE EXCEPTION 'Unexpected intake fields' USING ERRCODE='22023';
    END IF;
    event_name := 'privacy.review';
  END IF;
  IF NOT app.start_access(p_tenant,actor,event_name,jsonb_build_array(p_kind,p_detail,p_request,p_reason)) THEN
    RETURN (app.registry_replay(p_tenant,event_name)->>'id')::uuid;
  END IF;
  IF p_request IS NULL THEN
    INSERT INTO app.privacy_requests(tenant_id,requester_id,kind,detail)
      VALUES(p_tenant,actor,p_kind,btrim(p_detail)) RETURNING id INTO item;
  ELSE
    UPDATE app.privacy_requests SET status='reviewing'
      WHERE tenant_id=p_tenant AND id=p_request AND status='pending' RETURNING id INTO item;
    IF item IS NULL THEN RAISE EXCEPTION 'Request unavailable for review' USING ERRCODE='22023'; END IF;
  END IF;
  PERFORM app.finance_finish(p_tenant,actor,event_name,jsonb_build_object('id',item),p_reason);
  RETURN item;
END $$;

CREATE FUNCTION public.enclavix_privacy_list(p_tenant uuid)
RETURNS TABLE(id uuid,kind text,detail text,status text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT r.id,r.kind,r.detail,r.status,r.created_at
  FROM app.privacy_requests r
  WHERE r.tenant_id=p_tenant
    AND (r.requester_id=app.member(p_tenant) OR app.role_at(p_tenant,'association_admin'))
  ORDER BY r.created_at DESC,r.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_privacy_write(uuid,text,text,uuid,text),public.enclavix_privacy_list(uuid)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_privacy_write(uuid,text,text,uuid,text),public.enclavix_privacy_list(uuid)
  TO authenticated;

CREATE TABLE app.privacy_controls (
  tenant_id uuid PRIMARY KEY REFERENCES app.tenants(id),
  document_retention_days integer NOT NULL CHECK (document_retention_days BETWEEN 1 AND 36500),
  legal_hold boolean NOT NULL,
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (tenant_id,updated_by) REFERENCES app.memberships(tenant_id,id)
);
ALTER TABLE app.privacy_controls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.privacy_controls FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.enclavix_privacy_controls(p_tenant uuid,p_days integer,p_hold boolean,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid := app.require_admin(p_tenant,p_reason);
  settings jsonb;
BEGIN
  IF p_days IS NULL OR p_hold IS NULL THEN
    RAISE EXCEPTION 'Explicit retention and hold required' USING ERRCODE='22023';
  END IF;
  IF NOT app.start_access(p_tenant,actor,'privacy.controls',jsonb_build_array(p_days,p_hold,p_reason)) THEN
    RETURN app.registry_replay(p_tenant,'privacy.controls');
  END IF;
  INSERT INTO app.privacy_controls(tenant_id,document_retention_days,legal_hold,updated_by)
    VALUES(p_tenant,p_days,p_hold,actor)
    ON CONFLICT(tenant_id) DO UPDATE SET document_retention_days=excluded.document_retention_days,
      legal_hold=excluded.legal_hold,updated_by=excluded.updated_by,updated_at=clock_timestamp();
  settings := jsonb_build_object('document_retention_days',p_days,'legal_hold',p_hold);
  PERFORM app.finance_finish(p_tenant,actor,'privacy.controls',settings,p_reason);
  RETURN settings;
END $$;

CREATE FUNCTION public.enclavix_privacy_controls_read(p_tenant uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT jsonb_build_object('document_retention_days',document_retention_days,'legal_hold',legal_hold)
    FROM app.privacy_controls WHERE tenant_id=p_tenant AND app.role_at(p_tenant,'association_admin')
$$;
REVOKE ALL ON FUNCTION public.enclavix_privacy_controls(uuid,integer,boolean,text),
  public.enclavix_privacy_controls_read(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_privacy_controls(uuid,integer,boolean,text),
  public.enclavix_privacy_controls_read(uuid) TO authenticated;

-- Extend the existing expiring and audited tenant export with S05 records.
CREATE OR REPLACE FUNCTION app.registry_snapshot(t uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('schema_version',2,'tenant',(SELECT to_jsonb(x) FROM app.tenants x WHERE id=t),
 'communities',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.communities x WHERE tenant_id=t),
 'locations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.locations x WHERE tenant_id=t),
 'properties',(SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('lot_area_sqm',x.lot_area_sqm::text,'floor_area_sqm',x.floor_area_sqm::text,'ownership_share',x.ownership_share::text) ORDER BY id),'[]') FROM app.properties x WHERE tenant_id=t),
 'people',(SELECT coalesce(jsonb_agg(to_jsonb(x)-'auth_user_id' ORDER BY id),'[]') FROM app.people x WHERE tenant_id=t),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.memberships x WHERE tenant_id=t),
 'roles',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.membership_roles x WHERE tenant_id=t),
 'relationships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.property_relationships x WHERE tenant_id=t),
 'assets',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.assets x WHERE tenant_id=t),
 'asset_allocations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.asset_allocations x WHERE tenant_id=t),
 'documents',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'display_name',display_name,'sha256',sha256,'scan_status',scan_status,'audience',audience,'purpose',purpose,'previous_version_id',previous_version_id,'ticket_id',ticket_id) ORDER BY id),'[]') FROM app.document_objects WHERE tenant_id=t),
 'announcements',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.resident_announcements x WHERE tenant_id=t),
 'tickets',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.resident_tickets x WHERE tenant_id=t),
 'privacy_requests',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.privacy_requests x WHERE tenant_id=t),
 'privacy_controls',(SELECT to_jsonb(x) FROM app.privacy_controls x WHERE tenant_id=t),
 'files_included',false,'financial_cutover_included',false)
$$;
