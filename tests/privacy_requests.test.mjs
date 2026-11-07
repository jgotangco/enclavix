import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';

test('privacy intake replays safely and restricts staff review and cross-tenant visibility', async () => {
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


    async function write(args, key) {
      await db.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'idempotency-key':key})]);
      return (await db.query('SELECT public.enclavix_privacy_write($1,$2,$3,$4,$5) AS id',args)).rows[0].id;
    }
    await signIn(resident,id(9502));
    const submission = [f.villageTenant,'deletion','Synthetic deletion request',null,null];
    const item = await write(submission,'privacy-submit');
    assert.equal(await write(submission,'privacy-submit'),item);
    const review = [f.villageTenant,null,null,item,'Synthetic review opened'];
    await assert.rejects(write(review,'privacy-review'),e=>e.code==='42501');
    await signIn(admin,id(9501));
    assert.equal(await write(review,'privacy-review'),item);
    await signIn(resident,id(9502));
    const list = async tenant => (await db.query('SELECT * FROM public.enclavix_privacy_list($1)',[tenant])).rows;
    assert.equal((await list(f.villageTenant))[0].status,'reviewing');
    assert.deepEqual(await list(f.condoTenant),[]);
    await db.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.villageMember]);
    assert.deepEqual(await list(f.villageTenant),[]);
  } finally {
    await db.close();
  }
});
