-- S03 registry metadata only. Booking, capacity, gate and financial effects remain disabled.
ALTER TABLE app.asset_allocations ADD COLUMN cancelled_at timestamptz;
CREATE INDEX asset_allocation_lookup ON app.asset_allocations(tenant_id,asset_id,property_id,kind) WHERE cancelled_at IS NULL;

CREATE FUNCTION public.enclavix_s03_allocation(p_tenant uuid,p_action text,p_data jsonb,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_registry_admin(p_tenant,p_reason); event text:='registry.asset_'||p_action;
 old app.asset_allocations; asset app.assets; property uuid; community uuid; item uuid; v_kind app.allocation_kind;
 effective timestamptz; until_at timestamptz; at timestamptz:=statement_timestamp(); result jsonb;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('assign','end','cancel') THEN RAISE EXCEPTION 'Unknown allocation action' USING ERRCODE='22023'; END IF;
 IF p_action='assign' THEN PERFORM app.only_keys(p_data,ARRAY['asset_id','property_id','kind','valid_from','valid_until']);
 ELSIF p_action='end' THEN PERFORM app.only_keys(p_data,ARRAY['id','valid_until']);
 ELSE PERFORM app.only_keys(p_data,ARRAY['id']); END IF;
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('data',p_data,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each_text(p_data) x WHERE x.key IN ('valid_from','valid_until') AND nullif(x.value,'') IS NOT NULL
   AND x.value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$')
 THEN RAISE EXCEPTION 'Effective dates require an explicit ISO time zone' USING ERRCODE='22023'; END IF;
 IF p_action='assign' THEN
  SELECT * INTO asset FROM app.assets WHERE tenant_id=p_tenant AND id=(p_data->>'asset_id')::uuid AND is_active;
  SELECT id,community_id INTO property,community FROM app.properties WHERE tenant_id=p_tenant AND id=(p_data->>'property_id')::uuid AND is_active;
  IF asset.id IS NULL OR property IS NULL OR asset.community_id<>community THEN RAISE EXCEPTION 'Unknown or mismatched asset/property' USING ERRCODE='42501'; END IF;
  v_kind:=(p_data->>'kind')::app.allocation_kind;
  effective:=coalesce(nullif(p_data->>'valid_from','')::timestamptz,at);
  IF effective<at-interval '5 minutes' THEN RAISE EXCEPTION 'Backdated allocation changes are not supported' USING ERRCODE='22023'; END IF;
  effective:=greatest(effective,at);until_at:=nullif(p_data->>'valid_until','')::timestamptz;
  IF until_at<=effective THEN RAISE EXCEPTION 'End must follow start' USING ERRCODE='22023'; END IF;
 ELSE
  SELECT * INTO old FROM app.asset_allocations WHERE tenant_id=p_tenant AND id=(p_data->>'id')::uuid FOR UPDATE;
  IF old.id IS NULL THEN RAISE EXCEPTION 'Unknown allocation' USING ERRCODE='42501'; END IF;
  IF old.cancelled_at IS NOT NULL OR old.valid_until<=at THEN RAISE EXCEPTION 'Allocation is not open' USING ERRCODE='22023'; END IF;
  property:=old.property_id;community:=old.community_id;item:=old.id;
  effective:=greatest(old.valid_from,at);until_at:=old.valid_until;
  IF p_action='cancel' AND old.valid_from<=at THEN RAISE EXCEPTION 'End a current allocation; cancel only a future one' USING ERRCODE='22023'; END IF;
  IF p_action='end' THEN
   IF old.valid_from>at THEN RAISE EXCEPTION 'Cancel a future allocation instead' USING ERRCODE='22023'; END IF;
   until_at:=coalesce(nullif(p_data->>'valid_until','')::timestamptz,at);
   IF until_at<at-interval '5 minutes' THEN RAISE EXCEPTION 'Backdated end is not supported' USING ERRCODE='22023'; END IF;
   until_at:=greatest(until_at,at,old.valid_from+interval '1 microsecond');
   IF until_at<=old.valid_from OR (old.valid_until IS NOT NULL AND until_at>old.valid_until) THEN RAISE EXCEPTION 'An end cannot extend an allocation' USING ERRCODE='22023'; END IF;
  END IF;
 END IF;
 -- Changing one's own current/future asset entitlement requires another administrator.
 IF EXISTS(SELECT 1 FROM app.memberships m JOIN app.property_relationships r ON (r.tenant_id,r.person_id)=(m.tenant_id,m.person_id)
  WHERE m.tenant_id=p_tenant AND m.id=actor AND r.property_id=property AND (r.valid_until IS NULL OR r.valid_until>at)
  AND tstzrange(r.valid_from,r.valid_until,'[)') && tstzrange(effective,CASE WHEN p_action='end' THEN old.valid_until ELSE until_at END,'[)'))
 THEN RAISE EXCEPTION 'Self asset entitlement changes denied' USING ERRCODE='42501'; END IF;
 IF p_action='assign' THEN
  IF EXISTS(SELECT 1 FROM app.asset_allocations x WHERE x.tenant_id=p_tenant AND x.asset_id=asset.id AND x.property_id=property AND x.kind=v_kind AND x.cancelled_at IS NULL
   AND tstzrange(x.valid_from,x.valid_until,'[)') && tstzrange(effective,until_at,'[)'))
  THEN RAISE EXCEPTION 'Overlapping duplicate allocation' USING ERRCODE='23505'; END IF;
  INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from,valid_until)
   VALUES(p_tenant,community,asset.id,property,v_kind,effective,until_at) RETURNING id INTO item;
 ELSIF p_action='end' THEN UPDATE app.asset_allocations SET valid_until=until_at WHERE tenant_id=p_tenant AND id=item;
 ELSE UPDATE app.asset_allocations SET cancelled_at=at WHERE tenant_id=p_tenant AND id=item; END IF;
 result:=jsonb_build_object('id',item,'action',p_action);
 PERFORM app.registry_finish(p_tenant,actor,event,jsonb_build_object('allocation_id',item,'asset_id',coalesce(asset.id,old.asset_id),'property_id',property,'reason',p_reason,'valid_until',until_at),result);
 RETURN result;
END $$;

CREATE FUNCTION app.allocation_records(t uuid,p uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('asset_code',a.code,'asset_label',a.label,'property_code',q.code,'property_label',q.label,'time_zone',c.time_zone,
 'status',CASE WHEN x.cancelled_at IS NOT NULL THEN 'cancelled' WHEN x.valid_until<=statement_timestamp() THEN 'ended' WHEN x.valid_from>statement_timestamp() THEN 'scheduled' ELSE 'current' END) ORDER BY x.valid_from,x.id),'[]')
 FROM app.asset_allocations x JOIN app.assets a ON (a.tenant_id,a.community_id,a.id)=(x.tenant_id,x.community_id,x.asset_id)
 JOIN app.properties q ON (q.tenant_id,q.id)=(x.tenant_id,x.property_id)
 JOIN app.communities c ON (c.tenant_id,c.id)=(x.tenant_id,x.community_id)
 WHERE x.tenant_id=t AND (p IS NULL OR (x.property_id=p AND x.cancelled_at IS NULL AND a.is_active AND x.valid_from<=statement_timestamp() AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())))
