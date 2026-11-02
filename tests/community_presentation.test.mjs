import test from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const {formatWorkspaceDate}=await createJiti(import.meta.url).import('../src/lib/community/presentation.ts');
test('community date presentation uses its named zone across a day boundary',()=>{
 const value='2026-01-01T22:00:00Z';
 assert.match(formatWorkspaceDate(value,'Asia/Manila'),/02 Jan 2026.*06:00.*(GMT\+8|PST)/);
 assert.match(formatWorkspaceDate(value,'UTC'),/01 Jan 2026.*22:00.*UTC/);
});
test('invalid dates or zones are never silently displayed in the browser time zone',()=>{
 assert.equal(formatWorkspaceDate('not-a-date','Asia/Manila'),'Date unavailable');
 assert.equal(formatWorkspaceDate('2026-01-01T00:00:00Z','Unknown/Zone'),'Date unavailable');
});
