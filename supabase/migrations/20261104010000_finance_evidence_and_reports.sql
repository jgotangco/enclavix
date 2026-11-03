-- Private proof metadata and narrowly authorized report/download gateways.
ALTER TABLE app.document_objects ADD COLUMN purpose text NOT NULL DEFAULT 'general' CHECK(purpose IN ('general','payment_proof'));
CREATE FUNCTION app.finance_keep_proof() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.purpose IS DISTINCT FROM OLD.purpose OR (OLD.purpose='payment_proof' AND
 (NEW.sha256,NEW.size_bytes,NEW.content_type,NEW.uploaded_by_membership_id,NEW.property_id) IS DISTINCT FROM (OLD.sha256,OLD.size_bytes,OLD.content_type,OLD.uploaded_by_membership_id,OLD.property_id))
 THEN RAISE EXCEPTION 'Proof identity and bytes are immutable' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER document_purpose_identity BEFORE UPDATE ON app.document_objects FOR EACH ROW EXECUTE FUNCTION app.finance_keep_proof();
CREATE OR REPLACE FUNCTION app.document_access(path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM app.document_objects d WHERE d.object_path=path AND d.scan_status='clean' AND d.purpose='general'
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

CREATE FUNCTION public.enclavix_finance_proof_reserve(p_tenant uuid,p_property uuid,p_sha256 text,p_size integer,p_type text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; c uuid; doc app.document_objects; event text:='finance.proof_reserve'; result jsonb; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0)); actor:=app.member(p_tenant);
 SELECT community_id INTO c FROM app.properties WHERE tenant_id=p_tenant AND id=p_property;
 IF actor IS NULL OR NOT app.finance_property(p_tenant,p_property) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_sha256 IS NULL OR p_sha256 !~ '^[a-f0-9]{64}$' OR p_size IS NULL OR p_size NOT BETWEEN 1 AND 5242880 OR p_type IS NULL OR p_type NOT IN ('application/pdf','image/png','image/jpeg') THEN RAISE EXCEPTION 'Invalid proof metadata' USING ERRCODE='22023'; END IF;
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('property',p_property,'hash',p_sha256,'size',p_size,'type',p_type)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF (SELECT count(*) FROM app.document_objects WHERE tenant_id=p_tenant AND uploaded_by_membership_id=actor AND purpose='payment_proof' AND created_at>statement_timestamp()-interval '1 hour')>=20 THEN RAISE EXCEPTION 'Proof upload limit reached' USING ERRCODE='23514'; END IF;
 SELECT * INTO doc FROM app.document_objects WHERE tenant_id=p_tenant AND property_id=p_property AND uploaded_by_membership_id=actor AND sha256=p_sha256 AND purpose='payment_proof' ORDER BY created_at LIMIT 1;
 IF doc.id IS NOT NULL THEN
  IF doc.size_bytes<>p_size OR doc.content_type<>p_type THEN RAISE EXCEPTION 'Proof metadata conflict' USING ERRCODE='23505'; END IF;
  result:=jsonb_build_object('id',doc.id,'object_path',doc.object_path,'sha256',doc.sha256);
  PERFORM app.finance_finish(p_tenant,actor,event,result,'Reuse immutable payment evidence'); RETURN result;
 END IF;
 INSERT INTO app.document_objects(tenant_id,community_id,property_id,uploaded_by_membership_id,display_name,content_type,size_bytes,sha256,purpose)
 VALUES(p_tenant,c,p_property,actor,'Private payment evidence',p_type,p_size,p_sha256,'payment_proof') RETURNING * INTO doc;
 result:=jsonb_build_object('id',doc.id,'object_path',doc.object_path,'sha256',doc.sha256);
 PERFORM app.finance_finish(p_tenant,actor,event,result,'Reserve private payment evidence'); RETURN result;
