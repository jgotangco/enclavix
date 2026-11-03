-- S04 private receivables. No public prototype invoice or browser balance is authoritative.
CREATE TABLE app.finance_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('policy','rule','generation','payment','charge','credit','refund','reverse','close','reopen','opening','dispute','resolve','allocate')),
 payload jsonb NOT NULL, prepared_by uuid NOT NULL, reason text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 decided_by uuid, decision_reason text, created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,community_id,id),
 FOREIGN KEY(tenant_id,community_id) REFERENCES app.communities(tenant_id,id),
 FOREIGN KEY(tenant_id,prepared_by) REFERENCES app.memberships(tenant_id,id),
 FOREIGN KEY(tenant_id,decided_by) REFERENCES app.memberships(tenant_id,id),
 CHECK(decided_by IS NULL OR decided_by<>prepared_by), CHECK((status='pending')=(decided_by IS NULL))
);
CREATE TABLE app.finance_policies (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, community_id uuid NOT NULL,
 approval_limit numeric(14,2) NOT NULL CHECK(approval_limit>0 AND approval_limit<>'NaN'),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,community_id,id) REFERENCES app.finance_requests(tenant_id,community_id,id)
);
CREATE TABLE app.finance_rules (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, community_id uuid NOT NULL, code text NOT NULL,
 label text NOT NULL CHECK(length(label) BETWEEN 1 AND 200), basis text NOT NULL,
 rate numeric(20,8) NOT NULL CHECK(rate>=0 AND rate<>'NaN'),
 effective_from date NOT NULL, effective_until date, recurring boolean NOT NULL, category text NOT NULL,
 asset_kind app.asset_kind, grace_days integer NOT NULL DEFAULT 0 CHECK(grace_days BETWEEN 0 AND 365),
 cap numeric(14,2), due_days integer NOT NULL DEFAULT 0 CHECK(due_days BETWEEN 0 AND 365),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,community_id,code,effective_from),
 FOREIGN KEY(tenant_id,community_id,id) REFERENCES app.finance_requests(tenant_id,community_id,id),
 CHECK(basis IN ('fixed','lot_area','floor_area','ownership_share','asset_quantity','outstanding_percent')),
 CHECK(category IN ('dues','special','asset','discount','penalty','pass_through')),
 CHECK(effective_until IS NULL OR effective_until>effective_from),
 CHECK((basis='outstanding_percent')=(category='penalty')),
 CHECK(basis<>'outstanding_percent' OR (cap>0 AND cap<>'NaN' AND rate<=100)),
 CHECK((basis='asset_quantity')=(asset_kind IS NOT NULL))
);
CREATE TABLE app.finance_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL,
 period date NOT NULL CHECK(extract(day FROM period)=1), closed boolean NOT NULL DEFAULT false,
 changed_by_request uuid NOT NULL, UNIQUE(tenant_id,community_id,period),
 FOREIGN KEY(tenant_id,community_id,changed_by_request) REFERENCES app.finance_requests(tenant_id,community_id,id)
);
CREATE TABLE app.finance_batches (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, community_id uuid NOT NULL, period date NOT NULL,
 total numeric(14,2) NOT NULL, line_count integer NOT NULL, fingerprint text NOT NULL, cancelled boolean NOT NULL DEFAULT false,
 UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,community_id,id) REFERENCES app.finance_requests(tenant_id,community_id,id)
);
CREATE UNIQUE INDEX finance_current_batch ON app.finance_batches(tenant_id,community_id,period) WHERE NOT cancelled;
CREATE TABLE app.finance_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL,
 batch_id uuid NOT NULL, property_id uuid NOT NULL, rule_id uuid NOT NULL,
 amount numeric(14,2) NOT NULL CHECK(amount<>0 AND amount<>'NaN'), snapshot jsonb NOT NULL, due_on date NOT NULL,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,batch_id,property_id,rule_id),
 FOREIGN KEY(tenant_id,batch_id) REFERENCES app.finance_batches(tenant_id,id),
 FOREIGN KEY(tenant_id,rule_id) REFERENCES app.finance_rules(tenant_id,id),
 FOREIGN KEY(tenant_id,community_id,property_id) REFERENCES app.properties(tenant_id,community_id,id)
);
CREATE TABLE app.finance_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL, property_id uuid NOT NULL,
 request_id uuid NOT NULL, line_id uuid, kind text NOT NULL CHECK(kind IN ('charge','credit','payment','refund','reversal','opening')),
 amount numeric(14,2) NOT NULL CHECK(amount<>0 AND amount<>'NaN'), posted_on date NOT NULL, due_on date NOT NULL,
 label text NOT NULL, snapshot jsonb NOT NULL, reversal_of uuid, receipt_number bigint,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,community_id,property_id,id),
 UNIQUE(tenant_id,line_id), UNIQUE(tenant_id,reversal_of), UNIQUE(tenant_id,receipt_number),
 FOREIGN KEY(tenant_id,community_id,property_id) REFERENCES app.properties(tenant_id,community_id,id),
 FOREIGN KEY(tenant_id,community_id,request_id) REFERENCES app.finance_requests(tenant_id,community_id,id),
 FOREIGN KEY(tenant_id,line_id) REFERENCES app.finance_lines(tenant_id,id),
 FOREIGN KEY(tenant_id,community_id,property_id,reversal_of) REFERENCES app.finance_entries(tenant_id,community_id,property_id,id)
);
CREATE UNIQUE INDEX finance_one_post_per_request ON app.finance_entries(tenant_id,request_id) WHERE line_id IS NULL AND kind<>'opening';
CREATE TABLE app.finance_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL, property_id uuid NOT NULL,
 debit_id uuid NOT NULL, credit_id uuid NOT NULL, amount numeric(14,2) NOT NULL CHECK(amount<>0 AND amount<>'NaN'),
 request_id uuid NOT NULL, reversal_of uuid, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,reversal_of),
 FOREIGN KEY(tenant_id,community_id,property_id,debit_id) REFERENCES app.finance_entries(tenant_id,community_id,property_id,id),
 FOREIGN KEY(tenant_id,community_id,property_id,credit_id) REFERENCES app.finance_entries(tenant_id,community_id,property_id,id),
 FOREIGN KEY(tenant_id,request_id) REFERENCES app.finance_requests(tenant_id,id),
 FOREIGN KEY(tenant_id,reversal_of) REFERENCES app.finance_allocations(tenant_id,id), CHECK(debit_id<>credit_id)
);
CREATE TABLE app.finance_sequences (tenant_id uuid PRIMARY KEY REFERENCES app.tenants(id), next_number bigint NOT NULL DEFAULT 1 CHECK(next_number>0));
CREATE TABLE app.finance_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, community_id uuid NOT NULL, property_id uuid NOT NULL,
 submitted_by uuid NOT NULL, amount numeric(14,2) NOT NULL CHECK(amount>0 AND amount<>'NaN'),
 paid_on date NOT NULL, method text NOT NULL CHECK(length(method) BETWEEN 1 AND 80), reference text NOT NULL CHECK(length(reference) BETWEEN 1 AND 120),
 document_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,document_id),
 FOREIGN KEY(tenant_id,community_id,property_id) REFERENCES app.properties(tenant_id,community_id,id),
 FOREIGN KEY(tenant_id,submitted_by) REFERENCES app.memberships(tenant_id,id),
 FOREIGN KEY(tenant_id,document_id) REFERENCES app.document_objects(tenant_id,id)
);
CREATE INDEX finance_duplicate_reference ON app.finance_submissions(tenant_id,reference);
CREATE UNIQUE INDEX finance_one_submission_review ON app.finance_requests(tenant_id,(payload->>'submission_id')) WHERE kind='payment' AND status<>'rejected';
CREATE UNIQUE INDEX finance_one_fine ON app.finance_entries(tenant_id,(snapshot->>'fine_key')) WHERE snapshot->>'fine_key' IS NOT NULL;
CREATE UNIQUE INDEX finance_one_reassessment ON app.finance_entries(tenant_id,(snapshot->>'reassessment_of')) WHERE snapshot->>'reassessment_of' IS NOT NULL;
CREATE UNIQUE INDEX finance_opening_source ON app.finance_entries(tenant_id,(snapshot->>'source_key'),property_id) WHERE kind='opening';

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['finance_requests','finance_policies','finance_rules','finance_periods','finance_batches','finance_lines','finance_entries','finance_allocations','finance_sequences','finance_submissions'] LOOP
  EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC,anon,authenticated,service_role',t);
  IF t IN ('finance_policies','finance_rules','finance_lines','finance_entries','finance_allocations','finance_submissions') THEN
   EXECUTE format('CREATE TRIGGER finance_append_only BEFORE UPDATE OR DELETE ON app.%I FOR EACH ROW EXECUTE FUNCTION app.keep_audit()',t);
  END IF;
 END LOOP;
