-- S02: JWTs enter only through the provider-verifying Data API. No client DB logins.
-- This NOLOGIN/NOBYPASSRLS role owns read RPCs, never application tables.
CREATE ROLE enclavix_reader NOLOGIN NOINHERIT NOBYPASSRLS;
GRANT enclavix_reader TO postgres; -- migration owner only; never API/client roles
GRANT USAGE ON SCHEMA public, app TO enclavix_reader;
GRANT CREATE ON SCHEMA public TO enclavix_reader; -- temporary for function ownership transfer
GRANT SELECT ON ALL TABLES IN SCHEMA app TO enclavix_reader;

ALTER TABLE app.membership_roles ADD COLUMN revoked_at timestamptz;
ALTER TABLE app.document_objects ADD COLUMN audience text NOT NULL DEFAULT 'association_admin' CHECK(audience IN ('association_admin','property_owners','property_occupants'));

CREATE TABLE app.access_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 applicant_id uuid NOT NULL REFERENCES auth.users(id),
 display_name text NOT NULL CHECK(length(btrim(display_name)) BETWEEN 1 AND 200),
 requested_property text NOT NULL CHECK(length(btrim(requested_property)) BETWEEN 1 AND 200),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reviewed_by_membership_id uuid,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,reviewed_by_membership_id) REFERENCES app.memberships(tenant_id,id)
);
CREATE UNIQUE INDEX one_pending_application ON app.access_applications(tenant_id,applicant_id) WHERE status='pending';
CREATE TABLE app.invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 person_id uuid NOT NULL,
 email text NOT NULL CHECK(length(email) BETWEEN 3 AND 254 AND email=lower(btrim(email))),
 token_hash text NOT NULL UNIQUE,
 created_by_membership_id uuid NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at > created_at),
 accepted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(tenant_id,person_id) REFERENCES app.people(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES app.memberships(tenant_id,id)
);
CREATE TABLE app.platform_operators (
 auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id),
 enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE app.support_access (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 operator_id uuid NOT NULL REFERENCES app.platform_operators(auth_user_id),
 approved_by_membership_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
 starts_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 FOREIGN KEY(tenant_id,approved_by_membership_id) REFERENCES app.memberships(tenant_id,id),
 CHECK(expires_at > starts_at AND expires_at <= starts_at + interval '1 hour')
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['access_applications','invitations','platform_operators','support_access'] LOOP
 EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC, anon, authenticated, service_role',t);
 END LOOP;
END $$;

-- Narrow SECURITY DEFINER helpers inspect protected Auth/app records. Fixed search paths.
-- Claims are not a user supplied API payload: PostgREST sets them after JWT verification.
CREATE FUNCTION app.principal() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE c jsonb := coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb; u uuid;
BEGIN
 IF coalesce(c->>'role','') <> 'authenticated' OR c->>'session_id' IS NULL OR c->>'sub' IS NULL
    OR coalesce((c->>'exp')::numeric,0) <= extract(epoch FROM statement_timestamp()) THEN RETURN NULL; END IF;
 SELECT a.id INTO u FROM auth.users a JOIN auth.sessions s ON s.user_id=a.id
 WHERE a.id=(c->>'sub')::uuid AND s.id=(c->>'session_id')::uuid
 AND a.email_confirmed_at IS NOT NULL AND (a.banned_until IS NULL OR a.banned_until <= statement_timestamp())
 AND s.created_at > statement_timestamp()-interval '8 hours'
 AND (s.not_after IS NULL OR s.not_after > statement_timestamp());
 RETURN u;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN NULL;
END $$;
CREATE FUNCTION app.assured() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT app.principal() IS NOT NULL AND
 coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'aal','')='aal2'
 AND EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid
 AND created_at > statement_timestamp()-interval '1 hour')
