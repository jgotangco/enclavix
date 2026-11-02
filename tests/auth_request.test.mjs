import test from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const {bearerFrom,checkMutation,fields,uuid}=await createJiti(import.meta.url).import('../src/lib/auth/request.ts');
test('cookie commands require same-origin JSON; native bearer requests do not trust Origin as identity',()=>{
 const req=(headers)=>new Request('https://enclavix.example/api/v1/access/role',{method:'POST',headers});
 assert.throws(()=>checkMutation(req({'content-type':'application/json',origin:'https://attacker.example'})),/Same-origin/);
 assert.throws(()=>checkMutation(req({'content-type':'text/plain',origin:'https://enclavix.example'})),/JSON/);
 assert.doesNotThrow(()=>checkMutation(req({'content-type':'application/json',origin:'https://enclavix.example'})));
 assert.doesNotThrow(()=>checkMutation(req({'content-type':'application/json'}),'verified-later-by-provider'));
 assert.equal(bearerFrom(req({authorization:'Bearer ey.test.token'})),'ey.test.token');
 assert.throws(()=>bearerFrom(req({authorization:'Basic attacker'})),/Invalid/);
});
test('unknown actor, role, approval and tenant claim fields are rejected',()=>{
 for(const extra of ['actor','role','tenant','approved','user_metadata']) assert.throws(()=>fields({email:'sample@example.test',[extra]:'admin'},['email']),/Invalid/);
 assert.throws(()=>fields([],[]),/Invalid/);
 assert.throws(()=>uuid('../../other-association'),/Invalid/);
});