END $$;
CREATE TRIGGER finance_request_identity BEFORE UPDATE ON app.finance_requests FOR EACH ROW EXECUTE FUNCTION app.keep_identity('id','tenant_id','community_id','kind','payload','prepared_by','reason','created_at');
CREATE TRIGGER finance_batch_identity BEFORE UPDATE ON app.finance_batches FOR EACH ROW EXECUTE FUNCTION app.keep_identity('id','tenant_id','community_id','period','total','line_count','fingerprint');
CREATE TRIGGER finance_batch_no_delete BEFORE DELETE ON app.finance_batches FOR EACH ROW EXECUTE FUNCTION app.keep_audit();
CREATE TRIGGER finance_period_identity BEFORE UPDATE ON app.finance_periods FOR EACH ROW EXECUTE FUNCTION app.keep_identity('id','tenant_id','community_id','period');
CREATE FUNCTION app.finance_final_decision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN IF TG_OP='DELETE' OR OLD.status<>'pending' THEN RAISE EXCEPTION 'Finance decisions are final' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER finance_decision_final BEFORE UPDATE OR DELETE ON app.finance_requests FOR EACH ROW EXECUTE FUNCTION app.finance_final_decision();

CREATE FUNCTION app.finance_decimal(s text,places integer DEFAULT 2) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
BEGIN
 IF s IS NULL OR s !~ ('^(0|[1-9][0-9]{0,11})(\.[0-9]{1,'||places||'})?$') THEN RAISE EXCEPTION 'Invalid decimal string' USING ERRCODE='22023'; END IF;
 RETURN s::numeric;
END $$;
CREATE FUNCTION app.finance_date(s text) RETURNS date LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE d date; BEGIN
 IF s IS NULL OR s !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'ISO date required' USING ERRCODE='22023'; END IF;
 d:=s::date; IF to_char(d,'YYYY-MM-DD')<>s THEN RAISE EXCEPTION 'Invalid date' USING ERRCODE='22023'; END IF; RETURN d;
END $$;
CREATE FUNCTION app.finance_signed_decimal(s text) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
BEGIN RETURN CASE WHEN left(s,1)='-' THEN -app.finance_decimal(substr(s,2)) ELSE app.finance_decimal(s) END; END $$;
CREATE FUNCTION app.finance_staff(t uuid,c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT app.role_at(t,'finance_preparer',c) OR app.role_at(t,'finance_approver',c) OR app.role_at(t,'board_reviewer',c)
$$;
CREATE FUNCTION app.require_finance(t uuid,c uuid,r app.system_role,reason text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(t::text,0)); actor:=app.member(t);
 IF actor IS NULL OR NOT app.assured() OR NOT app.role_at(t,r,c) OR reason IS NULL OR length(btrim(reason)) NOT BETWEEN 10 AND 1000
 OR NOT EXISTS(SELECT 1 FROM app.communities WHERE tenant_id=t AND id=c)
 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'session_id')::uuid AND created_at>statement_timestamp()-interval '10 minutes')
 THEN RAISE EXCEPTION 'Recent finance MFA and reason required' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