$$;
CREATE FUNCTION app.member(t uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT m.id FROM app.memberships m JOIN app.people p ON (p.tenant_id,p.id)=(m.tenant_id,m.person_id)
 JOIN app.tenants a ON a.id=m.tenant_id
 WHERE m.tenant_id=t AND p.auth_user_id=app.principal() AND m.status='active' AND a.status='active'
 AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
 AND (NOT EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=t AND r.membership_id=m.id AND r.role<>'resident'
 AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())) OR app.assured())
 AND (NOT EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=t AND r.membership_id=m.id AND r.role='guard'
 AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp()))
 OR EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid
 AND created_at>statement_timestamp()-interval '30 minutes'))
$$;
CREATE FUNCTION app.role_at(t uuid, r app.system_role, c uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.membership_roles x WHERE x.tenant_id=t AND x.membership_id=app.member(t) AND x.role=r
 AND x.revoked_at IS NULL AND (x.community_id IS NULL OR x.community_id=c) AND x.valid_from<=statement_timestamp()
 AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp()))
$$;
CREATE FUNCTION app.property_access(t uuid, p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.properties q WHERE q.tenant_id=t AND q.id=p AND q.is_active AND
 (app.role_at(t,'association_admin',q.community_id) OR (app.role_at(t,'resident',q.community_id) AND EXISTS(
 SELECT 1 FROM app.property_relationships x JOIN app.memberships m ON m.tenant_id=x.tenant_id AND m.person_id=x.person_id
 WHERE x.tenant_id=t AND x.property_id=p AND m.id=app.member(t) AND x.valid_from<=statement_timestamp()
 AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())))))
$$;
CREATE FUNCTION app.supports(t uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT app.assured() AND EXISTS(SELECT 1 FROM app.support_access s JOIN app.platform_operators o ON o.auth_user_id=s.operator_id
 JOIN app.memberships m ON (m.tenant_id,m.id)=(s.tenant_id,s.approved_by_membership_id)
 JOIN app.tenants a ON a.id=s.tenant_id
 WHERE s.tenant_id=t AND s.operator_id=app.principal() AND o.enabled AND s.revoked_at IS NULL
 AND s.starts_at<=statement_timestamp() AND s.expires_at>statement_timestamp() AND a.status='active'
 AND m.status='active' AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
 AND EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=t AND r.membership_id=m.id AND r.role='association_admin'
 AND r.community_id IS NULL AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())))
$$;
CREATE FUNCTION app.document_access(path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.document_objects d WHERE d.object_path=path AND d.scan_status='clean'
 AND (app.role_at(d.tenant_id,'association_admin',d.community_id) OR
 (d.property_id IS NOT NULL AND app.property_access(d.tenant_id,d.property_id) AND
 (d.audience='property_occupants' OR (d.audience='property_owners' AND EXISTS(
 SELECT 1 FROM app.property_relationships x JOIN app.memberships m ON m.tenant_id=x.tenant_id AND m.person_id=x.person_id
 WHERE x.tenant_id=d.tenant_id AND x.property_id=d.property_id AND m.id=app.member(d.tenant_id)
 AND x.valid_from<=statement_timestamp() AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())
 AND (x.kind='owner' OR (x.kind='representative' AND EXISTS(SELECT 1 FROM app.property_relationships o
 WHERE o.tenant_id=x.tenant_id AND o.property_id=x.property_id AND o.person_id=x.represented_person_id AND o.kind='owner'
 AND o.valid_from<=statement_timestamp() AND (o.valid_until IS NULL OR o.valid_until>statement_timestamp()))))))))))
$$;

CREATE POLICY tenant_read ON app.tenants FOR SELECT TO enclavix_reader USING(app.member(id) IS NOT NULL OR app.supports(id));
CREATE POLICY community_read ON app.communities FOR SELECT TO enclavix_reader USING(app.member(tenant_id) IS NOT NULL OR app.supports(tenant_id));
CREATE POLICY property_read ON app.properties FOR SELECT TO enclavix_reader USING(app.property_access(tenant_id,id));
CREATE POLICY membership_read ON app.memberships FOR SELECT TO enclavix_reader USING(id=app.member(tenant_id));
CREATE POLICY roles_read ON app.membership_roles FOR SELECT TO enclavix_reader USING(membership_id=app.member(tenant_id) AND revoked_at IS NULL AND valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp()));
-- All other app tables still have no client/read-gateway policy.
GRANT EXECUTE ON FUNCTION app.principal(), app.assured(), app.member(uuid),app.role_at(uuid,app.system_role,uuid),app.property_access(uuid,uuid),app.supports(uuid) TO enclavix_reader;

