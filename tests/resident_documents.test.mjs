import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';

test('document versions enforce quarantine, audience, and server-only scan completion', async () => {
  const db = await createDomainDatabase();
  try {
    await seedDomainFixtures(db);
    await db.exec("UPDATE app.tenants SET status='active'");
    const admin = 'c0000000-0000-0000-0000-000000000003';
    const resident = 'c0000000-0000-0000-0000-000000000004';
    await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())", [f.villageTenant,f.coownerMember]);
    async function signIn(user, session) {
      await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[session,user]);
      await db.query("SELECT set_config('request.jwt.claims',$1,false)", [JSON.stringify({
        role:'authenticated',sub:user,session_id:session,aal:'aal2',exp:Math.floor(Date.now()/1000)+3600,
      })]);
    }


    const hash = 'b'.repeat(64);
    async function reserve(previous, key) {
      await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);
      return (await db.query('SELECT public.enclavix_document_reserve($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS result',[
        f.villageTenant,f.village,f.lot,previous,'Synthetic handbook','property_occupants',hash,10,'application/pdf','Synthetic document verification',
      ])).rows[0].result;
    }
    const complete = id => db.query('SELECT public.enclavix_document_complete($1,$2,$3,true)',[f.villageTenant,id,hash]);
    const release = async id => (await db.query('SELECT public.enclavix_document_release($1,$2) AS allowed',[f.villageTenant,id])).rows[0].allowed;
    await signIn(admin,id(9501));
    const first = await reserve(null,'document-first');
    assert.deepEqual(await reserve(null,'document-first'),first);
    assert.equal(await release(first.id),false);
    await db.exec('SET ROLE authenticated');
    try {
      await assert.rejects(complete(first.id),e=>e.code==='42501');
    } finally {
      await db.exec('RESET ROLE');
    }
    await complete(first.id);
    const second = await reserve(first.id,'document-revision');
    await assert.rejects(reserve(first.id,'document-fork'),e=>e.code==='23505');
    await signIn(resident,id(9502));
    await assert.rejects(reserve(null,'resident-upload'),e=>e.code==='42501');
    assert.equal(await release(second.id),false);
    assert.equal(await release(first.id),true);
    await db.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.villageMember]);
    assert.equal(await release(first.id),false);
  } finally {
    await db.close();
  }
});
