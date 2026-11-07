CREATE TABLE app.resident_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  community_id uuid NOT NULL,
  property_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  assignee_id uuid,
  escalated_at timestamptz,
  response_due_at timestamptz,
  FOREIGN KEY (tenant_id, assignee_id) REFERENCES app.memberships (tenant_id, id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (tenant_id, community_id, property_id) REFERENCES app.properties (tenant_id, community_id, id),
  FOREIGN KEY (tenant_id, requester_id) REFERENCES app.memberships (tenant_id, id)
);
ALTER TABLE app.resident_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.resident_tickets FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX resident_tickets_queue ON app.resident_tickets (tenant_id, community_id, created_at DESC, id DESC);

CREATE FUNCTION public.enclavix_ticket_write(
  p_tenant uuid, p_community uuid, p_property uuid, p_description text,
  p_ticket uuid, p_status text, p_reason text, p_assignee uuid DEFAULT NULL, p_due timestamptz DEFAULT NULL, p_evidence uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  actor uuid;
  ticket_id uuid;
  request_id uuid;
  event_name text;
  payload jsonb := jsonb_build_array(p_community, p_property, p_description, p_ticket, p_status, p_reason, p_assignee, p_due, p_evidence);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text, 0));
  IF p_ticket IS NULL THEN
    actor := app.member(p_tenant);
    IF actor IS NULL OR NOT app.role_at(p_tenant, 'resident', p_community)
       OR NOT app.property_access(p_tenant, p_property) THEN
      RAISE EXCEPTION 'Ticket submission denied' USING ERRCODE = '42501';
    END IF;
    IF p_status IS NOT NULL OR p_reason IS NOT NULL OR p_assignee IS NOT NULL OR p_due IS NOT NULL OR p_evidence IS NOT NULL THEN
      RAISE EXCEPTION 'Unexpected fields' USING ERRCODE = '22023';
    END IF;
    event_name := 'ticket.submit';
  ELSE
    actor := app.require_admin(p_tenant, p_reason);
    IF p_property IS NOT NULL OR p_description IS NOT NULL OR p_status IS NULL
       OR p_status NOT IN ('in_progress', 'resolved', 'assign_self', 'assign', 'set_due', 'escalate', 'reopen') THEN
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
    IF (p_status = 'assign') <> (p_assignee IS NOT NULL)
      OR (p_status = 'set_due') <> (p_due IS NOT NULL)
      OR (p_due IS NOT NULL AND (NOT isfinite(p_due) OR p_due <= statement_timestamp())) THEN
      RAISE EXCEPTION 'Invalid routing fields' USING ERRCODE='22023';
    END IF;
    IF p_assignee IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM app.memberships m JOIN app.membership_roles r
        ON r.tenant_id=m.tenant_id AND r.membership_id=m.id
      WHERE m.tenant_id=p_tenant AND m.id=p_assignee AND m.status='active'
        AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
        AND r.role='association_admin' AND r.community_id IS NULL AND r.revoked_at IS NULL
        AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())
    ) THEN RAISE EXCEPTION 'Assignee must be an active association administrator' USING ERRCODE='22023'; END IF;
    IF p_evidence IS NOT NULL AND (p_status <> 'resolved' OR NOT EXISTS (
      SELECT 1 FROM app.document_objects d WHERE d.tenant_id=p_tenant AND d.ticket_id=p_ticket
        AND d.id=p_evidence AND d.purpose='ticket_attachment' AND d.scan_status='clean'
    )) THEN RAISE EXCEPTION 'Closure evidence must be a clean attachment on this ticket' USING ERRCODE='22023'; END IF;
    UPDATE app.resident_tickets
      SET status = CASE p_status WHEN 'reopen' THEN 'open'
        WHEN 'assign_self' THEN status WHEN 'assign' THEN status WHEN 'set_due' THEN status WHEN 'escalate' THEN status ELSE p_status END,
        assignee_id = CASE p_status WHEN 'assign_self' THEN actor WHEN 'assign' THEN p_assignee ELSE assignee_id END,
        response_due_at = CASE WHEN p_status = 'set_due' THEN p_due ELSE response_due_at END,
        escalated_at = CASE WHEN p_status = 'escalate' THEN clock_timestamp() ELSE escalated_at END
      WHERE tenant_id = p_tenant AND community_id = p_community AND id = p_ticket
        AND ((status = 'open' AND p_status = 'in_progress')
          OR (status = 'in_progress' AND p_status = 'resolved')
          OR (status = 'resolved' AND p_status = 'reopen')
          OR (status <> 'resolved' AND p_status = 'assign_self' AND assignee_id IS DISTINCT FROM actor)
          OR (status <> 'resolved' AND p_status = 'assign' AND assignee_id IS DISTINCT FROM p_assignee)
          OR (status <> 'resolved' AND p_status = 'set_due' AND response_due_at IS DISTINCT FROM p_due)
          OR (status <> 'resolved' AND p_status = 'escalate' AND escalated_at IS NULL))
      RETURNING id INTO ticket_id;
    IF ticket_id IS NULL THEN
      RAISE EXCEPTION 'Ticket unavailable for transition' USING ERRCODE = '22023';
    END IF;
  END IF;

  PERFORM app.record_access(p_tenant, actor, event_name,
    jsonb_build_object('ticket_id', ticket_id, 'status', coalesce(p_status, 'open'), 'reason', p_reason, 'assignee_id', p_assignee, 'response_due_at', p_due, 'closure_document_id', p_evidence));
  request_id := current_setting('enclavix.operation_id')::uuid;
  UPDATE app.operation_requests SET result = jsonb_build_object('ticket_id', ticket_id)
    WHERE tenant_id = p_tenant AND id = request_id;
  RETURN ticket_id;
