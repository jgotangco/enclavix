import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {FIXTURE as f,id} from './domain-fixtures.mjs';
import {totp} from './verify-identity.mjs';
const ok=r=>{assert.ifError(r.error);return r.data;};

/** Real disposable provider/Postgres/storage and two independent transaction connections. */
export async function verifyFinance({db,admin,owner,staff,approver,connect}) {
 const u=ok(await approver.auth.getUser()).user;
 const person=id(9500),member=id(9501);
 await db.query('INSERT INTO app.people(id,tenant_id,display_name,auth_user_id) VALUES($1,$2,$3,$4)',[person,f.villageTenant,'Synthetic finance decision owner',u.id]);
 await db.query("INSERT INTO app.memberships(id,tenant_id,person_id,status,valid_from) VALUES($1,$2,$3,'active',now())",[member,f.villageTenant,person]);
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'finance_preparer',now()),($1,$3,'finance_approver',now())",[f.villageTenant,f.coownerMember,member]);
 const factor=ok(await approver.auth.mfa.enroll({factorType:'totp',friendlyName:'Disposable finance approver'}));
 ok(await approver.auth.mfa.challengeAndVerify({factorId:factor.id,code:totp(factor.totp.secret)}));
 const reason='Disposable finance integrity verification';
 const prepare=async(kind,data)=>ok(await staff.rpc('enclavix_finance_prepare',{p_tenant:f.villageTenant,p_community:f.village,p_kind:kind,p_data:data,p_reason:reason}));
 const decide=async(request)=>ok(await approver.rpc('enclavix_finance_decide',{p_tenant:f.villageTenant,p_request:request,p_approve:true,p_reason:reason}));
 const p=await prepare('policy',{approval_limit:'1000000'});assert.ok((await staff.rpc('enclavix_finance_decide',{p_tenant:f.villageTenant,p_request:p.id,p_approve:true,p_reason:reason})).error);await decide(p.id);
 const rule=await prepare('rule',{code:'CI-DUES',label:'Synthetic CI monthly dues',basis:'fixed',rate:'3000',effective_from:'2026-01-01',category:'dues',recurring:true});await decide(rule.id);
 const batch=await prepare('generation',{period:'2026-11-01'});await decide(batch.id);
 const tokens={preparer:(await staff.auth.getSession()).data.session.access_token,approver:(await approver.auth.getSession()).data.session.access_token};
 const claims=Object.fromEntries(Object.entries(tokens).map(([k,v])=>[k,JSON.parse(Buffer.from(v.split('.')[1],'base64url').toString())]));
 async function call(c,who,name,args,key=randomUUID()) {
  await c.query('BEGIN');try{await c.query('SET LOCAL ROLE authenticated');await c.query("SELECT set_config('request.jwt.claims',$1,true),set_config('request.headers',$2,true)",[JSON.stringify(claims[who]),JSON.stringify({'idempotency-key':key})]);const r=(await c.query(`SELECT public.enclavix_finance_${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}
 }
 const clients=await Promise.all([connect(),connect()]);
 try {
  await Promise.all(clients.map(c=>call(c,'preparer','generate',[f.villageTenant,batch.id,1,reason])));
  const completed=ok(await staff.rpc('enclavix_finance_generate',{p_tenant:f.villageTenant,p_batch:batch.id,p_limit:100,p_reason:reason}));assert.equal(completed.remaining,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM app.finance_entries WHERE request_id=$1',[batch.id])).rows[0].n,batch.preview.lines.length);
  const charge=(await db.query("SELECT id FROM app.finance_entries WHERE tenant_id=$1 AND property_id=$2 AND kind='charge'",[f.villageTenant,f.secondLot])).rows[0].id;
  const bytes=Buffer.from('%PDF-1.4\nDisposable finance proof');
  const {createHash}=await import('node:crypto');const hash=createHash('sha256').update(bytes).digest('hex');
  const proof=ok(await owner.rpc('enclavix_finance_proof_reserve',{p_tenant:f.villageTenant,p_property:f.secondLot,p_sha256:hash,p_size:bytes.length,p_type:'application/pdf'}));
  assert.ok((await owner.rpc('enclavix_finance_proof_complete',{p_tenant:f.villageTenant,p_document:proof.id,p_sha256:hash,p_clean:true})).error);
  ok(await admin.storage.from('tenant-private').upload(proof.object_path,bytes,{contentType:'application/pdf'}));
  ok(await admin.rpc('enclavix_finance_proof_complete',{p_tenant:f.villageTenant,p_document:proof.id,p_sha256:hash,p_clean:true}));
  assert.ok((await owner.storage.from('tenant-private').download(proof.object_path)).error);
  assert.equal(ok(await staff.rpc('enclavix_document',{p_tenant:f.villageTenant,p_document:proof.id})),null,'Administrator cannot use generic document path to read finance proof');
  const submission=ok(await owner.rpc('enclavix_finance_submit',{p_tenant:f.villageTenant,p_property:f.secondLot,p_data:{amount:'2000',paid_on:'2026-11-03',method:'Bank',reference:'CI-REFERENCE',document_id:proof.id}}));assert.equal(submission.status,'pending');
  const review=await prepare('payment',{submission_id:submission.id,allocations:[{charge_id:charge,amount:'2000'}],duplicate_review:'Checked synthetic bank reference and evidence hash'});
  const args=[f.villageTenant,review.id,true,reason];
  const posted=await Promise.all(clients.map(c=>call(c,'approver','decide',args,'same-payment-approval')));assert.deepEqual(posted[0],posted[1]);
  await Promise.all(clients.map(c=>call(c,'approver','decide',args)));
  assert.equal((await db.query('SELECT sum(amount)::text n FROM app.finance_entries WHERE tenant_id=$1 AND property_id=$2',[f.villageTenant,f.secondLot])).rows[0].n,'1000.00');
  assert.equal((await db.query('SELECT count(*)::int n FROM app.finance_entries WHERE request_id=$1',[review.id])).rows[0].n,1);
  const credit=await prepare('credit',{property_id:f.secondLot,amount:'500',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Synthetic allocation race credit'});const cr=await decide(credit.id);
  const allocation=await Promise.all([1,2].map(()=>prepare('allocate',{credit_id:cr.entry_id,posted_on:'2026-11-03',allocations:[{charge_id:charge,amount:'400'}]})));
  const raced=await Promise.allSettled(clients.map((c,i)=>call(c,'approver','decide',[f.villageTenant,allocation[i].id,true,reason])));
  assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);assert.equal(raced.filter(r=>r.status==='rejected'&&r.reason.code==='23514').length,1);
  const reverse=await prepare('reverse',{entry_id:posted[0].entry_id,posted_on:'2026-11-03'});const reversed=await Promise.all(clients.map(c=>call(c,'approver','decide',[f.villageTenant,reverse.id,true,reason],'same-reversal')));assert.deepEqual(reversed[0],reversed[1]);
  const close=await prepare('close',{period:'2026-11-01'});const chargeAfter=await prepare('charge',{property_id:f.secondLot,amount:'10',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Close race charge'});
  const outcomes=await Promise.allSettled([call(clients[0],'approver','decide',[f.villageTenant,close.id,true,reason]),call(clients[1],'approver','decide',[f.villageTenant,chargeAfter.id,true,reason])]);
  assert.equal(outcomes[0].status,'fulfilled');if(outcomes[1].status==='rejected')assert.equal(outcomes[1].reason.code,'23514');
  // Either serial order is valid; no post may occur after a committed close.
  const locked=await prepare('charge',{property_id:f.secondLot,amount:'1',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Closed period forbidden post'});
  assert.ok((await approver.rpc('enclavix_finance_decide',{p_tenant:f.villageTenant,p_request:locked.id,p_approve:true,p_reason:reason})).error);
  const report=ok(await owner.rpc('enclavix_finance_report',{p_tenant:f.villageTenant,p_community:f.village,p_property:f.secondLot,p_from:'2026-01-01',p_until:'2026-12-31'}));
  assert.equal(report.requests.length,0);assert.equal(Number(report.outstanding_debits)-Number(report.unapplied_credit),Number(report.closing_balance));
  console.log('S04 real provider/Postgres/storage: independent MFA, resumable concurrent generation, payment/receipt replay, allocation race, reversal and close-vs-post passed');
  return {approver,proof,submission};
 }finally{await Promise.all(clients.map(async c=>{try{await c.query('ROLLBACK');}finally{await c.end();}}));}
}
