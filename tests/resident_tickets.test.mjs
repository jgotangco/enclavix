import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDatabase} from '../tools/lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from '../tools/lib/domain-fixtures.mjs';

test('tickets enforce requester access, staff transitions and replay', async () => {
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
      return (await db.query('SELECT public.enclavix_ticket_write($1,$2,$3,$4,$5,$6,$7) AS id',args)).rows[0].id;
    }
    await signIn(resident,id(9502));
    const submission = [f.villageTenant,f.village,f.lot,'Synthetic water leak',null,null,null];
    const ticket = await write(submission,'ticket-create');
    assert.equal(await write(submission,'ticket-create'),ticket);
    const start = [f.villageTenant,f.village,null,null,ticket,'in_progress','Synthetic work started'];
    await assert.rejects(write(start,'ticket-start'),e=>e.code==='42501');
    await signIn(admin,id(9501));
    const resolve = [f.villageTenant,f.village,null,null,ticket,'resolved','Synthetic issue resolved'];
    await assert.rejects(write(resolve,'premature-resolve'),e=>e.code==='22023');
    const staffAction = action => [f.villageTenant,f.village,null,null,ticket,action,'Synthetic staff action'];
    assert.equal(await write(staffAction('assign_self'),'ticket-assign'),ticket);
    assert.equal(await write(staffAction('escalate'),'ticket-escalate'),ticket);
    assert.equal(await write(start,'ticket-start'),ticket);
    assert.equal(await write(start,'ticket-start'),ticket);
    assert.equal(await write(resolve,'ticket-resolve'),ticket);
    assert.equal(await write(staffAction('reopen'),'ticket-reopen'),ticket);
    await signIn(resident,id(9502));
    const list = async tenant => (await db.query('SELECT * FROM public.enclavix_ticket_list($1,$2)',[tenant,f.village])).rows;
    const [record] = await list(f.villageTenant);
    assert.equal(record.status,'open');
    assert.equal(record.assigned,true);
    assert.equal(record.escalated,true);
    assert.deepEqual(record.history.map(event => event.action),['open','assign_self','escalate','in_progress','resolved','reopen']);
    assert.ok(record.history.every(event => !Object.hasOwn(event,'reason')));
    assert.deepEqual(await list(f.condoTenant),[]);
    const inbox = async preference => (await db.query('SELECT public.enclavix_ticket_inbox($1,$2,$3) AS result',
      [f.villageTenant,f.village,preference])).rows[0].result;
    const delivered = await inbox(null);
    assert.equal(delivered.items.length,5);
    assert.deepEqual(await inbox(null),delivered);
    assert.equal((await inbox(false)).enabled,false);
    await db.query("UPDATE app.memberships SET status='revoked' WHERE id=$1",[f.villageMember]);
    assert.deepEqual(await list(f.villageTenant),[]);
  } finally {
    await db.close();
  }
});
