import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {FIXTURE as f} from './domain-fixtures.mjs';

/** Disposable PostgreSQL: real independent transactions and a provider-issued staff session. */
export async function verifyOnboardingConcurrency({connect,db,staff}) {
 const token=(await staff.auth.getSession()).data.session.access_token;
 const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
 async function call(c,name,args,key=randomUUID()) {
  await c.query('BEGIN');
  try {
   await c.query('SET LOCAL ROLE authenticated');
   await c.query("SELECT set_config('request.jwt.claims',$1,true),set_config('request.headers',$2,true)",[JSON.stringify(claims),JSON.stringify({'idempotency-key':key})]);
   const result=(await c.query(`SELECT public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) AS result`,args)).rows[0].result;
   await c.query('COMMIT');return result;
  } catch(e) {await c.query('ROLLBACK');throw e;}
 }
 const clients=await Promise.all([connect(),connect()]);
 try {
  const location=(await db.query('SELECT code FROM app.locations WHERE id=$1',[f.block])).rows[0].code;
  const community=(await db.query('SELECT code FROM app.communities WHERE id=$1',[f.village])).rows[0].code;
  const batch=await call(clients[0],'enclavix_s03_import_stage',[f.villageTenant,'property',JSON.stringify([{community_code:community,location_code:location,code:'CONCURRENT-S03',label:'Concurrent synthetic lot',kind:'lot'}]),'Preview concurrent synthetic source']);
  const results=await Promise.all(clients.map(c=>call(c,'enclavix_s03_import_commit',[f.villageTenant,batch.batch_id,batch.source_sha256,'Confirm concurrent synthetic batch'])));
  assert.ok(results.every(r=>r.committed));assert.equal(results.filter(r=>r.already_committed).length,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM app.properties WHERE tenant_id=$1 AND code='CONCURRENT-S03'",[f.villageTenant])).rows[0].n,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM app.audit_events WHERE tenant_id=$1 AND event_type='import.commit' AND details->>'batch_id'=$2",[f.villageTenant,batch.batch_id])).rows[0].n,1);
  // An action waiting for the association lock must lose authority after revocation commits.
  const [a,b]=clients;await a.query('BEGIN');await a.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[f.villageTenant]);
  await a.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.coownerMember]);
  const pid=(await b.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  const pending=call(b,'enclavix_s03_registry_command',[f.villageTenant,'person',JSON.stringify({external_key:'DENIED-QUEUED-S03',name:'Denied contact',kind:'individual'}),'Queued registry change after revocation']).then(()=>({accepted:true}),e=>({accepted:false,code:e.code}));
  let waiting=false;
  for(let i=0;i<100;i++){if((await db.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0]?.wait_event_type==='Lock'){waiting=true;break;}await new Promise(r=>setTimeout(r,20));}
  assert.ok(waiting);await a.query('COMMIT');assert.deepEqual(await pending,{accepted:false,code:'42501'});
  assert.equal((await db.query("SELECT count(*)::int n FROM app.people WHERE external_key='DENIED-QUEUED-S03'")).rows[0].n,0);
  console.log('S03 PostgreSQL: concurrent import commits apply once; queued registry changes recheck revoked authority');
 } finally {
  await Promise.all(clients.map(async c=>{try{await c.query('ROLLBACK');}finally{await c.end();}}));
  await db.query("UPDATE app.memberships SET status='active' WHERE id=$1",[f.coownerMember]);
 }
}
