import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';
let db,asset;
const users={staff:'c0000000-0000-0000-0000-000000000003',resident:'c0000000-0000-0000-0000-000000000004',operator:'c0000000-0000-0000-0000-000000000001'};
const sessions={staff:id(8701),resident:id(8702),operator:id(8703)};
before(async()=>{
 db=await createDomainDatabase();await seedDomainFixtures(db);await db.exec("UPDATE app.tenants SET status='active'");
 for(const who of Object.keys(users))await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[sessions[who],users[who]]);
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())",[f.villageTenant,f.coownerMember]);
 await db.query('INSERT INTO app.platform_operators(auth_user_id,enabled) VALUES($1,true)',[users.operator]);
 await as('staff');asset=(await rpc('enclavix_s03_registry_command',[f.villageTenant,'asset',JSON.stringify({community_id:f.village,code:'REGISTRY-ASSET',label:'Synthetic registry storage',kind:'storage'}),'Create synthetic allocation asset'])).id;
});
after(async()=>db?.close());
async function as(who,aal='aal2') {await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:users[who],session_id:sessions[who],aal,exp:Math.floor(Date.now()/1000)+3600})]);}
async function rpc(name,args,key=randomUUID()) {
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);await db.exec('SET ROLE authenticated');
 try{return(await db.query(`SELECT public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;}finally{await db.exec('RESET ROLE');}
}
const reason='Verified synthetic asset registry change';
const change=(action,data,key,tenant=f.villageTenant)=>rpc('enclavix_s03_allocation',[tenant,action,JSON.stringify(data),reason],key);
const assign=(extra={})=>({asset_id:asset,property_id:f.secondLot,kind:'use',...extra});
test('allocations are durable, audited, replay-safe and visible only with current property access',async()=>{
 await as('staff');const data=assign();const saved=await change('assign',data,'allocation-replay');assert.deepEqual(await change('assign',data,'allocation-replay'),saved);
 assert.equal((await db.query('SELECT count(*)::int n FROM app.asset_allocations WHERE id=$1',[saved.id])).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM app.audit_events WHERE details->>'allocation_id'=$1",[saved.id])).rows[0].n,1);
 await assert.rejects(change('assign',assign({kind:'ownership'}),'allocation-replay'),e=>e.code==='23505');
 await assert.rejects(change('assign',data),e=>e.code==='23505');
 await as('resident');const view=await rpc('enclavix_s03_property_allocations',[f.villageTenant,f.secondLot]);assert.ok(view.some(x=>x.id===saved.id&&x.asset_code==='REGISTRY-ASSET'));
 await assert.rejects(rpc('enclavix_s03_allocations',[f.villageTenant]),e=>e.code==='42501');
 await assert.rejects(rpc('enclavix_s03_property_allocations',[f.condoTenant,f.unit]),e=>e.code==='42501');
 await as('staff');await change('end',{id:saved.id},'end-current');await change('end',{id:saved.id},'end-current');
 assert.ok((await db.query('SELECT valid_until FROM app.asset_allocations WHERE id=$1',[saved.id])).rows[0].valid_until);
 await as('resident');assert.ok(!(await rpc('enclavix_s03_property_allocations',[f.villageTenant,f.secondLot])).some(x=>x.id===saved.id));
});
test('residents, operators, low assurance, stale sessions and self entitlement changes are denied',async()=>{
 for(const who of ['resident','operator']){await as(who);await assert.rejects(change('assign',assign()),e=>e.code==='42501');}
 await as('staff','aal1');await assert.rejects(change('assign',assign()),e=>e.code==='42501');
 await as('staff');await assert.rejects(change('assign',assign({property_id:f.lot})),e=>e.code==='42501');
 await db.query("UPDATE auth.sessions SET created_at=now()-interval '11 minutes' WHERE id=$1",[sessions.staff]);
 try{await assert.rejects(change('assign',assign()),e=>e.code==='42501');}finally{await db.query('UPDATE auth.sessions SET created_at=now() WHERE id=$1',[sessions.staff]);}
});
test('cross-tenant/community references, inactive assets and unknown fields cannot enter the registry',async()=>{
 await as('staff');
 await assert.rejects(change('assign',assign({asset_id:f.parking})),e=>e.code==='42501');
 await assert.rejects(change('assign',assign({property_id:f.unit})),e=>e.code==='42501');
 const c=(await rpc('enclavix_s03_registry_command',[f.villageTenant,'community',JSON.stringify({code:'ANOTHER',name:'Another community',kind:'village'}),reason])).id;
 const a=(await rpc('enclavix_s03_registry_command',[f.villageTenant,'asset',JSON.stringify({community_id:c,code:'OTHER-ASSET',label:'Other scope',kind:'parking'}),reason])).id;
 await assert.rejects(change('assign',assign({asset_id:a})),e=>e.code==='42501');
 await assert.rejects(change('assign',assign({actor:users.staff})),e=>e.code==='22023');
 await db.query('UPDATE app.assets SET is_active=false WHERE id=$1',[asset]);
 try{await assert.rejects(change('assign',assign()),e=>e.code==='42501');}finally{await db.query('UPDATE app.assets SET is_active=true WHERE id=$1',[asset]);}
});
test('future allocations can be cancelled without deleting history; dates are explicit and bounded',async()=>{
 await as('staff');
 const later=new Date(Date.now()+86400000).toISOString(),end=new Date(Date.now()+172800000).toISOString();
 const planned=await change('assign',assign({valid_from:later,valid_until:end}));
 await assert.rejects(change('end',{id:planned.id}),e=>e.code==='22023');
 await change('cancel',{id:planned.id},'cancel-future');await change('cancel',{id:planned.id},'cancel-future');
 const row=(await db.query('SELECT * FROM app.asset_allocations WHERE id=$1',[planned.id])).rows[0];assert.ok(row.cancelled_at);assert.ok(row.valid_from);
 assert.equal((await rpc('enclavix_s03_allocations',[f.villageTenant])).find(x=>x.id===planned.id).status,'cancelled');
 const replacement=await change('assign',assign({valid_from:later,valid_until:end}));assert.notEqual(replacement.id,planned.id);
 await assert.rejects(change('assign',assign({valid_from:'2030-01-01T12:00:00'})),e=>e.code==='22023');
 await assert.rejects(change('assign',assign({valid_from:'2020-01-01T12:00:00Z'})),e=>e.code==='22023');
 await assert.rejects(change('assign',assign({valid_from:end,valid_until:later})),e=>e.code==='22023');
});
test('end cannot extend a term, cancellation cannot remove current entitlement, and history remains',async()=>{
 await as('staff');const end=new Date(Date.now()+3600000).toISOString();
 const saved=await change('assign',assign({kind:'ownership',valid_until:end}));
 await assert.rejects(change('cancel',{id:saved.id}),e=>e.code==='22023');
 await assert.rejects(change('end',{id:saved.id,valid_until:new Date(Date.now()+7200000).toISOString()}),e=>e.code==='22023');
 await change('end',{id:saved.id});await assert.rejects(change('end',{id:saved.id}),e=>e.code==='22023');
 assert.equal((await db.query('SELECT count(*)::int n FROM app.asset_allocations WHERE id=$1',[saved.id])).rows[0].n,1);
});

test('asset links never grant property access and self termination requires another administrator',async()=>{
 await as('staff');
 const own=(await db.query("INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from) VALUES($1,$2,$3,$4,'use',now()) RETURNING id",[f.villageTenant,f.village,asset,f.lot])).rows[0].id;
 await assert.rejects(change('end',{id:own}),e=>e.code==='42501');
 await db.query('UPDATE app.memberships SET status=$1 WHERE id=$2',['revoked',f.villageMember]);
 try{await as('resident');await assert.rejects(rpc('enclavix_s03_property_allocations',[f.villageTenant,f.secondLot]),e=>e.code==='42501');}finally{await db.query('UPDATE app.memberships SET status=$1 WHERE id=$2',['active',f.villageMember]);}
 await as('staff');const index=await rpc('enclavix_s03_index',[]);assert.equal(index.contexts.find(x=>x.tenant_id===f.villageTenant).time_zone,'Asia/Manila');
 const info=await rpc('enclavix_s03_property',[f.villageTenant,f.secondLot]);assert.equal(info.time_zone,'Asia/Manila');
});
