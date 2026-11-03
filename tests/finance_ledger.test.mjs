import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createJiti} from 'jiti';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';
let db,batch;
const user={preparer:'c0000000-0000-0000-0000-000000000003',approver:'c0000000-0000-0000-0000-000000000002',resident:'c0000000-0000-0000-0000-000000000004'};
const member={preparer:f.coownerMember,approver:id(9401),resident:f.villageMember};
const session={preparer:id(9411),approver:id(9412),resident:id(9413)};
const reason='Synthetic finance control verification';
const {calculateAssessment}=await createJiti(import.meta.url).import('../src/lib/finance/assessment.ts');
before(async()=>{
 db=await createDomainDatabase();await seedDomainFixtures(db);await db.exec("UPDATE app.tenants SET status='active'");
 await db.query('INSERT INTO app.people(id,tenant_id,display_name,auth_user_id) VALUES($1,$2,$3,$4)',[id(9400),f.villageTenant,'Synthetic finance approver',user.approver]);
 await db.query("INSERT INTO app.memberships(id,tenant_id,person_id,status,valid_from) VALUES($1,$2,$3,'active',now())",[member.approver,f.villageTenant,id(9400)]);
 for(const who of Object.keys(user)) await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[session[who],user[who]]);
 for(const [who,role] of [['preparer','finance_preparer'],['approver','finance_approver']]) await db.query('INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,$3,now())',[f.villageTenant,member[who],role]);
});
after(async()=>db?.close());
async function as(who,aal='aal2') {await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:user[who],session_id:session[who],aal,exp:Math.floor(Date.now()/1000)+3600})]);}
async function rpc(name,args,key=randomUUID()) {
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);await db.exec('SET ROLE authenticated');
 try{return(await db.query(`SELECT public.enclavix_finance_${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;}finally{await db.exec('RESET ROLE');}
}
const prepare=(kind,data,key)=>rpc('prepare',[f.villageTenant,f.village,kind,JSON.stringify(data),reason],key);
const decide=(req,key,approve=true)=>rpc('decide',[f.villageTenant,req,approve,reason],key);
async function approved(kind,data){await as('preparer');const p=await prepare(kind,data);await as('approver');const result=await decide(p.id);return {...p,...result};}
async function balance(p=f.secondLot){return(await db.query('SELECT coalesce(sum(amount),0)::text n FROM app.finance_entries WHERE tenant_id=$1 AND property_id=$2',[f.villageTenant,p])).rows[0].n;}
test('policy requires a different finance approver; rules freeze exact approved snapshots',async()=>{
 await as('preparer');const p=await prepare('policy',{approval_limit:'1000000'},'policy-repeat');assert.equal((await prepare('policy',{approval_limit:'1000000'},'policy-repeat')).id,p.id);
 await assert.rejects(decide(p.id),e=>e.code==='42501');
 await as('approver');await decide(p.id);
 await approved('rule',{code:'MONTHLY',label:'Monthly dues',basis:'fixed',rate:'3000',effective_from:'2026-01-01',recurring:true,category:'dues',due_days:10});
 await as('preparer');batch=await prepare('generation',{period:'2026-11-01'});assert.equal(batch.preview.lines.length,2);assert.equal(batch.preview.total,'6000.00');
 await assert.rejects(prepare('generation',{period:'2026-11-01'}),e=>e.code==='23505');
 await assert.rejects(rpc('generate',[f.villageTenant,batch.id,1,reason]),e=>e.code==='42501');
 await as('approver');await decide(batch.id);
 await as('preparer');const first=await rpc('generate',[f.villageTenant,batch.id,1,reason],'first-chunk');assert.equal(first.remaining,1);assert.deepEqual(await rpc('generate',[f.villageTenant,batch.id,1,reason],'first-chunk'),first);
 assert.equal((await rpc('generate',[f.villageTenant,batch.id,1,reason])).remaining,0);assert.equal((await rpc('generate',[f.villageTenant,batch.id,1,reason])).posted,0);
 assert.equal(await balance(),'3000.00');
 await assert.rejects(prepare('rule',{code:'MONTHLY',label:'Retroactive dues',basis:'fixed',rate:'4000',effective_from:'2026-11-01',recurring:true,category:'dues'}),e=>e.code==='23514');
});
test('partial credits allocate once, overpayments remain available, and reversal restores debt',async()=>{
 const charge=(await db.query("SELECT id FROM app.finance_entries WHERE tenant_id=$1 AND property_id=$2 AND kind='charge'",[f.villageTenant,f.secondLot])).rows[0].id;
 const c=await approved('credit',{property_id:f.secondLot,amount:'2000',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Synthetic approved credit',allocations:[{charge_id:charge,amount:'2000'}]});
 assert.equal(await balance(),'1000.00');assert.equal((await db.query('SELECT app.finance_available($1,$2)::text n',[f.villageTenant,charge])).rows[0].n,'1000.00');
 await as('approver');assert.equal((await decide(c.id)).already_decided,true);
 const over=await approved('credit',{property_id:f.secondLot,amount:'1500',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Synthetic overpayment credit',allocations:[{charge_id:charge,amount:'1000'}]});
 assert.equal(await balance(),'-500.00');assert.equal((await db.query('SELECT app.finance_available($1,$2)::text n',[f.villageTenant,over.entry_id])).rows[0].n,'500.00');
 const rev=await approved('reverse',{entry_id:c.entry_id,posted_on:'2026-11-03'});assert.ok(rev.entry_id);assert.equal(await balance(),'1500.00');
 await as('preparer');const bad=await prepare('credit',{property_id:f.secondLot,amount:'10000',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Rejected allocation excess',allocations:[{charge_id:charge,amount:'3000'}]});
 await as('approver');await assert.rejects(decide(bad.id),e=>e.code==='23514');assert.equal(await balance(),'1500.00');
 const refund=await approved('refund',{credit_id:over.entry_id,amount:'500',posted_on:'2026-11-03',label:'Synthetic refund'});assert.ok(refund.entry_id);assert.equal(await balance(),'2000.00');
});
test('closed periods reject backdating; reopen is independently approved and audited',async()=>{
 await approved('close',{period:'2026-11-01'});
 await as('preparer');const p=await prepare('charge',{property_id:f.secondLot,amount:'1',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Closed period attempt'});
 await as('approver');await assert.rejects(decide(p.id),e=>e.code==='23514');
 await approved('reopen',{period:'2026-11-01'});await as('approver');await decide(p.id);
 assert.ok((await db.query("SELECT count(*)::int n FROM app.audit_events WHERE event_type='finance.decide'",[])).rows[0].n>=8);
});
test('residents, wrong scope, stale MFA and modified fields cannot post or approve',async()=>{
 await as('resident');await assert.rejects(prepare('policy',{approval_limit:'1'}),e=>e.code==='42501');await assert.rejects(decide(batch.id),e=>e.code==='42501');
 await db.exec('SET ROLE authenticated');try{await assert.rejects(db.query('INSERT INTO app.finance_entries DEFAULT VALUES'),e=>e.code==='42501');}finally{await db.exec('RESET ROLE');}
 await as('preparer','aal1');await assert.rejects(prepare('policy',{approval_limit:'1'}),e=>e.code==='42501');
 await as('preparer');await assert.rejects(rpc('prepare',[f.condoTenant,f.condo,'policy','{"approval_limit":"1"}',reason]),e=>e.code==='42501');
 await assert.rejects(prepare('charge',{property_id:f.unit,amount:'1',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Wrong property'}),e=>e.code==='42501');
 await assert.rejects(prepare('policy',{approval_limit:'1',actor:member.approver}),e=>e.code==='22023');
 await db.query("UPDATE auth.sessions SET created_at=now()-interval '11 minutes' WHERE id=$1",[session.preparer]);try{await assert.rejects(prepare('policy',{approval_limit:'1'}),e=>e.code==='42501');}finally{await db.query('UPDATE auth.sessions SET created_at=now() WHERE id=$1',[session.preparer]);}
});
test('opening batches reconcile, retain provenance, and cannot duplicate source/property',async()=>{
 const payload={source_key:'LEGACY-CUTOVER',source_sha256:'a'.repeat(64),posted_on:'2026-10-01',signoff:'Synthetic reconciled legacy source',expected_total:'100',rows:[{property_id:f.secondLot,amount:'150',direction:'debit'},{property_id:f.lot,amount:'50',direction:'credit'}]};
 await as('preparer');await assert.rejects(prepare('opening',{...payload,expected_total:'99'}),e=>e.code==='23514');
 await as('preparer');payload.source_sha256=(await rpc('opening_preview',[f.villageTenant,f.village,JSON.stringify(payload.rows),reason])).source_sha256;
 await approved('opening',payload);
 await as('preparer');const dup=await prepare('opening',payload);await as('approver');await assert.rejects(decide(dup.id),e=>e.code==='23505');
});
test('posted entries, rule formulas and allocations cannot be erased or rewritten',async()=>{
 for(const table of ['finance_entries','finance_rules','finance_allocations','finance_batches','finance_lines']){
  await assert.rejects(db.exec(`DELETE FROM app.${table}`),e=>e.code==='23514');
 }
});
test('resident proof submission is pending; only server scanning and independent staff can post payment',async()=>{
 await as('resident');
 const proof=await rpc('proof_reserve',[f.villageTenant,f.secondLot,'c'.repeat(64),100,'application/pdf']);
 await assert.rejects(rpc('proof_complete',[f.villageTenant,proof.id,'c'.repeat(64),true]),e=>e.code==='42501');
 const payload={amount:'2000',paid_on:'2026-11-03',method:'Bank transfer',reference:' SAMPLE-123 ',document_id:proof.id};
 await assert.rejects(rpc('submit',[f.villageTenant,f.secondLot,JSON.stringify(payload)]),e=>e.code==='42501');
 await db.exec('SET ROLE service_role');try{assert.equal((await db.query('SELECT public.enclavix_finance_proof_complete($1,$2,$3,true) result',[f.villageTenant,proof.id,'c'.repeat(64)])).rows[0].result,true);}finally{await db.exec('RESET ROLE');}
 const prior=await balance();const sub=await rpc('submit',[f.villageTenant,f.secondLot,JSON.stringify(payload)],'payment-submission-retry');
 assert.equal(sub.status,'pending');assert.equal(await balance(),prior);assert.deepEqual(await rpc('submit',[f.villageTenant,f.secondLot,JSON.stringify(payload)],'payment-submission-retry'),sub);
 assert.equal((await db.query('SELECT public.enclavix_document($1,$2) result',[f.villageTenant,proof.id])).rows[0].result,null,'Generic document download cannot bypass finance evidence permissions');
 const review=await approved('payment',{submission_id:sub.id,allocations:[],duplicate_review:'Reviewed reference and hash against existing submissions'});
 assert.ok(review.acknowledgment);assert.equal(Number(await balance()),Number(prior)-2000);
 await as('approver');await decide(review.id);
 assert.equal((await db.query('SELECT count(*)::int n FROM app.finance_entries WHERE request_id=$1',[review.id])).rows[0].n,1);
 await as('resident');const report=await rpc('report',[f.villageTenant,f.village,f.secondLot,'2026-01-01','2026-12-31']);
 assert.equal(report.requests.length,0);assert.equal(typeof report.submissions.find(s=>s.id===sub.id).amount,'string');assert.equal(report.submissions.find(s=>s.id===sub.id).status,'approved');assert.equal(report.allocation_balances,'reconstructed at report end date');
 const index=await rpc('index',[]);assert.ok(index.find(t=>t.tenant_id===f.villageTenant).communities[0].properties.some(p=>p.id===f.secondLot));
 await assert.rejects(rpc('report',[f.villageTenant,f.village,null,'2026-01-01','2026-12-31']),e=>e.code==='42501');
});
test('historical reports preserve pre-reversal balances and current membership termination removes finance access',async()=>{
 await as('resident');const before=await rpc('report',[f.villageTenant,f.village,f.secondLot,'2026-11-01','2026-11-02']);
 assert.equal(before.movement,'3000.00');assert.equal(before.outstanding_debits,'3150.00');
 await db.query("UPDATE app.property_relationships SET valid_until=statement_timestamp() WHERE tenant_id=$1 AND property_id=$2 AND person_id=$3",[f.villageTenant,f.secondLot,f.villagePerson]);
 await assert.rejects(rpc('report',[f.villageTenant,f.village,f.secondLot,'2026-01-01','2026-12-31']),e=>e.code==='42501');
});
test('limits, fine source keys, final decisions and period boundary rules fail safely',async()=>{
 await as('preparer');
 await assert.rejects(prepare('rule',{code:'MIDMONTH',label:'Ambiguous proration',basis:'fixed',rate:'1',effective_from:'2027-01-15',recurring:true,category:'dues'}),e=>e.code==='22023');
 await assert.rejects(prepare('policy',{approval_limit:100}),e=>e.code==='22023');
 const high=await prepare('charge',{property_id:f.lot,amount:'1000001',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Exceeds approved limit'});await as('approver');await assert.rejects(decide(high.id),e=>e.code==='23514');await decide(high.id,undefined,false);
 await assert.rejects(decide(high.id),e=>e.code==='23505');
 const fine={property_id:f.lot,amount:'25',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Independently reviewed fine',fine_key:'APPROVED-VIOLATION-001'};
 const original=await approved('charge',fine);await as('preparer');const repeated=await prepare('charge',fine);await as('approver');await assert.rejects(decide(repeated.id),e=>e.code==='23505');
 await approved('reverse',{entry_id:original.entry_id,posted_on:'2026-11-03'});
 await approved('charge',{...fine,fine_key:'APPROVED-VIOLATION-001-REASSESS',reassessment_of:original.entry_id});
 await as('preparer');const reassess=await prepare('charge',{...fine,fine_key:'APPROVED-VIOLATION-001-REASSESS-TWICE',reassessment_of:original.entry_id});await as('approver');await assert.rejects(decide(reassess.id),e=>e.code==='23505');
 await assert.rejects(db.query("UPDATE app.finance_requests SET payload='{}' WHERE id=$1",[high.id]),e=>e.code==='23514');
});
test('approved penalty rules honor grace and caps, skip disputed charges, and preserve discount snapshots',async()=>{
 const c=id(9600),p=id(9601);
 await db.query("INSERT INTO app.communities(id,tenant_id,code,name,kind) VALUES($1,$2,'FIN-TEST','Finance policy test','village')",[c,f.villageTenant]);
 await db.query("INSERT INTO app.properties(id,tenant_id,community_id,code,label,kind,lot_area_sqm) VALUES($1,$2,$3,'FIN-P','Finance property','lot',100.25)",[p,f.villageTenant,c]);
 async function inCommunity(kind,data){await as('preparer');const r=await rpc('prepare',[f.villageTenant,c,kind,JSON.stringify(data),reason]);await as('approver');return {...r,...await decide(r.id)};}
 await inCommunity('policy',{approval_limit:'1000000'});
 const charge=await inCommunity('charge',{property_id:p,amount:'3000',posted_on:'2026-01-01',due_on:'2026-01-10',label:'Penalty basis'});
 const rule=await inCommunity('rule',{code:'PENALTY',label:'Capped late penalty',basis:'outstanding_percent',rate:'10',cap:'100',grace_days:5,effective_from:'2026-02-01',recurring:true,category:'penalty'});
 await inCommunity('rule',{code:'DISCOUNT',label:'Approved fixed discount',basis:'fixed',rate:'10.005',effective_from:'2026-02-01',recurring:true,category:'discount'});
 const batch=await inCommunity('generation',{period:'2026-02-01'});assert.equal(batch.preview.lines.find(l=>l.rule_id===rule.id).amount,'100.00');assert.equal(batch.preview.total,'89.99');
 const dispute=await inCommunity('dispute',{entry_id:charge.entry_id,posted_on:'2026-02-02'});
 const next=await inCommunity('generation',{period:'2026-03-01'});assert.ok(!next.preview.lines.some(l=>l.rule_id===rule.id));
 await inCommunity('resolve',{dispute_id:dispute.id});
 const restored=await inCommunity('generation',{period:'2026-04-01'});assert.equal(restored.preview.lines.find(l=>l.rule_id===rule.id).amount,'100.00');
});
test('trusted database snapshots match exact preview golden cases for every dimensional basis',async()=>{
 const c=id(9610),p=id(9611),a=id(9612);
 await db.query("INSERT INTO app.communities(id,tenant_id,code,name,kind) VALUES($1,$2,'EXACT-FIN','Exact calculation cases','village')",[c,f.villageTenant]);
 await db.query("INSERT INTO app.properties(id,tenant_id,community_id,code,label,kind,lot_area_sqm,floor_area_sqm,ownership_share) VALUES($1,$2,$3,'EXACT-P','Exact property','lot',100.25,50.05,0.33333333)",[p,f.villageTenant,c]);
 await db.query("INSERT INTO app.assets(id,tenant_id,community_id,code,label,kind) VALUES($1,$2,$3,'EXACT-ASSET','Exact parking','parking')",[a,f.villageTenant,c]);
 await db.query("INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from) VALUES($1,$2,$3,$4,'use','2026-01-01T00:00:00Z')",[f.villageTenant,c,a,p]);
 await as('preparer');const policy=await rpc('prepare',[f.villageTenant,c,'policy','{"approval_limit":"1000000"}',reason]);await as('approver');await decide(policy.id);
 const cases=[['fixed','1.005',undefined],['lot_area','12.345','100.25'],['floor_area','0.1','50.05'],['ownership_share','3000','0.33333333'],['asset_quantity','125.005','1']];
 for(const [basis,rate] of cases){
  await as('preparer');const r=await rpc('prepare',[f.villageTenant,c,'rule',JSON.stringify({code:basis.toUpperCase(),label:basis,basis,rate,effective_from:'2026-01-01',category:'dues',recurring:true,...(basis==='asset_quantity'?{asset_kind:'parking'}:{})}),reason]);await as('approver');await decide(r.id);
 }
 await as('preparer');const plan=await rpc('prepare',[f.villageTenant,c,'generation','{"period":"2026-11-01"}',reason]);
 for(const [basis,rate,quantity] of cases)assert.equal(plan.preview.lines.find(l=>l.snapshot.basis===basis).amount,calculateAssessment({basis,rate,...(quantity?{quantity}:{})}));
});