END $$;
-- Server-only scanner completion. End-user RPCs cannot mark a document clean.
CREATE FUNCTION public.enclavix_finance_proof_complete(p_tenant uuid,p_document uuid,p_sha256 text,p_clean boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE d app.document_objects; BEGIN
 SELECT * INTO d FROM app.document_objects WHERE tenant_id=p_tenant AND id=p_document AND purpose='payment_proof' AND sha256=p_sha256 FOR UPDATE;
 IF d.id IS NULL OR p_clean IS NULL THEN RETURN false; END IF;
 IF d.scan_status='clean' THEN RETURN p_clean; END IF;
 IF d.scan_status<>'pending' THEN RETURN false; END IF;
 UPDATE app.document_objects SET scan_status=CASE WHEN p_clean THEN 'clean'::app.scan_status ELSE 'rejected'::app.scan_status END WHERE tenant_id=p_tenant AND id=d.id;
 INSERT INTO app.audit_events(tenant_id,actor_membership_id,event_type,outcome,details) VALUES(p_tenant,d.uploaded_by_membership_id,'finance.proof_scan','succeeded',jsonb_build_object('document_id',d.id,'sha256',p_sha256,'clean',p_clean));
 RETURN p_clean;
END $$;
CREATE FUNCTION public.enclavix_finance_proof(p_tenant uuid,p_document uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE d app.document_objects; actor uuid:=app.member(p_tenant); BEGIN
 SELECT * INTO d FROM app.document_objects WHERE tenant_id=p_tenant AND id=p_document AND purpose='payment_proof';
 IF actor IS NULL OR d.id IS NULL OR NOT app.finance_property(p_tenant,d.property_id,(d.created_at AT TIME ZONE (SELECT time_zone FROM app.communities WHERE tenant_id=p_tenant AND id=d.community_id))::date)
 OR (NOT app.finance_staff(p_tenant,d.community_id) AND d.uploaded_by_membership_id<>actor) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF d.scan_status<>'clean' THEN RETURN jsonb_build_object('id',d.id,'status',d.scan_status); END IF;
 INSERT INTO app.audit_events(tenant_id,actor_membership_id,event_type,outcome,details) VALUES(p_tenant,actor,'finance.proof_download','succeeded',jsonb_build_object('document_id',d.id));
 RETURN jsonb_build_object('id',d.id,'status',d.scan_status,'object_path',d.object_path,'sha256',d.sha256,'size_bytes',d.size_bytes::text);
END $$;
CREATE FUNCTION public.enclavix_finance_submit(p_tenant uuid,p_property uuid,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; q app.properties; doc app.document_objects; existing app.finance_submissions; item uuid; amount numeric; d date; event text:='finance.submit'; x jsonb; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));actor:=app.member(p_tenant);
 SELECT * INTO q FROM app.properties WHERE tenant_id=p_tenant AND id=p_property;
 IF actor IS NULL OR NOT app.finance_property(p_tenant,p_property) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM app.only_keys(p_data,ARRAY['amount','paid_on','method','reference','document_id']);
 IF NOT app.start_access(p_tenant,actor,event,jsonb_build_object('property',p_property,'data',p_data)) THEN RETURN app.registry_replay(p_tenant,event); END IF;
 IF jsonb_typeof(p_data->'amount') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Amount string required' USING ERRCODE='22023'; END IF;
 amount:=app.finance_decimal(p_data->>'amount'); d:=app.finance_date(p_data->>'paid_on');
 IF amount<=0 OR d>(statement_timestamp() AT TIME ZONE (SELECT time_zone FROM app.communities WHERE tenant_id=p_tenant AND id=q.community_id))::date THEN RAISE EXCEPTION 'Invalid payment amount/date' USING ERRCODE='22023'; END IF;
 SELECT * INTO doc FROM app.document_objects WHERE tenant_id=p_tenant AND property_id=p_property AND id=(p_data->>'document_id')::uuid AND uploaded_by_membership_id=actor AND purpose='payment_proof' AND scan_status='clean';
 IF doc.id IS NULL THEN RAISE EXCEPTION 'Own clean proof required' USING ERRCODE='42501'; END IF;
 IF coalesce(length(btrim(p_data->>'method')),0) NOT BETWEEN 1 AND 80 OR coalesce(length(btrim(p_data->>'reference')),0) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Method and reference required' USING ERRCODE='22023'; END IF;
 SELECT * INTO existing FROM app.finance_submissions WHERE tenant_id=p_tenant AND document_id=doc.id;
 IF existing.id IS NOT NULL THEN
  IF (existing.property_id,existing.submitted_by,existing.amount,existing.paid_on,existing.method,existing.reference) IS DISTINCT FROM (p_property,actor,amount,d,btrim(p_data->>'method'),upper(regexp_replace(btrim(p_data->>'reference'),'\s+','','g'))) THEN RAISE EXCEPTION 'Proof already bound to another submission' USING ERRCODE='23505'; END IF;
  x:=jsonb_build_object('id',existing.id,'status',coalesce((SELECT status FROM app.finance_requests WHERE tenant_id=p_tenant AND kind='payment' AND payload->>'submission_id'=existing.id::text ORDER BY created_at DESC LIMIT 1),'pending'),'already_submitted',true); PERFORM app.finance_finish(p_tenant,actor,event,x,'Confirm existing payment submission'); RETURN x;
 END IF;
 INSERT INTO app.finance_submissions(tenant_id,community_id,property_id,submitted_by,amount,paid_on,method,reference,document_id) VALUES(p_tenant,q.community_id,p_property,actor,amount,d,btrim(p_data->>'method'),upper(regexp_replace(btrim(p_data->>'reference'),'\s+','','g')),doc.id) RETURNING id INTO item;
 x:=jsonb_build_object('id',item,'status','pending','message','Submitted for review; no payment posted'); PERFORM app.finance_finish(p_tenant,actor,event,x,'Submit private payment evidence'); RETURN x;
END $$;

CREATE FUNCTION public.enclavix_finance_index() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 WITH properties AS (
 SELECT p.tenant_id,p.community_id,jsonb_agg(jsonb_build_object('id',p.id,'code',p.code,'label',p.label) ORDER BY p.code) items
 FROM app.properties p WHERE app.finance_property(p.tenant_id,p.id) GROUP BY p.tenant_id,p.community_id
 ), communities AS (
 SELECT c.tenant_id,jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'time_zone',c.time_zone,
 'preparer',app.role_at(c.tenant_id,'finance_preparer',c.id),'approver',app.role_at(c.tenant_id,'finance_approver',c.id),
 'staff',app.finance_staff(c.tenant_id,c.id),'properties',coalesce(p.items,'[]')) ORDER BY c.name) items
 FROM app.communities c LEFT JOIN properties p ON p.tenant_id=c.tenant_id AND p.community_id=c.id
 WHERE app.finance_staff(c.tenant_id,c.id) OR p.items IS NOT NULL GROUP BY c.tenant_id
 ) SELECT coalesce(jsonb_agg(jsonb_build_object('tenant_id',t.id,'name',t.legal_name,'currency',t.currency,'communities',c.items) ORDER BY t.legal_name),'[]')
 FROM app.tenants t JOIN communities c ON c.tenant_id=t.id WHERE app.member(t.id) IS NOT NULL
