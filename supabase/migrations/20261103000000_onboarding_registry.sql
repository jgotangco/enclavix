-- S03 synthetic onboarding and association-scoped registry commands. No production activation.
ALTER TABLE app.people ADD COLUMN external_key text;
CREATE UNIQUE INDEX people_external_key ON app.people(tenant_id,external_key) WHERE external_key IS NOT NULL;
CREATE UNIQUE INDEX communities_canonical_code ON app.communities(tenant_id,upper(btrim(code)));
CREATE UNIQUE INDEX locations_canonical_code ON app.locations(tenant_id,community_id,upper(btrim(code)));
CREATE UNIQUE INDEX properties_canonical_code ON app.properties(tenant_id,community_id,upper(btrim(code)));
CREATE UNIQUE INDEX assets_canonical_code ON app.assets(tenant_id,community_id,upper(btrim(code)));

CREATE TABLE app.association_setup (
 tenant_id uuid PRIMARY KEY REFERENCES app.tenants(id),
 created_by_operator uuid NOT NULL REFERENCES app.platform_operators(auth_user_id),
 administrator_id uuid NOT NULL REFERENCES auth.users(id),
 reviewed_by_operator uuid REFERENCES app.platform_operators(auth_user_id),
 sandbox boolean NOT NULL DEFAULT true CHECK(sandbox),
 address text NOT NULL DEFAULT '',
 brand_name text NOT NULL DEFAULT '',
 accent_color text NOT NULL DEFAULT '#123F35' CHECK(accent_color ~ '^#[0-9A-Fa-f]{6}$'),
 billing_day integer NOT NULL DEFAULT 1 CHECK(billing_day BETWEEN 1 AND 28),
 notification_contact text NOT NULL DEFAULT '',
 support_contact text NOT NULL DEFAULT '',
 privacy_notice_ref text NOT NULL DEFAULT '',
 authority_ref text NOT NULL DEFAULT '',
 opening_balance_state text NOT NULL DEFAULT 'pending' CHECK(opening_balance_state IN ('pending','no_opening_balances','deferred_to_s04')),
 revision integer NOT NULL DEFAULT 1,
 submitted_revision integer,
 approved_revision integer,
 approved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(administrator_id<>created_by_operator),
 CHECK(reviewed_by_operator IS NULL OR (reviewed_by_operator<>created_by_operator AND reviewed_by_operator<>administrator_id))
);
CREATE TABLE app.lifecycle_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 event_type text NOT NULL CHECK(event_type ~ '^[a-z][a-z0-9_.]{1,99}$'),
 details jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(details)='object'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER lifecycle_append_only BEFORE UPDATE OR DELETE ON app.lifecycle_events FOR EACH ROW EXECUTE FUNCTION app.keep_audit();
CREATE TABLE app.registry_exports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 created_by_membership_id uuid NOT NULL,
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES app.memberships(tenant_id,id)
);
CREATE TABLE app.offboarding_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES app.tenants(id),
 requested_by_membership_id uuid NOT NULL,
 export_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
 status text NOT NULL DEFAULT 'staged' CHECK(status IN ('staged','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,requested_by_membership_id) REFERENCES app.memberships(tenant_id,id),
 FOREIGN KEY(tenant_id,export_id) REFERENCES app.registry_exports(tenant_id,id)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['association_setup','lifecycle_events','registry_exports','offboarding_requests'] LOOP
 EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION app.require_operator() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=app.principal();
BEGIN
 IF u IS NULL OR NOT app.assured() OR NOT EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=u AND enabled)
 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=u AND id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid AND created_at>statement_timestamp()-interval '10 minutes')
 THEN RAISE EXCEPTION 'Recent MFA operator sign-in required' USING ERRCODE='42501'; END IF;
 RETURN u;
END $$;
CREATE FUNCTION app.registry_actor(t uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT m.id FROM app.memberships m JOIN app.people p ON (p.tenant_id,p.id)=(m.tenant_id,m.person_id)
 JOIN app.tenants a ON a.id=m.tenant_id LEFT JOIN app.association_setup s ON s.tenant_id=a.id
 WHERE m.tenant_id=t AND p.auth_user_id=app.principal() AND app.assured() AND m.status='active'
 AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp())
 AND ((a.status='active' AND app.role_at(t,'association_admin')) OR (a.status='onboarding' AND s.administrator_id=app.principal()))
 AND EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=t AND r.membership_id=m.id AND r.role='association_admin' AND r.community_id IS NULL AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp()))
 AND (NOT EXISTS(SELECT 1 FROM app.membership_roles r WHERE r.tenant_id=t AND r.membership_id=m.id AND r.role='guard' AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())) OR EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid AND created_at>statement_timestamp()-interval '30 minutes'))
$$;
CREATE FUNCTION app.require_registry_admin(t uuid,reason text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(t::text,0));actor:=app.registry_actor(t);
 IF actor IS NULL OR reason IS NULL OR length(btrim(reason)) NOT BETWEEN 10 AND 1000
 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid AND created_at>statement_timestamp()-interval '10 minutes')
 THEN RAISE EXCEPTION 'Recent administrator MFA and reason required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
