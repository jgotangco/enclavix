import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures, FIXTURE as f, id} from '../tools/lib/domain-fixtures.mjs';

let db;
const owner='c0000000-0000-0000-0000-000000000004';
const staff='c0000000-0000-0000-0000-000000000003';
const outsider='c0000000-0000-0000-0000-000000000005';
const ownerSession=id(1001),staffSession=id(1002),outsideSession=id(1003);
before(async()=>{
 db=await createDomainDatabase();await seedDomainFixtures(db);
 await db.exec(`UPDATE app.tenants SET status='active';`);
 await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2),($3,$4),($5,$6)',[ownerSession,owner,staffSession,staff,outsideSession,outsider]);
 // Controlled bootstrap only: no route creates the first association administrator.
 await db.query(`INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())`,[f.villageTenant,f.coownerMember]);
});
after(async()=>db?.close());
async function claims(user=owner, session=ownerSession, aal='aal1',extra={}) {
 await db.query(`SELECT set_config('request.jwt.claims',$1,false)`,[JSON.stringify({role:'authenticated',sub:user,session_id:session,aal,exp:Math.floor(Date.now()/1000)+3600,...extra})]);
}
async function rpc(sql,args=[]) {
 await db.exec('SET ROLE authenticated');
 try{return await db.query(sql,args);}finally{await db.exec('RESET ROLE');}
}
async function denied(sql,args=[]){await assert.rejects(rpc(sql,args),e=>['42501','23503'].includes(e.code));}
const val=r=>r.rows[0].value;

