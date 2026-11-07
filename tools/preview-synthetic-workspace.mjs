/** Disposable UI review only: in-memory SQL + loopback Auth stand-in, never real authentication evidence. */
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {createDomainDatabase} from './lib/domain-database.mjs';
import {seedDomainFixtures,FIXTURE as f,id} from './lib/domain-fixtures.mjs';

if(process.env.ENCLAVIX_WORKSPACE_REVIEW!=='1')throw new Error('Explicit ENCLAVIX_WORKSPACE_REVIEW=1 is required for this synthetic-only review');
const db=await createDomainDatabase();await seedDomainFixtures(db);await db.exec("UPDATE app.tenants SET status='active'");
const staff='c0000000-0000-0000-0000-000000000003',resident='c0000000-0000-0000-0000-000000000004';
await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now()),($3,$4,'association_admin',now()),($3,$5,'resident',now())",[f.villageTenant,f.coownerMember,f.condoTenant,f.condoStaffMember,f.condoMember]);
await db.query('UPDATE app.people SET auth_user_id=$1 WHERE id=$2',[staff,f.condoStaff]);
await db.query('UPDATE app.people SET auth_user_id=$1 WHERE id=$2',[resident,f.condoPerson]);
await db.query("INSERT INTO app.communities(id,tenant_id,code,name,kind) VALUES($1,$2,'WEST','West sample community','village')",[id(9801),f.villageTenant]);
await db.query("INSERT INTO app.locations(id,tenant_id,community_id,code,label,kind) VALUES($1,$2,$3,'WEST-BLOCK','West block','block')",[id(9802),f.villageTenant,id(9801)]);
await db.query("INSERT INTO app.properties(id,tenant_id,community_id,location_id,code,label,kind) VALUES($1,$2,$3,$4,'WEST-001','West sample lot','lot')",[id(9803),f.villageTenant,id(9801),id(9802)]);
await db.query("INSERT INTO app.property_relationships(tenant_id,community_id,property_id,person_id,kind,valid_from) VALUES($1,$2,$3,$4,'owner',now())",[f.villageTenant,id(9801),id(9803),f.villagePerson]);
await db.query('INSERT INTO app.platform_operators(auth_user_id,enabled) VALUES($1,true),($2,true)',['c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002']);
await db.query("INSERT INTO app.assets(id,tenant_id,community_id,code,label,kind) VALUES($1,$2,$3,'SAMPLE-STORAGE','Synthetic sample storage','storage')",[id(9804),f.villageTenant,f.village]);
await db.query("INSERT INTO app.asset_allocations(tenant_id,community_id,asset_id,property_id,kind,valid_from) VALUES($1,$2,$3,$4,'use',now())",[f.villageTenant,f.village,id(9804),f.secondLot]);
// S04 fixtures are explicitly synthetic, approved only inside this disposable UI stand-in.
const financeApprover='c0000000-0000-0000-0000-000000000005';
await db.query('INSERT INTO app.people(id,tenant_id,display_name,auth_user_id) VALUES($1,$2,$3,$4)',[id(9701),f.villageTenant,'Synthetic finance approver',financeApprover]);
await db.query("INSERT INTO app.memberships(id,tenant_id,person_id,status,valid_from) VALUES($1,$2,$3,'active',now())",[id(9702),f.villageTenant,id(9701)]);
await db.query("INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'finance_preparer',now()),($1,$3,'finance_approver',now())",[f.villageTenant,f.coownerMember,id(9702)]);
for(const [sid,uid] of [[id(9703),staff],[id(9704),financeApprover]])await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[sid,uid]);
async function financeFixture(who,name,args){
 const uid=who==='prepare'?staff:financeApprover,sid=who==='prepare'?id(9703):id(9704);
 await db.query("SELECT set_config('request.jwt.claims',$1,false),set_config('request.headers',$2,false)",[JSON.stringify({role:'authenticated',sub:uid,session_id:sid,aal:'aal2',exp:Math.floor(Date.now()/1000)+3600}),JSON.stringify({'idempotency-key':randomUUID()})]);
 return(await db.query(`SELECT public.enclavix_finance_${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
}
async function financeApproved(kind,data){const p=await financeFixture('prepare','prepare',[f.villageTenant,f.village,kind,JSON.stringify(data),'Synthetic UI fixture finance preparation']);await financeFixture('approve','decide',[f.villageTenant,p.id,true,'Synthetic UI fixture independent decision']);return p;}
await financeApproved('policy',{approval_limit:'1000000'});
await financeApproved('rule',{code:'MONTHLY',label:'Monthly association dues',basis:'fixed',rate:'3000',effective_from:'2026-01-01',recurring:true,category:'dues',due_days:10});
const financeBatch=await financeApproved('generation',{period:'2026-11-01'});
await financeFixture('prepare','generate',[f.villageTenant,financeBatch.id,100,'Synthetic UI fixture billing generation']);
await financeFixture('prepare','prepare',[f.villageTenant,f.village,'credit',JSON.stringify({property_id:f.secondLot,amount:'200',posted_on:'2026-11-03',due_on:'2026-11-03',label:'Synthetic reviewed adjustment'}),'Synthetic UI fixture adjustment proposal']);
const tokens=new Map();let queue=Promise.resolve(),child;
const password='Synthetic-workspace-42!'; // Disposable test value; never an account outside this stand-in.
const provider=createServer((req,res)=>{
 queue=queue.then(async()=>{
  res.setHeader('Content-Type','application/json');res.setHeader('X-Supabase-Api-Version','2024-01-01');
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1048576)throw Object.assign(new Error('Oversize'),{code:'22023'});}
  const body=JSON.parse(raw||'{}'),url=new URL(req.url,'http://127.0.0.1:54321');
  if(url.pathname==='/auth/v1/token'){
   const row=(await db.query('SELECT id,email,email_confirmed_at FROM auth.users WHERE email=$1',[body.email])).rows[0];
   if(!row||body.password!==password){res.writeHead(400);res.end(JSON.stringify({code:'invalid_credentials',msg:'Synthetic sign-in denied'}));return;}
   const sid=randomUUID(),now=Math.floor(Date.now()/1000);await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[sid,row.id]);
   const claims={sub:row.id,role:'authenticated',aal:'aal2',session_id:sid,iat:now,exp:now+3600};
   const token=`${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic`;
   const user={...row,aud:'authenticated',role:'authenticated',created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{},identities:[],factors:[]};
   tokens.set(token,{claims,user});res.end(JSON.stringify({access_token:token,refresh_token:randomUUID(),token_type:'bearer',expires_in:3600,user}));return;
  }
  const session=tokens.get(req.headers.authorization?.replace(/^Bearer /,''));
  if(!session){res.writeHead(401);res.end(JSON.stringify({code:'not_authenticated',msg:'Synthetic sign-in required'}));return;}
  if(url.pathname==='/auth/v1/user'){res.end(JSON.stringify(session.user));return;}
  if(url.pathname==='/auth/v1/logout'){await db.query('DELETE FROM auth.sessions WHERE user_id=$1',[session.user.id]);res.end('{}');return;}
  const name=url.pathname.match(/^\/rest\/v1\/rpc\/(enclavix_[a-z0-9_]+)$/)?.[1];
  if(!name){res.writeHead(404);res.end('{}');return;}
  const signature=(await db.query("SELECT proargnames FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname=$1",[name])).rows[0];
  const args=signature?.proargnames||[];
  if(!signature||Object.keys(body).some(k=>!args.includes(k))){res.writeHead(400);res.end(JSON.stringify({code:'22023'}));return;}
  await db.exec('BEGIN');
  try{
   await db.query("SELECT set_config('request.jwt.claims',$1,true),set_config('request.headers',$2,true)",[JSON.stringify(session.claims),JSON.stringify({'idempotency-key':req.headers['idempotency-key']})]);
   await db.exec('SET LOCAL ROLE authenticated');
   const result=(await db.query(`SELECT public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args.map(k=>typeof body[k]==='object'&&body[k]!==null?JSON.stringify(body[k]):body[k]??null))).rows[0].result;
   await db.exec('COMMIT');res.end(JSON.stringify(result));
  }catch(error){await db.exec('ROLLBACK');res.writeHead(400);res.end(JSON.stringify({code:error.code||'22023',message:'Synthetic command denied'}));}
 }).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end('{}');});
});
try{
 provider.listen(54321,'127.0.0.1');await once(provider,'listening');
 child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3103'],{env:{...process.env,NODE_ENV:'production',ENCLAVIX_APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',ENCLAVIX_LOCAL_AUTH_TEST:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-ui-review-public-key'},stdio:['ignore','ignore','ignore']});
 child.on('exit',()=>{void stop();});
 console.log('Synthetic UI review: http://127.0.0.1:3103/account. Use fixture guard@enclavehoa.com or resident@enclavehoa.com; password is the disposable value declared in this tool. This does not verify real Auth/MFA.');
}catch(error){await db.close();throw error;}
let stopping=false;
async function stop(){if(stopping)return;stopping=true;if(child?.exitCode===null)child.kill('SIGTERM');await new Promise(r=>provider.close(r));await queue;await db.close();}
process.once('SIGINT',()=>{void stop();});process.once('SIGTERM',()=>{void stop();});