CREATE FUNCTION app.registry_replay(t uuid,event text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT result FROM app.operation_requests WHERE tenant_id=t AND operation=event
 AND idempotency_key=nullif(current_setting('request.headers',true),'')::jsonb->>'idempotency-key'
$$;
CREATE FUNCTION app.registry_finish(t uuid,actor uuid,event text,details jsonb,result jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM app.record_access(t,actor,event,details);
 UPDATE app.operation_requests o SET result=registry_finish.result WHERE o.tenant_id=t AND o.id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;
 UPDATE app.association_setup SET revision=revision+1,submitted_revision=NULL,approved_revision=NULL,approved_at=NULL,reviewed_by_operator=NULL WHERE tenant_id=t AND EXISTS(SELECT 1 FROM app.tenants WHERE id=t AND status='onboarding');
END $$;
CREATE FUNCTION app.only_keys(data jsonb,allowed text[]) RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF data IS NULL OR jsonb_typeof(data)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(data) k WHERE NOT k=ANY(allowed))
 THEN RAISE EXCEPTION 'Unexpected command fields' USING ERRCODE='22023'; END IF;
END $$;
CREATE FUNCTION app.canonical_code(value text) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE code text:=upper(btrim(value));
BEGIN
 IF code IS NULL OR code !~ '^[A-Z0-9][A-Z0-9._ /-]{0,79}$' THEN RAISE EXCEPTION 'Invalid code' USING ERRCODE='22023'; END IF;
 RETURN code;
END $$;

CREATE FUNCTION public.enclavix_s03_registry_command(p_tenant uuid,p_action text,p_data jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); v_result jsonb; item uuid; event text:='registry.'||p_action; effective timestamptz; old app.property_relationships; community uuid; person uuid; target uuid; v_kind app.relationship_kind;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('community','location','property','person','asset','property_update','person_update','relationship','end_relationship','transfer') THEN RAISE EXCEPTION 'Unknown registry command' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('data',p_data,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF p_action='community' THEN
  PERFORM app.only_keys(p_data,ARRAY['code','name','kind','time_zone','structure_labels']);
  IF p_data ? 'structure_labels' THEN
   PERFORM app.only_keys(p_data->'structure_labels',ARRAY['phase','block','tower','floor','property','owner','tenant']);
   IF EXISTS(SELECT 1 FROM jsonb_each(p_data->'structure_labels') x WHERE jsonb_typeof(x.value)<>'string' OR length(btrim(x.value#>>'{}')) NOT BETWEEN 1 AND 80)
   THEN RAISE EXCEPTION 'Invalid terminology label' USING ERRCODE='22023'; END IF;
  END IF;
  INSERT INTO app.communities(tenant_id,code,name,kind,time_zone,structure_labels) VALUES(p_tenant,app.canonical_code(p_data->>'code'),p_data->>'name',(p_data->>'kind')::app.community_kind,coalesce(p_data->>'time_zone','Asia/Manila'),coalesce(p_data->'structure_labels','{}')) RETURNING id INTO item;
 ELSIF p_action='location' THEN
  PERFORM app.only_keys(p_data,ARRAY['community_id','parent_id','code','label','kind']);
  INSERT INTO app.locations(tenant_id,community_id,parent_location_id,code,label,kind) VALUES(p_tenant,(p_data->>'community_id')::uuid,nullif(p_data->>'parent_id','')::uuid,app.canonical_code(p_data->>'code'),p_data->>'label',(p_data->>'kind')::app.location_kind) RETURNING id INTO item;
 ELSIF p_action='property' THEN
  PERFORM app.only_keys(p_data,ARRAY['community_id','location_id','code','label','kind','lot_area_sqm','floor_area_sqm','ownership_share']);
  INSERT INTO app.properties(tenant_id,community_id,location_id,code,label,kind,lot_area_sqm,floor_area_sqm,ownership_share) VALUES(p_tenant,(p_data->>'community_id')::uuid,nullif(p_data->>'location_id','')::uuid,app.canonical_code(p_data->>'code'),p_data->>'label',(p_data->>'kind')::app.property_kind,nullif(p_data->>'lot_area_sqm','')::numeric,nullif(p_data->>'floor_area_sqm','')::numeric,nullif(p_data->>'ownership_share','')::numeric) RETURNING id INTO item;
 ELSIF p_action='person' THEN
  PERFORM app.only_keys(p_data,ARRAY['external_key','name','kind','email']);
  INSERT INTO app.people(tenant_id,external_key,display_name,kind,contact_email) VALUES(p_tenant,app.canonical_code(p_data->>'external_key'),p_data->>'name',(p_data->>'kind')::app.person_kind,nullif(lower(btrim(p_data->>'email')),'')) RETURNING id INTO item;
 ELSIF p_action='asset' THEN
  PERFORM app.only_keys(p_data,ARRAY['community_id','location_id','code','label','kind','capacity']);
  INSERT INTO app.assets(tenant_id,community_id,location_id,code,label,kind,capacity) VALUES(p_tenant,(p_data->>'community_id')::uuid,nullif(p_data->>'location_id','')::uuid,app.canonical_code(p_data->>'code'),p_data->>'label',(p_data->>'kind')::app.asset_kind,coalesce((p_data->>'capacity')::integer,1)) RETURNING id INTO item;
 ELSIF p_action='property_update' THEN
  PERFORM app.only_keys(p_data,ARRAY['id','label','lot_area_sqm','floor_area_sqm','ownership_share']);
  UPDATE app.properties SET label=p_data->>'label',lot_area_sqm=nullif(p_data->>'lot_area_sqm','')::numeric,floor_area_sqm=nullif(p_data->>'floor_area_sqm','')::numeric,ownership_share=nullif(p_data->>'ownership_share','')::numeric WHERE tenant_id=p_tenant AND id=(p_data->>'id')::uuid RETURNING id INTO item;
  IF item IS NULL THEN RAISE EXCEPTION 'Unknown property' USING ERRCODE='42501'; END IF;
 ELSIF p_action='person_update' THEN
  PERFORM app.only_keys(p_data,ARRAY['id','name','email']);
  UPDATE app.people SET display_name=p_data->>'name',contact_email=nullif(lower(btrim(p_data->>'email')),'') WHERE tenant_id=p_tenant AND id=(p_data->>'id')::uuid RETURNING id INTO item;
  IF item IS NULL THEN RAISE EXCEPTION 'Unknown contact' USING ERRCODE='42501'; END IF;
 ELSE
  PERFORM app.only_keys(p_data,ARRAY['id','property_id','person_id','old_person_id','new_person_id','kind','represented_person_id','valid_from','valid_until','primary_contact','billing_contact']);
  IF p_action='end_relationship' THEN
   SELECT * INTO old FROM app.property_relationships WHERE tenant_id=p_tenant AND id=(p_data->>'id')::uuid FOR UPDATE;
   person:=old.person_id;target:=NULL;item:=old.id;
  ELSE
   person:=coalesce(p_data->>'person_id',p_data->>'old_person_id')::uuid;target:=nullif(p_data->>'new_person_id','')::uuid;
  END IF;
  IF person IS NULL OR EXISTS(SELECT 1 FROM app.memberships m WHERE m.tenant_id=p_tenant AND m.id=actor AND m.person_id IN (person,target,nullif(p_data->>'represented_person_id','')::uuid))
  THEN RAISE EXCEPTION 'Self property elevation/change denied' USING ERRCODE='42501'; END IF;
  IF p_action='end_relationship' THEN
   IF old.valid_from>statement_timestamp() OR (old.valid_until IS NOT NULL AND old.valid_until<=statement_timestamp()) THEN RAISE EXCEPTION 'Relationship is not current' USING ERRCODE='22023'; END IF;
   UPDATE app.property_relationships SET valid_until=greatest(statement_timestamp(),valid_from+interval '1 microsecond') WHERE id=old.id;
  ELSE
   v_kind:=(p_data->>'kind')::app.relationship_kind;
   SELECT community_id INTO community FROM app.properties WHERE tenant_id=p_tenant AND id=(p_data->>'property_id')::uuid AND is_active;
   IF community IS NULL THEN RAISE EXCEPTION 'Unknown property' USING ERRCODE='42501'; END IF;
   effective:=coalesce(nullif(p_data->>'valid_from','')::timestamptz,statement_timestamp());
   IF effective<statement_timestamp()-interval '5 minutes' THEN RAISE EXCEPTION 'Backdated access changes are not supported' USING ERRCODE='22023'; END IF;
   effective:=greatest(effective,statement_timestamp());
   IF p_action='transfer' THEN
    IF v_kind NOT IN ('owner','tenant') OR target IS NULL OR target=person THEN RAISE EXCEPTION 'Invalid transfer' USING ERRCODE='22023'; END IF;
    SELECT * INTO old FROM app.property_relationships WHERE tenant_id=p_tenant AND property_id=(p_data->>'property_id')::uuid AND person_id=person AND app.property_relationships.kind=v_kind
     AND valid_from<=effective AND (valid_until IS NULL OR valid_until>effective) ORDER BY valid_from DESC LIMIT 1 FOR UPDATE;
    IF old.id IS NULL OR effective<=old.valid_from THEN RAISE EXCEPTION 'No transferable relationship' USING ERRCODE='22023'; END IF;
    UPDATE app.property_relationships SET valid_until=effective WHERE id=old.id;
    person:=target;
   END IF;
   IF EXISTS(SELECT 1 FROM app.property_relationships x WHERE x.tenant_id=p_tenant AND x.property_id=(p_data->>'property_id')::uuid AND x.person_id=person AND x.kind=v_kind
    AND tstzrange(x.valid_from,x.valid_until,'[)') && tstzrange(effective,nullif(p_data->>'valid_until','')::timestamptz,'[)'))
   THEN RAISE EXCEPTION 'Overlapping relationship' USING ERRCODE='23505'; END IF;
   IF EXISTS(SELECT 1 FROM app.property_relationships x WHERE x.tenant_id=p_tenant AND x.property_id=(p_data->>'property_id')::uuid
    AND ((coalesce((p_data->>'primary_contact')::boolean,false) AND x.is_primary_contact) OR (coalesce((p_data->>'billing_contact')::boolean,false) AND x.is_billing_responsible))
    AND tstzrange(x.valid_from,x.valid_until,'[)') && tstzrange(effective,nullif(p_data->>'valid_until','')::timestamptz,'[)'))
   THEN RAISE EXCEPTION 'Primary or billing contact overlap' USING ERRCODE='23505'; END IF;
   INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,represented_person_id,valid_from,valid_until,is_primary_contact,is_billing_responsible)
   VALUES(p_tenant,community,(p_data->>'property_id')::uuid,person,v_kind,nullif(p_data->>'represented_person_id','')::uuid,effective,nullif(p_data->>'valid_until','')::timestamptz,coalesce((p_data->>'primary_contact')::boolean,false),coalesce((p_data->>'billing_contact')::boolean,false)) RETURNING id INTO item;
  END IF;
 END IF;
 v_result:=jsonb_build_object('id',item,'action',p_action);
 PERFORM app.registry_finish(p_tenant,actor,event,jsonb_build_object('record_id',item,'action',p_action,'reason',p_reason),v_result);
 RETURN v_result;
END $$;

CREATE TABLE app.platform_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES app.platform_operators(auth_user_id),
 operation text NOT NULL,
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 1 AND 128),
 request_sha256 text NOT NULL CHECK(request_sha256 ~ '^[a-f0-9]{64}$'),
 result jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,operation,idempotency_key)
);
ALTER TABLE app.platform_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.platform_requests FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION app.platform_start(actor uuid,event text,payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE key text:=nullif(current_setting('request.headers',true),'')::jsonb->>'idempotency-key'; hash text:=encode(sha256(convert_to(payload::text,'UTF8')),'hex'); op app.platform_requests;
BEGIN
 IF key IS NULL OR key !~ '^[A-Za-z0-9._:-]{1,128}$' THEN RAISE EXCEPTION 'Idempotency-Key required' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('platform:'||actor::text||event||key,0));
 IF app.require_operator()<>actor THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO op FROM app.platform_requests WHERE actor_id=actor AND operation=event AND idempotency_key=key FOR UPDATE;
 IF op.id IS NOT NULL THEN
  IF op.request_sha256<>hash OR op.result IS NULL THEN RAISE EXCEPTION 'Request conflict' USING ERRCODE='23505'; END IF;
  RETURN false;
 END IF;
 INSERT INTO app.platform_requests(actor_id,operation,idempotency_key,request_sha256) VALUES(actor,event,key,hash) RETURNING * INTO op;
 PERFORM set_config('enclavix.platform_operation_id',op.id::text,true);
 RETURN true;
END $$;
CREATE FUNCTION app.platform_replay(actor uuid,event text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT result FROM app.platform_requests WHERE actor_id=actor AND operation=event AND idempotency_key=nullif(current_setting('request.headers',true),'')::jsonb->>'idempotency-key'
$$;
CREATE FUNCTION app.lifecycle_log(t uuid,event text,details jsonb,result jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 INSERT INTO app.lifecycle_events(tenant_id,actor_id,event_type,details) VALUES(t,app.principal(),event,details);
 UPDATE app.platform_requests r SET result=lifecycle_log.result WHERE r.id=nullif(current_setting('enclavix.platform_operation_id',true),'')::uuid AND r.actor_id=app.principal();
END $$;
CREATE FUNCTION public.enclavix_s03_create(p_data jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_operator(); admin_id uuid; t uuid; person uuid; member uuid; v_result jsonb;
BEGIN
 PERFORM app.only_keys(p_data,ARRAY['tenant_key','legal_name','administrator_email','currency','time_zone','locale','authority_ref']);
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'Reason required' USING ERRCODE='22023'; END IF;
 IF NOT app.platform_start(actor,'onboarding.create',jsonb_build_object('data',p_data,'reason',p_reason)) THEN RETURN app.platform_replay(actor,'onboarding.create'); END IF;
 SELECT id INTO admin_id FROM auth.users WHERE lower(email)=lower(btrim(p_data->>'administrator_email')) AND email_confirmed_at IS NOT NULL AND (banned_until IS NULL OR banned_until<=statement_timestamp());
 IF admin_id IS NULL OR admin_id=actor THEN RAISE EXCEPTION 'A different verified administrator is required' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_data->>'authority_ref',''))) NOT BETWEEN 10 AND 500 THEN RAISE EXCEPTION 'Authority evidence reference required' USING ERRCODE='22023'; END IF;
 INSERT INTO app.tenants(tenant_key,legal_name,currency,time_zone,locale) VALUES(lower(btrim(p_data->>'tenant_key')),p_data->>'legal_name',coalesce(p_data->>'currency','PHP'),coalesce(p_data->>'time_zone','Asia/Manila'),coalesce(p_data->>'locale','en-PH')) RETURNING id INTO t;
 INSERT INTO app.people(tenant_id,external_key,display_name,auth_user_id,contact_email) VALUES(t,'INITIAL-ADMIN','Nominated administrator',admin_id,lower(btrim(p_data->>'administrator_email'))) RETURNING id INTO person;
 INSERT INTO app.memberships(tenant_id,person_id,status,valid_from) VALUES(t,person,'active',statement_timestamp()) RETURNING id INTO member;
 INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES(t,member,'association_admin',statement_timestamp());
 INSERT INTO app.association_setup(tenant_id,created_by_operator,administrator_id,brand_name,authority_ref) VALUES(t,actor,admin_id,p_data->>'legal_name',p_data->>'authority_ref');
 v_result:=jsonb_build_object('tenant_id',t,'sandbox',true);
 PERFORM app.lifecycle_log(t,'onboarding.created',jsonb_build_object('administrator_id',admin_id,'reason',p_reason,'authority_ref',p_data->>'authority_ref'),v_result);
 RETURN v_result;
END $$;
CREATE FUNCTION app.setup_checklist(t uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object(
 'structure',EXISTS(SELECT 1 FROM app.communities WHERE tenant_id=t) AND EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=t) AND NOT EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=t AND location_id IS NULL),
 'administrator',EXISTS(SELECT 1 FROM app.memberships m JOIN app.people p ON (p.tenant_id,p.id)=(m.tenant_id,m.person_id) JOIN app.membership_roles r ON (r.tenant_id,r.membership_id)=(m.tenant_id,m.id)
 WHERE m.tenant_id=t AND p.auth_user_id=s.administrator_id AND m.status='active' AND m.valid_from<=statement_timestamp() AND (m.valid_until IS NULL OR m.valid_until>statement_timestamp()) AND r.role='association_admin' AND r.community_id IS NULL AND r.revoked_at IS NULL AND r.valid_from<=statement_timestamp() AND (r.valid_until IS NULL OR r.valid_until>statement_timestamp())),
 'contact_details',length(btrim(s.address))>=10 AND s.notification_contact ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' AND length(btrim(s.support_contact))>=5,
 'privacy_notice',length(btrim(s.privacy_notice_ref))>=10,
 'opening_balances',s.opening_balance_state<>'pending',
 'authority_evidence',length(btrim(s.authority_ref))>=10,
 'imports_resolved',NOT EXISTS(SELECT 1 FROM app.import_batches WHERE tenant_id=t AND status NOT IN ('committed','cancelled')),
 'sandbox_only',s.sandbox,
 'property_count',(SELECT count(*) FROM app.properties WHERE tenant_id=t))
 FROM app.association_setup s WHERE s.tenant_id=t
