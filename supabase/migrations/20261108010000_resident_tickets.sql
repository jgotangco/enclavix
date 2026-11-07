CREATE TABLE app.resident_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  community_id uuid NOT NULL,
  property_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties (tenant_id, community_id, id),
  FOREIGN KEY (tenant_id, requester_id) REFERENCES app.memberships (tenant_id, id)
);
ALTER TABLE app.resident_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.resident_tickets FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX resident_tickets_queue ON app.resident_tickets (tenant_id, community_id, created_at DESC, id DESC);

CREATE FUNCTION public.enclavix_ticket_write(
  p_tenant uuid, p_community uuid, p_property uuid, p_description text,
  p_ticket uuid, p_status text, p_reason text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  actor uuid;
  ticket_id uuid;
  request_id uuid;
  event_name text;
  payload jsonb := jsonb_build_array(p_community, p_property, p_description, p_ticket, p_status, p_reason);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text, 0));
  IF p_ticket IS NULL THEN
    actor := app.member(p_tenant);
    IF actor IS NULL OR NOT app.role_at(p_tenant, 'resident', p_community)
       OR NOT app.property_access(p_tenant, p_property) THEN
      RAISE EXCEPTION 'Ticket submission denied' USING ERRCODE = '42501';
    END IF;
    IF p_status IS NOT NULL OR p_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Unexpected fields' USING ERRCODE = '22023';
    END IF;
    event_name := 'ticket.submit';
  ELSE
    actor := app.require_admin(p_tenant, p_reason);
    IF p_property IS NOT NULL OR p_description IS NOT NULL OR p_status IS NULL
       OR p_status NOT IN ('in_progress', 'resolved') THEN
      RAISE EXCEPTION 'Invalid transition request' USING ERRCODE = '22023';
    END IF;
    event_name := 'ticket.transition';
  END IF;

  IF NOT app.start_access(p_tenant, actor, event_name, payload) THEN
    RETURN (SELECT (result->>'ticket_id')::uuid FROM app.operation_requests
      WHERE tenant_id = p_tenant AND operation = event_name
      AND idempotency_key = current_setting('request.headers')::jsonb->>'idempotency-key');
  END IF;

  IF p_ticket IS NULL THEN
    INSERT INTO app.resident_tickets (tenant_id, community_id, property_id, requester_id, description)
      VALUES (p_tenant, p_community, p_property, actor, btrim(p_description)) RETURNING id INTO ticket_id;
  ELSE
    UPDATE app.resident_tickets SET status = p_status
      WHERE tenant_id = p_tenant AND community_id = p_community AND id = p_ticket
        AND ((status = 'open' AND p_status = 'in_progress')
          OR (status = 'in_progress' AND p_status = 'resolved'))
      RETURNING id INTO ticket_id;
    IF ticket_id IS NULL THEN
      RAISE EXCEPTION 'Ticket unavailable for transition' USING ERRCODE = '22023';
    END IF;
  END IF;

  PERFORM app.record_access(p_tenant, actor, event_name,
    jsonb_build_object('ticket_id', ticket_id, 'status', coalesce(p_status, 'open'), 'reason', p_reason));
  request_id := current_setting('enclavix.operation_id')::uuid;
  UPDATE app.operation_requests SET result = jsonb_build_object('ticket_id', ticket_id)
    WHERE tenant_id = p_tenant AND id = request_id;
  RETURN ticket_id;
END;
$$;

CREATE FUNCTION public.enclavix_ticket_list(p_tenant uuid, p_community uuid)
RETURNS TABLE(id uuid, property_id uuid, description text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT t.id, t.property_id, t.description, t.status, t.created_at
    FROM app.resident_tickets t
    WHERE t.tenant_id = p_tenant AND t.community_id = p_community
      AND (app.role_at(p_tenant, 'association_admin')
        OR (t.requester_id = app.member(p_tenant) AND app.role_at(p_tenant, 'resident', p_community)
          AND app.property_access(p_tenant, t.property_id)))
    ORDER BY t.created_at DESC, t.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_ticket_write(uuid, uuid, uuid, text, uuid, text, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enclavix_ticket_list(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_write(uuid, uuid, uuid, text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_list(uuid, uuid) TO authenticated;
