import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDomainDatabase } from '../tools/lib/domain-database.mjs';
import { seedDomainFixtures, FIXTURE as f, id } from '../tools/lib/domain-fixtures.mjs';

let db;
before(async () => { db = await createDomainDatabase(); await seedDomainFixtures(db); });
after(async () => { await db?.close(); });
const deny = (sql, args = [], code = '23503') => assert.rejects(db.query(sql, args), error => error.code === code);

test('village and condominium coexist with distinct hierarchical forms', async () => {
  const result = await db.query('SELECT kind,count(*)::int AS count FROM app.communities GROUP BY kind ORDER BY kind::text');
  assert.deepEqual(result.rows, [{kind:'condominium',count:1},{kind:'village',count:1}]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM app.locations')).rows[0].count,4);
  await deny(`INSERT INTO app.locations(tenant_id,community_id,kind,code,label) VALUES ($1,$2,'tower','BAD','Wrong form')`, [f.villageTenant,f.village], '23514');
  await deny(`INSERT INTO app.locations(tenant_id,community_id,parent_location_id,kind,code,label) VALUES ($1,$2,$3,'floor','BAD','Wrong parent')`, [f.condoTenant,f.condo,f.block]);
});
test('a multi-property owner and coowners are independent from their account roles', async () => {
  const result = await db.query(`SELECT count(*)::int AS count FROM app.property_relationships WHERE person_id=$1 AND kind='owner'`, [f.villagePerson]);
  assert.equal(result.rows[0].count,2);
  assert.equal((await db.query(`SELECT count(*)::int AS count FROM app.property_relationships WHERE property_id=$1 AND kind='owner'`, [f.lot])).rows[0].count,2);
  assert.deepEqual((await db.query('SELECT role FROM app.membership_roles WHERE membership_id=$1',[f.villageMember])).rows, [{role:'resident'}]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM app.people WHERE auth_user_id IS NOT NULL')).rows[0].count,4);
  assert.equal((await db.query(`SELECT count(DISTINCT m.tenant_id)::int AS count FROM app.memberships m JOIN app.people p ON (m.tenant_id,m.person_id)=(p.tenant_id,p.id) JOIN app.membership_roles r ON (m.tenant_id,m.id)=(r.tenant_id,r.membership_id) WHERE r.role='guard' AND p.auth_user_id IS NOT NULL`)).rows[0].count,2);
});
test('a corporate owner can designate an independently scoped representative', async () => {
  const rows = (await db.query(`SELECT represented_person_id FROM app.property_relationships WHERE person_id=$1`,[f.representative])).rows;
  assert.equal(rows[0].represented_person_id, f.organization);
  await deny(`INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,valid_from) VALUES ($1,$2,$3,$4,'representative',now())`,[f.villageTenant,f.village,f.lot,f.representative],'23514');
});
test('property and asset references cannot cross tenants or communities', async () => {
  await deny(`INSERT INTO app.properties(tenant_id,community_id,code,label,kind) VALUES ($1,$2,'BAD','Wrong tenant','lot')`,[f.villageTenant,f.condo]);
  await deny(`INSERT INTO app.properties(tenant_id,community_id,location_id,code,label,kind) VALUES ($1,$2,$3,'BAD','Wrong location','lot')`,[f.villageTenant,f.village,f.floor]);
  await deny(`INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from) VALUES ($1,$2,$3,$4,'use',now())`,[f.condoTenant,f.condo,f.parking,f.lot]);
});
test('human property codes can repeat in another HOA without weakening identity binding', async () => {
  await db.exec('BEGIN');
  try {
    await db.query(`INSERT INTO app.properties(tenant_id,community_id,location_id,code,label,kind) VALUES ($1,$2,$3,'B1-L1','Repeated local code','condominium_unit')`,[f.condoTenant,f.condo,f.floor]);
    assert.equal((await db.query(`SELECT count(*)::int AS count FROM app.properties WHERE code='B1-L1'`)).rows[0].count,2);
  } finally { await db.exec('ROLLBACK'); }
  await deny(`INSERT INTO app.people(tenant_id,display_name,auth_user_id) VALUES ($1,'Duplicate binding',$2)`,[f.villageTenant,'c0000000-0000-0000-0000-000000000004'],'23505');
});
test('people, memberships and role grants cannot reference another association', async () => {
  await deny(`INSERT INTO app.memberships(tenant_id,person_id,valid_from) VALUES ($1,$2,now())`,[f.condoTenant,f.villagePerson]);
  await deny(`INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES ($1,$2,'guard',now())`,[f.condoTenant,f.villageMember]);
  await deny(`INSERT INTO app.membership_roles(tenant_id,membership_id,granted_by_membership_id,role,valid_from) VALUES ($1,$2,$3,'guard',now())`,[f.villageTenant,f.villageMember,f.condoMember]);
  await deny(`INSERT INTO app.membership_roles(tenant_id,membership_id,community_id,role,valid_from) VALUES ($1,$2,$3,'guard',now())`,[f.villageTenant,f.villageMember,f.condo]);
  await deny(`INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,valid_from) VALUES ($1,$2,$3,$4,'owner',now())`,[f.villageTenant,f.village,f.lot,f.condoPerson]);
});
test('temporal intervals, valid zones and numeric limits are checked in PostgreSQL', async () => {
  await deny(`UPDATE app.memberships SET valid_until=valid_from WHERE id=$1`,[f.villageMember],'23514');
  await deny(`UPDATE app.property_relationships SET valid_until=valid_from WHERE person_id=$1`,[f.renter],'23514');
  await deny(`UPDATE app.properties SET ownership_share=1.1 WHERE id=$1`,[f.unit],'23514');
  await deny(`UPDATE app.properties SET lot_area_sqm='NaN' WHERE id=$1`,[f.lot],'23514');
  await deny(`UPDATE app.assets SET capacity=0 WHERE id=$1`,[f.parking],'23514');
  await deny(`UPDATE app.communities SET time_zone='Not/A_Timezone' WHERE id=$1`,[f.condo],'22023');
});
test('identity and hierarchy cannot be moved to defeat scoped references', async () => {
  await deny('UPDATE app.people SET tenant_id=$1 WHERE id=$2',[f.condoTenant,f.villagePerson],'23514');
  await deny('UPDATE app.locations SET parent_location_id=$1 WHERE id=$2',[f.block,f.phase],'23514');
  await deny(`UPDATE app.communities SET kind='condominium' WHERE id=$1`,[f.village],'23514');
  await deny(`INSERT INTO app.properties(tenant_id,community_id,code,label,kind) VALUES ($1,$2,'WRONG-FORM','Wrong form','condominium_unit')`,[f.villageTenant,f.village],'23514');
});
test('imports reject cross-tenant actors/rows and repeated idempotency keys', async () => {
  await deny(`INSERT INTO app.import_batches(tenant_id,created_by_membership_id,idempotency_key,source_sha256) VALUES ($1,$2,'bad',$3)`,[f.condoTenant,f.villageMember,'a'.repeat(64)]);
  await deny(`INSERT INTO app.import_rows(tenant_id,batch_id,row_number,record_kind,raw_payload) VALUES ($1,$2,2,'property','{}')`,[f.condoTenant,f.batch]);
  await deny(`INSERT INTO app.import_batches(tenant_id,created_by_membership_id,idempotency_key,source_sha256) VALUES ($1,$2,'sample-import',$3)`,[f.villageTenant,f.villageMember,'c'.repeat(64)],'23505');
  await deny(`INSERT INTO app.import_rows(tenant_id,batch_id,row_number,record_kind,raw_payload) VALUES ($1,$2,1,'property','{}')`,[f.villageTenant,f.batch],'23505');
});
test('document paths derive from tenant ownership and cannot be supplied or reassigned', async () => {
  const row=(await db.query('SELECT object_path FROM app.document_objects WHERE id=$1',[f.document])).rows[0];
  assert.equal(row.object_path,`${f.villageTenant}/${f.document}`);
  await deny(`UPDATE app.document_objects SET object_path=$1 WHERE id=$2`,[`${f.condoTenant}/other`,f.document],'428C9');
  await deny(`INSERT INTO app.document_objects(tenant_id,community_id,property_id,uploaded_by_membership_id,display_name,content_type,size_bytes) VALUES ($1,$2,$3,$4,'bad','application/pdf',1)`,[f.villageTenant,f.village,f.unit,f.villageMember]);
  await deny(`INSERT INTO app.document_objects(tenant_id,uploaded_by_membership_id,display_name,content_type,size_bytes) VALUES ($1,$2,'bad','application/pdf',1)`,[f.condoTenant,f.villageMember]);
  await deny(`INSERT INTO app.document_objects(tenant_id,property_id,uploaded_by_membership_id,display_name,content_type,size_bytes) VALUES ($1,$2,$3,'bad','application/pdf',1)`,[f.villageTenant,f.unit,f.villageMember],'23514');
});
test('operation, outbox and audit references cannot cross tenants', async () => {
  await deny(`INSERT INTO app.operation_requests(tenant_id,actor_membership_id,operation,idempotency_key,request_sha256) VALUES ($1,$2,'fixture.record','bad',$3)`,[f.condoTenant,f.villageMember,'c'.repeat(64)]);
  await deny(`INSERT INTO app.outbox_events(tenant_id,operation_id,sequence,event_type,payload) VALUES ($1,$2,2,'fixture.created.v1','{}')`,[f.condoTenant,f.operation]);
  await deny(`INSERT INTO app.audit_events(tenant_id,actor_membership_id,operation_id,event_type,outcome) VALUES ($1,$2,$3,'fixture.created','succeeded')`,[f.condoTenant,f.condoMember,f.operation]);
});
test('a failed transaction rolls back operation and outbox together; retries cannot double-insert', async () => {
  await db.exec('BEGIN');
  try {
    await db.query(`INSERT INTO app.operation_requests(id,tenant_id,actor_membership_id,operation,idempotency_key,request_sha256) VALUES ($1,$2,$3,'fixture.record','rolled-back',$4)`,[id(900),f.villageTenant,f.villageMember,'d'.repeat(64)]);
    await db.query(`INSERT INTO app.outbox_events(tenant_id,operation_id,sequence,event_type,payload) VALUES ($1,$2,1,'fixture.created.v1','{}')`,[f.villageTenant,id(900)]);
    await deny(`INSERT INTO app.outbox_events(tenant_id,operation_id,sequence,event_type,payload) VALUES ($1,$2,1,'fixture.created.v1','{}')`,[f.villageTenant,id(900)],'23505');
  } finally { await db.exec('ROLLBACK'); }
  assert.equal((await db.query('SELECT count(*)::int AS count FROM app.operation_requests WHERE id=$1',[id(900)])).rows[0].count,0);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM app.outbox_events WHERE operation_id=$1',[id(900)])).rows[0].count,0);
  await deny(`INSERT INTO app.operation_requests(tenant_id,actor_membership_id,operation,idempotency_key,request_sha256) VALUES ($1,$2,'fixture.record','sample-operation',$3)`,[f.villageTenant,f.villageMember,'e'.repeat(64)],'23505');
});
test('audit history is append only, even for the fixture administrator', async () => {
  await deny('UPDATE app.audit_events SET outcome=$1 WHERE tenant_id=$2',['denied',f.villageTenant],'23514');
  await deny('DELETE FROM app.audit_events WHERE tenant_id=$1',[f.villageTenant],'23514');
});
test('every app table denies reads and writes even if restricted roles receive accidental DML grants', async () => {
  const tables=(await db.query(`SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='app' ORDER BY tablename`)).rows;
  assert.equal(tables.length,17);
  assert.ok(tables.every(t=>t.rowsecurity));
  assert.equal((await db.query(`SELECT count(*)::int AS count FROM pg_policies WHERE schemaname='app'`)).rows[0].count,0);
  for (const role of ['anon','authenticated']) {
    await db.exec(`CREATE ROLE ${role} NOLOGIN; GRANT USAGE ON SCHEMA app TO ${role}; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA app TO ${role}; SET ROLE ${role};`);
    try {
      for (const t of tables) assert.equal((await db.query(`SELECT count(*)::int AS count FROM app.${t.tablename}`)).rows[0].count,0,t.tablename);
      await deny(`INSERT INTO app.tenants(tenant_key,legal_name) VALUES ('bad-tenant','Denied')`,[],'42501');
      const changed=await db.query('UPDATE app.people SET display_name=$1 RETURNING id',['Denied']);
      assert.equal(changed.rows.length,0);
      assert.equal((await db.query('DELETE FROM app.memberships RETURNING id')).rows.length,0);
    } finally { await db.exec('RESET ROLE'); }
  }
});