CREATE FUNCTION public.enclavix_contexts() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('tenant_id',t.id,'name',t.legal_name,'membership_id',app.member(t.id),
 'support_only',app.member(t.id) IS NULL,'communities',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'kind',c.kind)),'[]') FROM app.communities c WHERE c.tenant_id=t.id),
 'roles',(SELECT coalesce(jsonb_agg(jsonb_build_object('role',r.role,'community_id',r.community_id)),'[]') FROM app.membership_roles r WHERE r.tenant_id=t.id))), '[]') FROM app.tenants t
$$;
ALTER FUNCTION public.enclavix_contexts() OWNER TO enclavix_reader;
CREATE FUNCTION public.enclavix_properties(p_tenant uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'tenant_id',tenant_id,'community_id',community_id,'code',code,'label',label,'kind',kind)),'[]') FROM app.properties WHERE tenant_id=p_tenant
$$;
ALTER FUNCTION public.enclavix_properties(uuid) OWNER TO enclavix_reader;

-- Audited named commands. No general table writer or user-controlled actor/claims.
CREATE FUNCTION app.require_admin(t uuid, reason text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(t::text,0));
 actor:=app.member(t);
 IF actor IS NULL OR NOT app.role_at(t,'association_admin') OR NOT app.assured() OR reason IS NULL OR length(btrim(reason)) NOT BETWEEN 10 AND 1000
 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid AND created_at>statement_timestamp()-interval '10 minutes')
 THEN RAISE EXCEPTION 'Not authorized; recent MFA sign-in and reason required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
CREATE FUNCTION app.record_access(t uuid, actor uuid, event text, details jsonb) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 INSERT INTO app.audit_events(tenant_id,actor_membership_id,event_type,outcome,details) VALUES(t,actor,event,'succeeded',details)
$$;
CREATE FUNCTION public.enclavix_apply(p_tenant uuid,p_name text,p_property text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=app.principal(); result uuid;
BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM app.tenants WHERE id=p_tenant AND status='active') THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 INSERT INTO app.access_applications(tenant_id,applicant_id,display_name,requested_property) VALUES(p_tenant,u,p_name,p_property) RETURNING id INTO result;
 RETURN result;
END $$;
CREATE FUNCTION public.enclavix_applications(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT app.role_at(p_tenant,'association_admin') THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'display_name',display_name,'requested_property',requested_property,'status',status)),'[]') FROM app.access_applications WHERE tenant_id=p_tenant AND status='pending');
END $$;
CREATE FUNCTION public.enclavix_review_application(p_application uuid,p_person uuid,p_property uuid,p_approve boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a app.access_applications; actor uuid; m uuid;
BEGIN
 SELECT * INTO a FROM app.access_applications WHERE id=p_application;
 actor:=app.require_admin(a.tenant_id,p_reason);
 SELECT * INTO a FROM app.access_applications WHERE id=p_application FOR UPDATE;
 IF a.status<>'pending' THEN RAISE EXCEPTION 'Already reviewed' USING ERRCODE='23505'; END IF;
 IF p_approve THEN
  IF NOT EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=a.tenant_id AND id=p_property AND is_active)
  OR NOT EXISTS(SELECT 1 FROM app.people WHERE tenant_id=a.tenant_id AND id=p_person AND kind='individual' AND (auth_user_id IS NULL OR auth_user_id=a.applicant_id))
  THEN RAISE EXCEPTION 'Invalid approved relationship' USING ERRCODE='42501'; END IF;
  UPDATE app.people SET auth_user_id=a.applicant_id WHERE tenant_id=a.tenant_id AND id=p_person;
  INSERT INTO app.memberships(tenant_id,person_id,valid_from) VALUES(a.tenant_id,p_person,statement_timestamp()) ON CONFLICT(tenant_id,person_id) DO NOTHING;
  SELECT id INTO m FROM app.memberships WHERE tenant_id=a.tenant_id AND person_id=p_person FOR UPDATE;
  IF m=actor THEN RAISE EXCEPTION 'Self approval denied' USING ERRCODE='42501'; END IF;
  UPDATE app.membership_roles SET revoked_at=statement_timestamp() WHERE tenant_id=a.tenant_id AND membership_id=m AND revoked_at IS NULL;
  UPDATE app.memberships SET status='active',valid_from=least(valid_from,statement_timestamp()),valid_until=NULL WHERE id=m;
  INSERT INTO app.membership_roles(tenant_id,membership_id,role,granted_by_membership_id,valid_from) VALUES(a.tenant_id,m,'resident',actor,statement_timestamp());
  INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,valid_from)
  SELECT a.tenant_id,community_id,id,p_person,'occupant',statement_timestamp() FROM app.properties WHERE id=p_property AND tenant_id=a.tenant_id;
 END IF;
 UPDATE app.access_applications SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,reviewed_by_membership_id=actor,reason=p_reason WHERE id=a.id;
 PERFORM app.record_access(a.tenant_id,actor,'access.application_reviewed',jsonb_build_object('application_id',a.id,'approved',p_approve,'reason',p_reason));
