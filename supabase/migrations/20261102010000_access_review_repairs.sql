-- S02 review repair: property approval is not an implicit role-removal command.
-- Keep the previously reviewed migration intact and repair its named command additively.
CREATE OR REPLACE FUNCTION public.enclavix_review_application(p_application uuid,p_person uuid,p_property uuid,p_approve boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a app.access_applications; actor uuid; m app.memberships; community uuid; active_now boolean;
BEGIN
 SELECT * INTO a FROM app.access_applications WHERE id=p_application;
 actor:=app.require_admin(a.tenant_id,p_reason);
 SELECT * INTO a FROM app.access_applications WHERE id=p_application FOR UPDATE;
 IF a.status<>'pending' THEN RAISE EXCEPTION 'Already reviewed' USING ERRCODE='23505'; END IF;
 IF p_approve IS NULL THEN RAISE EXCEPTION 'Explicit decision required' USING ERRCODE='22023'; END IF;
 IF p_approve THEN
  SELECT community_id INTO community FROM app.properties WHERE tenant_id=a.tenant_id AND id=p_property AND is_active;
  IF community IS NULL OR NOT EXISTS(SELECT 1 FROM app.people WHERE tenant_id=a.tenant_id AND id=p_person AND kind='individual' AND (auth_user_id IS NULL OR auth_user_id=a.applicant_id))
  THEN RAISE EXCEPTION 'Invalid approved relationship' USING ERRCODE='42501'; END IF;
  UPDATE app.people SET auth_user_id=a.applicant_id WHERE tenant_id=a.tenant_id AND id=p_person;
  INSERT INTO app.memberships(tenant_id,person_id,valid_from) VALUES(a.tenant_id,p_person,statement_timestamp()) ON CONFLICT(tenant_id,person_id) DO NOTHING;
  SELECT * INTO m FROM app.memberships WHERE tenant_id=a.tenant_id AND person_id=p_person FOR UPDATE;
  IF m.id=actor THEN RAISE EXCEPTION 'Self approval denied' USING ERRCODE='42501'; END IF;
  active_now:=m.status='active' AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp());
  IF NOT active_now THEN
   -- Reinstatement must not resurrect old staff or future-dated grants.
   UPDATE app.membership_roles SET revoked_at=statement_timestamp() WHERE tenant_id=a.tenant_id AND membership_id=m.id AND revoked_at IS NULL;
   UPDATE app.memberships SET status='active',valid_from=least(valid_from,statement_timestamp()),valid_until=NULL WHERE id=m.id;
  END IF;
  -- Active memberships retain their existing roles and membership expiry.
  -- Add only the resident community scope needed for the approved property.
  IF NOT EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=a.tenant_id AND r.membership_id=m.id AND r.role='resident'
   AND (r.community_id IS NULL OR r.community_id=community) AND r.revoked_at IS NULL
   AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())) THEN
   INSERT INTO app.membership_roles(tenant_id,membership_id,role,community_id,granted_by_membership_id,valid_from)
   VALUES(a.tenant_id,m.id,'resident',community,actor,statement_timestamp());
  END IF;
  IF NOT EXISTS(SELECT 1 FROM app.property_relationships x WHERE x.tenant_id=a.tenant_id AND x.property_id=p_property AND x.person_id=p_person
   AND x.valid_from<=statement_timestamp() AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())) THEN
   INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,valid_from)
   VALUES(a.tenant_id,community,p_property,p_person,'occupant',statement_timestamp());
  END IF;
 END IF;
 UPDATE app.access_applications SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,reviewed_by_membership_id=actor,reason=p_reason WHERE id=a.id;
 PERFORM app.record_access(a.tenant_id,actor,'access.application_reviewed',jsonb_build_object('application_id',a.id,'approved',p_approve,'person_id',p_person,'property_id',p_property,'reason',p_reason));
END $$;

-- A reload/account switch can lose in-memory retry state. Require explicit revocation
-- before issuing a replacement invitation, even when the caller supplies a fresh key.
CREATE OR REPLACE FUNCTION public.enclavix_invite(p_tenant uuid,p_person uuid,p_email text,p_reason text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_admin(p_tenant,p_reason); token text:=gen_random_uuid()::text||gen_random_uuid()::text; i uuid;
BEGIN
 IF NOT app.start_access(p_tenant,actor,'access.invited',jsonb_build_object('person',p_person,'email',lower(btrim(p_email)),'reason',p_reason)) THEN RAISE EXCEPTION 'Invitation already issued; revoke and reissue if token lost' USING ERRCODE='23505'; END IF;
 IF NOT EXISTS(SELECT 1 FROM app.people WHERE tenant_id=p_tenant AND id=p_person AND kind='individual' AND auth_user_id IS NULL)
 THEN RAISE EXCEPTION 'Invalid invitation target' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM app.invitations WHERE tenant_id=p_tenant AND person_id=p_person AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>statement_timestamp())
 THEN RAISE EXCEPTION 'Revoke the active invitation before issuing a replacement' USING ERRCODE='23505'; END IF;
 INSERT INTO app.invitations(tenant_id,person_id,email,token_hash,created_by_membership_id,expires_at)
 VALUES(p_tenant,p_person,lower(btrim(p_email)),encode(sha256(convert_to(token,'UTF8')),'hex'),actor,statement_timestamp()+interval '48 hours') RETURNING id INTO i;
 PERFORM app.record_access(p_tenant,actor,'access.invited',jsonb_build_object('invitation_id',i,'reason',p_reason));
 RETURN token;
END $$;
