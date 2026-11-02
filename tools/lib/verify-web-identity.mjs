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
  const tampered=await fetch(endpoint+'access/apply',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({p_tenant:f.villageTenant,p_name:'Native caller',p_property:'Lot 1',role:'association_admin'})});assert.equal(tampered.status,403);
  assert.equal((await fetch(base+'/admin',{headers:{cookie},redirect:'manual'})).status,307,'Real identity must not reach mock business screens');
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