-- Current billing entitlement plus historical entitlement: a transfer does not expose a predecessor's statements.
CREATE FUNCTION app.finance_property(t uuid,p uuid,on_date date DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.properties q JOIN app.communities c ON (c.tenant_id,c.id)=(q.tenant_id,q.community_id)
 WHERE q.tenant_id=t AND q.id=p AND q.is_active AND (app.finance_staff(t,q.community_id) OR
 (app.role_at(t,'resident',q.community_id) AND EXISTS(SELECT 1 FROM app.property_relationships x JOIN app.memberships m ON (m.tenant_id,m.person_id)=(x.tenant_id,x.person_id)
 WHERE x.tenant_id=t AND x.property_id=p AND m.id=app.member(t) AND x.valid_from<=statement_timestamp() AND (x.valid_until IS NULL OR x.valid_until>statement_timestamp())
 AND (on_date IS NULL OR (x.valid_from AT TIME ZONE c.time_zone)::date<=on_date)
 AND (x.kind<>'representative' OR EXISTS(SELECT 1 FROM app.property_relationships ro WHERE ro.tenant_id=t AND ro.property_id=p AND ro.person_id=x.represented_person_id AND ro.kind='owner' AND ro.valid_from<=statement_timestamp() AND (ro.valid_until IS NULL OR ro.valid_until>statement_timestamp()) AND (on_date IS NULL OR (ro.valid_from AT TIME ZONE c.time_zone)::date<=on_date)))
 AND (x.kind='owner' OR x.is_billing_responsible OR (x.kind='representative' AND EXISTS(SELECT 1 FROM app.property_relationships o WHERE o.tenant_id=t AND o.property_id=p AND o.person_id=x.represented_person_id AND o.kind='owner' AND o.valid_from<=statement_timestamp() AND (o.valid_until IS NULL OR o.valid_until>statement_timestamp()) AND (on_date IS NULL OR (o.valid_from AT TIME ZONE c.time_zone)::date<=on_date))))))))
$$;
CREATE FUNCTION app.finance_open(t uuid,c uuid,d date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM app.finance_periods WHERE tenant_id=t AND community_id=c AND period=date_trunc('month',d)::date AND closed)
 THEN RAISE EXCEPTION 'Financial period closed' USING ERRCODE='23514'; END IF;
