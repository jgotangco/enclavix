import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';
let db;
const users={operator:'c0000000-0000-0000-0000-000000000001',reviewer:'c0000000-0000-0000-0000-000000000002',admin:'c0000000-0000-0000-0000-000000000004',staff:'c0000000-0000-0000-0000-000000000003',outsider:'c0000000-0000-0000-0000-000000000005'};
const sessions=Object.fromEntries(Object.keys(users).map((k,i)=>[k,id(8000+i)]));
before(async()=>{
 db=await createDomainDatabase();await seedDomainFixtures(db);await db.exec("UPDATE app.tenants SET status='active'");
 for(const k of Object.keys(users))await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[sessions[k],users[k]]);
 await db.query('INSERT INTO app.platform_operators(auth_user_id,enabled) VALUES($1,true),($2,true)',[users.operator,users.reviewer]);
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())",[f.villageTenant,f.coownerMember]);
});
after(async()=>db?.close());
async function as(who,aal='aal2'){
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:users[who],session_id:sessions[who],aal,exp:Math.floor(Date.now()/1000)+3600})]);
}
async function rpc(name,args=[],key=randomUUID()){
 await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);await db.exec('SET ROLE authenticated');
 try{return (await db.query(`SELECT public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) AS result`,args)).rows[0].result;}finally{await db.exec('RESET ROLE');}
}
async function command(t,action,data,key){return rpc('enclavix_s03_registry_command',[t,action,JSON.stringify(data),'Verified synthetic registry operation'],key);}
const setupData=key=>({tenant_key:key,legal_name:'Sample '+key,administrator_email:'resident@enclavehoa.com',authority_ref:'Synthetic authority review record',currency:'PHP',time_zone:'Asia/Manila',locale:'en-PH'});
async function setup(key,kind='village'){
 await as('operator');const created=await rpc('enclavix_s03_create',[JSON.stringify(setupData(key)),'Create synthetic onboarding sandbox']);const t=created.tenant_id;
 await as('admin');const c=(await command(t,'community',{code:'PRIMARY',name:'Sample community',kind})).id;
 let l;
 if(kind==='condominium'){
  const tower=(await command(t,'location',{community_id:c,code:'TOWER-A',label:'Tower A',kind:'tower'})).id;
  l=(await command(t,'location',{community_id:c,parent_id:tower,code:'FLOOR-1',label:'Floor 1',kind:'floor'})).id;
 }else l=(await command(t,'location',{community_id:c,code:'BLOCK-1',label:'Block 1',kind:'block'})).id;
 const p=(await command(t,'property',{community_id:c,location_id:l,code:'P-001',label:'Sample property',kind:kind==='village'?'lot':'condominium_unit'})).id;
 await rpc('enclavix_s03_settings',[t,JSON.stringify({address:'Synthetic community address',brand_name:'Sample community',notification_contact:'sample@example.test',support_contact:'Sample admin office',privacy_notice_ref:'Synthetic privacy notice record',opening_balance_state:'deferred_to_s04'}),'Save synthetic onboarding configuration']);
 return {t,c,l,p};
}
test('village and condominium can be configured and independently activated without code changes',async()=>{
 for(const [key,kind] of [['sample-onboarding-village','village'],['sample-onboarding-condo','condominium']]){
  const {t}=await setup(key,kind);const view=await rpc('enclavix_s03_setup',[t]);assert.ok(Object.entries(view.checklist).filter(([k])=>k!=='property_count').every(([,v])=>v===true));
  await rpc('enclavix_s03_submit',[t,'Submit completed synthetic checklist']);
  await as('operator');await assert.rejects(rpc('enclavix_s03_activate',[t,view.setup.revision,'Self approval is never permitted']),e=>e.code==='42501');
  await as('reviewer');const active=await rpc('enclavix_s03_activate',[t,view.setup.revision,'Independent synthetic authority verification']);assert.equal(active.sandbox,true);
  await as('admin');assert.ok((await rpc('enclavix_s03_index')).contexts.some(x=>x.tenant_id===t));
 }
});
test('registry commands reject untrusted ownership claims, residents, operators and self-entitlement changes',async()=>{
 await as('admin');await assert.rejects(command(f.villageTenant,'person',{external_key:'BAD',name:'Bad',kind:'individual',auth_user_id:users.admin}),e=>e.code==='42501');
 await as('operator');await assert.rejects(rpc('enclavix_s03_registry',[f.villageTenant]),e=>e.code==='42501');
 await as('staff');await assert.rejects(command(f.villageTenant,'person',{external_key:'BAD',name:'Bad',kind:'individual',auth_user_id:users.admin}),e=>e.code==='22023');
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:f.secondLot,person_id:f.coowner,kind:'owner'}),e=>e.code==='42501');
 const a=await command(f.villageTenant,'person',{external_key:'  new-person  ',name:'Sample person',kind:'individual'},'same-registry-command');
 const b=await command(f.villageTenant,'person',{external_key:'  new-person  ',name:'Sample person',kind:'individual'},'same-registry-command');assert.deepEqual(a,b);
 assert.equal((await db.query('SELECT external_key FROM app.people WHERE id=$1',[a.id])).rows[0].external_key,'NEW-PERSON');
});
test('import preview reports row errors without creating records; commit is atomic and replay-safe',async()=>{
 await as('staff');
 const invalid=await rpc('enclavix_s03_import_stage',[f.villageTenant,'property',JSON.stringify([{community_code:'VILLAGE',location_code:'PHASE-1-BLOCK-1',code:'IM-1',label:'Imported lot',kind:'lot'},{community_code:'VILLAGE',location_code:'UNKNOWN',code:'IM-2',label:'Wrong location',kind:'lot'}]),'Preview synthetic property import']);
 assert.deepEqual(invalid.summary,{total:2,valid:1,invalid:1});
 assert.equal((await db.query("SELECT count(*)::int AS n FROM app.properties WHERE code='IM-1'")).rows[0].n,0);
 await assert.rejects(rpc('enclavix_s03_import_commit',[f.villageTenant,invalid.batch_id,invalid.source_sha256,'Cannot commit a partial batch']),e=>e.code==='22023');
 const good=await rpc('enclavix_s03_import_stage',[f.villageTenant,'property',JSON.stringify([{community_code:'VILLAGE',location_code:'PHASE-1-BLOCK-1',code:'IM-1',label:'Imported lot',kind:'lot'}]),'Preview valid synthetic import']);
 assert.equal(good.summary.invalid,0);
 const committed=await rpc('enclavix_s03_import_commit',[f.villageTenant,good.batch_id,good.source_sha256,'Confirm reviewed synthetic import']);assert.equal(committed.committed,true);
 const replay=await rpc('enclavix_s03_import_commit',[f.villageTenant,good.batch_id,good.source_sha256,'Retry reviewed synthetic import']);assert.equal(replay.already_committed,true);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM app.properties WHERE code='IM-1'")).rows[0].n,1);
});
test('export and offboarding staging are scoped, exclude auth identity bindings, and reject stale snapshots',async()=>{
 await as('staff');const created=await rpc('enclavix_s03_export_create',[f.villageTenant,'Create synthetic scoped registry export']);
 const data=await rpc('enclavix_s03_export',[f.villageTenant,created.export_id]);assert.equal(data.data.tenant.id,f.villageTenant);assert.ok(data.data.people.every(p=>!('auth_user_id' in p)&&p.tenant_id===f.villageTenant));
 await assert.rejects(rpc('enclavix_s03_export',[f.condoTenant,created.export_id]),e=>e.code==='42501');
 await command(f.villageTenant,'person',{external_key:'AFTER-EXPORT',name:'New sample contact',kind:'individual'});
 await assert.rejects(rpc('enclavix_s03_offboarding',[f.villageTenant,created.export_id,'Stage synthetic offboarding request']),e=>e.code==='23505');
 const current=await rpc('enclavix_s03_export_create',[f.villageTenant,'Create a current synthetic export']);
 const staged=await rpc('enclavix_s03_offboarding',[f.villageTenant,current.export_id,'Stage synthetic offboarding request']);assert.equal(staged.access_terminated,false);assert.equal(staged.deletion_performed,false);
});
test('onboarding rejects low assurance, stale submissions and revoked nominees',async()=>{
 await as('operator','aal1');await assert.rejects(rpc('enclavix_s03_create',[JSON.stringify(setupData('no-mfa-create')),'Attempt without MFA assurance']),e=>e.code==='42501');
 const {t}=await setup('onboarding-revalidation');
 const snapshot=await rpc('enclavix_s03_setup',[t]);
 await rpc('enclavix_s03_submit',[t,'Submit synthetic ready checklist']);
 await command(t,'person',{external_key:'REVISION-CHANGE',name:'Sample contact',kind:'individual'});
 await as('reviewer');await assert.rejects(rpc('enclavix_s03_activate',[t,snapshot.setup.revision,'Review no longer current revision']),e=>e.code==='23505');
 await db.query("UPDATE app.memberships SET status='revoked' WHERE tenant_id=$1",[t]);
 await as('admin');await assert.rejects(rpc('enclavix_s03_setup',[t]),e=>e.code==='42501');await assert.rejects(rpc('enclavix_s03_registry',[t]),e=>e.code==='42501');
 assert.ok(!(await rpc('enclavix_s03_index')).setups.some(s=>s.tenant_id===t));
});
test('transfers preserve history, remove obsolete ownership and representation access, and reject cross-tenant links',async()=>{
 await as('staff');
 const community=(await command(f.villageTenant,'community',{code:'TRANSFER-COMMUNITY',name:'Transfer sample',kind:'village'})).id;
 const location=(await command(f.villageTenant,'location',{community_id:community,code:'TRANSFER-BLOCK',label:'Transfer block',kind:'block'})).id;
 const property=(await command(f.villageTenant,'property',{community_id:community,location_id:location,code:'TRANSFER-LOT',label:'Transfer sample lot',kind:'lot'})).id;
 const target=(await command(f.villageTenant,'person',{external_key:'TRANSFER-TARGET',name:'New synthetic owner',kind:'individual'})).id;
 const relationship=(await command(f.villageTenant,'relationship',{property_id:property,person_id:f.villagePerson,kind:'owner'})).id;
 await as('admin');assert.equal((await rpc('enclavix_s03_property',[f.villageTenant,property])).property.id,property);
 await as('staff');await command(f.villageTenant,'transfer',{property_id:property,old_person_id:f.villagePerson,new_person_id:target,kind:'owner'});
 const old=(await db.query('SELECT * FROM app.property_relationships WHERE id=$1',[relationship])).rows[0];assert.ok(old.valid_until);
 assert.equal((await db.query('SELECT count(*)::int n FROM app.property_relationships WHERE property_id=$1',[property])).rows[0].n,2);
 await as('admin');await assert.rejects(rpc('enclavix_s03_property',[f.villageTenant,property]),e=>e.code==='42501');
 await as('staff');await assert.rejects(command(f.villageTenant,'relationship',{property_id:property,person_id:f.condoPerson,kind:'owner'}),e=>e.code==='23503');
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:property,person_id:target,kind:'owner'}),e=>e.code==='23505');
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:property,person_id:f.renter,kind:'tenant',valid_from:'2020-01-01T00:00:00Z'}),e=>e.code==='22023');
 // A representative loses derived property access when the represented owner's entitlement ends.
 await db.query("INSERT INTO app.memberships(tenant_id,person_id,status,valid_from) VALUES($1,$2,'active',now())",[f.villageTenant,f.representative]);
 const repMember=(await db.query('SELECT id FROM app.memberships WHERE tenant_id=$1 AND person_id=$2',[f.villageTenant,f.representative])).rows[0].id;
 await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'resident',now())",[f.villageTenant,repMember]);
 await db.query('UPDATE app.people SET auth_user_id=$1 WHERE id=$2',[users.outsider,f.representative]);
 await as('outsider');assert.ok(await rpc('enclavix_s03_property',[f.villageTenant,f.secondLot]));
 await as('staff');await command(f.villageTenant,'transfer',{property_id:f.secondLot,old_person_id:f.organization,new_person_id:target,kind:'owner'});
 await as('outsider');await assert.rejects(rpc('enclavix_s03_property',[f.villageTenant,f.secondLot]),e=>e.code==='42501');
});
test('import conflicts invalidate whole batches and reconciliation exposes duplicate rows',async()=>{
 await as('staff');
 const row={community_code:'VILLAGE',location_code:'PHASE-1-BLOCK-1',code:'COLLISION-IMPORT',label:'Sample',kind:'lot'};
 const duplicate=await rpc('enclavix_s03_import_stage',[f.villageTenant,'property',JSON.stringify([row,row]),'Preview duplicate synthetic source rows']);assert.equal(duplicate.summary.invalid,2);
 const batch=await rpc('enclavix_s03_import_stage',[f.villageTenant,'property',JSON.stringify([{...row,code:'ATOMIC-FIRST'},row]),'Preview a valid atomic source batch']);
 await command(f.villageTenant,'property',{community_id:f.village,location_id:f.block,code:row.code,label:'Created after preview',kind:'lot'});
 await assert.rejects(rpc('enclavix_s03_import_commit',[f.villageTenant,batch.batch_id,batch.source_sha256,'Commit changed synthetic registry']),e=>e.code==='23505');
 assert.equal((await db.query("SELECT count(*)::int n FROM app.properties WHERE code='ATOMIC-FIRST'")).rows[0].n,0);
 await assert.rejects(rpc('enclavix_s03_import_commit',[f.villageTenant,batch.batch_id,'0'.repeat(64),'Reject substituted source fingerprint']),e=>e.code==='23505');
 await assert.rejects(rpc('enclavix_s03_import_stage',[f.villageTenant,'person',null,'Reject missing import payload']),e=>e.code==='22023');
 const contact=await command(f.villageTenant,'person',{external_key:'REL-IMPORT',name:'Relationship sample',kind:'individual'});assert.ok(contact.id);
 const relation={community_code:'VILLAGE',property_code:'B1-L1',person_key:'REL-IMPORT',kind:'occupant'};
 // Resolve the existing fixture code rather than assuming its presentation format.
 relation.property_code=(await db.query('SELECT code FROM app.properties WHERE id=$1',[f.lot])).rows[0].code;
 const relationships=await rpc('enclavix_s03_import_stage',[f.villageTenant,'relationship',JSON.stringify([relation,relation]),'Preview duplicate relationship source']);assert.equal(relationships.summary.invalid,2);
});
test('terminology and contact responsibilities are configuration with bounded values and nonoverlapping dates',async()=>{
 await as('staff');
 const community=await command(f.villageTenant,'community',{code:'LABELLED',name:'Configurable terms',kind:'village',structure_labels:{property:'Home',block:'Street'}});
 assert.equal((await db.query('SELECT structure_labels FROM app.communities WHERE id=$1',[community.id])).rows[0].structure_labels.property,'Home');
 await assert.rejects(command(f.villageTenant,'community',{code:'BAD-LABEL',name:'Bad term',kind:'village',structure_labels:{property:{nested:'not text'}}}),e=>e.code==='22023');
 const first=(await command(f.villageTenant,'person',{external_key:'PRIMARY-ONE',name:'Primary sample',kind:'individual'})).id;
 const second=(await command(f.villageTenant,'person',{external_key:'PRIMARY-TWO',name:'Other sample',kind:'individual'})).id;
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:f.lot,person_id:first,kind:'occupant',valid_from:'2030-01-01T12:00:00'}),e=>e.code==='22023');
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:f.lot,person_id:first,kind:'occupant',valid_from:'2030-01-01T12:00:00Z',valid_until:'2029-01-01T12:00:00Z'}),e=>e.code==='22023');
 const current=await command(f.villageTenant,'relationship',{property_id:f.lot,person_id:first,kind:'occupant',primary_contact:true,billing_contact:true});
 await assert.rejects(command(f.villageTenant,'relationship',{property_id:f.lot,person_id:second,kind:'occupant',primary_contact:true}),e=>e.code==='23505');
 await command(f.villageTenant,'end_relationship',{id:current.id});
 await command(f.villageTenant,'relationship',{property_id:f.lot,person_id:second,kind:'occupant',primary_contact:true,billing_contact:true});
 const registry=await rpc('enclavix_s03_registry',[f.villageTenant]);assert.ok(registry.people.every(p=>!('auth_user_id' in p)));assert.ok(registry.properties.every(p=>p.lot_area_sqm===null||typeof p.lot_area_sqm==='string'));
});
