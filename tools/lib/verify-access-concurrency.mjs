import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {FIXTURE as f,id} from './domain-fixtures.mjs';

/** Two real DB sessions; verified provider JWT claims installed only in the local test harness. */
export async function verifyAccessConcurrency({connect,db,staff,admin}) {
 const token=(await staff.auth.getSession()).data.session.access_token;
 const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
 const created=await admin.auth.admin.createUser({email:'concurrency@example.test',password:randomBytes(24).toString('base64url'),email_confirm:true});assert.ifError(created.error);
 const person=id(9101),application=id(9102);
 await db.query("INSERT INTO app.people(id,tenant_id,display_name) VALUES($1,$2,'Concurrency applicant')",[person,f.villageTenant]);
 await db.query("INSERT INTO app.access_applications(id,tenant_id,applicant_id,display_name,requested_property) VALUES($1,$2,$3,'Concurrency applicant','Lot 2')",[application,f.villageTenant,created.data.user.id]);
 const clients=await Promise.all([connect(),connect()]);
 try{
  const results=await Promise.allSettled(clients.map(async c=>{
   await c.query('BEGIN');
   try{
    await c.query('SET LOCAL ROLE authenticated');await c.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify(claims)]);
    await c.query('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[application,person,f.secondLot,'Verified concurrent application approval']);await c.query('COMMIT');
   }catch(e){await c.query('ROLLBACK');throw e;}
  }));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='23505').length,1);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM app.audit_events WHERE event_type='access.application_reviewed' AND details->>'application_id'=$1",[application])).rows[0].n,1);
  // A queued admin command must recheck authority after another transaction revokes it.
  const [a,b]=clients;
  await a.query('BEGIN');await a.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[f.villageTenant]);
  await a.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.coownerMember]);
  await b.query('BEGIN');await b.query('SET LOCAL ROLE authenticated');await b.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'idempotency-key':'queued-role-command'})]);await b.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify(claims)]);
  const pid=(await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  const pending=b.query('SELECT public.enclavix_set_role($1,$2,$3,NULL,NULL,false,$4)',[f.villageTenant,f.villageMember,'finance_approver','Queued action must not outlive actor revocation']);
  const observed=pending.then(()=>({accepted:true}),e=>({accepted:false,code:e.code}));
  let waiting=false;
  for(let i=0;i<100;i++){const activity=(await db.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0];if(activity?.wait_event_type==='Lock'){waiting=true;break;}await new Promise(r=>setTimeout(r,20));}
  assert.ok(waiting,'Second command should wait on the tenant lock');
  await a.query('COMMIT');
  assert.deepEqual(await observed,{accepted:false,code:'42501'});
  await b.query('ROLLBACK');
  await db.query("UPDATE app.memberships SET status='active' WHERE id=$1",[f.coownerMember]);
  console.log('S02 PostgreSQL: concurrent approvals commit once; queued commands recheck authority after actor revocation');
 }finally{await Promise.all(clients.map(async c=>{try{await c.query('ROLLBACK');}finally{await c.end();}}));}
}