$$;
CREATE FUNCTION public.enclavix_s03_setup(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s app.association_setup;
BEGIN
 SELECT * INTO s FROM app.association_setup WHERE tenant_id=p_tenant;
 IF s.tenant_id IS NULL OR app.principal() IS NULL OR NOT app.assured() OR
 NOT (app.registry_actor(p_tenant) IS NOT NULL OR EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=app.principal() AND enabled))
 THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('setup',to_jsonb(s),'tenant',(SELECT jsonb_build_object('id',id,'name',legal_name,'status',status,'currency',currency,'time_zone',time_zone,'locale',locale) FROM app.tenants WHERE id=p_tenant),'checklist',app.setup_checklist(p_tenant));
END $$;
CREATE FUNCTION public.enclavix_s03_settings(p_tenant uuid,p_data jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); v_result jsonb;
BEGIN
 PERFORM app.only_keys(p_data,ARRAY['address','brand_name','accent_color','billing_day','notification_contact','support_contact','privacy_notice_ref','opening_balance_state']);
 IF NOT EXISTS(SELECT 1 FROM app.association_setup WHERE tenant_id=p_tenant) THEN RAISE EXCEPTION 'No onboarding setup' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,'registry.settings',jsonb_build_object('data',p_data,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,'registry.settings'); END IF;
 UPDATE app.association_setup SET address=coalesce(p_data->>'address',''),brand_name=coalesce(p_data->>'brand_name',''),accent_color=coalesce(p_data->>'accent_color','#123F35'),billing_day=coalesce((p_data->>'billing_day')::integer,1),notification_contact=coalesce(p_data->>'notification_contact',''),support_contact=coalesce(p_data->>'support_contact',''),privacy_notice_ref=coalesce(p_data->>'privacy_notice_ref',''),opening_balance_state=coalesce(p_data->>'opening_balance_state','pending') WHERE tenant_id=p_tenant;
 v_result:=jsonb_build_object('saved',true);
 PERFORM app.registry_finish(p_tenant,actor,'registry.settings',jsonb_build_object('reason',p_reason),v_result);RETURN v_result;
