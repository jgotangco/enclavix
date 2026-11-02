import assert from 'node:assert/strict';
import {createHmac,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {FIXTURE as f,id} from './domain-fixtures.mjs';

function totp(secret) {
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';
 for(const c of secret.toUpperCase().replace(/=+$/,'')) bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');
 const bytes=[];for(let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.slice(i,i+8),2));
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const h=createHmac('sha1',Buffer.from(bytes)).update(counter).digest();const o=h.at(-1)&15;
 return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');
}
const ok=r=>{assert.ifError(r.error);return r.data;};
export async function verifyIdentity({db,admin,sessions,state}) {
 const owner=sessions[0],staff=sessions[1],outsider=sessions[2];
 const user=ok(await owner.auth.getUser()).user, staffUser=ok(await staff.auth.getUser()).user;
 await db.query("UPDATE app.tenants SET status='active'");
 await db.query(`INSERT INTO app.membership_roles(tenant_id,membership_id,role,valid_from) VALUES($1,$2,'association_admin',now())`,[f.villageTenant,f.coownerMember]);
 assert.equal(ok(await owner.rpc('enclavix_contexts')).length,1,'Staff board-reviewer membership needs MFA in second tenant');
 assert.deepEqual(ok(await staff.rpc('enclavix_contexts')),[]);
 const enrollment=ok(await staff.auth.mfa.enroll({factorType:'totp',friendlyName:'Disposable CI authenticator'}));
 const upgraded=await staff.auth.mfa.challengeAndVerify({factorId:enrollment.id,code:totp(enrollment.totp.secret)});ok(upgraded);
 assert.equal(ok(await staff.auth.mfa.getAuthenticatorAssuranceLevel()).currentLevel,'aal2');
 assert.equal(ok(await staff.rpc('enclavix_contexts')).length,2);
 assert.equal(ok(await owner.rpc('enclavix_properties',{p_tenant:f.villageTenant})).length,2);
 assert.deepEqual(ok(await owner.rpc('enclavix_properties',{p_tenant:f.condoTenant})),[]);
 assert.ok((await owner.rpc('enclavix_set_role',{p_tenant:f.villageTenant,p_member:f.villageMember,p_role:'association_admin',p_community:null,p_until:null,p_revoke:false,p_reason:'Forged native client elevation'})).error);
 const application=ok(await outsider.rpc('enclavix_apply',{p_tenant:f.villageTenant,p_name:'CI applicant',p_property:'Lot 2'}));
 assert.ok((await outsider.rpc('enclavix_review_application',{p_application:application,p_person:f.renter,p_property:f.secondLot,p_approve:true,p_reason:'Self approval must be denied'})).error);
 ok(await staff.rpc('enclavix_review_application',{p_application:application,p_person:f.renter,p_property:f.secondLot,p_approve:true,p_reason:'Verified synthetic occupancy records'}));
 assert.deepEqual(ok(await outsider.rpc('enclavix_properties',{p_tenant:f.villageTenant})).map(p=>p.id),[f.secondLot]);
 // Actual private storage endpoint, not just a SQL predicate.
 const path=`${f.villageTenant}/${f.document}`;
 ok(await admin.storage.from('tenant-private').upload(path,Buffer.from('Synthetic CI evidence'),{contentType:'application/pdf'}));
 assert.ok((await owner.storage.from('tenant-private').download(path)).error,'Pending scan objects must be denied');
 await db.query("UPDATE app.document_objects SET scan_status='clean',audience='property_owners' WHERE id=$1",[f.document]);
 assert.ok((await owner.storage.from('tenant-private').download(path)).error,'Direct objects stay private even to related residents');
 assert.equal(ok(await owner.rpc('enclavix_document',{p_tenant:f.villageTenant,p_document:f.document})).object_path,path);
 assert.equal(ok(await outsider.rpc('enclavix_document',{p_tenant:f.villageTenant,p_document:f.document})),null);
 assert.ok((await outsider.storage.from('tenant-private').download(path)).error,'Other household denied');
 assert.ok((await outsider.storage.from('tenant-private').upload(`${f.villageTenant}/${id(9999)}`,Buffer.from('Denied'))).error,'Client uploads remain closed until S05');
 assert.ok((await owner.storage.from('tenant-private').createSignedUrl(path,86400)).error,'Clients cannot mint URLs that outlive revocation');
 // Support operator has no grant by default, never gets property/document access.
 const operator=ok(await outsider.auth.getUser()).user.id;
 const member=(await db.query('SELECT id FROM app.memberships WHERE person_id=$1',[f.renter])).rows[0].id;
 ok(await staff.rpc('enclavix_revoke_membership',{p_tenant:f.villageTenant,p_member:member,p_reason:'Synthetic membership removal verification'}));
 assert.deepEqual(ok(await outsider.rpc('enclavix_properties',{p_tenant:f.villageTenant})),[]);
 await db.query('INSERT INTO app.platform_operators(auth_user_id,enabled) VALUES($1,true)',[operator]);
 const factor=ok(await outsider.auth.mfa.enroll({factorType:'totp',friendlyName:'CI support authenticator'}));
 ok(await outsider.auth.mfa.challengeAndVerify({factorId:factor.id,code:totp(factor.totp.secret)}));
 assert.deepEqual(ok(await outsider.rpc('enclavix_contexts')),[]);
 ok(await staff.rpc('enclavix_support',{p_tenant:f.villageTenant,p_operator:operator,p_minutes:5,p_revoke:false,p_reason:'Synthetic support metadata investigation'}));
 assert.equal(ok(await outsider.rpc('enclavix_contexts'))[0].support_only,true);
 assert.deepEqual(ok(await outsider.rpc('enclavix_properties',{p_tenant:f.villageTenant})),[]);
 assert.ok((await outsider.storage.from('tenant-private').download(path)).error);
 ok(await staff.rpc('enclavix_support',{p_tenant:f.villageTenant,p_operator:operator,p_minutes:5,p_revoke:true,p_reason:'Synthetic support investigation complete'}));
 assert.deepEqual(ok(await outsider.rpc('enclavix_contexts')),[]);
 // Actual provider recovery link/OTP/password update. No outgoing email or hosted credentials.
 const password=randomBytes(24).toString('base64url');
 const link=ok(await admin.auth.admin.generateLink({type:'recovery',email:user.email}));
 const recovered=createClient(state.API_URL,state.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 ok(await recovered.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'recovery'}));
 const changed=await recovered.auth.updateUser({password});assert.ifError(changed.error);
 ok(await recovered.auth.signOut({scope:'global'}));
 assert.deepEqual(ok(await owner.rpc('enclavix_contexts')),[],'Old unexpired JWT cannot authorize after provider global logout');
 const fresh=ok(await owner.auth.signInWithPassword({email:user.email,password}));
 const sessionId=JSON.parse(Buffer.from(fresh.session.access_token.split('.')[1],'base64url').toString()).session_id;
 ok(await owner.rpc('enclavix_revoke_session',{p_session:sessionId}));
 assert.deepEqual(ok(await owner.rpc('enclavix_contexts')),[]);
 assert.ok((await owner.auth.refreshSession()).error,'Remote revoked session cannot refresh');
 // Revocation test restores a live owner session for the web boundary checks.
 ok(await owner.auth.signInWithPassword({email:user.email,password}));
 assert.equal(ok(await owner.rpc('enclavix_contexts')).length,1);
 console.log('S02 provider: real TOTP MFA, approval, scoped API, private storage, support grant/revoke, recovery, global logout and remote session revocation passed');
 return {owner,staff,staffUser,password};
}
