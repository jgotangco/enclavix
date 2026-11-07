import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';

test('announcements enforce publish authority, scoped audiences and replay', async () => {
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
    async function publish(title, key, property = null) {
      await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);
      return (await db.query('SELECT public.enclavix_announcement_publish($1,$2,$3,$4,$5,$6,$7) AS id',[
        f.villageTenant,f.village,property,title,'Synthetic notice','2099-01-01T00:00:00Z','Verify publication audit',
      ])).rows[0].id;
    }
    await signIn(admin,id(9501));
    const notice = await publish('Water interruption','notice-1');
    assert.equal(await publish('Water interruption','notice-1'),notice);
    await assert.rejects(publish('Changed title','notice-1'),e=>e.code==='23505');
    await assert.rejects(publish('Wrong community','notice-2',f.unit),e=>e.code==='23503');
    await publish('Property-only notice','notice-property',f.secondLot);
    await db.query('UPDATE app.property_relationships SET valid_until=now() WHERE tenant_id=$1 AND property_id=$2 AND person_id=$3', [f.villageTenant,f.secondLot,f.villagePerson]);
    await db.query(`INSERT INTO app.resident_announcements
      (tenant_id,community_id,author_id,title,body,created_at,expires_at)
      VALUES ($1,$2,$3,'Expired','Synthetic notice',now()-interval '2 days',now()-interval '1 day')`,
      [f.villageTenant,f.village,f.coownerMember]);
    await signIn(resident,id(9502));
    await assert.rejects(publish('Forged notice','resident-publish'),e=>e.code==='42501');
    await db.exec('SET ROLE authenticated');
    try {
      const feed = (await db.query('SELECT * FROM public.enclavix_announcement_feed($1,$2)',[f.villageTenant,f.village])).rows;
      assert.deepEqual(feed.map(row=>row.id),[notice]);
      assert.deepEqual((await db.query('SELECT * FROM public.enclavix_announcement_feed($1,$2)',[f.condoTenant,f.village])).rows,[]);
      await assert.rejects(db.query('SELECT * FROM app.resident_announcements'),e=>e.code==='42501');
    } finally {
      await db.exec('RESET ROLE');
    }
  } finally {
    await db.close();
  }
});
