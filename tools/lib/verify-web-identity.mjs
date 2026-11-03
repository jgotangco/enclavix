import {createServer as createHttpServer} from 'node:http';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {FIXTURE as f} from './domain-fixtures.mjs';

/** Built production server + disposable loopback provider, synthetic accounts only. */
export async function verifyWebIdentity({state,owner,staff,password,finance}) {
 const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');
 const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 const base=`http://127.0.0.1:${port}`;
 const scannerToken=randomUUID();
 const scanner=createHttpServer(async(req,res)=>{
  if(req.headers.authorization!==`Bearer ${scannerToken}`){res.writeHead(403);res.end();return;}
  const chunks=[];for await(const bytes of req)chunks.push(bytes);const bytes=Buffer.concat(chunks);
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({sha256:createHash('sha256').update(bytes).digest('hex'),verdict:bytes.includes(Buffer.from('EICAR'))?'infected':'clean'}));
 });
 scanner.listen(0,'127.0.0.1');await once(scanner,'listening');
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
  env:{...process.env,NODE_ENV:'production',ENCLAVIX_APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',ENCLAVIX_LOCAL_AUTH_TEST:'1',NEXT_PUBLIC_SUPABASE_URL:state.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:state.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:state.SERVICE_ROLE_KEY,ENCLAVIX_SCANNER_URL:`http://127.0.0.1:${scanner.address().port}/scan`,ENCLAVIX_SCANNER_TOKEN:scannerToken},
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
  const linkedAsset=registryData.assets.find(x=>x.community_id===f.village);
  // This fixture has no village asset before S03 concurrency adds one.
  assert.ok(linkedAsset);
  const allocationBody={p_tenant:f.villageTenant,p_action:'assign',p_data:{asset_id:linkedAsset.id,property_id:f.secondLot,kind:'ownership'},p_reason:'Record native synthetic asset allocation'};
  const allocatedResponse=await fetch(endpoint+'community/allocation',{method:'POST',headers:{...nativeHeaders,'Idempotency-Key':'web-allocation-s03'},body:JSON.stringify(allocationBody)});assert.equal(allocatedResponse.status,200);
  const allocation=(await allocatedResponse.json()).data;
  const residentAssets=await fetch(endpoint+`community/${f.villageTenant}/property_allocations/${f.secondLot}`,{headers:{cookie}});assert.equal(residentAssets.status,200);assert.ok((await residentAssets.json()).data.some(x=>x.id===allocation.id));
  assert.equal((await fetch(endpoint+`community/${f.villageTenant}/allocations`,{headers:{cookie}})).status,403);
  assert.equal((await fetch(endpoint+`community/${f.condoTenant}/property_allocations/${f.unit}`,{headers:{cookie}})).status,403);
  console.log('S03 asset API: authenticated native assignment, resident property-scoped reads and wrong-scope denial passed');
  assert.equal((await fetch(base+'/finance')).status,200);
  assert.equal((await fetch(endpoint+'finance/index',{headers:{cookie:'demo_user_role=SUPER_ADMIN'}})).status,401);
  const fq=new URLSearchParams({tenant:f.villageTenant,community:f.village,property:f.secondLot,from:'2026-01-01',until:'2026-12-31'});
  const finReport=await fetch(endpoint+'finance/report?'+fq,{headers:{cookie}});assert.equal(finReport.status,200);assert.match(finReport.headers.get('cache-control'),/no-store/);assert.equal((await finReport.json()).data.requests.length,0);
  assert.equal((await fetch(endpoint+`finance/${f.villageTenant}/proof/${finance.proof.id}`,{headers:{cookie}})).status,200);
  assert.equal((await fetch(endpoint+`tenants/${f.villageTenant}/documents/${finance.proof.id}`,{headers:{cookie}})).status,404);
  const uploadBody={p_tenant:f.villageTenant,p_property:f.secondLot,content_type:'application/pdf',base64:Buffer.from('%PDF-1.4\nBuilt API scanner fixture').toString('base64')};
  const fh={cookie,origin:base,'content-type':'application/json','Idempotency-Key':'web-finance-upload'};
  assert.equal((await fetch(endpoint+'finance/upload',{method:'POST',headers:{...fh,origin:'https://attacker.invalid'},body:JSON.stringify(uploadBody)})).status,403);
  const uploaded=await fetch(endpoint+'finance/upload',{method:'POST',headers:fh,body:JSON.stringify(uploadBody)});assert.equal(uploaded.status,200);const proofId=(await uploaded.json()).data.id;
  const repeated=await fetch(endpoint+'finance/upload',{method:'POST',headers:fh,body:JSON.stringify(uploadBody)});assert.equal(repeated.status,200);assert.equal((await repeated.json()).data.id,proofId);
  const nativeBody={p_tenant:f.villageTenant,p_property:f.secondLot,p_data:{amount:'123',paid_on:'2026-11-03',method:'Bank',reference:'WEB-PROOF-CHECK',document_id:proofId}};
  const submitted=await fetch(endpoint+'finance/submit',{method:'POST',headers:{...fh,'Idempotency-Key':'web-finance-submit'},body:JSON.stringify(nativeBody)});assert.equal(submitted.status,200);assert.equal((await submitted.json()).data.status,'pending');
  const infected=await fetch(endpoint+'finance/upload',{method:'POST',headers:{...fh,'Idempotency-Key':'web-infected-proof'},body:JSON.stringify({...uploadBody,base64:Buffer.from('%PDF-1.4\nEICAR synthetic rejection marker').toString('base64')})});assert.equal(infected.status,400);
  assert.equal((await fetch(endpoint+'finance/decide',{method:'POST',headers:fh,body:JSON.stringify({p_tenant:f.villageTenant,p_request:finance.submission.id,p_approve:true,p_reason:'Resident approval must be denied'})})).status,403);
  assert.equal((await fetch(endpoint+'finance/constructor',{method:'POST',headers:fh,body:'{}'})).status,404);
  assert.equal((await fetch(endpoint+'finance/index',{headers:{authorization:`Bearer ${token}`}})).status,200);
  console.log('S04 built cookie/native API: private scanner/upload/download, rejected proof, replay, pending submission, tenant controls and no resident approval passed');
  const roleCommand={p_tenant:f.villageTenant,p_member:f.villageMember,p_role:'finance_preparer',p_community:null,p_until:null,p_revoke:false,p_reason:'Verified native permission change retry'};
  for(let i=0;i<2;i++){
   const changed=await fetch(endpoint+'access/role',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','Idempotency-Key':'native-role-command'},body:JSON.stringify(roleCommand)});assert.equal(changed.status,200);
  }
  const conflict=await fetch(endpoint+'access/role',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','Idempotency-Key':'native-role-command'},body:JSON.stringify({...roleCommand,p_role:'association_admin'})});assert.equal(conflict.status,409);
  assert.equal((await fetch(endpoint+`community/${f.villageTenant}/property_allocations/${f.secondLot}`,{headers:{cookie}})).status,403,'New staff grants immediately require MFA for the old resident session');
  const logout=await fetch(endpoint+'auth/logout',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({scope:'global'})});assert.equal(logout.status,200);
  assert.equal((await fetch(endpoint+'session',{headers:{cookie}})).status,401,'Stolen old cookie denied after logout');
  assert.equal((await fetch(endpoint+`tenants/${f.villageTenant}/documents/${f.document}`,{headers:{cookie}})).status,401);
  const nativeLogout=await fetch(endpoint+'auth/logout',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({scope:'local'})});assert.equal(nativeLogout.status,200);
  assert.equal((await fetch(endpoint+'session',{headers:{authorization:`Bearer ${token}`}})).status,401);
  console.log('S02 built web: real cookie login, HttpOnly/Secure cookies, CSRF, native bearer requests, tenant/file isolation, no-store responses and stale-cookie denial after logout passed');
 }finally{
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}
  await new Promise(resolve=>scanner.close(resolve));
  // Never dump captured server output: it may contain cookies or request secrets.
  output='';
 }
}
