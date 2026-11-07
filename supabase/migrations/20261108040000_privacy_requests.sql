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
