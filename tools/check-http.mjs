/** HTTP checks against the built Next server. No external services or real credentials. */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', data => { output += data; });
child.stderr.on('data', data => { output += data; });
const base = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${output}`);
    try { ready = (await fetch(`${base}/login`)).status === 200; } catch { /* Wait for listener. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Server did not become ready: ${output}`);
  const demo = process.env.ENCLAVIX_APP_ENV === 'demo';
  for (const pathname of ['/admin', '/admin/billing', '/guard', '/resident', '/resident/billing']) {
    const response = await fetch(base + pathname, { redirect: 'manual', headers: { cookie: 'demo_user_role=SUPER_ADMIN' } });
    assert.equal(response.status, demo ? 200 : 307, pathname);
    if (!demo) assert.equal(new URL(response.headers.get('location'), base).pathname, '/login');
    const unsigned = await fetch(base + pathname, { redirect: 'manual' });
    assert.equal(unsigned.status, 307, `${pathname} without a cookie`);
  }
  const callback = await fetch(`${base}/auth/callback?code=forged`, { redirect: 'manual' });
  assert.equal(callback.status, 307);
  assert.equal(new URL(callback.headers.get('location'), base).pathname, '/login');
  console.log(`HTTP containment verified for built ${demo ? 'mock demo' : 'production'} server`);
  if (demo) {
    // The public URL was absent at build time. Runtime injection must still fail startup.
    const invalid = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '0'], {
      env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://demo-isolated.invalid' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let invalidOutput = '';
    invalid.stdout.on('data', data => { invalidOutput += data; });
    invalid.stderr.on('data', data => { invalidOutput += data; });
    const timeout = setTimeout(() => invalid.kill('SIGKILL'), 10000);
    try {
      const [code] = await once(invalid, 'exit');
      assert.notEqual(code, 0);
      assert.match(invalidOutput, /Synthetic demos cannot configure Supabase credentials/);
      console.log('Built demo rejects backend credentials injected at startup');
    } finally { clearTimeout(timeout); }
  }
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await once(child, 'exit');
  }
}