END;
$$;

CREATE INDEX resident_ticket_history ON app.audit_events (tenant_id, (details->>'ticket_id'), created_at)
  WHERE event_type IN ('ticket.submit', 'ticket.transition');

CREATE FUNCTION public.enclavix_ticket_list(p_tenant uuid, p_community uuid)
RETURNS TABLE(id uuid, property_id uuid, description text, status text, created_at timestamptz, assigned boolean, escalated boolean, response_due_at timestamptz, history jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT t.id, t.property_id, t.description, t.status, t.created_at, t.assignee_id IS NOT NULL, t.escalated_at IS NOT NULL, t.response_due_at,
      coalesce((SELECT jsonb_agg(jsonb_build_object('action', a.details->>'status', 'at', a.created_at)
        ORDER BY a.created_at, a.id)
        FROM app.audit_events a
        WHERE a.tenant_id = t.tenant_id AND a.event_type IN ('ticket.submit', 'ticket.transition')
          AND a.details->>'ticket_id' = t.id::text), '[]'::jsonb)
    FROM app.resident_tickets t
    WHERE t.tenant_id = p_tenant AND t.community_id = p_community
      AND (app.role_at(p_tenant, 'association_admin')
        OR (t.requester_id = app.member(p_tenant) AND app.role_at(p_tenant, 'resident', p_community)
          AND app.property_access(p_tenant, t.property_id)))
    ORDER BY t.created_at DESC, t.id DESC LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.enclavix_ticket_write(uuid, uuid, uuid, text, uuid, text, text, uuid, timestamptz, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enclavix_ticket_list(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_write(uuid, uuid, uuid, text, uuid, text, text, uuid, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_list(uuid, uuid) TO authenticated;

CREATE FUNCTION public.enclavix_ticket_assignees(p_tenant uuid)
RETURNS TABLE(id uuid,name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT m.id,p.display_name FROM app.memberships m
    JOIN app.people p ON p.tenant_id=m.tenant_id AND p.id=m.person_id
    WHERE m.tenant_id=p_tenant AND app.role_at(p_tenant,'association_admin')
      AND m.status='active' AND m.valid_from<=statement_timestamp()
      AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
      AND EXISTS (SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=m.tenant_id AND r.membership_id=m.id
        AND r.role='association_admin' AND r.community_id IS NULL AND r.revoked_at IS NULL
        AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp()))
    ORDER BY p.display_name,m.id LIMIT 100;
$$;
REVOKE ALL ON FUNCTION public.enclavix_ticket_assignees(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_assignees(uuid) TO authenticated;
