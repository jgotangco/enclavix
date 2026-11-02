import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {FIXTURE as f} from './domain-fixtures.mjs';

/** Built production server + disposable loopback provider, synthetic accounts only. */
export async function verifyWebIdentity({state,owner,staff,password}) {
 const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');
 const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
  env:{...process.env,NODE_ENV:'production',ENCLAVIX_APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',ENCLAVIX_LOCAL_AUTH_TEST:'1',NEXT_PUBLIC_SUPABASE_URL:state.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:state.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:state.SERVICE_ROLE_KEY},
  stdio:['ignore','pipe','pipe'],
 });
 let output='';child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{output+=d;});
 try{
  let ready=false;
  for(let i=0;i<150;i++){if(child.exitCode!==null)throw new Error('Built identity server exited before ready');try{ready=(await fetch(`${base}/login`)).status===200;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Built identity server did not become ready');
  const endpoint=base+'/api/v1/';
  const forged=await fetch(endpoint+'session',{headers:{cookie:'demo_user_role=SUPER_ADMIN'}});assert.equal(forged.status,401);
  const email=(await owner.auth.getUser()).data.user.email;
  const login=await fetch(endpoint+'auth/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({email,password})});
  assert.equal(login.status,200);
  const setCookies=login.headers.getSetCookie();assert.ok(setCookies.length);
  assert.ok(setCookies.every(c=>/httponly/i.test(c)&&/samesite=lax/i.test(c)&&/secure/i.test(c)));
  const cookie=setCookies.map(c=>c.split(';')[0]).join('; ');
  const account=await fetch(endpoint+'session',{headers:{cookie}});assert.equal(account.status,200);
  assert.match(account.headers.get('cache-control'),/no-store/);
  assert.equal((await account.json()).data.contexts.length,1);
  const csrf=await fetch(endpoint+'access/apply',{method:'POST',headers:{cookie,'content-type':'application/json',origin:'https://attacker.invalid'},body:'{}'});assert.equal(csrf.status,403);
  const properties=await fetch(endpoint+`tenants/${f.villageTenant}/properties`,{headers:{cookie}});assert.equal((await properties.json()).data.length,2);
  const wrongTenant=await fetch(endpoint+`tenants/${f.condoTenant}/properties`,{headers:{cookie}});assert.equal(wrongTenant.status,403);
  const file=await fetch(endpoint+`tenants/${f.villageTenant}/documents/${f.document}`,{headers:{cookie}});assert.equal(file.status,200);assert.equal(await file.text(),'Synthetic CI evidence');assert.match(file.headers.get('content-disposition'),/attachment/);
  const badFile=await fetch(endpoint+`tenants/${f.condoTenant}/documents/${f.document}`,{headers:{cookie}});assert.equal(badFile.status,404);
  const token=(await staff.auth.getSession()).data.session.access_token;
  const native=await fetch(endpoint+`tenants/${f.villageTenant}/applications`,{headers:{authorization:`Bearer ${token}`}});assert.equal(native.status,200);
  const tampered=await fetch(endpoint+'access/apply',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({p_tenant:f.villageTenant,p_name:'Native caller',p_property:'Lot 1',role:'association_admin'})});assert.equal(tampered.status,400);
  assert.equal((await fetch(base+'/admin',{headers:{cookie},redirect:'manual'})).status,307,'Real identity must not reach mock business screens');
  const roleCommand={p_tenant:f.villageTenant,p_member:f.villageMember,p_role:'finance_preparer',p_community:null,p_until:null,p_revoke:false,p_reason:'Verified native permission change retry'};
  for(let i=0;i<2;i++){
   const changed=await fetch(endpoint+'access/role',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','Idempotency-Key':'native-role-command'},body:JSON.stringify(roleCommand)});assert.equal(changed.status,200);
  }
  const conflict=await fetch(endpoint+'access/role',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','Idempotency-Key':'native-role-command'},body:JSON.stringify({...roleCommand,p_role:'association_admin'})});assert.equal(conflict.status,409);
  assert.equal((await fetch(base+'/workspace')).status,200);
  assert.equal((await fetch(endpoint+'community/index',{headers:{cookie:'demo_user_role=SUPER_ADMIN'}})).status,401);
  const registry=await fetch(endpoint+`community/${f.villageTenant}/registry`,{headers:{authorization:`Bearer ${token}`}});assert.equal(registry.status,200);
  const registryData=(await registry.json()).data;assert.ok(registryData.people.every(p=>!('auth_user_id' in p)));assert.ok(registryData.properties.every(p=>p.lot_area_sqm===null||typeof p.lot_area_sqm==='string'));
  assert.equal((await fetch(endpoint+`community/${f.villageTenant}/constructor/${f.lot}`,{headers:{authorization:`Bearer ${token}`}})).status,404);
  assert.equal((await fetch(endpoint+'community/constructor',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:'{}'})).status,404);
  const command={p_tenant:f.villageTenant,p_action:'person',p_data:{external_key:'NATIVE-S03',name:'Native synthetic contact',kind:'individual'},p_reason:'Verified shared registry API command'};
  const nativeHeaders={authorization:`Bearer ${token}`,'content-type':'application/json','Idempotency-Key':'native-s03-command'};
  for(let i=0;i<2;i++)assert.equal((await fetch(endpoint+'community/registry_command',{method:'POST',headers:nativeHeaders,body:JSON.stringify(command)})).status,200);
  assert.equal((await fetch(endpoint+'community/registry_command',{method:'POST',headers:nativeHeaders,body:JSON.stringify({...command,role:'association_admin'})})).status,400);
  assert.equal((await fetch(endpoint+'community/registry_command',{method:'POST',headers:{cookie,origin:'https://attacker.invalid','content-type':'application/json'},body:JSON.stringify(command)})).status,403);
  assert.equal((await fetch(endpoint+'community/registry_command',{method:'POST',headers:nativeHeaders,body:'x'.repeat(8193)})).status,413);
  const previewBody={p_tenant:f.villageTenant,p_kind:'person',p_rows:[{external_key:'WEB-IMPORT-S03',name:'Web import synthetic contact',kind:'individual'}],p_reason:'Preview shared web and native import'};
  const previewResponse=await fetch(endpoint+'community/import_stage',{method:'POST',headers:{...nativeHeaders,'Idempotency-Key':'web-import-s03'},body:JSON.stringify(previewBody)});assert.equal(previewResponse.status,200);
  const preview=(await previewResponse.json()).data;
  const rows=await fetch(endpoint+`community/${f.villageTenant}/import_view/${preview.batch_id}`,{headers:nativeHeaders});assert.equal(rows.status,200);assert.equal((await rows.json()).data.rows[0].row,1);
  assert.equal((await fetch(endpoint+'community/import_commit',{method:'POST',headers:{...nativeHeaders,'Idempotency-Key':'web-import-commit-s03'},body:JSON.stringify({p_tenant:f.villageTenant,p_batch:preview.batch_id,p_expected_hash:preview.source_sha256,p_reason:'Confirm reviewed shared import preview'})})).status,200);
  console.log('S03 built web: workspace, authenticated shared API, native registry replay, no auth bindings, exact decimals, row preview/commit, CSRF and size limits passed');
  const logout=await fetch(endpoint+'auth/logout',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({scope:'global'})});assert.equal(logout.status,200);
  assert.equal((await fetch(endpoint+'session',{headers:{cookie}})).status,401,'Stolen old cookie denied after logout');
  assert.equal((await fetch(endpoint+`tenants/${f.villageTenant}/documents/${f.document}`,{headers:{cookie}})).status,401);
  const nativeLogout=await fetch(endpoint+'auth/logout',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({scope:'local'})});assert.equal(nativeLogout.status,200);
  assert.equal((await fetch(endpoint+'session',{headers:{authorization:`Bearer ${token}`}})).status,401);
  console.log('S02 built web: real cookie login, HttpOnly/Secure cookies, CSRF, native bearer requests, tenant/file isolation, no-store responses and stale-cookie denial after logout passed');
 }finally{
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}
  // Never dump captured server output: it may contain cookies or request secrets.
  output='';
 }
}