$$;

CREATE FUNCTION app.finance_available_at(t uuid,item uuid,d date) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT abs(e.amount)-coalesce((SELECT sum(a.amount) FROM app.finance_allocations a JOIN app.finance_requests r ON r.tenant_id=a.tenant_id AND r.id=a.request_id
 WHERE a.tenant_id=t AND (a.debit_id=item OR a.credit_id=item) AND coalesce((r.payload->>'posted_on')::date,(r.payload->>'period')::date)<=d),0)
 FROM app.finance_entries e WHERE e.tenant_id=t AND e.id=item AND e.posted_on<=d AND e.kind<>'reversal'
 AND NOT EXISTS(SELECT 1 FROM app.finance_entries x WHERE x.tenant_id=t AND x.reversal_of=item AND x.posted_on<=d)
$$;
CREATE FUNCTION public.enclavix_finance_report(p_tenant uuid,p_community uuid,p_property uuid,p_from text,p_until text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE start_date date:=app.finance_date(p_from); end_date date:=app.finance_date(p_until); staff boolean:=app.finance_staff(p_tenant,p_community); rows jsonb; result jsonb; BEGIN
 IF app.member(p_tenant) IS NULL OR NOT EXISTS(SELECT 1 FROM app.communities WHERE tenant_id=p_tenant AND id=p_community) OR (NOT staff AND (p_property IS NULL OR NOT app.finance_property(p_tenant,p_property))) OR (p_property IS NOT NULL AND NOT EXISTS(SELECT 1 FROM app.properties WHERE tenant_id=p_tenant AND community_id=p_community AND id=p_property)) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF end_date<start_date OR end_date-start_date>366 THEN RAISE EXCEPTION 'Report range must be at most 367 days' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(v)),'[]') INTO rows FROM (
 SELECT e.id,e.property_id,p.code AS property_code,e.kind,e.amount::text,e.posted_on,e.due_on,e.label,e.reversal_of,e.receipt_number::text,EXISTS(SELECT 1 FROM app.finance_entries rev WHERE rev.tenant_id=p_tenant AND rev.reversal_of=e.id AND rev.posted_on<=end_date) AS voided,
 app.finance_available_at(p_tenant,e.id,end_date)::text AS unapplied,
 CASE WHEN staff THEN e.snapshot ELSE jsonb_build_object('rule_id',e.snapshot->'rule_id','basis',e.snapshot->'basis','rate',e.snapshot->'rate','quantity',e.snapshot->'quantity','period',e.snapshot->'period') END AS snapshot FROM app.finance_entries e JOIN app.properties p ON p.tenant_id=e.tenant_id AND p.id=e.property_id
 WHERE e.tenant_id=p_tenant AND e.community_id=p_community AND (p_property IS NULL OR e.property_id=p_property) AND e.posted_on BETWEEN start_date AND end_date AND app.finance_property(p_tenant,e.property_id,e.posted_on) ORDER BY e.posted_on,e.created_at,e.id LIMIT 1000) v;
 SELECT jsonb_build_object('opening_balance',coalesce(sum(e.amount) FILTER(WHERE e.posted_on<start_date),0)::text,'movement',coalesce(sum(e.amount) FILTER(WHERE e.posted_on BETWEEN start_date AND end_date),0)::text,'closing_balance',coalesce(sum(e.amount) FILTER(WHERE e.posted_on<=end_date),0)::text,
 'row_count',count(*) FILTER(WHERE e.posted_on BETWEEN start_date AND end_date),'rows',rows,'truncated',count(*) FILTER(WHERE e.posted_on BETWEEN start_date AND end_date)>1000,
 'unapplied_credit',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount<0 AND e.posted_on<=end_date),0)::text,
 'outstanding_debits',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount>0 AND e.posted_on<=end_date),0)::text,
 'aging',jsonb_build_object('current',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount>0 AND e.due_on>=end_date AND e.posted_on<=end_date),0)::text,'days_1_30',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount>0 AND end_date-e.due_on BETWEEN 1 AND 30 AND e.posted_on<=end_date),0)::text,'days_31_60',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount>0 AND end_date-e.due_on BETWEEN 31 AND 60 AND e.posted_on<=end_date),0)::text,'days_61_plus',coalesce(sum(app.finance_available_at(p_tenant,e.id,end_date)) FILTER(WHERE e.amount>0 AND end_date-e.due_on>60 AND e.posted_on<=end_date),0)::text)) INTO result
 FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.community_id=p_community AND (p_property IS NULL OR e.property_id=p_property) AND app.finance_property(p_tenant,e.property_id,e.posted_on);
 RETURN result||jsonb_build_object('as_of',end_date,
 'daily_reconciliation',(SELECT coalesce(jsonb_agg(to_jsonb(daily) ORDER BY daily.posted_on),'[]') FROM (SELECT e.posted_on,sum(e.amount)::text movement,coalesce(sum(-e.amount) FILTER(WHERE e.kind='payment'),0)::text gross_payments,count(*) entries FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.community_id=p_community AND (p_property IS NULL OR e.property_id=p_property) AND e.posted_on BETWEEN start_date AND end_date AND app.finance_property(p_tenant,e.property_id,e.posted_on) GROUP BY e.posted_on) daily),
 'register_totals',(SELECT coalesce(jsonb_agg(to_jsonb(reg) ORDER BY reg.kind),'[]') FROM (SELECT e.kind,count(*) entries,sum(e.amount)::text amount FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.community_id=p_community AND (p_property IS NULL OR e.property_id=p_property) AND e.posted_on BETWEEN start_date AND end_date AND app.finance_property(p_tenant,e.property_id,e.posted_on) GROUP BY e.kind) reg),'allocation_balances','reconstructed at report end date','requests',CASE WHEN staff THEN (SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT * FROM app.finance_requests WHERE tenant_id=p_tenant AND community_id=p_community ORDER BY created_at DESC LIMIT 100) r) ELSE '[]'::jsonb END,
 'batches',CASE WHEN staff THEN (SELECT coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('total',b.total::text,'remaining',(SELECT count(*) FROM app.finance_lines l WHERE l.tenant_id=p_tenant AND l.batch_id=b.id AND NOT EXISTS(SELECT 1 FROM app.finance_entries e WHERE e.tenant_id=p_tenant AND e.line_id=l.id)))),'[]') FROM app.finance_batches b WHERE b.tenant_id=p_tenant AND b.community_id=p_community) ELSE '[]'::jsonb END,
 'submissions',(SELECT coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('amount',s.amount::text,'status',coalesce((SELECT r.status FROM app.finance_requests r WHERE r.tenant_id=p_tenant AND r.kind='payment' AND r.payload->>'submission_id'=s.id::text ORDER BY (r.status<>'rejected') DESC,r.decided_at DESC NULLS FIRST,r.created_at DESC,r.id DESC LIMIT 1),'pending'),'rejection_reason',(SELECT r.decision_reason FROM app.finance_requests r WHERE r.tenant_id=p_tenant AND r.kind='payment' AND r.payload->>'submission_id'=s.id::text AND r.status='rejected' AND NOT EXISTS(SELECT 1 FROM app.finance_requests newer WHERE newer.tenant_id=p_tenant AND newer.kind='payment' AND newer.payload->>'submission_id'=s.id::text AND newer.status<>'rejected') ORDER BY r.decided_at DESC,r.id DESC LIMIT 1),'duplicate_candidates',CASE WHEN staff THEN (SELECT count(*) FROM app.finance_submissions z JOIN app.document_objects zd ON zd.tenant_id=z.tenant_id AND zd.id=z.document_id JOIN app.document_objects sd ON sd.tenant_id=s.tenant_id AND sd.id=s.document_id WHERE z.tenant_id=p_tenant AND app.finance_staff(p_tenant,z.community_id) AND z.id<>s.id AND (z.reference=s.reference OR zd.sha256=sd.sha256 OR (z.amount=s.amount AND z.paid_on=s.paid_on AND z.method=s.method))) ELSE NULL END)),'[]') FROM app.finance_submissions s WHERE s.tenant_id=p_tenant AND s.community_id=p_community AND (p_property IS NULL OR s.property_id=p_property) AND (staff OR s.submitted_by=app.member(p_tenant))));
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'enclavix_finance_%' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.signature::text NOT LIKE '%proof_complete%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END IF;
END LOOP; END $$;
GRANT EXECUTE ON FUNCTION public.enclavix_finance_proof_complete(uuid,uuid,text,boolean) TO service_role;
