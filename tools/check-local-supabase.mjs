/** Disposable loopback Supabase only. Never accepts a hosted project or remote DB. */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { seedDomainFixtures } from './lib/domain-fixtures.mjs';
import { verifyDomainPostgres, verifyDomainConcurrency } from './lib/verify-domain.mjs';

const state = JSON.parse(execFileSync('node_modules/.bin/supabase', ['status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
for (const key of ['API_URL', 'DB_URL']) {
  const url = new URL(state[key]);
  assert.equal(url.hostname, '127.0.0.1', 'Only disposable local Supabase is permitted');
}
assert.equal(new URL(state.API_URL).port, '54321');
assert.equal(new URL(state.DB_URL).port, '54322');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(state.API_URL, state.SERVICE_ROLE_KEY, options);
const publicClient = createClient(state.API_URL, state.ANON_KEY, options);
const fixtures = await readFile('tests/fixtures/relational_users.sql', 'utf8');
const users = [...fixtures.matchAll(/'(c0000000-0000-0000-0000-\d{12})', '([^']+)'/g)];
assert.equal(users.length, 10);
let seed = await readFile('supabase/seed.sql', 'utf8');
const sessions = [];
for (const [, fixtureId, email] of users) {
  const password = randomBytes(24).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  seed = seed.replaceAll(fixtureId, data.user.id);
  const client = createClient(state.API_URL, state.ANON_KEY, options);
  const login = await client.auth.signInWithPassword({ email, password });
  assert.ifError(login.error);
  assert.equal(login.data.user.id, data.user.id);
  sessions.push(client);
}
const db = new pg.Client({ connectionString: state.DB_URL });
await db.connect();
try {
  await db.query('BEGIN');
  await db.query(seed);
  await db.query('COMMIT');
  assert.equal(Number((await db.query('SELECT count(*) FROM profiles')).rows[0].count), 10);
  for (const client of [publicClient, ...sessions]) {
    const result = await client.from('profiles').select('*');
    assert.ifError(result.error);
    assert.deepEqual(result.data, []);
  }
  const denied = await sessions[0].from('announcements').insert({ title: 'Denied', content: 'Test', published_by: (await sessions[0].auth.getUser()).data.user.id });
  assert.ok(denied.error, 'Authenticated write must remain denied before S02');
  console.log('Local Supabase: 10 Admin API users can sign in; seed and API deny-by-default checks passed');
  const owner=(await sessions[0].auth.getUser()).data.user.id;
  const staff=(await sessions[1].auth.getUser()).data.user.id;
  await seedDomainFixtures(db,owner,staff);
  await verifyDomainPostgres(db);
  await verifyDomainConcurrency(async () => {
    const client=new pg.Client({ connectionString: state.DB_URL });
    await client.connect();
    return client;
  });
  const unexposed=await publicClient.schema('app').from('people').select('*');
  assert.equal(unexposed.error?.code,'PGRST106','Private domain schema must not be in the exposed schema list');
} finally {
  await db.end();
  await Promise.all(sessions.map(client => client.auth.signOut()));
}