END $$;
CREATE FUNCTION public.enclavix_s03_submit(p_tenant uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); checks jsonb; v_result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM app.tenants WHERE id=p_tenant AND status='onboarding') THEN RAISE EXCEPTION 'Not onboarding' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,'onboarding.submit',jsonb_build_object('reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,'onboarding.submit'); END IF;
 checks:=app.setup_checklist(p_tenant);
 IF checks IS NULL OR EXISTS(SELECT 1 FROM jsonb_each(checks) x WHERE x.key<>'property_count' AND x.value<>'true'::jsonb) THEN RAISE EXCEPTION 'Complete the activation checklist' USING ERRCODE='22023'; END IF;
 UPDATE app.association_setup SET submitted_revision=revision WHERE tenant_id=p_tenant;
 v_result:=jsonb_build_object('submitted',true);
 PERFORM app.record_access(p_tenant,actor,'onboarding.submitted',jsonb_build_object('reason',p_reason));
 UPDATE app.operation_requests SET result=v_result WHERE id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;
 RETURN v_result;
END $$;
CREATE FUNCTION public.enclavix_s03_activate(p_tenant uuid,p_revision integer,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; s app.association_setup; checks jsonb; v_result jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));actor:=app.require_operator();
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'Reason required' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM app.association_setup WHERE tenant_id=p_tenant FOR UPDATE;
 IF s.tenant_id IS NULL OR actor IN (s.created_by_operator,s.administrator_id) THEN RAISE EXCEPTION 'Independent operator approval required' USING ERRCODE='42501'; END IF;
 IF NOT app.platform_start(actor,'onboarding.activate',jsonb_build_object('tenant',p_tenant,'revision',p_revision,'reason',p_reason)) THEN RETURN app.platform_replay(actor,'onboarding.activate'); END IF;
 IF s.revision<>p_revision OR s.submitted_revision IS DISTINCT FROM s.revision OR NOT EXISTS(SELECT 1 FROM app.tenants WHERE id=p_tenant AND status='onboarding') THEN RAISE EXCEPTION 'Setup changed or not submitted' USING ERRCODE='23505'; END IF;
 checks:=app.setup_checklist(p_tenant);
 IF EXISTS(SELECT 1 FROM jsonb_each(checks) x WHERE x.key<>'property_count' AND x.value<>'true'::jsonb) THEN RAISE EXCEPTION 'Incomplete activation checklist' USING ERRCODE='22023'; END IF;
 UPDATE app.association_setup SET reviewed_by_operator=actor,approved_revision=revision,approved_at=statement_timestamp() WHERE tenant_id=p_tenant;
 UPDATE app.tenants SET status='active' WHERE id=p_tenant;
 v_result:=jsonb_build_object('activated',true,'sandbox',true);
 PERFORM app.lifecycle_log(p_tenant,'onboarding.activated',jsonb_build_object('revision',s.revision,'reason',p_reason,'authority_ref',s.authority_ref,'sandbox',true),v_result);
 RETURN v_result;
