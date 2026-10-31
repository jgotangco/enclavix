import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';
import { NextRequest } from 'next/server.js';
const jiti = createJiti(import.meta.url);
const { updateSession } = await jiti.import('../src/lib/supabase/middleware.ts');
const original = { ...process.env };
beforeEach(() => {
  for (const key of Object.keys(process.env)) if (key.startsWith('ENCLAVIX_') || key.startsWith('NEXT_PUBLIC_') || key === 'SUPABASE_SERVICE_ROLE_KEY') delete process.env[key];
});
after(() => { process.env = original; });
function request(path, cookie = '') { return updateSession(new NextRequest(`http://localhost:3000${path}`, { headers: { cookie } })); }
function demo() { process.env.ENCLAVIX_APP_ENV = 'demo'; process.env.NEXT_PUBLIC_APP_ENV = 'demo'; }
test('public routes remain available', async () => {
  for (const p of ['/', '/login', '/about', '/robots.txt']) assert.equal((await request(p)).status, 200);
});
test('all production portals remain closed even with a forged administrator cookie', async () => {
  process.env.ENCLAVIX_APP_ENV = 'production'; process.env.NEXT_PUBLIC_APP_ENV = 'production';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://s00-ci.invalid'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ci-public-key';
  for (const p of ['/admin', '/guard', '/resident', '/admin/billing', '/resident/amenities']) {
    const res = await request(p, 'demo_user_role=SUPER_ADMIN');
    assert.equal(res.status, 307); assert.equal(new URL(res.headers.get('location')).pathname, '/login');
  }
});
test('public flag and legacy isolation declaration do not authorize a demo', async () => {
  process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER = 'true'; process.env.ENCLAVIX_DEMO_DATABASE_ISOLATED = 'true';
  assert.equal((await request('/admin', 'demo_user_role=SUPER_ADMIN')).status, 307);
});
test('mock-only demo honors its portal roles', async () => {
  demo();
  for (const [role, p] of [['SUPER_ADMIN', '/admin'], ['TREASURER', '/admin/billing'], ['GUARD', '/guard'], ['RESIDENT', '/resident']]) assert.equal((await request(p, `demo_user_role=${role}`)).status, 200);
  assert.equal((await request('/admin', 'demo_user_role=RESIDENT')).headers.get('location'), 'http://localhost:3000/resident');
});
test('invalid or missing demo role cannot enter a portal', async () => {
  demo(); for (const cookie of ['', 'demo_user_role=INVALID']) assert.equal((await request('/resident', cookie)).status, 307);
});
test('configured backends invalidate demo auth including misleading URLs', async () => {
  demo();
  for (const url of ['https://prod.supabase.co?note=demo-isolated', 'https://localhost.evil.invalid', 'https://prod.invalid/127.0.0.1', 'http://127.0.0.1:54321', 'https://demo-isolated.supabase.co']) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url; process.env.ENCLAVIX_DEMO_DATABASE_ISOLATED = 'true';
    assert.equal((await request('/admin', 'demo_user_role=SUPER_ADMIN')).status, 307, url);
  }
});
test('callback and invented auth-prefixed routes cannot bypass containment', async () => {
  for (const p of ['/auth/callback?code=fake', '/api/auth/anything', '/auth-other']) assert.equal((await request(p)).status, 307);
});
