ALTER TABLE app.memberships ADD COLUMN ticket_notifications boolean NOT NULL DEFAULT true;

CREATE FUNCTION app.enqueue_ticket_notification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.event_type <> 'ticket.transition' OR NEW.operation_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO app.outbox_events(tenant_id,operation_id,sequence,event_type,payload)
    SELECT t.tenant_id,NEW.operation_id,1,'ticket.inbox',
      jsonb_build_object('ticket_id',t.id,'recipient_id',t.requester_id)
    FROM app.resident_tickets t JOIN app.memberships m
      ON m.tenant_id=t.tenant_id AND m.id=t.requester_id
    WHERE t.tenant_id=NEW.tenant_id AND t.id=(NEW.details->>'ticket_id')::uuid
      AND m.ticket_notifications;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app.enqueue_ticket_notification() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER ticket_notification_outbox AFTER INSERT ON app.audit_events
  FOR EACH ROW WHEN (NEW.event_type='ticket.transition')
  EXECUTE FUNCTION app.enqueue_ticket_notification();

CREATE INDEX ticket_outbox_recipient ON app.outbox_events(tenant_id,(payload->>'recipient_id'),created_at DESC,id DESC)
  WHERE event_type='ticket.inbox';

CREATE FUNCTION public.enclavix_ticket_inbox(p_tenant uuid,p_community uuid,p_preference boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE
  actor uuid;
  enabled boolean;
  items jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
  actor := app.member(p_tenant);
  IF actor IS NULL OR NOT app.role_at(p_tenant,'resident',p_community) THEN
    RAISE EXCEPTION 'Inbox access denied' USING ERRCODE='42501';
  END IF;
  IF p_preference IS NOT NULL THEN
    UPDATE app.memberships SET ticket_notifications=p_preference WHERE tenant_id=p_tenant AND id=actor;
  END IF;
  SELECT ticket_notifications INTO enabled FROM app.memberships WHERE tenant_id=p_tenant AND id=actor;
  IF enabled THEN
    UPDATE app.outbox_events o SET status='delivered', attempts=o.attempts+1
      FROM app.resident_tickets t
      WHERE o.tenant_id=p_tenant AND o.event_type='ticket.inbox' AND o.status='pending'
        AND o.payload->>'recipient_id'=actor::text AND o.available_at<=statement_timestamp()
        AND t.tenant_id=p_tenant AND t.id=(o.payload->>'ticket_id')::uuid
        AND t.community_id=p_community AND t.requester_id=actor AND app.property_access(p_tenant,t.property_id);
  END IF;
  SELECT coalesce(jsonb_agg(item ORDER BY created_at DESC,id DESC),'[]'::jsonb) INTO items FROM (
    SELECT o.id,o.created_at,jsonb_build_object('id',o.id,'at',o.created_at,'ticket_id',t.id) AS item
      FROM app.outbox_events o JOIN app.resident_tickets t
        ON t.tenant_id=o.tenant_id AND t.id=(o.payload->>'ticket_id')::uuid
      WHERE o.tenant_id=p_tenant AND o.event_type='ticket.inbox' AND o.status='delivered'
        AND o.payload->>'recipient_id'=actor::text AND t.community_id=p_community
        AND t.requester_id=actor AND app.property_access(p_tenant,t.property_id)
      ORDER BY o.created_at DESC,o.id DESC LIMIT 100
  ) visible;
  RETURN jsonb_build_object('enabled',enabled,'items',items);
END $$;
REVOKE ALL ON FUNCTION public.enclavix_ticket_inbox(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_ticket_inbox(uuid,uuid,boolean) TO authenticated;