END $$;
CREATE FUNCTION app.finance_finish(t uuid,actor uuid,event text,result jsonb,reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN PERFORM app.record_access(t,actor,event,jsonb_build_object('result',result,'reason',reason));
 UPDATE app.operation_requests o SET result=finance_finish.result WHERE o.tenant_id=t AND o.id=nullif(current_setting('enclavix.operation_id',true),'')::uuid;
END $$;
CREATE FUNCTION app.finance_opening_preview(t uuid,c uuid,items jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE x jsonb; n integer:=0; issues jsonb:='[]'; rows jsonb:='[]'; total numeric:=0; value numeric; code text; BEGIN
 IF jsonb_typeof(items) IS DISTINCT FROM 'array' OR jsonb_array_length(items) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Opening import requires 1 to 1000 rows' USING ERRCODE='22023'; END IF;
 FOR x IN SELECT v FROM jsonb_array_elements(items) v LOOP
  n:=n+1; BEGIN
   PERFORM app.only_keys(x,ARRAY['property_id','amount','direction']);
   IF jsonb_typeof(x->'amount') IS DISTINCT FROM 'string' OR coalesce(x->>'direction','') NOT IN ('debit','credit') THEN RAISE EXCEPTION 'Amount string and debit/credit direction required' USING ERRCODE='22023'; END IF;
   value:=app.finance_decimal(x->>'amount'); IF value<=0 THEN RAISE EXCEPTION 'Positive opening amount required' USING ERRCODE='22023'; END IF;
   SELECT p.code INTO code FROM app.properties p WHERE p.tenant_id=t AND p.community_id=c AND p.id=(x->>'property_id')::uuid AND p.is_active;
   IF code IS NULL THEN RAISE EXCEPTION 'Unknown scoped property' USING ERRCODE='22023'; END IF;
   IF (SELECT count(*) FROM jsonb_array_elements(items) v WHERE v->>'property_id'=x->>'property_id')>1 THEN RAISE EXCEPTION 'Duplicate property row' USING ERRCODE='22023'; END IF;
   total:=total+value*CASE WHEN x->>'direction'='credit' THEN -1 ELSE 1 END;
   rows:=rows||jsonb_build_array(jsonb_build_object('row',n,'property_code',code,'amount',value::text,'direction',x->>'direction','status','valid'));
  EXCEPTION WHEN invalid_text_representation OR invalid_parameter_value OR numeric_value_out_of_range THEN
   issues:=issues||jsonb_build_array(jsonb_build_object('row',n,'message',SQLERRM)); rows:=rows||jsonb_build_array(jsonb_build_object('row',n,'status','invalid'));
  END;
 END LOOP;
 RETURN jsonb_build_object('rows',rows,'issues',issues,'valid',jsonb_array_length(issues)=0,'total',total::text,'source_sha256',encode(sha256(convert_to(items::text,'UTF8')),'hex'));
END $$;
CREATE FUNCTION public.enclavix_finance_opening_preview(p_tenant uuid,p_community uuid,p_rows jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN PERFORM app.require_finance(p_tenant,p_community,'finance_preparer',p_reason); RETURN app.finance_opening_preview(p_tenant,p_community,p_rows); END $$;
CREATE FUNCTION app.finance_available(t uuid,e uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT abs(x.amount)-coalesce((SELECT sum(a.amount) FROM app.finance_allocations a WHERE a.tenant_id=t AND (a.debit_id=e OR a.credit_id=e)),0)
 FROM app.finance_entries x WHERE x.tenant_id=t AND x.id=e AND x.kind<>'reversal' AND NOT EXISTS(SELECT 1 FROM app.finance_entries r WHERE r.tenant_id=t AND r.reversal_of=e)
$$;
CREATE FUNCTION app.finance_allocate(t uuid,req uuid,credit uuid,items jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cr app.finance_entries; dr app.finance_entries; x jsonb; n numeric; posting date; BEGIN
 SELECT coalesce((payload->>'posted_on')::date,(payload->>'period')::date) INTO posting FROM app.finance_requests WHERE tenant_id=t AND id=req;
 SELECT * INTO cr FROM app.finance_entries WHERE tenant_id=t AND id=credit AND amount<0;
 IF cr.id IS NULL OR jsonb_typeof(items) IS DISTINCT FROM 'array' OR jsonb_array_length(items)>1000 THEN RAISE EXCEPTION 'Invalid allocations' USING ERRCODE='22023'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(items) LOOP
  PERFORM app.only_keys(x,ARRAY['charge_id','amount']); n:=app.finance_decimal(x->>'amount');
  SELECT * INTO dr FROM app.finance_entries WHERE tenant_id=t AND id=(x->>'charge_id')::uuid AND property_id=cr.property_id AND community_id=cr.community_id AND amount>0;
  IF dr.id IS NULL OR posting IS NULL OR dr.posted_on>posting OR cr.posted_on>posting OR n<=0 OR coalesce(app.finance_available(t,credit),0)<n OR coalesce(app.finance_available(t,dr.id),0)<n THEN RAISE EXCEPTION 'Allocation exceeds available balance or scope' USING ERRCODE='23514'; END IF;
  INSERT INTO app.finance_allocations(tenant_id,community_id,property_id,debit_id,credit_id,amount,request_id) VALUES(t,cr.community_id,cr.property_id,dr.id,credit,n,req);
 END LOOP;
END $$;

-- Trusted assessment snapshot; called under tenant lock by prepare, never with browser amounts.
CREATE FUNCTION app.finance_plan(t uuid,c uuid,d date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE q app.properties; r app.finance_rules; n numeric; qty numeric; base numeric; lines jsonb:='[]'; BEGIN
 FOR q IN SELECT * FROM app.properties WHERE tenant_id=t AND community_id=c AND is_active ORDER BY id LOOP
  FOR r IN SELECT DISTINCT ON(code) * FROM app.finance_rules WHERE tenant_id=t AND community_id=c AND effective_from<=d ORDER BY code,effective_from DESC LOOP
   IF (r.effective_until IS NOT NULL AND r.effective_until<=d) OR (NOT r.recurring AND date_trunc('month',r.effective_from)::date<>d) THEN CONTINUE; END IF;
   qty:=CASE r.basis WHEN 'fixed' THEN 1 WHEN 'lot_area' THEN q.lot_area_sqm WHEN 'floor_area' THEN q.floor_area_sqm WHEN 'ownership_share' THEN q.ownership_share ELSE NULL END;
   IF r.basis='asset_quantity' THEN SELECT count(DISTINCT x.asset_id) INTO qty FROM app.asset_allocations x JOIN app.assets a ON (a.tenant_id,a.community_id,a.id)=(x.tenant_id,x.community_id,x.asset_id)
    JOIN app.communities com ON com.tenant_id=t AND com.id=c WHERE x.tenant_id=t AND x.property_id=q.id AND a.kind=r.asset_kind AND a.is_active AND x.cancelled_at IS NULL AND x.valid_from<=d::timestamp AT TIME ZONE com.time_zone AND (x.valid_until IS NULL OR x.valid_until>d::timestamp AT TIME ZONE com.time_zone); END IF;
   IF r.basis='outstanding_percent' THEN
    SELECT coalesce(sum(app.finance_available(t,e.id)),0) INTO base FROM app.finance_entries e WHERE e.tenant_id=t AND e.property_id=q.id AND e.amount>0 AND e.kind<>'reversal' AND e.posted_on<d AND e.due_on<d-r.grace_days
    AND NOT EXISTS(SELECT 1 FROM app.finance_requests z WHERE z.tenant_id=t AND z.kind='dispute' AND z.status='approved' AND z.payload->>'entry_id'=e.id::text AND NOT EXISTS(SELECT 1 FROM app.finance_requests y WHERE y.tenant_id=t AND y.kind='resolve' AND y.status='approved' AND y.payload->>'dispute_id'=z.id::text));
    qty:=base/100;
   END IF;
   IF qty IS NULL THEN RAISE EXCEPTION 'Missing assessment dimension for property %',q.code USING ERRCODE='22023'; END IF;
   n:=round(r.rate*qty,2); IF r.basis='outstanding_percent' THEN n:=least(n,r.cap); END IF;
   IF n>999999999999.99 THEN RAISE EXCEPTION 'Assessment range exceeded' USING ERRCODE='22003'; END IF;
   IF r.category='discount' THEN n:=-n; END IF;
   IF n<>0 THEN lines:=lines||jsonb_build_array(jsonb_build_object('property_id',q.id,'rule_id',r.id,'amount',n::text,'due_on',d+r.due_days,'snapshot',jsonb_build_object('rule_id',r.id,'code',r.code,'label',r.label,'basis',r.basis,'category',r.category,'rate',r.rate::text,'quantity',qty::text,'period',d)));
   END IF;
   IF jsonb_array_length(lines)>10000 THEN RAISE EXCEPTION 'Generation exceeds 10000 lines; split community scope' USING ERRCODE='22023'; END IF;
  END LOOP;
 END LOOP;
 RETURN lines;
END $$;

CREATE FUNCTION public.enclavix_finance_prepare(p_tenant uuid,p_community uuid,p_kind text,p_data jsonb,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=app.require_finance(p_tenant,p_community,'finance_preparer',p_reason); event text:='finance.prepare'; item uuid; d date; amount numeric; lines jsonb; x jsonb; prop uuid; sub app.finance_submissions; e app.finance_entries; BEGIN
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('community',p_community,'kind',p_kind,'data',p_data,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 CASE p_kind
 WHEN 'policy' THEN PERFORM app.only_keys(p_data,ARRAY['approval_limit']); amount:=app.finance_decimal(p_data->>'approval_limit'); IF amount<=0 THEN RAISE EXCEPTION 'Positive approval limit required' USING ERRCODE='22023'; END IF;
 WHEN 'rule' THEN
  PERFORM app.only_keys(p_data,ARRAY['code','label','basis','rate','effective_from','effective_until','recurring','category','asset_kind','grace_days','cap','due_days']);
  PERFORM app.finance_decimal(p_data->>'rate',8); d:=app.finance_date(p_data->>'effective_from'); IF extract(day FROM d)<>1 OR (p_data->>'effective_until' IS NOT NULL AND extract(day FROM app.finance_date(p_data->>'effective_until'))<>1) THEN RAISE EXCEPTION 'Monthly rules require period boundary effective dates' USING ERRCODE='22023'; END IF;
  IF p_data->>'effective_until' IS NOT NULL THEN PERFORM app.finance_date(p_data->>'effective_until'); END IF;
  IF EXISTS(SELECT 1 FROM app.finance_batches WHERE tenant_id=p_tenant AND community_id=p_community AND NOT cancelled AND period>=date_trunc('month',d)::date) THEN RAISE EXCEPTION 'Rule changes cannot alter a snapshotted period' USING ERRCODE='23514'; END IF;
  IF p_data->>'cap' IS NOT NULL THEN PERFORM app.finance_decimal(p_data->>'cap'); END IF;
  -- Validate with table constraints without publishing a rule; full validation occurs atomically on approval.
  IF coalesce(p_data->>'basis','') NOT IN ('fixed','lot_area','floor_area','ownership_share','asset_quantity','outstanding_percent') OR coalesce(p_data->>'category','') NOT IN ('dues','special','asset','discount','penalty','pass_through') OR coalesce(length(p_data->>'label'),0) NOT BETWEEN 1 AND 200 OR jsonb_typeof(p_data->'recurring') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid rule' USING ERRCODE='22023'; END IF;
  p_data:=p_data||jsonb_build_object('code',app.canonical_code(p_data->>'code'));
 WHEN 'generation' THEN
  PERFORM app.only_keys(p_data,ARRAY['period']); d:=app.finance_date(p_data->>'period'); IF extract(day FROM d)<>1 THEN RAISE EXCEPTION 'Period must start on day one' USING ERRCODE='22023'; END IF;
  PERFORM app.finance_open(p_tenant,p_community,d);
  IF EXISTS(SELECT 1 FROM app.finance_batches WHERE tenant_id=p_tenant AND community_id=p_community AND NOT cancelled AND period=d) THEN RAISE EXCEPTION 'Period already snapshotted; resume existing batch' USING ERRCODE='23505'; END IF;
  lines:=app.finance_plan(p_tenant,p_community,d); p_data:=p_data||jsonb_build_object('lines',lines,'total',(SELECT coalesce(sum((v->>'amount')::numeric),0)::text FROM jsonb_array_elements(lines) v),'fingerprint',encode(sha256(convert_to(lines::text,'UTF8')),'hex'));
 WHEN 'payment' THEN
  PERFORM app.only_keys(p_data,ARRAY['submission_id','allocations','duplicate_review']);
  SELECT * INTO sub FROM app.finance_submissions WHERE tenant_id=p_tenant AND community_id=p_community AND id=(p_data->>'submission_id')::uuid;
  IF sub.id IS NULL OR actor=sub.submitted_by THEN RAISE EXCEPTION 'Independent evidence review required' USING ERRCODE='42501'; END IF;
  IF coalesce(length(btrim(p_data->>'duplicate_review')),0) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'Duplicate review reason required' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM app.document_objects WHERE tenant_id=p_tenant AND id=sub.document_id AND scan_status='clean') THEN RAISE EXCEPTION 'Clean private proof required' USING ERRCODE='23514'; END IF;
  p_data:=p_data||jsonb_build_object('property_id',sub.property_id,'amount',sub.amount::text,'posted_on',sub.paid_on,'document_id',sub.document_id);
 WHEN 'charge','credit' THEN
  PERFORM app.only_keys(p_data,ARRAY['property_id','amount','posted_on','due_on','label','allocations','fine_key','reassessment_of']);
  amount:=app.finance_decimal(p_data->>'amount'); IF amount<=0 THEN RAISE EXCEPTION 'Positive amount required' USING ERRCODE='22023'; END IF;
  IF coalesce(length(btrim(p_data->>'label')),0) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Label required' USING ERRCODE='22023'; END IF;
  IF p_data ? 'fine_key' AND coalesce(p_data->>'fine_key','') !~ '^[A-Za-z0-9._:-]{1,120}$' THEN RAISE EXCEPTION 'Durable fine key required' USING ERRCODE='22023'; END IF;
  IF p_data ? 'reassessment_of' THEN
   SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND community_id=p_community AND property_id=(p_data->>'property_id')::uuid AND id=(p_data->>'reassessment_of')::uuid AND snapshot->>'fine_key' IS NOT NULL;
   IF p_kind<>'charge' OR p_data->>'fine_key' IS NULL OR e.id IS NULL OR NOT EXISTS(SELECT 1 FROM app.finance_entries WHERE tenant_id=p_tenant AND reversal_of=e.id) THEN RAISE EXCEPTION 'Reassessment requires a formally reversed fine on this property' USING ERRCODE='23514'; END IF;
  END IF;
  IF p_kind='credit' AND p_data->>'fine_key' IS NOT NULL THEN RAISE EXCEPTION 'Fine requires a reviewed debit' USING ERRCODE='22023'; END IF;
  PERFORM app.finance_date(p_data->>'due_on'); PERFORM app.finance_date(p_data->>'posted_on');
 WHEN 'allocate' THEN
  PERFORM app.only_keys(p_data,ARRAY['credit_id','allocations','posted_on']);
  SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND community_id=p_community AND id=(p_data->>'credit_id')::uuid AND app.finance_entries.amount<0;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Unknown credit' USING ERRCODE='42501'; END IF;
  PERFORM app.finance_date(p_data->>'posted_on');
  p_data:=p_data||jsonb_build_object('property_id',e.property_id,'amount',abs(e.amount)::text);
 WHEN 'refund' THEN
  PERFORM app.only_keys(p_data,ARRAY['credit_id','amount','posted_on','label']); amount:=app.finance_decimal(p_data->>'amount');
  SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND community_id=p_community AND id=(p_data->>'credit_id')::uuid AND app.finance_entries.amount<0;
  IF e.id IS NULL OR amount<=0 THEN RAISE EXCEPTION 'Unknown refundable credit' USING ERRCODE='22023'; END IF;
  PERFORM app.finance_date(p_data->>'posted_on'); p_data:=p_data||jsonb_build_object('property_id',e.property_id);
 WHEN 'reverse','dispute' THEN
  PERFORM app.only_keys(p_data,ARRAY['entry_id','posted_on']); SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND community_id=p_community AND id=(p_data->>'entry_id')::uuid AND kind<>'reversal';
  IF e.id IS NULL THEN RAISE EXCEPTION 'Unknown entry' USING ERRCODE='42501'; END IF;
  PERFORM app.finance_date(p_data->>'posted_on'); p_data:=p_data||jsonb_build_object('property_id',e.property_id,'amount',abs(e.amount)::text);
 WHEN 'resolve' THEN
  PERFORM app.only_keys(p_data,ARRAY['dispute_id']); IF NOT EXISTS(SELECT 1 FROM app.finance_requests WHERE tenant_id=p_tenant AND community_id=p_community AND kind='dispute' AND status='approved' AND id=(p_data->>'dispute_id')::uuid) THEN RAISE EXCEPTION 'Unknown dispute' USING ERRCODE='42501'; END IF;
 WHEN 'close','reopen' THEN
  PERFORM app.only_keys(p_data,ARRAY['period']); d:=app.finance_date(p_data->>'period'); IF extract(day FROM d)<>1 THEN RAISE EXCEPTION 'Period must start on day one' USING ERRCODE='22023'; END IF;
 WHEN 'opening' THEN
  PERFORM app.only_keys(p_data,ARRAY['source_key','source_sha256','source_file_sha256','posted_on','rows','expected_total','signoff']);
  IF coalesce(p_data->>'source_key','') !~ '^[A-Za-z0-9._:-]{1,120}$' OR coalesce(p_data->>'source_sha256','') !~ '^[a-f0-9]{64}$' OR coalesce(length(btrim(p_data->>'signoff')),0)<10 OR jsonb_typeof(p_data->'rows') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'rows') NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Opening provenance and rows required' USING ERRCODE='22023'; END IF;
  PERFORM app.finance_date(p_data->>'posted_on');
  x:=app.finance_opening_preview(p_tenant,p_community,p_data->'rows');
  IF NOT (x->>'valid')::boolean OR p_data->>'source_sha256' IS DISTINCT FROM x->>'source_sha256' THEN RAISE EXCEPTION 'Opening preview invalid or fingerprint changed' USING ERRCODE='23514'; END IF;
  amount:=0;
  FOR x IN SELECT value FROM jsonb_array_elements(p_data->'rows') LOOP
   PERFORM app.only_keys(x,ARRAY['property_id','amount','direction']);
   IF coalesce(x->>'direction','') NOT IN ('debit','credit') OR app.finance_decimal(x->>'amount')<=0 THEN RAISE EXCEPTION 'Invalid opening row' USING ERRCODE='22023'; END IF;
   IF NOT EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=p_tenant AND community_id=p_community AND id=(x->>'property_id')::uuid AND is_active) THEN RAISE EXCEPTION 'Invalid opening scope' USING ERRCODE='42501'; END IF;
   amount:=amount+app.finance_decimal(x->>'amount')*CASE WHEN x->>'direction'='credit' THEN -1 ELSE 1 END;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT v->>'property_id') FROM jsonb_array_elements(p_data->'rows') v) OR app.finance_signed_decimal(p_data->>'expected_total')<>amount THEN RAISE EXCEPTION 'Opening reconciliation mismatch or duplicate row' USING ERRCODE='23514'; END IF;
 ELSE RAISE EXCEPTION 'Unknown finance proposal' USING ERRCODE='22023';
 END CASE;
 IF p_data ? 'allocations' AND (jsonb_typeof(p_data->'allocations') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'allocations')>1000) THEN RAISE EXCEPTION 'Invalid allocation preview' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(p_data) f WHERE f.key IN ('amount','rate','cap','approval_limit','expected_total') AND jsonb_typeof(f.value)<>'string') THEN RAISE EXCEPTION 'Finance decimals require strings' USING ERRCODE='22023'; END IF;
 prop:=nullif(p_data->>'property_id','')::uuid;
 IF prop IS NOT NULL AND NOT EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=p_tenant AND community_id=p_community AND id=prop AND is_active) THEN RAISE EXCEPTION 'Unknown scoped property' USING ERRCODE='42501'; END IF;
 INSERT INTO app.finance_requests(tenant_id,community_id,kind,payload,prepared_by,reason) VALUES(p_tenant,p_community,p_kind,p_data,actor,p_reason) RETURNING id INTO item;
 IF p_kind='generation' THEN
  INSERT INTO app.finance_batches(id,tenant_id,community_id,period,total,line_count,fingerprint) VALUES(item,p_tenant,p_community,d,(p_data->>'total')::numeric,jsonb_array_length(lines),p_data->>'fingerprint');
  INSERT INTO app.finance_lines(tenant_id,community_id,batch_id,property_id,rule_id,amount,snapshot,due_on) SELECT p_tenant,p_community,item,(v->>'property_id')::uuid,(v->>'rule_id')::uuid,(v->>'amount')::numeric,v->'snapshot',(v->>'due_on')::date FROM jsonb_array_elements(lines) v;
 END IF;
 x:=jsonb_build_object('id',item,'status','pending','preview',p_data);
 PERFORM app.finance_finish(p_tenant,actor,event,x,p_reason); RETURN x;