END $$;
CREATE FUNCTION public.enclavix_invite(p_tenant uuid,p_person uuid,p_email text,p_reason text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_admin(p_tenant,p_reason); token text:=gen_random_uuid()::text||gen_random_uuid()::text; i uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM app.people WHERE tenant_id=p_tenant AND id=p_person AND kind='individual' AND auth_user_id IS NULL)
 THEN RAISE EXCEPTION 'Invalid invitation target' USING ERRCODE='42501'; END IF;
 INSERT INTO app.invitations(tenant_id,person_id,email,token_hash,created_by_membership_id,expires_at)
 VALUES(p_tenant,p_person,lower(btrim(p_email)),encode(sha256(convert_to(token,'UTF8')),'hex'),actor,statement_timestamp()+interval '48 hours') RETURNING id INTO i;
 PERFORM app.record_access(p_tenant,actor,'access.invited',jsonb_build_object('invitation_id',i,'reason',p_reason));
 RETURN token;
END $$;
CREATE FUNCTION public.enclavix_accept_invitation(p_token text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=app.principal(); i app.invitations; m uuid;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO i FROM app.invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(i.tenant_id::text,0));
 SELECT * INTO i FROM app.invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 IF i.id IS NULL OR i.accepted_at IS NOT NULL OR i.revoked_at IS NOT NULL OR i.expires_at<=statement_timestamp()
 OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u AND lower(email)=i.email)
 OR NOT EXISTS(SELECT 1 FROM app.tenants WHERE id=i.tenant_id AND status='active')
 OR NOT EXISTS(SELECT 1 FROM app.memberships m JOIN app.membership_roles r ON (r.tenant_id,r.membership_id)=(m.tenant_id,m.id)
 WHERE m.id=i.created_by_membership_id AND m.tenant_id=i.tenant_id AND m.status='active' AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
 AND r.role='association_admin' AND r.community_id IS NULL AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp()))
 THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501'; END IF;
 UPDATE app.people SET auth_user_id=u WHERE tenant_id=i.tenant_id AND id=i.person_id AND auth_user_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Already bound' USING ERRCODE='42501'; END IF;
 INSERT INTO app.memberships(tenant_id,person_id,status,valid_from) VALUES(i.tenant_id,i.person_id,'active',statement_timestamp())
 ON CONFLICT(tenant_id,person_id) DO UPDATE SET status='active',valid_from=least(app.memberships.valid_from,statement_timestamp()),valid_until=NULL RETURNING id INTO m;
 UPDATE app.membership_roles SET revoked_at=statement_timestamp() WHERE tenant_id=i.tenant_id AND membership_id=m AND revoked_at IS NULL;
 INSERT INTO app.membership_roles(tenant_id,membership_id,role,granted_by_membership_id,valid_from) VALUES(i.tenant_id,m,'resident',i.created_by_membership_id,statement_timestamp());
 UPDATE app.invitations SET accepted_at=statement_timestamp() WHERE id=i.id;
 PERFORM app.record_access(i.tenant_id,m,'access.invitation_accepted',jsonb_build_object('invitation_id',i.id));
