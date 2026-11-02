"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Context = { tenant_id: string; name: string; membership_id: string | null; support_only: boolean; communities: {id:string;name:string;kind:string}[]; roles:{role:string;community_id:string|null}[] };
type Session = { id:string; created_at:string; expires_at:string|null; current:boolean };
type Account = { user_id:string; email:string; contexts:Context[]; sessions:Session[]; factors:{id:string;status:string;friendly_name?:string}[] };
type Directory = {people:{id:string;name:string;linked:boolean}[];members:{id:string;name:string;status:string}[];properties:{id:string;code:string;label:string}[];invitations:{id:string;name:string;email:string;expires_at:string}[]};
function Choice({name,label,options,optional=false}:{name:string;label:string;options:{id:string;label:string}[];optional?:boolean}) {
 return <label className="block my-3 text-sm font-medium">{label}<select className={inputClass} name={name} required={!optional}><option value="">{optional?"Not selected / association-wide where applicable":"Choose an entry"}</option>{options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
}
type Property = { id:string; community_id:string; code:string;label:string;kind:string };
async function api(path:string, body?:unknown) {
  const response = await fetch(`/api/v1/${path}`, body === undefined ? { cache:"no-store" } : {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body), cache:"no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in with a verified email address to continue." : "Request unavailable or not permitted. Staff actions require a recent MFA sign-in. Check your details and try again.");
  return payload.data;
}
const inputClass="block border border-slate-400 rounded p-2 w-full text-slate-950 bg-white";
function Field({name,label,type="text",required=true}:{name:string;label:string;type?:string;required?:boolean}) {
 return <label className="block my-3 text-sm font-medium">{label}<input className={inputClass} name={name} type={type} required={required} autoComplete={type==="password"?"current-password":type==="email"?"email":"off"}/></label>;
}
export function AccountAccess({loadAccount=false}:{loadAccount?:boolean}) {
 const [account,setAccount]=useState<Account|null>(null);
 const [directory,setDirectory]=useState<Directory|null>(null);
 const [tenant,setTenant]=useState("");
 const [properties,setProperties]=useState<Property[]>([]);
 const [applications,setApplications]=useState<{id:string;display_name:string;requested_property:string;status:string}[]>([]);
 const [busy,setBusy]=useState(loadAccount);
 const [message,setMessage]=useState("");
 const [secret,setSecret]=useState<{id:string;secret:string}|null>(null);
 const [audit,setAudit]=useState<{id:string;event_type:string;created_at:string;details:Record<string,unknown>}[]>([]);
 const [invitation,setInvitation]=useState<string|null>(null);
 const current=account?.contexts.find(c=>c.tenant_id===tenant);
 async function refresh() { const data:Account=await api("session");setAccount(data);setTenant("");setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setSecret(null);setInvitation(null); }
 useEffect(()=>{
  if (!loadAccount) return;
  let alive=true;
  api("session").then(data=>{if(alive)setAccount(data);}).catch(e=>{if(alive)setMessage(e.message);}).finally(()=>{if(alive)setBusy(false);});
  return ()=>{alive=false;};
 },[loadAccount]);
 async function run(action:()=>Promise<void>) {setBusy(true);setMessage("");try{await action();}catch(e){setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setTenant("");setInvitation(null);setMessage(e instanceof Error?e.message:"Request failed.");}finally{setBusy(false);}}
 function submit(action:(values:Record<string,string>)=>Promise<void>) {
  return (event:React.FormEvent<HTMLFormElement>)=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;void run(()=>action(values));};
 }
 async function choose(next:string) {
  // Clear previous context before fetching; a failed switch cannot retain old tenant data.
  setTenant(next);setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setInvitation(null);
 }
 return <main className="max-w-3xl w-full mx-auto p-6 space-y-6">
  <header><Link href="/" className="underline">Enclavix</Link><h1 className="text-3xl font-semibold mt-4">Community account</h1><p className="mt-2">Use your own account. Association membership and property access require approval.</p></header>
  <p role="status" aria-live="polite" className="whitespace-pre-wrap">{busy?"Working…":message}</p>
  <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
  {!account ? <>
   <section className="bg-white border rounded p-5"><h2 className="text-xl font-semibold">Sign in</h2><form onSubmit={submit(async v=>{await api("auth/login",v);await refresh();setMessage("Signed in. Complete MFA if your association requires it.");})}><Field name="email" label="Email" type="email"/><Field name="password" label="Password" type="password"/><button className="underline">Sign in</button></form></section>
   <details className="border rounded p-5"><summary>Create an account</summary><form onSubmit={submit(async v=>{const r=await api("auth/register",v);setMessage(r.message);})}><Field name="email" label="Email" type="email"/><Field name="password" label="Password (at least 12 characters)" type="password"/><button className="underline">Send verification email</button></form></details>
   <details className="border rounded p-5"><summary>Recover your account</summary><form onSubmit={submit(async v=>{const r=await api("auth/recover",v);setMessage(r.message);})}><Field name="email" label="Email" type="email"/><button className="underline">Request recovery email</button></form><p>Open the email in this browser. If you lose your authenticator, contact your association; recovery does not bypass staff MFA.</p></details>
  </> : <>
   <section className="bg-white border rounded p-5"><h2 className="text-xl font-semibold">{account.email}</h2><p>No operational business screens are enabled in this sprint.</p>
   <div className="flex gap-5 mt-3"><button className="underline" onClick={()=>void run(refresh)}>Refresh access</button><button className="underline" onClick={()=>void run(async()=>{await api("auth/logout",{scope:"global"});setAccount(null);setTenant("");setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setSecret(null);setInvitation(null);setMessage("Signed out on all devices.");})}>Sign out on all devices</button></div></section>
   <section className="border rounded p-5"><h2 className="text-xl font-semibold">Authenticator and password</h2><p>Every staff role requires an authenticator code. Guard access lasts at most 30 minutes, other staff access one hour, and resident sessions eight hours. Sensitive actions require sign-in within the last ten minutes.</p>
    <button className="underline my-3" onClick={()=>void run(async()=>{setSecret(await api("auth/mfa/enroll",{}));})}>Set up an authenticator</button>
    {secret && <div><p>Add this secret to your authenticator. It is shown only for this enrollment.</p><code className="break-all">{secret.secret}</code></div>}
    <form onSubmit={submit(async v=>{await api("auth/mfa/verify",v);await refresh();setMessage("MFA verified. Refresh or choose your association.");})}><label className="block">Authenticator<select className={inputClass} name="factor_id" required>{secret && <option value={secret.id}>New authenticator</option>}{account.factors.filter(f=>f.status==="verified").map(f=><option key={f.id} value={f.id}>{f.friendly_name||"Authenticator"}</option>)}</select></label><Field name="code" label="Six-digit authenticator code"/><button className="underline">Verify code</button></form>
    <details className="mt-4"><summary>Change or reset password</summary><form onSubmit={submit(async v=>{const r=await api("auth/password",v);setAccount(null);setTenant("");setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setSecret(null);setInvitation(null);setMessage(r.message);})}><Field name="password" label="New password (at least 12 characters)" type="password"/><button className="underline">Change password and sign out</button></form></details>
   </section>
   <section className="border rounded p-5"><h2 className="text-xl font-semibold">Association and property context</h2>
    {!account.contexts.length && <p>No authorized association is available. Complete MFA, accept an invitation, or apply for access.</p>}
    <label>Active association<select className={inputClass} value={tenant} onChange={e=>void choose(e.target.value)}><option value="">Choose an association</option>{account.contexts.map(c=><option key={c.tenant_id} value={c.tenant_id}>{c.name}{c.support_only?" (approved support metadata only)":""}</option>)}</select></label>
    {current && <div key={tenant}><p className="mt-3">Active: <strong>{current.name}</strong>. Roles: {current.roles.map(r=>r.role).join(", ")||"metadata support only"}.</p><p>Communities: {current.communities.map(c=>c.name).join(", ")}</p><button className="underline my-3" onClick={()=>void run(async()=>{setProperties(await api(`tenants/${tenant}/properties`));})}>Load authorized properties</button><ul>{properties.map(p=><li key={p.id}>{current.communities.find(c=>c.id===p.community_id)?.name} — {p.code}: {p.label}</li>)}</ul></div>}
   </section>
   <details className="border rounded p-5"><summary>Apply for access or accept an invitation</summary><p>Ask your association for its identifier. Requested property details do not grant access.</p><form onSubmit={submit(async v=>{await api("access/apply",v);setMessage("Application submitted for association review.");})}><Field name="p_tenant" label="Association ID"/><Field name="p_name" label="Your name"/><Field name="p_property" label="Requested property"/><button className="underline">Submit application</button></form><form onSubmit={submit(async v=>{await api("access/accept",v);await refresh();setMessage("Invitation accepted.");})}><Field name="p_token" label="Invitation token"/><button className="underline">Accept invitation</button></form></details>
   {current?.roles.some(r=>r.role==="association_admin" && r.community_id===null) && <details className="border rounded p-5" key={`admin-${tenant}`}><summary>Association access administration — {current.name}</summary><p>Choose records verified by your association. Sign in again and complete MFA before sensitive changes. Every change is audited. You cannot change your own access.</p>
    <button className="underline mt-3" onClick={()=>void run(async()=>{const [pending,contacts]=await Promise.all([api(`tenants/${tenant}/applications`),api(`tenants/${tenant}/access-directory`)]);setApplications(pending);setDirectory(contacts);})}>Load access review workspace</button><p>Property and contact records must already be verified. Registry creation arrives in S03.</p>
    <form onSubmit={submit(async v=>{await api("access/review",{...v,p_approve:v.p_approve==="true",p_person:v.p_person||null,p_property:v.p_property||null});setApplications([]);setMessage("Application reviewed.");})}><Choice name="p_application" label="Application" options={applications.map(a=>({id:a.id,label:`${a.display_name} — ${a.requested_property}`}))}/><Choice name="p_person" label="Verified contact (approval only)" optional options={directory?.people.map(p=>({id:p.id,label:p.name}))||[]}/><Choice name="p_property" label="Verified property (approval only)" optional options={directory?.properties.map(p=>({id:p.id,label:`${p.code} — ${p.label}`}))||[]}/><label>Decision<select className={inputClass} name="p_approve"><option value="false">Reject</option><option value="true">Approve as resident</option></select></label><Field name="p_reason" label="Reason (at least 10 characters)"/><button className="underline">Confirm application decision for {current.name}</button></form>
    <form onSubmit={submit(async v=>{setInvitation(await api("access/invite",{...v,p_tenant:tenant}));setMessage("Invitation created. Deliver the token privately to the verified recipient; it expires in 48 hours.");})}><Choice name="p_person" label="Invitation recipient" options={directory?.people.filter(p=>!p.linked).map(p=>({id:p.id,label:p.name}))||[]}/><Field name="p_email" label="Verified recipient email" type="email"/><Field name="p_reason" label="Invitation reason"/><button className="underline">Create resident invitation</button></form>{invitation && <p className="break-all">Invitation token: {invitation}</p>}
    <form onSubmit={submit(async v=>{await api("access/revoke-invitation",v);setInvitation(null);setMessage("Invitation revoked.");})}><Choice name="p_invitation" label="Invitation to revoke" options={directory?.invitations.map(i=>({id:i.id,label:`${i.name} — ${i.email}`}))||[]}/><Field name="p_reason" label="Revocation reason"/><button className="underline">Revoke invitation</button></form>
    <button className="underline my-3" onClick={()=>void run(async()=>{setAudit(await api(`tenants/${tenant}/access-audit`));})}>Load access audit and support decisions</button><ul>{audit.map(a=><li key={a.id} className="break-all">{new Date(a.created_at).toLocaleString()} — {a.event_type.replace("access.", "").replaceAll("_", " ")}: {String(a.details.reason||"Access decision recorded")}</li>)}</ul>
    <form onSubmit={submit(async v=>{await api("access/role",{...v,p_tenant:tenant,p_community:v.p_community||null,p_until:v.p_until?new Date(v.p_until).toISOString():null,p_revoke:v.p_revoke==="true"});await refresh();setMessage("Role change recorded.");})}><Choice name="p_member" label="Member" options={directory?.members.map(m=>({id:m.id,label:`${m.name} — ${m.status}`}))||[]}/><label>Role<select className={inputClass} name="p_role">{["resident","association_admin","finance_preparer","finance_approver","guard","facilities_staff","board_reviewer"].map(r=><option key={r}>{r}</option>)}</select></label><Choice name="p_community" label="Community scope" optional options={current.communities.map(c=>({id:c.id,label:c.name}))}/><Field name="p_until" label="Expiry (local time; optional)" type="datetime-local" required={false}/><label>Action<select className={inputClass} name="p_revoke"><option value="true">Revoke role</option><option value="false">Grant role</option></select></label><Field name="p_reason" label="Reason"/><button className="underline">Confirm role change for {current.name}</button></form>
    <form onSubmit={submit(async v=>{await api("access/revoke",{...v,p_tenant:tenant});setMessage("Membership revoked.");})}><Choice name="p_member" label="Member to remove" options={directory?.members.map(m=>({id:m.id,label:`${m.name} — ${m.status}`}))||[]}/><Field name="p_reason" label="Reason"/><button className="underline">Revoke membership in {current.name}</button></form>
    <form onSubmit={submit(async v=>{await api("access/support",{...v,p_tenant:tenant,p_minutes:Number(v.p_minutes),p_revoke:v.p_revoke==="true"});setMessage("Support access decision recorded.");})}><Field name="p_operator" label="Operator account identifier (from the verified support request)"/><Field name="p_minutes" label="Duration (1–60 minutes)" type="number"/><label>Support decision<select className={inputClass} name="p_revoke"><option value="true">Revoke access</option><option value="false">Approve metadata-only support</option></select></label><Field name="p_reason" label="Support reason"/><button className="underline">Confirm support decision for {current.name}</button></form>
   </details>}
   <section className="border rounded p-5"><h2 className="text-xl font-semibold">Signed-in devices and sessions</h2><ul>{account.sessions.map(s=><li key={s.id} className="my-3">{s.current?"This session":"Other session"} — signed in {new Date(s.created_at).toLocaleString()} <button className="underline" onClick={()=>void run(async()=>{await api("auth/revoke-session",{p_session:s.id});if(s.current){setAccount(null);setTenant("");setProperties([]);setApplications([]);setDirectory(null);setAudit([]);setSecret(null);setInvitation(null);setMessage("Session revoked. Sign in again.");}else await refresh();})}>Sign out this session</button></li>)}</ul></section>
  </>}
  </fieldset>
 </main>;
}
