import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';
const jiti = createJiti(import.meta.url);
const { assertApplicationEnvironment, isDemoModeAllowedServer, isSupabaseConfigured } = await jiti.import('../src/lib/env.server.ts');
const { createClient: browserClient } = await jiti.import('../src/lib/supabase/client.ts');
const { createClient: serverClient } = await jiti.import('../src/lib/supabase/server.ts');
const original = { ...process.env };
beforeEach(() => {
  for (const key of Object.keys(process.env)) if (key.startsWith('ENCLAVIX_') || key.startsWith('NEXT_PUBLIC_') || key === 'SUPABASE_SERVICE_ROLE_KEY') delete process.env[key];
});
after(() => { process.env = original; });
test('missing and conflicting deployment modes fail startup', () => {
  assert.throws(assertApplicationEnvironment, /must be demo or production/);
  process.env.ENCLAVIX_APP_ENV = 'production'; process.env.NEXT_PUBLIC_APP_ENV = 'demo';
  assert.throws(assertApplicationEnvironment, /must agree/); assert.equal(isDemoModeAllowedServer(), false);
});
test('production requires explicit valid configuration', () => {
  process.env.ENCLAVIX_APP_ENV = 'production'; process.env.NEXT_PUBLIC_APP_ENV = 'production';
  assert.throws(assertApplicationEnvironment, /requires valid Supabase/);
  for (const raw of ['not-a-url', 'https://dummy-project.supabase.co', 'https://your-supabase-url', 'http://example.com', 'https://prod.invalid?demo-isolated', 'https://user:pass@prod.invalid']) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = raw; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ci-public-key';
    assert.equal(isSupabaseConfigured(), false, raw);
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://s00-ci.invalid';
  assert.doesNotThrow(assertApplicationEnvironment); assert.equal(isDemoModeAllowedServer(), false);
});
test('mock demo rejects even partial backend credentials', () => {
  process.env.ENCLAVIX_APP_ENV = 'demo'; process.env.NEXT_PUBLIC_APP_ENV = 'demo';
  assert.doesNotThrow(assertApplicationEnvironment);
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    process.env[key] = 'test-value'; assert.throws(assertApplicationEnvironment, /cannot configure Supabase/);
    assert.equal(isDemoModeAllowedServer(), false); delete process.env[key];
  }
});
test('both backend client factories are disabled in S00', () => {
  assert.throws(browserClient, /disabled in S00/); assert.throws(serverClient, /disabled in S00/);
});