END $$;

-- Active association registry reads require global administrator authority. Operators
-- may inspect onboarding metadata/checklists, never the resident registry itself.
CREATE FUNCTION public.enclavix_s03_registry(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.registry_actor(p_tenant);
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
 'communities',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.code),'[]') FROM app.communities x WHERE tenant_id=p_tenant),
 'locations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.code),'[]') FROM app.locations x WHERE tenant_id=p_tenant),
 'properties',(SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('lot_area_sqm',x.lot_area_sqm::text,'floor_area_sqm',x.floor_area_sqm::text,'ownership_share',x.ownership_share::text) ORDER BY x.code),'[]') FROM app.properties x WHERE tenant_id=p_tenant),
 'people',(SELECT coalesce(jsonb_agg((to_jsonb(x)-'auth_user_id')||jsonb_build_object('account_linked',x.auth_user_id IS NOT NULL) ORDER BY x.display_name),'[]') FROM app.people x WHERE tenant_id=p_tenant),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at),'[]') FROM app.memberships x WHERE tenant_id=p_tenant),
 'relationships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.valid_from),'[]') FROM app.property_relationships x WHERE tenant_id=p_tenant),
 'assets',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.code),'[]') FROM app.assets x WHERE tenant_id=p_tenant),
 'imports',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status,'created_at',created_at) ORDER BY created_at DESC),'[]') FROM app.import_batches WHERE tenant_id=p_tenant),
 'exports',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'expires_at',expires_at) ORDER BY created_at DESC),'[]') FROM app.registry_exports WHERE tenant_id=p_tenant),
 'offboarding',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status,'reason',reason,'created_at',created_at) ORDER BY created_at DESC),'[]') FROM app.offboarding_requests WHERE tenant_id=p_tenant));
END $$;
CREATE FUNCTION public.enclavix_s03_index() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('operator',app.assured() AND EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=app.principal() AND enabled),
 'contexts',public.enclavix_contexts(),
 'setups',(SELECT coalesce(jsonb_agg(jsonb_build_object('tenant_id',s.tenant_id,'name',t.legal_name,'status',t.status,'revision',s.revision,'submitted',s.submitted_revision=s.revision,'administrator',app.registry_actor(s.tenant_id) IS NOT NULL,'creator',s.created_by_operator=app.principal())),'[]') FROM app.association_setup s JOIN app.tenants t ON t.id=s.tenant_id
 WHERE app.assured() AND (app.registry_actor(s.tenant_id) IS NOT NULL OR EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=app.principal() AND enabled))))
$$;
CREATE FUNCTION public.enclavix_s03_property(p_tenant uuid,p_property uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE member uuid:=app.member(p_tenant); person uuid;
BEGIN
 IF NOT app.property_access(p_tenant,p_property) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT person_id INTO person FROM app.memberships WHERE tenant_id=p_tenant AND id=member;
 RETURN jsonb_build_object('property',(SELECT jsonb_build_object('id',id,'community_id',community_id,'code',code,'label',label,'kind',kind,'lot_area_sqm',lot_area_sqm::text,'floor_area_sqm',floor_area_sqm::text) FROM app.properties WHERE tenant_id=p_tenant AND id=p_property),
 'relationships',(SELECT coalesce(jsonb_agg(jsonb_build_object('kind',kind,'valid_from',valid_from,'valid_until',valid_until)),'[]') FROM app.property_relationships WHERE tenant_id=p_tenant AND property_id=p_property AND person_id=person AND valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp())));