test('trusted JWT session, verified contact, expiry and revocation are required',async()=>{
 await claims(owner,ownerSession,'aal1',{exp:1}); assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await claims(owner,outsideSession);assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await claims();await db.query('UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1',[owner]);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await db.query('UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1',[owner]);
 assert.equal(val(await rpc('SELECT public.enclavix_contexts() AS value')).length,1);
 await db.query("UPDATE auth.sessions SET not_after=now()-interval '1 minute' WHERE id=$1",[ownerSession]);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await db.query('UPDATE auth.sessions SET not_after=NULL WHERE id=$1',[ownerSession]);
});
test('residents see related properties only; civic title and forged claims confer no privilege',async()=>{
 await claims(owner,ownerSession,'aal1',{user_metadata:{role:'association_admin'},tenant_id:f.condoTenant,role_name:'association_admin'});
 assert.equal(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])).length,2);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.condoTenant])),[]);
 await denied('SELECT public.enclavix_set_role($1,$2,$3,NULL,NULL,false,$4)',[f.villageTenant,f.villageMember,'association_admin','Forged elevation attempt']);
 await denied('SELECT public.enclavix_applications($1)',[f.condoTenant]);
});
test('all staff roles require MFA and guards have shorter absolute sessions',async()=>{
 await claims(staff,staffSession);assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await claims(staff,staffSession,'aal2');assert.equal(val(await rpc('SELECT public.enclavix_contexts() AS value')).length,2);
 await db.query("UPDATE auth.sessions SET created_at=now()-interval '31 minutes' WHERE id=$1",[staffSession]);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await db.query('UPDATE auth.sessions SET created_at=now() WHERE id=$1',[staffSession]);
});
test('reader role is non-login, cannot bypass RLS, and pooled principals do not leak',async()=>{
 assert.deepEqual((await db.query("SELECT rolcanlogin,rolbypassrls FROM pg_roles WHERE rolname='enclavix_reader'")).rows,[{rolcanlogin:false,rolbypassrls:false}]);
 await claims();assert.equal(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])).length,2);
 await claims(outsider,outsideSession);assert.deepEqual(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])),[]);
 await db.exec("SELECT set_config('request.jwt.claims','{}',false)");
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 assert.equal((await db.query("SELECT pg_has_role('authenticated','enclavix_reader','MEMBER') AS member")).rows[0].member,false);
 await db.exec('SET ROLE authenticated');try{
  await assert.rejects(db.query('SELECT * FROM app.people'),e=>e.code==='42501');
 }finally{await db.exec('RESET ROLE');}
});
test('application cannot self-approve; approved binding and relationship are audited atomically',async()=>{
 await claims(outsider,outsideSession);
 const application=val(await rpc('SELECT public.enclavix_apply($1,$2,$3) AS value',[f.villageTenant,'Sample Applicant','Lot 2']));
 assert.deepEqual(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])),[]);
 await denied('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[application,f.renter,f.secondLot,'Self approval attempt']);
 await claims(staff,staffSession,'aal2');
 await denied('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[application,f.renter,f.unit,'Wrong HOA property']);
 assert.equal((await db.query('SELECT status FROM app.access_applications WHERE id=$1',[application])).rows[0].status,'pending');
 await rpc('SELECT public.enclavix_review_application($1,$2,$3,true,$4)',[application,f.renter,f.secondLot,'Relationship checked against association records']);
 await claims(outsider,outsideSession);const properties=val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant]));
 assert.deepEqual(properties.map(p=>p.id),[f.secondLot]);
 await claims(staff,staffSession,'aal2');
 await rpc('SELECT public.enclavix_revoke_membership($1,$2,$3)',[f.villageTenant,(await db.query('SELECT id FROM app.memberships WHERE person_id=$1',[f.renter])).rows[0].id,'Occupancy ended and access removed']);
 await claims(outsider,outsideSession);assert.deepEqual(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])),[]);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM app.audit_events WHERE event_type='access.application_reviewed'")).rows[0].n,1);
});
test('role changes cannot elevate self; community scope, reason and recent MFA are enforced',async()=>{
 await claims(staff,staffSession,'aal2');
 await denied('SELECT public.enclavix_set_role($1,$2,$3,NULL,NULL,false,$4)',[f.villageTenant,f.coownerMember,'finance_approver','Self privilege elevation']);
 await denied('SELECT public.enclavix_set_role($1,$2,$3,NULL,NULL,false,NULL)',[f.villageTenant,f.villageMember,'finance_approver']);
 await denied('SELECT public.enclavix_set_role($1,$2,$3,$4,NULL,false,$5)',[f.villageTenant,f.villageMember,'finance_approver',f.condo,'Cross tenant scope rejected']);
 await db.query("UPDATE auth.sessions SET created_at=now()-interval '11 minutes' WHERE id=$1",[staffSession]);
 await denied('SELECT public.enclavix_set_role($1,$2,$3,NULL,NULL,false,$4)',[f.villageTenant,f.villageMember,'finance_approver','Old session change attempt']);
 await db.query('UPDATE auth.sessions SET created_at=now() WHERE id=$1',[staffSession]);
});
test('invitation is email-bound, opaque, one-time, expiring, and grants only resident access',async()=>{
 await claims(staff,staffSession,'aal2');
 const token=val(await rpc('SELECT public.enclavix_invite($1,$2,$3,$4) AS value',[f.villageTenant,f.representative,'invite@example.test','Verified representative invitation']));
 const invited=id(2001),invitedSession=id(2002);
 await db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)',[invited,'invite@example.test']);await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[invitedSession,invited]);
 await claims(owner,ownerSession);await denied('SELECT public.enclavix_accept_invitation($1)',[token]);
 await claims(invited,invitedSession);await rpc('SELECT public.enclavix_accept_invitation($1)',[token]);
 await denied('SELECT public.enclavix_accept_invitation($1)',[token]);
 const contexts=val(await rpc('SELECT public.enclavix_contexts() AS value'));
 assert.deepEqual(contexts[0].roles.map(r=>r.role),['resident']);
 const stored=(await db.query('SELECT token_hash FROM app.invitations WHERE person_id=$1',[f.representative])).rows[0].token_hash;
 assert.notEqual(stored,token);assert.equal(stored.length,64);
});
test('support has no routine access; explicit grant is time-limited and never grants documents or properties',async()=>{
 await db.query('INSERT INTO app.platform_operators(auth_user_id,enabled) VALUES($1,true)',[outsider]);
 await claims(outsider,outsideSession,'aal2');assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await claims(staff,staffSession,'aal2');
 await denied('SELECT public.enclavix_support($1,$2,61,false,$3)',[f.villageTenant,outsider,'Support metadata investigation']);
 await rpc('SELECT public.enclavix_support($1,$2,15,false,$3)',[f.villageTenant,outsider,'Support metadata investigation']);
 await claims(outsider,outsideSession,'aal2');
 const context=val(await rpc('SELECT public.enclavix_contexts() AS value'));
 assert.equal(context[0].support_only,true);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_properties($1) AS value',[f.villageTenant])),[]);
 await db.query("UPDATE app.support_access SET expires_at=now()-interval '1 second', starts_at=now()-interval '2 seconds' WHERE operator_id=$1",[outsider]);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
});
test('role changes take effect on the next request without refreshing the JWT',async()=>{
 await claims(staff,staffSession,'aal2');
 await rpc('SELECT public.enclavix_set_role($1,$2,$3,$4,NULL,false,$5)',[f.villageTenant,f.villageMember,'finance_approver',f.village,'Verified temporary approval permission']);
 await claims(owner,ownerSession,'aal1');assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
 await claims(owner,ownerSession,'aal2');
 assert.equal((await db.query("SELECT app.role_at($1,'finance_approver',$2) AS allowed",[f.villageTenant,f.village])).rows[0].allowed,true);
 assert.equal((await db.query("SELECT app.role_at($1,'finance_approver',$2) AS allowed",[f.villageTenant,f.condo])).rows[0].allowed,false);
 await claims(staff,staffSession,'aal2');
 await rpc('SELECT public.enclavix_set_role($1,$2,$3,$4,NULL,true,$5)',[f.villageTenant,f.villageMember,'finance_approver',f.village,'Temporary approval permission removed']);
 await claims(owner,ownerSession,'aal2');assert.equal((await db.query("SELECT app.role_at($1,'finance_approver',$2) AS allowed",[f.villageTenant,f.village])).rows[0].allowed,false);
});
test('document access checks scan, audience, household ownership and current membership',async()=>{
 await claims(owner,ownerSession);
 assert.equal((await db.query('SELECT app.document_access($1) AS allowed',[`${f.villageTenant}/${f.document}`])).rows[0].allowed,false);
 await db.query("UPDATE app.document_objects SET scan_status='clean',audience='property_owners' WHERE id=$1",[f.document]);
 assert.equal(val(await rpc('SELECT public.enclavix_document($1,$2) AS value',[f.villageTenant,f.document])).object_path,`${f.villageTenant}/${f.document}`);
 assert.equal(val(await rpc('SELECT public.enclavix_document($1,$2) AS value',[f.condoTenant,f.document])),null);
 // Applicant's occupant relationship must not authorize owner-only evidence.
 await claims(outsider,outsideSession,'aal2');
 const m=(await db.query('SELECT id FROM app.memberships WHERE person_id=$1',[f.renter])).rows[0].id;
 await db.query("UPDATE app.memberships SET status='active' WHERE id=$1",[m]);
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'resident',now())",[f.villageTenant,m]);
 await db.query('UPDATE app.document_objects SET property_id=$1 WHERE id=$2',[f.secondLot,f.document]);
 assert.equal(val(await rpc('SELECT public.enclavix_document($1,$2) AS value',[f.villageTenant,f.document])),null);
 await db.query("UPDATE app.document_objects SET audience='property_occupants' WHERE id=$1",[f.document]);
 assert.ok(val(await rpc('SELECT public.enclavix_document($1,$2) AS value',[f.villageTenant,f.document])));
 await db.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[m]);
 assert.equal(val(await rpc('SELECT public.enclavix_document($1,$2) AS value',[f.villageTenant,f.document])),null);
});
test('session inventory and remote revocation are restricted to the current identity',async()=>{
 await claims(owner,ownerSession);const inventory=val(await rpc('SELECT public.enclavix_sessions() AS value'));
 assert.deepEqual(inventory.map(s=>s.id),[ownerSession]);
 await rpc('SELECT public.enclavix_revoke_session($1)',[staffSession]);assert.equal((await db.query('SELECT count(*)::int AS n FROM auth.sessions WHERE id=$1',[staffSession])).rows[0].n,1);
 await rpc('SELECT public.enclavix_revoke_session($1)',[ownerSession]);
 assert.deepEqual(val(await rpc('SELECT public.enclavix_contexts() AS value')),[]);
});