END $$;
CREATE FUNCTION public.enclavix_set_role(p_tenant uuid,p_member uuid,p_role app.system_role,p_community uuid,p_until timestamptz,p_revoke boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_admin(p_tenant,p_reason);
BEGIN
 IF p_member=actor OR NOT EXISTS(SELECT 1 FROM app.memberships WHERE tenant_id=p_tenant AND id=p_member AND status='active') THEN RAISE EXCEPTION 'Invalid role target' USING ERRCODE='42501'; END IF;
 IF p_until IS NOT NULL AND p_until<=statement_timestamp() THEN RAISE EXCEPTION 'Invalid expiry' USING ERRCODE='22023'; END IF;
 UPDATE app.membership_roles SET revoked_at=statement_timestamp()
 WHERE tenant_id=p_tenant AND membership_id=p_member AND role=p_role AND community_id IS NOT DISTINCT FROM p_community
 AND revoked_at IS NULL;
 IF NOT p_revoke THEN
 INSERT INTO app.membership_roles(tenant_id,membership_id,role,community_id,valid_from,valid_until,granted_by_membership_id)
 VALUES(p_tenant,p_member,p_role,p_community,statement_timestamp(),p_until,actor);
 END IF;
 PERFORM app.record_access(p_tenant,actor,'access.role_changed',jsonb_build_object('membership_id',p_member,'role',p_role,'community_id',p_community,'revoked',p_revoke,'reason',p_reason));
END $$;
CREATE FUNCTION public.enclavix_revoke_membership(p_tenant uuid,p_member uuid,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_admin(p_tenant,p_reason);
BEGIN
 IF p_member=actor THEN RAISE EXCEPTION 'Self action denied' USING ERRCODE='42501'; END IF;
 UPDATE app.memberships SET status='revoked' WHERE tenant_id=p_tenant AND id=p_member;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid target' USING ERRCODE='42501'; END IF;
 UPDATE app.membership_roles SET revoked_at=statement_timestamp() WHERE tenant_id=p_tenant AND membership_id=p_member AND revoked_at IS NULL;
 PERFORM app.record_access(p_tenant,actor,'access.membership_revoked',jsonb_build_object('membership_id',p_member,'reason',p_reason));
END $$;
CREATE FUNCTION public.enclavix_support(p_tenant uuid,p_operator uuid,p_minutes integer,p_revoke boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_admin(p_tenant,p_reason);
BEGIN
 IF p_operator=app.principal() OR p_minutes NOT BETWEEN 1 AND 60 OR NOT EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=p_operator AND enabled)
 THEN RAISE EXCEPTION 'Invalid support request' USING ERRCODE='42501'; END IF;
 UPDATE app.support_access SET revoked_at=statement_timestamp() WHERE tenant_id=p_tenant AND operator_id=p_operator AND revoked_at IS NULL;
 IF NOT p_revoke THEN INSERT INTO app.support_access(tenant_id,operator_id,approved_by_membership_id,reason,expires_at) VALUES(p_tenant,p_operator,actor,p_reason,statement_timestamp()+make_interval(mins=>p_minutes)); END IF;
 PERFORM app.record_access(p_tenant,actor,'access.support_changed',jsonb_build_object('operator_id',p_operator,'minutes',p_minutes,'revoked',p_revoke,'reason',p_reason));
END $$;
CREATE FUNCTION public.enclavix_sessions() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'expires_at',not_after,'current',id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid)),'[]') FROM auth.sessions WHERE user_id=app.principal()
$$;
-- Revoke selected devices without granting clients Auth table access. Subsequent RPCs check live session existence.
CREATE FUNCTION public.enclavix_revoke_session(p_session uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=app.principal();
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 DELETE FROM auth.sessions WHERE id=p_session AND user_id=u;
END $$;

CREATE FUNCTION public.enclavix_revoke_invitation(p_invitation uuid,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE i app.invitations; actor uuid;
BEGIN
 SELECT * INTO i FROM app.invitations WHERE id=p_invitation;
 actor:=app.require_admin(i.tenant_id,p_reason);
 UPDATE app.invitations SET revoked_at=statement_timestamp() WHERE id=i.id AND accepted_at IS NULL;
 PERFORM app.record_access(i.tenant_id,actor,'access.invitation_revoked',jsonb_build_object('invitation_id',i.id,'reason',p_reason));
END $$;
CREATE FUNCTION public.enclavix_access_audit(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT app.role_at(p_tenant,'association_admin') THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(row_to_json(x)),'[]') FROM (SELECT id,actor_membership_id,event_type,details,created_at FROM app.audit_events
 WHERE tenant_id=p_tenant AND event_type LIKE 'access.%' ORDER BY created_at DESC,id LIMIT 100) x);
END $$;

CREATE FUNCTION public.enclavix_access_directory(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT app.role_at(p_tenant,'association_admin') THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
 'people',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',display_name,'linked',auth_user_id IS NOT NULL)),'[]') FROM app.people WHERE tenant_id=p_tenant AND kind='individual'),
 'members',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',p.display_name,'status',m.status)),'[]') FROM app.memberships m JOIN app.people p ON (p.tenant_id,p.id)=(m.tenant_id,m.person_id) WHERE m.tenant_id=p_tenant),
 'properties',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'label',label)),'[]') FROM app.properties WHERE tenant_id=p_tenant AND is_active),
 'invitations',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',p.display_name,'email',i.email,'expires_at',i.expires_at)),'[]') FROM app.invitations i JOIN app.people p ON (p.tenant_id,p.id)=(i.tenant_id,i.person_id) WHERE i.tenant_id=p_tenant AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>statement_timestamp()));