END $$;

-- Validate against the same command/constraints as commit. The inner subtransaction
-- is intentionally rolled back even on success; no preview write becomes durable.
CREATE FUNCTION app.import_candidate(t uuid,k text,raw jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE data jsonb; c uuid; l uuid; p uuid; person uuid; represented uuid;
BEGIN
 IF jsonb_typeof(raw)<>'object' THEN RAISE EXCEPTION 'Row must be an object' USING ERRCODE='22023'; END IF;
 IF k='person' THEN
  PERFORM app.only_keys(raw,ARRAY['external_key','name','kind','email']);
  data:=raw||jsonb_build_object('external_key',app.canonical_code(raw->>'external_key'));
 ELSE
  SELECT id INTO c FROM app.communities WHERE tenant_id=t AND upper(btrim(code))=app.canonical_code(raw->>'community_code');
  IF c IS NULL THEN RAISE EXCEPTION 'Unknown community code' USING ERRCODE='22023'; END IF;
  IF k IN ('property','asset') THEN
   SELECT id INTO l FROM app.locations WHERE tenant_id=t AND community_id=c AND upper(btrim(code))=app.canonical_code(raw->>'location_code');
   IF l IS NULL THEN RAISE EXCEPTION 'Unknown location code' USING ERRCODE='22023'; END IF;
   IF k='property' THEN PERFORM app.only_keys(raw,ARRAY['community_code','location_code','code','label','kind','lot_area_sqm','floor_area_sqm','ownership_share']);
   ELSE PERFORM app.only_keys(raw,ARRAY['community_code','location_code','code','label','kind','capacity']); END IF;
   data:=(raw-'community_code'-'location_code')||jsonb_build_object('community_id',c,'location_id',l,'code',app.canonical_code(raw->>'code'));
  ELSIF k='relationship' THEN
   PERFORM app.only_keys(raw,ARRAY['community_code','property_code','person_key','kind','represented_person_key','valid_from','valid_until','primary_contact','billing_contact']);
   SELECT id INTO p FROM app.properties WHERE tenant_id=t AND community_id=c AND upper(btrim(code))=app.canonical_code(raw->>'property_code');
   SELECT id INTO person FROM app.people WHERE tenant_id=t AND external_key=app.canonical_code(raw->>'person_key');
   IF nullif(raw->>'represented_person_key','') IS NOT NULL THEN SELECT id INTO represented FROM app.people WHERE tenant_id=t AND external_key=app.canonical_code(raw->>'represented_person_key'); END IF;
   IF p IS NULL OR person IS NULL OR ((raw->>'kind')='representative' AND represented IS NULL) THEN RAISE EXCEPTION 'Unknown property or person code' USING ERRCODE='22023'; END IF;
   data:=(raw-'community_code'-'property_code'-'person_key'-'represented_person_key')||jsonb_build_object('property_id',p,'person_id',person,'represented_person_id',represented);
  ELSE RAISE EXCEPTION 'Unsupported registry import kind' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN data;
END $$;
CREATE FUNCTION app.validate_import(t uuid,b uuid,k text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE row app.import_rows; data jsonb; saved_headers text:=current_setting('request.headers',true); good integer:=0; bad integer:=0; issue text; duplicate boolean;
BEGIN
 FOR row IN SELECT * FROM app.import_rows WHERE tenant_id=t AND batch_id=b ORDER BY row_number LOOP
  issue:=NULL;data:=NULL;
  BEGIN
   data:=app.import_candidate(t,k,row.raw_payload);
   IF k IN ('property','asset','person') THEN
    SELECT count(*)>1 INTO duplicate FROM app.import_rows x WHERE x.tenant_id=t AND x.batch_id=b
    AND upper(btrim(coalesce(x.raw_payload->>'code',x.raw_payload->>'external_key')))=upper(btrim(coalesce(row.raw_payload->>'code',row.raw_payload->>'external_key')))
    AND coalesce(upper(btrim(x.raw_payload->>'community_code')),'')=coalesce(upper(btrim(row.raw_payload->>'community_code')),'');
    IF duplicate THEN RAISE EXCEPTION 'Repeated key in this batch' USING ERRCODE='23505'; END IF;
   END IF;
   IF k='relationship' AND EXISTS(SELECT 1 FROM app.import_rows x WHERE x.tenant_id=t AND x.batch_id=b AND x.id<>row.id
    AND upper(btrim(x.raw_payload->>'community_code'))=upper(btrim(row.raw_payload->>'community_code'))
    AND upper(btrim(x.raw_payload->>'property_code'))=upper(btrim(row.raw_payload->>'property_code'))
    AND ((upper(btrim(x.raw_payload->>'person_key'))=upper(btrim(row.raw_payload->>'person_key')) AND x.raw_payload->>'kind'=row.raw_payload->>'kind')
      OR (x.raw_payload->>'primary_contact'='true' AND row.raw_payload->>'primary_contact'='true')
      OR (x.raw_payload->>'billing_contact'='true' AND row.raw_payload->>'billing_contact'='true')))
   THEN RAISE EXCEPTION 'Conflicting relationships in one batch; separate sequential intervals' USING ERRCODE='23505'; END IF;
   PERFORM set_config('request.headers',jsonb_build_object('idempotency-key','validate-'||b::text||'-'||row.row_number::text)::text,true);
   PERFORM public.enclavix_s03_registry_command(t,k,data,'Validate synthetic registry import preview');
   RAISE EXCEPTION 'Rollback successful preview' USING ERRCODE='P0004';
  EXCEPTION
   WHEN SQLSTATE 'P0004' THEN NULL;
   WHEN unique_violation THEN issue:='Duplicate code or overlapping relationship';
   WHEN foreign_key_violation THEN issue:='Record references do not match this association/community';
   WHEN not_null_violation THEN issue:='A required field is missing';
   WHEN check_violation THEN issue:='Field value or effective date is invalid';
   WHEN insufficient_privilege THEN issue:='This relationship is not authorized';
   WHEN invalid_text_representation OR invalid_parameter_value OR numeric_value_out_of_range OR invalid_datetime_format OR datetime_field_overflow THEN issue:='Invalid or missing field, reference code, number or date';
  END;
  PERFORM set_config('request.headers',coalesce(saved_headers,''),true);
  IF issue IS NULL THEN good:=good+1; ELSE bad:=bad+1; END IF;
  UPDATE app.import_rows SET validated_payload=CASE WHEN issue IS NULL THEN data ELSE NULL END,status=CASE WHEN issue IS NULL THEN 'valid'::app.import_row_status ELSE 'invalid'::app.import_row_status END,
   issues=CASE WHEN issue IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('row',row.row_number,'message',issue)) END WHERE id=row.id;
 END LOOP;
 UPDATE app.import_batches SET status=CASE WHEN bad=0 THEN 'validated'::app.import_status ELSE 'staged'::app.import_status END WHERE tenant_id=t AND id=b;
 RETURN jsonb_build_object('total',good+bad,'valid',good,'invalid',bad);
END $$;
CREATE FUNCTION public.enclavix_s03_import_stage(p_tenant uuid,p_kind text,p_rows jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); b uuid; checks jsonb; v_result jsonb; row jsonb; n integer:=0; event text:='import.stage'; hash text;
BEGIN
 IF p_kind NOT IN ('property','person','asset','relationship') OR p_kind IS NULL OR p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 1000 OR pg_column_size(p_rows)>1048576
 THEN RAISE EXCEPTION 'Choose a supported kind and 1 to 1000 rows within 1 MiB' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('kind',p_kind,'rows',p_rows,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 hash:=encode(sha256(convert_to(jsonb_build_object('kind',p_kind,'rows',p_rows)::text,'UTF8')),'hex');
 INSERT INTO app.import_batches(tenant_id,created_by_membership_id,idempotency_key,source_sha256) VALUES(p_tenant,actor,nullif(current_setting('request.headers',true),'')::jsonb->>'idempotency-key',hash) RETURNING id INTO b;
 FOR row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  n:=n+1;
  INSERT INTO app.import_rows(tenant_id,batch_id,row_number,record_kind,raw_payload) VALUES(p_tenant,b,n,p_kind,CASE WHEN jsonb_typeof(row)='object' THEN row ELSE jsonb_build_object('invalid_row',row) END);
 END LOOP;
 checks:=app.validate_import(p_tenant,b,p_kind);v_result:=jsonb_build_object('batch_id',b,'summary',checks,'source_sha256',hash);
 PERFORM app.record_access(p_tenant,actor,event,jsonb_build_object('batch_id',b,'summary',checks,'reason',p_reason));
 UPDATE app.operation_requests SET result=v_result WHERE id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;
 RETURN v_result;
END $$;
CREATE FUNCTION public.enclavix_s03_import_view(p_tenant uuid,p_batch uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,'Review association import preview');
BEGIN
 IF NOT EXISTS(SELECT 1 FROM app.import_batches WHERE tenant_id=p_tenant AND id=p_batch) THEN RAISE EXCEPTION 'Unknown batch' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('batch',(SELECT to_jsonb(b) FROM app.import_batches b WHERE tenant_id=p_tenant AND id=p_batch),
 'rows',(SELECT coalesce(jsonb_agg(jsonb_build_object('row',row_number,'kind',record_kind,'raw',raw_payload,'validated',validated_payload,'status',status,'issues',issues) ORDER BY row_number),'[]') FROM app.import_rows WHERE tenant_id=p_tenant AND batch_id=p_batch));
END $$;
CREATE FUNCTION public.enclavix_s03_import_commit(p_tenant uuid,p_batch uuid,p_expected_hash text,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); b app.import_batches; row app.import_rows; checks jsonb; v_result jsonb; saved_headers text:=current_setting('request.headers',true); event text:='import.commit'; op uuid;
BEGIN
 SELECT * INTO b FROM app.import_batches WHERE tenant_id=p_tenant AND id=p_batch FOR UPDATE;
 IF b.id IS NULL THEN RAISE EXCEPTION 'Unknown batch' USING ERRCODE='42501'; END IF;
 IF p_expected_hash IS NULL OR b.source_sha256<>p_expected_hash THEN RAISE EXCEPTION 'Import source changed' USING ERRCODE='23505'; END IF;
 IF b.status='committed' THEN RETURN jsonb_build_object('batch_id',b.id,'committed',true,'already_committed',true); END IF;
 IF b.status<>'validated' THEN RAISE EXCEPTION 'Only a valid preview can be committed' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('batch',p_batch,'hash',p_expected_hash,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 op:=nullif(current_setting('enclavix.operation_id',true),'')::uuid;
 checks:=app.validate_import(p_tenant,b.id,(SELECT record_kind FROM app.import_rows WHERE tenant_id=p_tenant AND batch_id=b.id LIMIT 1));
 IF (checks->>'invalid')::integer<>0 THEN RAISE EXCEPTION 'Registry changed; create a fresh preview' USING ERRCODE='23505'; END IF;
 FOR row IN SELECT * FROM app.import_rows WHERE tenant_id=p_tenant AND batch_id=b.id ORDER BY row_number LOOP
  PERFORM set_config('request.headers',jsonb_build_object('idempotency-key','commit-'||b.id::text||'-'||row.row_number::text)::text,true);
  PERFORM public.enclavix_s03_registry_command(p_tenant,row.record_kind,row.validated_payload,'Commit approved registry import: '||p_reason);
  UPDATE app.import_rows SET status='applied' WHERE id=row.id;
 END LOOP;
 PERFORM set_config('request.headers',coalesce(saved_headers,''),true);PERFORM set_config('enclavix.operation_id',op::text,true);
 UPDATE app.import_batches SET status='committed',approved_by_membership_id=actor WHERE id=b.id;
 v_result:=jsonb_build_object('batch_id',b.id,'committed',true,'summary',checks);
 PERFORM app.registry_finish(p_tenant,actor,event,jsonb_build_object('batch_id',b.id,'summary',checks,'reason',p_reason),v_result);RETURN v_result;
END $$;
CREATE FUNCTION public.enclavix_s03_import_cancel(p_tenant uuid,p_batch uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); v_result jsonb;
BEGIN
 IF NOT app.start_access(p_tenant,actor,'import.cancel',jsonb_build_object('batch',p_batch,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,'import.cancel'); END IF;
 UPDATE app.import_batches SET status='cancelled' WHERE tenant_id=p_tenant AND id=p_batch AND status IN ('staged','validated');
 IF NOT FOUND THEN RAISE EXCEPTION 'Batch cannot be cancelled' USING ERRCODE='22023'; END IF;
 v_result:=jsonb_build_object('cancelled',true);PERFORM app.record_access(p_tenant,actor,'import.cancelled',jsonb_build_object('batch_id',p_batch,'reason',p_reason));
 UPDATE app.operation_requests SET result=v_result WHERE id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;RETURN v_result;
END $$;

CREATE FUNCTION app.registry_snapshot(t uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('schema_version',1,'tenant',(SELECT to_jsonb(x) FROM app.tenants x WHERE id=t),
 'communities',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.communities x WHERE tenant_id=t),
 'locations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.locations x WHERE tenant_id=t),
 'properties',(SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('lot_area_sqm',x.lot_area_sqm::text,'floor_area_sqm',x.floor_area_sqm::text,'ownership_share',x.ownership_share::text) ORDER BY id),'[]') FROM app.properties x WHERE tenant_id=t),
 'people',(SELECT coalesce(jsonb_agg(to_jsonb(x)-'auth_user_id' ORDER BY id),'[]') FROM app.people x WHERE tenant_id=t),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.memberships x WHERE tenant_id=t),
 'roles',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.membership_roles x WHERE tenant_id=t),
 'relationships',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.property_relationships x WHERE tenant_id=t),
 'assets',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.assets x WHERE tenant_id=t),
 'asset_allocations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY id),'[]') FROM app.asset_allocations x WHERE tenant_id=t),
 'documents',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'display_name',display_name,'sha256',sha256,'scan_status',scan_status,'audience',audience) ORDER BY id),'[]') FROM app.document_objects WHERE tenant_id=t),
 'files_included',false,'financial_cutover_included',false)