$$;
CREATE FUNCTION public.enclavix_s03_allocations(p_tenant uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF app.registry_actor(p_tenant) IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN app.allocation_records(p_tenant);
END $$;
CREATE FUNCTION public.enclavix_s03_property_allocations(p_tenant uuid,p_property uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT app.property_access(p_tenant,p_property) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN app.allocation_records(p_tenant,p_property);
END $$;
REVOKE ALL ON FUNCTION app.allocation_records(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.enclavix_s03_allocation(uuid,text,jsonb,text),public.enclavix_s03_allocations(uuid),public.enclavix_s03_property_allocations(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_s03_allocation(uuid,text,jsonb,text),public.enclavix_s03_allocations(uuid),public.enclavix_s03_property_allocations(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enclavix_s03_index() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('operator',app.assured() AND EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=app.principal() AND enabled),
 'contexts',(SELECT coalesce(jsonb_agg(x.value||jsonb_build_object('time_zone',t.time_zone,'communities',(SELECT coalesce(jsonb_agg(y.value||jsonb_build_object('time_zone',c.time_zone)),'[]') FROM jsonb_array_elements(x.value->'communities') y JOIN app.communities c ON c.tenant_id=t.id AND c.id=(y.value->>'id')::uuid))),'[]') FROM jsonb_array_elements(public.enclavix_contexts()) x JOIN app.tenants t ON t.id=(x.value->>'tenant_id')::uuid),
 'setups',(SELECT coalesce(jsonb_agg(jsonb_build_object('tenant_id',s.tenant_id,'name',t.legal_name,'status',t.status,'revision',s.revision,'submitted',s.submitted_revision=s.revision,'administrator',app.registry_actor(s.tenant_id) IS NOT NULL,'creator',s.created_by_operator=app.principal())),'[]') FROM app.association_setup s JOIN app.tenants t ON t.id=s.tenant_id
 WHERE app.assured() AND (app.registry_actor(s.tenant_id) IS NOT NULL OR EXISTS(SELECT 1 FROM app.platform_operators WHERE auth_user_id=app.principal() AND enabled))))
$$;

CREATE OR REPLACE FUNCTION public.enclavix_s03_property(p_tenant uuid,p_property uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE member uuid:=app.member(p_tenant); person uuid;
BEGIN
 IF NOT app.property_access(p_tenant,p_property) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT person_id INTO person FROM app.memberships WHERE tenant_id=p_tenant AND id=member;
 RETURN jsonb_build_object('time_zone',(SELECT c.time_zone FROM app.properties q JOIN app.communities c ON (c.tenant_id,c.id)=(q.tenant_id,q.community_id) WHERE q.tenant_id=p_tenant AND q.id=p_property),'property',(SELECT jsonb_build_object('id',id,'community_id',community_id,'code',code,'label',label,'kind',kind,'lot_area_sqm',lot_area_sqm::text,'floor_area_sqm',floor_area_sqm::text) FROM app.properties WHERE tenant_id=p_tenant AND id=p_property),
 'relationships',(SELECT coalesce(jsonb_agg(jsonb_build_object('kind',kind,'valid_from',valid_from,'valid_until',valid_until)),'[]') FROM app.property_relationships WHERE tenant_id=p_tenant AND property_id=p_property AND person_id=person AND valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp())));
END $$;
