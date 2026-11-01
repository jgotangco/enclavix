/** Synthetic and deterministic identifiers. Never run these fixtures on a hosted project. */
export const id = n => `01000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const FIXTURE = {
  villageTenant: id(1), condoTenant: id(2), village: id(10), condo: id(20),
  phase: id(11), block: id(12), tower: id(21), floor: id(22),
  lot: id(101), secondLot: id(102), unit: id(201),
  villagePerson: id(301), condoPerson: id(302), coowner: id(303), renter: id(304), organization: id(305), representative: id(306),
  villageMember: id(401), condoMember: id(402), coownerMember: id(403), condoStaff: id(307), condoStaffMember: id(404),
  parking: id(501), storage: id(502), batch: id(601), document: id(701), operation: id(801),
};
const from = '2026-01-01T00:00:00Z';

export async function seedDomainFixtures(db, authUserId = 'c0000000-0000-0000-0000-000000000004', staffAuthUserId = 'c0000000-0000-0000-0000-000000000003') {
  const f = FIXTURE;
  await db.query(`INSERT INTO app.tenants(id,tenant_key,legal_name) VALUES ($1,'sample-village','Sample Village Association'),($2,'sample-condo','Sample Condominium Corporation')`, [f.villageTenant, f.condoTenant]);
  await db.query(`INSERT INTO app.communities(id,tenant_id,code,name,kind,structure_labels) VALUES ($1,$2,'VILLAGE','Sample Village','village','{"block":"Block","property":"Lot"}'),($3,$4,'CONDO','Sample Condominium','condominium','{"tower":"Tower","property":"Unit"}')`, [f.village,f.villageTenant,f.condo,f.condoTenant]);
  for (const values of [
    [f.phase,f.villageTenant,f.village,null,'phase','PHASE-1','Phase 1'],
    [f.block,f.villageTenant,f.village,f.phase,'block','PHASE-1-BLOCK-1','Block 1'],
    [f.tower,f.condoTenant,f.condo,null,'tower','TOWER-A','Tower A'],
    [f.floor,f.condoTenant,f.condo,f.tower,'floor','TOWER-A-FLOOR-1','Floor 1'],
  ]) await db.query('INSERT INTO app.locations(id,tenant_id,community_id,parent_location_id,kind,code,label) VALUES ($1,$2,$3,$4,$5,$6,$7)', values);
  for (const values of [
    [f.lot,f.villageTenant,f.village,f.block,'B1-L1','Lot 1','lot'],
    [f.secondLot,f.villageTenant,f.village,f.block,'B1-L2','Lot 2','townhouse_unit'],
    [f.unit,f.condoTenant,f.condo,f.floor,'A-101','Unit 101','condominium_unit'],
  ]) await db.query('INSERT INTO app.properties(id,tenant_id,community_id,location_id,code,label,kind) VALUES ($1,$2,$3,$4,$5,$6,$7)', values);
  // The same verified identity has separate contact records and memberships in both tenants.
  for (const values of [
    [f.villagePerson,f.villageTenant,'individual','Sample Owner',authUserId],
    [f.condoPerson,f.condoTenant,'individual','Sample Owner',authUserId],
    [f.coowner,f.villageTenant,'individual','Sample Coowner and Staff',staffAuthUserId],
    [f.condoStaff,f.condoTenant,'individual','Sample Staff',staffAuthUserId],
    [f.renter,f.villageTenant,'individual','Sample Tenant',null],
    [f.organization,f.villageTenant,'organization','Sample Corporate Owner',null],
    [f.representative,f.villageTenant,'individual','Sample Representative',null],
  ]) await db.query('INSERT INTO app.people(id,tenant_id,kind,display_name,auth_user_id) VALUES ($1,$2,$3,$4,$5)', values);
  for (const values of [[f.villageMember,f.villageTenant,f.villagePerson], [f.condoMember,f.condoTenant,f.condoPerson], [f.coownerMember,f.villageTenant,f.coowner], [f.condoStaffMember,f.condoTenant,f.condoStaff]]) {
    await db.query(`INSERT INTO app.memberships(id,tenant_id,person_id,status,valid_from) VALUES ($1,$2,$3,'active',$4)`, [...values,from]);
  }
  await db.query(`INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES ($1,$2,'resident',$5),($3,$4,'board_reviewer',$5),($1,$6,'guard',$5)`, [f.villageTenant,f.villageMember,f.condoTenant,f.condoMember,from,f.coownerMember]);
  await db.query(`INSERT INTO app.membership_roles(tenant_id,membership_id,community_id,role,valid_from) VALUES ($1,$2,$3,'guard',$4)`, [f.condoTenant,f.condoStaffMember,f.condo,from]);
  await db.query(`INSERT INTO app.civic_designations(tenant_id,membership_id,title,valid_from) VALUES ($1,$2,'President',$3)`, [f.villageTenant,f.villageMember,from]);
  for (const values of [
    [f.villageTenant,f.village,f.lot,f.villagePerson,null,'owner'],
    [f.villageTenant,f.village,f.secondLot,f.villagePerson,null,'owner'],
    [f.villageTenant,f.village,f.lot,f.coowner,null,'owner'],
    [f.villageTenant,f.village,f.secondLot,f.renter,null,'tenant'],
    [f.villageTenant,f.village,f.secondLot,f.organization,null,'owner'],
    [f.villageTenant,f.village,f.secondLot,f.representative,f.organization,'representative'],
    [f.condoTenant,f.condo,f.unit,f.condoPerson,null,'owner'],
  ]) await db.query('INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,represented_person_id,kind,valid_from) VALUES ($1,$2,$3,$4,$5,$6,$7)', [...values,from]);
  await db.query(`INSERT INTO app.assets(id,tenant_id,community_id,code,label,kind) VALUES ($1,$2,$3,'P-01','Parking 1','parking'),($4,$2,$3,'S-01','Storage 1','storage')`, [f.parking,f.condoTenant,f.condo,f.storage]);
  await db.query(`INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from) VALUES ($1,$2,$3,$4,'use',$5)`, [f.condoTenant,f.condo,f.parking,f.unit,from]);
  await db.query(`INSERT INTO app.import_batches(id,tenant_id,community_id,created_by_membership_id,idempotency_key,source_sha256) VALUES ($1,$2,$3,$4,'sample-import',$5)`, [f.batch,f.villageTenant,f.village,f.villageMember,'a'.repeat(64)]);
  await db.query(`INSERT INTO app.import_rows(tenant_id,batch_id,row_number,record_kind,raw_payload) VALUES ($1,$2,1,'property','{"code":"B2-L3"}')`, [f.villageTenant,f.batch]);
  await db.query(`INSERT INTO app.document_objects(id,tenant_id,community_id,property_id,uploaded_by_membership_id,display_name,content_type,size_bytes) VALUES ($1,$2,$3,$4,$5,'Synthetic evidence','application/pdf',100)`, [f.document,f.villageTenant,f.village,f.lot,f.villageMember]);
  await db.query(`INSERT INTO app.operation_requests(id,tenant_id,actor_membership_id,operation,idempotency_key,request_sha256) VALUES ($1,$2,$3,'fixture.record','sample-operation',$4)`, [f.operation,f.villageTenant,f.villageMember,'b'.repeat(64)]);
  await db.query(`INSERT INTO app.outbox_events(tenant_id,operation_id,sequence,event_type,payload) VALUES ($1,$2,1,'fixture.created.v1','{}')`, [f.villageTenant,f.operation]);
  await db.query(`INSERT INTO app.audit_events(tenant_id,actor_membership_id,operation_id,event_type,outcome) VALUES ($1,$2,$3,'fixture.created','succeeded')`, [f.villageTenant,f.villageMember,f.operation]);
}