END $$;

CREATE FUNCTION public.enclavix_finance_decide(p_tenant uuid,p_request uuid,p_approve boolean,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE req app.finance_requests; actor uuid; data jsonb; event text:='finance.decide'; amount numeric; limit_amount numeric; item uuid; n bigint; e app.finance_entries; x jsonb; d date; sub app.finance_submissions; BEGIN
 -- Lock before reading scope/status so a queued revocation cannot retain authorization.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 SELECT * INTO req FROM app.finance_requests WHERE tenant_id=p_tenant AND id=p_request;
 actor:=app.require_finance(p_tenant,req.community_id,'finance_approver',p_reason);
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('request',p_request,'approve',p_approve,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF actor=req.prepared_by OR p_approve IS NULL THEN RAISE EXCEPTION 'Independent decision required' USING ERRCODE='42501'; END IF;
 IF req.status<>'pending' THEN
  IF (req.status='approved') IS DISTINCT FROM p_approve THEN RAISE EXCEPTION 'Decision already final' USING ERRCODE='23505'; END IF;
  x:=jsonb_build_object('id',req.id,'status',req.status,'already_decided',true); PERFORM app.finance_finish(p_tenant,actor,event,x,p_reason); RETURN x; END IF;
 data:=req.payload;
 IF p_approve THEN
  SELECT approval_limit INTO limit_amount FROM app.finance_policies WHERE tenant_id=p_tenant AND community_id=req.community_id ORDER BY created_at DESC,id DESC LIMIT 1;
  amount:=CASE WHEN req.kind='generation' THEN (SELECT coalesce(sum(abs(lim.amount)),0) FROM app.finance_lines lim WHERE lim.tenant_id=p_tenant AND lim.batch_id=req.id) WHEN req.kind='opening' THEN (SELECT coalesce(sum((v->>'amount')::numeric),0) FROM jsonb_array_elements(data->'rows') v) ELSE coalesce((data->>'amount')::numeric,0) END;
  IF req.kind<>'policy' AND (limit_amount IS NULL OR amount>limit_amount) THEN RAISE EXCEPTION 'Approved policy limit required' USING ERRCODE='23514'; END IF;
  d:=coalesce((data->>'posted_on')::date,(data->>'period')::date);
  IF d>(statement_timestamp() AT TIME ZONE (SELECT time_zone FROM app.communities WHERE tenant_id=p_tenant AND id=req.community_id))::date THEN RAISE EXCEPTION 'Future financial posting denied' USING ERRCODE='22023'; END IF;
  IF d IS NOT NULL AND req.kind NOT IN ('reopen','close') THEN PERFORM app.finance_open(p_tenant,req.community_id,d); END IF;
  CASE req.kind
  WHEN 'policy' THEN INSERT INTO app.finance_policies(id,tenant_id,community_id,approval_limit) VALUES(req.id,p_tenant,req.community_id,app.finance_decimal(data->>'approval_limit'));
  WHEN 'rule' THEN
   IF EXISTS(SELECT 1 FROM app.finance_batches WHERE tenant_id=p_tenant AND community_id=req.community_id AND NOT cancelled AND period>=date_trunc('month',(data->>'effective_from')::date)::date) THEN RAISE EXCEPTION 'Snapshotted period cannot change' USING ERRCODE='23514'; END IF;
   INSERT INTO app.finance_rules(id,tenant_id,community_id,code,label,basis,rate,effective_from,effective_until,recurring,category,asset_kind,grace_days,cap,due_days) VALUES(req.id,p_tenant,req.community_id,data->>'code',data->>'label',data->>'basis',app.finance_decimal(data->>'rate',8),(data->>'effective_from')::date,(data->>'effective_until')::date,(data->>'recurring')::boolean,data->>'category',(data->>'asset_kind')::app.asset_kind,coalesce((data->>'grace_days')::integer,0),(data->>'cap')::numeric,coalesce((data->>'due_days')::integer,0));
  WHEN 'generation' THEN NULL; -- approved immutable lines are posted in resumable chunks
  WHEN 'close','reopen' THEN
   IF req.kind='close' AND EXISTS(SELECT 1 FROM app.finance_batches b JOIN app.finance_lines l ON l.tenant_id=b.tenant_id AND l.batch_id=b.id WHERE b.tenant_id=p_tenant AND b.community_id=req.community_id AND NOT b.cancelled AND b.period=d AND NOT EXISTS(SELECT 1 FROM app.finance_entries z WHERE z.tenant_id=p_tenant AND z.line_id=l.id)) THEN RAISE EXCEPTION 'Incomplete billing batch' USING ERRCODE='23514'; END IF;
   INSERT INTO app.finance_periods(tenant_id,community_id,period,closed,changed_by_request) VALUES(p_tenant,req.community_id,d,req.kind='close',req.id) ON CONFLICT(tenant_id,community_id,period) DO UPDATE SET closed=excluded.closed,changed_by_request=excluded.changed_by_request;
  WHEN 'payment' THEN
   SELECT * INTO sub FROM app.finance_submissions WHERE tenant_id=p_tenant AND id=(data->>'submission_id')::uuid;
   IF actor=sub.submitted_by OR NOT EXISTS(SELECT 1 FROM app.document_objects WHERE tenant_id=p_tenant AND id=sub.document_id AND scan_status='clean') THEN RAISE EXCEPTION 'Independent approval and clean proof required' USING ERRCODE='42501'; END IF;
   INSERT INTO app.finance_sequences(tenant_id) VALUES(p_tenant) ON CONFLICT DO NOTHING;
   UPDATE app.finance_sequences SET next_number=next_number+1 WHERE tenant_id=p_tenant RETURNING next_number-1 INTO n;
   INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,kind,amount,posted_on,due_on,label,snapshot,receipt_number) VALUES(p_tenant,req.community_id,sub.property_id,req.id,'payment',-sub.amount,d,d,'Payment acknowledgment',data,n) RETURNING id INTO item;
   PERFORM app.finance_allocate(p_tenant,req.id,item,coalesce(data->'allocations','[]'));
  WHEN 'charge','credit' THEN
   INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,kind,amount,posted_on,due_on,label,snapshot) VALUES(p_tenant,req.community_id,(data->>'property_id')::uuid,req.id,req.kind,(data->>'amount')::numeric*CASE WHEN req.kind='credit' THEN -1 ELSE 1 END,d,(data->>'due_on')::date,data->>'label',data) RETURNING id INTO item;
   IF req.kind='credit' THEN PERFORM app.finance_allocate(p_tenant,req.id,item,coalesce(data->'allocations','[]')); END IF;
  WHEN 'allocate' THEN PERFORM app.finance_allocate(p_tenant,req.id,(data->>'credit_id')::uuid,data->'allocations');
  WHEN 'refund' THEN
   SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND id=(data->>'credit_id')::uuid;
   IF coalesce(app.finance_available(p_tenant,e.id),0)<amount THEN RAISE EXCEPTION 'Insufficient unapplied credit' USING ERRCODE='23514'; END IF;
   INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,kind,amount,posted_on,due_on,label,snapshot) VALUES(p_tenant,req.community_id,e.property_id,req.id,'refund',amount,d,d,'Refund record (no funds transfer)',data) RETURNING id INTO item;
   PERFORM app.finance_allocate(p_tenant,req.id,e.id,jsonb_build_array(jsonb_build_object('charge_id',item,'amount',amount::text)));
  WHEN 'reverse' THEN
   SELECT * INTO e FROM app.finance_entries WHERE tenant_id=p_tenant AND id=(data->>'entry_id')::uuid;
   IF d<e.posted_on OR EXISTS(SELECT 1 FROM app.finance_allocations a JOIN app.finance_requests ar ON ar.tenant_id=a.tenant_id AND ar.id=a.request_id WHERE a.tenant_id=p_tenant AND (a.debit_id=e.id OR a.credit_id=e.id) AND (ar.payload->>'posted_on')::date>d) THEN RAISE EXCEPTION 'Reversal cannot precede source or allocation history' USING ERRCODE='23514'; END IF;
   INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,kind,amount,posted_on,due_on,label,snapshot,reversal_of) VALUES(p_tenant,req.community_id,e.property_id,req.id,'reversal',-e.amount,d,d,'Linked reversal',data,e.id) RETURNING id INTO item;
   INSERT INTO app.finance_allocations(tenant_id,community_id,property_id,debit_id,credit_id,amount,request_id,reversal_of) SELECT a.tenant_id,a.community_id,a.property_id,a.debit_id,a.credit_id,-a.amount,req.id,a.id FROM app.finance_allocations a WHERE a.tenant_id=p_tenant AND (a.debit_id=e.id OR a.credit_id=e.id) AND a.reversal_of IS NULL AND NOT EXISTS(SELECT 1 FROM app.finance_allocations r WHERE r.tenant_id=p_tenant AND r.reversal_of=a.id);
  WHEN 'opening' THEN
   FOR x IN SELECT value FROM jsonb_array_elements(data->'rows') LOOP
    INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,kind,amount,posted_on,due_on,label,snapshot) VALUES(p_tenant,req.community_id,(x->>'property_id')::uuid,req.id,'opening',(x->>'amount')::numeric*CASE WHEN x->>'direction'='credit' THEN -1 ELSE 1 END,d,d,'Reconciled opening balance',jsonb_build_object('source_key',data->>'source_key','source_sha256',data->>'source_sha256','source_file_sha256',data->>'source_file_sha256','signoff',data->>'signoff'));
   END LOOP;
  WHEN 'dispute','resolve' THEN NULL;
  END CASE;
 END IF;
 IF NOT p_approve AND req.kind='generation' THEN UPDATE app.finance_batches SET cancelled=true WHERE tenant_id=p_tenant AND id=req.id; END IF;
 UPDATE app.finance_requests SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,decided_by=actor,decision_reason=p_reason,decided_at=clock_timestamp() WHERE tenant_id=p_tenant AND id=req.id;
 x:=jsonb_build_object('id',req.id,'status',CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,'entry_id',item,'acknowledgment',n::text);
 PERFORM app.finance_finish(p_tenant,actor,event,x,p_reason); RETURN x;
