/** Built production routes + actual SDK, entirely synthetic loopback Auth responses. No hosted calls. */
import {createServer as httpServer} from 'node:http';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const flows=[];const exchanges=[];
const provider=httpServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:54321');let raw='';for await(const chunk of req)raw+=chunk;
 const body=JSON.parse(raw||'{}');
 res.setHeader('Content-Type','application/json');res.setHeader('X-Supabase-Api-Version','2024-01-01');
 if(url.pathname==='/auth/v1/recover'||url.pathname==='/auth/v1/signup'){
  const prefix=body.email.split('@')[0];
  if(['limited','offline','exists','invalid'].includes(prefix)){
   const status={limited:429,offline:503,exists:422,invalid:422}[prefix];
   const code={limited:'over_email_send_rate_limit',offline:'unexpected_failure',exists:'user_already_exists',invalid:'validation_failed'}[prefix];
   res.writeHead(status);res.end(JSON.stringify({code,msg:'Synthetic provider response'}));return;
  }
  const redirect=new URL(url.searchParams.get('redirect_to'));
  const flow=redirect.searchParams.get('sb_flow_id');assert.match(flow,/^[a-f0-9]{32}$/);
  flows.push({flow,challenge:body.code_challenge});
  res.end(url.pathname.endsWith('/signup')?JSON.stringify({id:'01000000-0000-4000-8000-000000009999',email:body.email}):'{}');return;
 }
 if(url.pathname==='/auth/v1/token'){
  const expected=flows[Number(body.auth_code.split('-').at(-1))];
  const challenge=createHash('sha256').update(body.code_verifier).digest('base64url');
  if(!expected||expected.challenge!==challenge){res.writeHead(400);res.end(JSON.stringify({code:'bad_code',msg:'Wrong synthetic verifier'}));return;}
  exchanges.push(expected.flow);
  const payload={sub:'01000000-0000-4000-8000-000000009999',exp:Math.floor(Date.now()/1000)+3600};
  const token=`${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.synthetic`;
  res.end(JSON.stringify({access_token:token,token_type:'bearer',refresh_token:'synthetic-refresh',expires_in:3600,user:{id:payload.sub,email:'synthetic@example.test',email_confirmed_at:new Date().toISOString()}}));return;
 }
 res.writeHead(404);res.end('{}');
});
let child;
try{
 // Refuse to replace an occupied port; no existing local stack is stopped.
 provider.listen(54321,'127.0.0.1');await once(provider,'listening');
 const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
 const base=`http://127.0.0.1:${port}`;
 child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
  env:{...process.env,NODE_ENV:'production',ENCLAVIX_APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',ENCLAVIX_LOCAL_AUTH_TEST:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-review-public-key'},stdio:['ignore','pipe','pipe'],
 });
 // Drain output without printing cookies, recovery codes or synthetic credential fixtures.
 child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
 let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Built app exited early');try{ready=(await fetch(base+'/login')).status===200;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 const jar=new Map();
 function cookies(response){for(const value of response.headers.getSetCookie()){const part=value.split(';')[0];const index=part.indexOf('=');const name=part.slice(0,index),data=part.slice(index+1);if(data)jar.set(name,data);else jar.delete(name);}}
 const cookie=()=>[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
 async function post(kind,email){const r=await fetch(`${base}/api/v1/auth/${kind}`,{method:'POST',headers:{'Content-Type':'application/json',origin:base,cookie:cookie()},body:JSON.stringify(kind==='recover'?{email}:{email,password:'Synthetic-local-review-password'})});cookies(r);return r;}
 for(const kind of ['register','recover']){
  for(const [email,status,code] of [['limited@example.test',429,'rate_limited'],['offline@example.test',503,'unavailable'],['invalid@example.test',400,'invalid_request']]){
   const response=await post(kind,email);assert.equal(response.status,status);assert.equal((await response.json()).error.code,code);
  }
  const masked=await post(kind,'exists@example.test');assert.equal(masked.status,200);assert.match((await masked.json()).data.message,/If eligible/);
 }
 // Two initiated email flows share a browser cookie jar. Complete the earlier one first.
 assert.equal((await post('recover','first@example.test')).status,200);
 assert.equal((await post('register','second@example.test')).status,200);
 assert.equal(flows.length,2);assert.notEqual(flows[0].flow,flows[1].flow);
 const invalid=await fetch(`${base}/auth/callback?code=synthetic-0&sb_flow_id=bad`,{headers:{cookie:cookie()},redirect:'manual'});assert.equal(new URL(invalid.headers.get('location')).pathname,'/login');assert.equal(exchanges.length,0);
 for(const index of [0,1]){
  const response=await fetch(`${base}/auth/callback?code=synthetic-${index}&sb_flow_id=${flows[index].flow}`,{headers:{cookie:cookie()},redirect:'manual'});
  cookies(response);assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location')).pathname,'/account');
 }
 assert.deepEqual(exchanges,flows.map(f=>f.flow));
 console.log('Built S02 review regressions passed: registration/recovery 429/503 handling, enumeration-safe responses and overlapping PKCE callback/cookie flows');
}finally{
 if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}
 if(provider.listening){provider.closeAllConnections();await new Promise(r=>provider.close(r));}
}