END $$;

-- No PUBLIC default execute, and no service-role bypass of these entry points.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE (n.nspname='public' AND p.proname LIKE 'enclavix_%') OR (n.nspname='app' AND p.proname IN ('principal','assured','member','role_at','property_access','supports','document_access','require_admin','record_access')) LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.signature::text LIKE 'enclavix_%' OR f.signature::text LIKE 'public.enclavix_%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END IF;
 END LOOP;
END $$;
-- Restore only the gateway's helper grants after revoking defaults.
GRANT EXECUTE ON FUNCTION app.principal(),app.assured(),app.member(uuid),app.role_at(uuid,app.system_role,uuid),app.property_access(uuid,uuid),app.supports(uuid) TO enclavix_reader;
CREATE POLICY document_read ON app.document_objects FOR SELECT TO enclavix_reader USING(app.document_access(object_path));
GRANT EXECUTE ON FUNCTION app.document_access(text) TO enclavix_reader;
CREATE FUNCTION public.enclavix_document(p_tenant uuid,p_document uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('object_path',object_path,'display_name',display_name,'size_bytes',size_bytes::text)
 FROM app.document_objects WHERE tenant_id=p_tenant AND id=p_document
$$;
ALTER FUNCTION public.enclavix_document(uuid,uuid) OWNER TO enclavix_reader;
REVOKE ALL ON FUNCTION public.enclavix_document(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_document(uuid,uuid) TO authenticated;
-- Storage is installed by Supabase, not the standalone relational test fixture.
DO $$ BEGIN
 IF to_regclass('storage.objects') IS NOT NULL THEN
  EXECUTE 'INSERT INTO storage.buckets(id,name,public,file_size_limit) VALUES (''tenant-private'',''tenant-private'',false,20971520) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=20971520';
  -- No client object policies: clients cannot mint signed URLs that outlive revocation.
  -- The web/API download gateway checks live authorization then streams with a server-only key.
 END IF;
END $$;

REVOKE CREATE ON SCHEMA public FROM enclavix_reader;