END $$;

CREATE FUNCTION public.enclavix_finance_generate(p_tenant uuid,p_batch uuid,p_limit integer,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE b app.finance_batches; actor uuid; l app.finance_lines; n integer:=0; remaining integer; event text:='finance.generate'; x jsonb; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0)); SELECT * INTO b FROM app.finance_batches WHERE tenant_id=p_tenant AND id=p_batch;
 actor:=app.require_finance(p_tenant,b.community_id,'finance_preparer',p_reason);
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('batch',p_batch,'limit',p_limit,'reason',p_reason)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Chunk limit required' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM app.finance_requests WHERE tenant_id=p_tenant AND id=p_batch AND status='approved') THEN RAISE EXCEPTION 'Approved batch required' USING ERRCODE='42501'; END IF;
 PERFORM app.finance_open(p_tenant,b.community_id,b.period);
 IF (SELECT coalesce(sum(amount),0) FROM app.finance_lines WHERE tenant_id=p_tenant AND batch_id=b.id)<>b.total OR (SELECT count(*) FROM app.finance_lines WHERE tenant_id=p_tenant AND batch_id=b.id)<>b.line_count THEN RAISE EXCEPTION 'Batch reconciliation mismatch' USING ERRCODE='23514'; END IF;
 FOR l IN SELECT * FROM app.finance_lines q WHERE q.tenant_id=p_tenant AND q.batch_id=b.id AND NOT EXISTS(SELECT 1 FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.line_id=q.id) ORDER BY id LIMIT p_limit LOOP
  INSERT INTO app.finance_entries(tenant_id,community_id,property_id,request_id,line_id,kind,amount,posted_on,due_on,label,snapshot) VALUES(p_tenant,b.community_id,l.property_id,b.id,l.id,CASE WHEN l.amount>0 THEN 'charge' ELSE 'credit' END,l.amount,b.period,l.due_on,l.snapshot->>'label',l.snapshot); n:=n+1;
 END LOOP;
 SELECT count(*) INTO remaining FROM app.finance_lines q WHERE q.tenant_id=p_tenant AND q.batch_id=b.id AND NOT EXISTS(SELECT 1 FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.line_id=q.id);
 x:=jsonb_build_object('id',b.id,'posted',n,'remaining',remaining,'complete',remaining=0); PERFORM app.finance_finish(p_tenant,actor,event,x,p_reason); RETURN x;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.enclavix_finance_prepare(uuid,uuid,text,jsonb,text),public.enclavix_finance_decide(uuid,uuid,boolean,text),public.enclavix_finance_generate(uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.enclavix_finance_prepare(uuid,uuid,text,jsonb,text),public.enclavix_finance_decide(uuid,uuid,boolean,text),public.enclavix_finance_generate(uuid,uuid,integer,text) TO authenticated;