$$;
CREATE FUNCTION public.enclavix_s03_export_create(p_tenant uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); data jsonb; hash text; item uuid; v_result jsonb;
BEGIN
 IF NOT app.start_access(p_tenant,actor,'registry.export',jsonb_build_object('reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,'registry.export'); END IF;
 data:=app.registry_snapshot(p_tenant);
 IF pg_column_size(data)>10485760 THEN RAISE EXCEPTION 'Registry too large for synchronous export staging' USING ERRCODE='54000'; END IF;
 hash:=encode(sha256(convert_to(data::text,'UTF8')),'hex');
 INSERT INTO app.registry_exports(tenant_id,created_by_membership_id,snapshot) VALUES(p_tenant,actor,jsonb_build_object('data',data,'sha256',hash)) RETURNING id INTO item;
 v_result:=jsonb_build_object('export_id',item,'sha256',hash,'files_included',false);
 PERFORM app.record_access(p_tenant,actor,'registry.export_created',jsonb_build_object('export_id',item,'reason',p_reason));
 UPDATE app.operation_requests SET result=v_result WHERE id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;RETURN v_result;
END $$;
CREATE FUNCTION public.enclavix_s03_export(p_tenant uuid,p_export uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,'Download approved registry export'); data jsonb;
BEGIN
 SELECT snapshot INTO data FROM app.registry_exports WHERE tenant_id=p_tenant AND id=p_export AND expires_at>statement_timestamp();
 IF data IS NULL THEN RAISE EXCEPTION 'Unavailable export' USING ERRCODE='42501'; END IF;
 RETURN data;
END $$;
CREATE FUNCTION public.enclavix_s03_offboarding(p_tenant uuid,p_export uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); e app.registry_exports; item uuid; v_result jsonb; current_hash text;
BEGIN
 IF NOT app.start_access(p_tenant,actor,'registry.offboarding',jsonb_build_object('export',p_export,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,'registry.offboarding'); END IF;
 SELECT * INTO e FROM app.registry_exports WHERE tenant_id=p_tenant AND id=p_export AND expires_at>statement_timestamp();
 current_hash:=encode(sha256(convert_to(app.registry_snapshot(p_tenant)::text,'UTF8')),'hex');
 IF e.id IS NULL OR current_hash IS DISTINCT FROM e.snapshot->>'sha256' THEN RAISE EXCEPTION 'Create a current export before staging offboarding' USING ERRCODE='23505'; END IF;
 IF EXISTS(SELECT 1 FROM app.offboarding_requests WHERE tenant_id=p_tenant AND status='staged') THEN RAISE EXCEPTION 'Offboarding already staged' USING ERRCODE='23505'; END IF;
 INSERT INTO app.offboarding_requests(tenant_id,requested_by_membership_id,export_id,reason) VALUES(p_tenant,actor,e.id,p_reason) RETURNING id INTO item;
 v_result:=jsonb_build_object('request_id',item,'status','staged','access_terminated',false,'deletion_performed',false);
 PERFORM app.record_access(p_tenant,actor,'registry.offboarding_staged',jsonb_build_object('request_id',item,'export_id',e.id,'reason',p_reason));
 UPDATE app.operation_requests SET result=v_result WHERE id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;RETURN v_result;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'enclavix_s03_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION app.property_access(t uuid,p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.properties q WHERE q.tenant_id=t AND q.id=p AND q.is_active AND
 (app.role_at(t,'association_admin',q.community_id) OR (app.role_at(t,'resident',q.community_id) AND EXISTS(
 SELECT 1 FROM app.property_relationships x JOIN app.memberships m ON m.tenant_id=x.tenant_id AND m.person_id=x.person_id
 WHERE x.tenant_id=t AND x.property_id=p AND m.id=app.member(t) AND x.valid_from<=statement_timestamp()
 AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())
 AND (x.kind<>'representative' OR EXISTS(SELECT 1 FROM app.property_relationships o WHERE o.tenant_id=x.tenant_id AND o.property_id=x.property_id
 AND o.person_id=x.represented_person_id AND o.kind='owner' AND o.valid_from<=statement_timestamp() AND (o.valid_until IS NULL OR o.valid_until>statement_timestamp())))))))
$$;
REVOKE ALL ON FUNCTION app.property_access(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
