import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
import {createClient} from '@supabase/supabase-js';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';
const jiti=createJiti(import.meta.url);
const {createAccountApi}=await jiti.import('../src/lib/auth/account-api.ts');
const {exchangeCallback}=await jiti.import('../src/lib/auth/callback.ts');
const {checkEmailResult}=await jiti.import('../src/lib/auth/email-result.ts');
let db;
const owner='c0000000-0000-0000-0000-000000000004';
const staff='c0000000-0000-0000-0000-000000000003';
before(async()=>{
 db=await createDomainDatabase();await seedDomainFixtures(db);
 await db.exec("UPDATE app.tenants SET status='active'");
 await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2),($3,$4)',[id(9901),owner,id(9902),staff]);
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())",[f.villageTenant,f.coownerMember]);
});
after(async()=>db?.close());
async function principal(user=staff,session=id(9902)){
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:user,session_id:session,aal:'aal2',exp:Math.floor(Date.now()/1000)+3600})]);
}
async function rpc(sql,args=[]){await db.exec('SET ROLE authenticated');try{return await db.query(sql,args);}finally{await db.exec('RESET ROLE');}}
async function application(){
 await principal(owner,id(9901));
 const app=(await rpc('SELECT public.enclavix_apply($1,$2,$3) AS id',[f.villageTenant,'Existing member','Lot 2'])).rows[0].id;
 await principal();return app;
}
for(const role of ['finance_approver','association_admin','guard']){
 test(`property approval preserves active ${role} role, scope and membership expiry`,async()=>{
  await db.exec('BEGIN');try{
   await db.query("UPDATE app.memberships SET valid_until=now()+interval '7 days' WHERE id=$1",[f.villageMember]);
   const until=(await db.query('SELECT valid_until FROM app.memberships WHERE id=$1',[f.villageMember])).rows[0].valid_until;
   await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,community_id,valid_from,valid_until) VALUES($1,$2,$3,$4,now(),now()+interval '1 day')",[f.villageTenant,f.villageMember,role,f.village]);
   const before=(await db.query('SELECT * FROM app.membership_roles WHERE membership_id=$1 ORDER BY id',[f.villageMember])).rows;
   const relations=(await db.query('SELECT count(*)::int AS n FROM app.property_relationships WHERE person_id=$1',[f.villagePerson])).rows[0].n;
   const app=await application();
   await rpc('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[app,f.villagePerson,f.secondLot,'Verified additional property approval']);
   assert.deepEqual((await db.query('SELECT * FROM app.membership_roles WHERE membership_id=$1 ORDER BY id',[f.villageMember])).rows,before);
   assert.deepEqual((await db.query('SELECT valid_until FROM app.memberships WHERE id=$1',[f.villageMember])).rows[0].valid_until,until);
   assert.equal((await db.query('SELECT count(*)::int AS n FROM app.property_relationships WHERE person_id=$1',[f.villagePerson])).rows[0].n,relations);
  }finally{await db.exec('ROLLBACK');}
 });
}
test('active staff gain only the approved resident community scope without losing staff grants',async()=>{
 await db.exec('BEGIN');try{
  await db.query("DELETE FROM app.membership_roles WHERE membership_id=$1 AND role='resident'",[f.villageMember]);
  await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'finance_preparer',now())",[f.villageTenant,f.villageMember]);
  const app=await application();await rpc('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[app,f.villagePerson,f.secondLot,'Verified additional property request']);
  const roles=(await db.query('SELECT role,community_id FROM app.membership_roles WHERE membership_id=$1 AND revoked_at IS NULL ORDER BY role::text',[f.villageMember])).rows;
  assert.deepEqual(roles,[{role:'finance_preparer',community_id:null},{role:'resident',community_id:f.village}]);
 }finally{await db.exec('ROLLBACK');}
});
test('reapproval of a revoked membership does not restore old staff or future grants',async()=>{
 await db.exec('BEGIN');try{
  await db.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.villageMember]);
  await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'finance_approver',now()),($1,$2,'association_admin',now()+interval '1 day')",[f.villageTenant,f.villageMember]);
  const app=await application();await rpc('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[app,f.villagePerson,f.secondLot,'Verified resident reinstatement only']);
  const grants=(await db.query('SELECT role,community_id FROM app.membership_roles WHERE membership_id=$1 AND revoked_at IS NULL',[f.villageMember])).rows;
  assert.deepEqual(grants,[{role:'resident',community_id:f.village}]);
 }finally{await db.exec('ROLLBACK');}
});
test('a dropped invitation response retried through the UI client creates one invitation',async()=>{
 {
  await principal();const keys=[];let drop=true;
  const {api}=createAccountApi(async(_url,init)=>{
   const key=new Headers(init.headers).get('Idempotency-Key');keys.push(key);
   await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);
   let token;
   try{const b=JSON.parse(init.body);token=(await rpc('SELECT public.enclavix_invite($1,$2,$3,$4)',[b.p_tenant,b.p_person,b.p_email,b.p_reason])).rows[0].enclavix_invite;}
   catch(error){assert.equal(error.code,'23505');return Response.json({error:{code:'conflict'}},{status:409});}
   if(drop){drop=false;throw new TypeError('Synthetic lost response after commit');}
   return Response.json({data:token});
  });
  const payload={p_tenant:f.villageTenant,p_person:f.representative,p_email:'synthetic@example.test',p_reason:'Verified synthetic invitation'};
  await assert.rejects(api('access/invite',payload),/lost response/);
  await assert.rejects(api('access/invite',payload),/earlier attempt/);
  assert.equal(keys[0],keys[1]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM app.invitations WHERE person_id=$1',[f.representative])).rows[0].n,1);
 }
});
test('new-key retries cannot create a second live invitation; explicit revocation permits replacement',async()=>{
 await principal();
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':'new-key-duplicate'})]);
 await assert.rejects(rpc('SELECT public.enclavix_invite($1,$2,$3,$4)',[f.villageTenant,f.representative,'synthetic@example.test','Verified synthetic invitation']),e=>e.code==='23505');
 const invitation=(await db.query('SELECT id FROM app.invitations WHERE person_id=$1 AND revoked_at IS NULL',[f.representative])).rows[0].id;
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':'explicit-revocation'})]);
 await rpc('SELECT public.enclavix_revoke_invitation($1,$2)',[invitation,'Explicitly revoke the lost invitation']);
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':'replacement-after-revocation'})]);
 await rpc('SELECT public.enclavix_invite($1,$2,$3,$4)',[f.villageTenant,f.representative,'synthetic@example.test','Verified synthetic invitation']);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM app.invitations WHERE person_id=$1 AND revoked_at IS NULL',[f.representative])).rows[0].n,1);
});
test('retry keys survive unreadable/503 outcomes, distinguish payloads, and clear on success/account switch',async()=>{
 const calls=[];let response='503';let next=0;
 const client=createAccountApi(async(_url,init)=>{
  calls.push(new Headers(init.headers).get('Idempotency-Key'));
  if(response==='truncated')return new Response('{',{status:200});
  if(response==='empty')return Response.json({});
  return Response.json({data:null},{status:Number(response)});
 },()=>`request-${++next}`);
 await assert.rejects(client.api('access/support',{a:1,b:2}));
 response='truncated';await assert.rejects(client.api('access/support',{b:2,a:1}));
 response='empty';await assert.rejects(client.api('access/support',{a:1,b:2}),/could not be confirmed/);
 response='200';await client.api('access/support',{a:1,b:2});
 assert.equal(new Set(calls).size,1);
 await client.api('access/support',{a:1,b:2});assert.notEqual(calls[4],calls[3]);
 response='503';await assert.rejects(client.api('access/support',{a:2}));
 client.clearPending();await assert.rejects(client.api('access/support',{a:2}));assert.notEqual(calls[5],calls[6]);
});
test('a refused request does not pin a key to a corrected submission',async()=>{
 const keys=[];let status=400;
 const {api}=createAccountApi(async(_url,init)=>{keys.push(new Headers(init.headers).get('Idempotency-Key'));return Response.json({data:null},{status});});
 await assert.rejects(api('access/role',{role:'invalid'}));status=200;await api('access/role',{role:'resident'});assert.notEqual(keys[0],keys[1]);
});
test('overlapping SDK recovery flows exchange the earlier verifier without borrowing the latest',async()=>{
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const flows=[];const attempted=[];
 const client=createClient('https://synthetic.invalid','synthetic-key',{auth:{storageKey:'review-recovery',storage,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,experimental:{appendPkceFlowIdToRedirects:true}},global:{fetch:async(input,init)=>{
  const url=new URL(input);const body=JSON.parse(init.body);
  if(url.pathname.endsWith('/recover')){
   const callback=new URL(url.searchParams.get('redirect_to'));flows.push({flow:callback.searchParams.get('sb_flow_id'),challenge:body.code_challenge});return Response.json({});
  }
  attempted.push(body.code_verifier);
  const {createHash}=await import('node:crypto');
  const expected=flows[Number(body.auth_code.slice(-1))].challenge;
  assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'),expected);
  // Verification selection is under test; deliberately avoid creating a real/session fixture.
  return Response.json({code:'bad_code',msg:'Synthetic rejection after verifier check'},{status:400});
 }}});
 for(let i=0;i<2;i++)assert.equal((await client.auth.resetPasswordForEmail('synthetic@example.test',{redirectTo:'https://app.example/auth/callback'})).error,null);
 assert.ok(flows.every(f=>f.flow));assert.notEqual(flows[0].flow,flows[1].flow);
 assert.equal(await exchangeCallback(client.auth,new URL(`https://app.example/auth/callback?code=synthetic-0&sb_flow_id=${'c'.repeat(32)}`)),false);assert.equal(attempted.length,0);
 for(const i of [0,1])assert.equal(await exchangeCallback(client.auth,new URL(`https://app.example/auth/callback?code=synthetic-${i}&sb_flow_id=${flows[i].flow}`)),false);
 assert.equal(attempted.length,2);assert.notEqual(attempted[0],attempted[1]);
});
test('callback rejects malformed/duplicate flow IDs and never borrows another flow verifier',async()=>{
 let called=false;const auth={exchangeCodeForSession:async()=>{called=true;return {error:null};}};
 for(const query of ['code=x&sb_flow_id=bad','code=x&sb_flow_id=abcdefgh&sb_flow_id=ijklmnop','code=x&code=y','code=']){
  assert.equal(await exchangeCallback(auth,new URL(`https://app.example/auth/callback?${query}`)),false);
 }
 assert.equal(called,false);
 assert.equal(await exchangeCallback(auth,new URL('https://app.example/auth/callback?code=legacy')),true);
});
for(const method of ['signUp','resetPasswordForEmail']){
 test(`${method} reports provider rate limits/outages while masking account-existence responses`,async()=>{
  let failure={status:429,code:'over_email_send_rate_limit'};
  const client=createClient('https://synthetic.invalid','synthetic-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async()=>Response.json({code:failure.code,msg:'Synthetic provider failure'},{status:failure.status,headers:{'X-Supabase-Api-Version':'2024-01-01'}})}});
  const request=()=>method==='signUp'?client.auth.signUp({email:'synthetic@example.test',password:'Synthetic-review-password'}):client.auth.resetPasswordForEmail('synthetic@example.test');
  let result=await request();assert.throws(()=>checkEmailResult(result.error),e=>e.status===429);
  failure={status:503,code:'unexpected_failure'};result=await request();assert.throws(()=>checkEmailResult(result.error),e=>e.status===503);
  failure={status:422,code:'user_already_exists'};result=await request();assert.doesNotThrow(()=>checkEmailResult(result.error));
  failure={status:422,code:'validation_failed'};result=await request();assert.throws(()=>checkEmailResult(result.error),e=>e.status===400);
 });
}

test('revoking one invitation clears only its matching pending retry',async()=>{
 const keys=[];const {api,clearPending}=createAccountApi(async(_url,init)=>{keys.push(new Headers(init.headers).get('Idempotency-Key'));throw new TypeError('Synthetic connection loss');});
 const first={p_tenant:'tenant-a',p_email:' FIRST@example.test ',p_reason:'Same reason'};
 const second={p_tenant:'tenant-b',p_email:'second@example.test',p_reason:'Same reason'};
 await assert.rejects(api('access/invite',first));await assert.rejects(api('access/invite',second));
 clearPending('access/invite',{p_tenant:'tenant-a',p_email:'first@example.test'});
 await assert.rejects(api('access/invite',first));await assert.rejects(api('access/invite',second));
 assert.notEqual(keys[0],keys[2]);assert.equal(keys[1],keys[3]);
});
