"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { formatWorkspaceDate } from "@/lib/community/presentation";
import { createAccountApi } from "@/lib/auth/account-api";
import { createRegistryFileReader, importTemplates, parseRegistryCsv } from "@/lib/community/csv";
type Entry = {
    id: string;
    code?: string;
    label?: string;
    name?: string;
    display_name?: string;
    kind?: string;
    community_id?: string;
    time_zone?: string;
    property_id?: string;
    person_id?: string;
    asset_code?: string;
    property_code?: string;
    valid_from?: string;
    valid_until?: string;
    status?: string;
    created_at?: string;
    expires_at?: string;
    reason?: string;
};
type Context = {
    tenant_id: string;
    name: string;
    time_zone: string;
    support_only: boolean;
    communities: Entry[];
    roles: {
        role: string;
        community_id: string | null;
    }[];
};
type SetupEntry = {
    tenant_id: string;
    name: string;
    status: string;
    revision: number;
    submitted: boolean;
    administrator: boolean;
    creator: boolean;
};
type Index = {
    operator: boolean;
    contexts: Context[];
    setups: SetupEntry[];
};
type Setup = {
    tenant: {
        name: string;
        status: string;
        currency: string;
        time_zone: string;
        locale: string;
    };
    setup: Record<string, string | number | boolean | null>;
    checklist: Record<string, boolean | number>;
};
type Registry = Record<"communities" | "locations" | "properties" | "people" | "relationships" | "assets" | "imports" | "exports" | "offboarding", Entry[]>;
type Preview = {
    batch: {
        id: string;
        status: string;
        source_sha256: string;
    };
    rows: {
        row: number;
        raw: Record<string, unknown>;
        validated: Record<string, unknown> | null;
        status: string;
        issues: {
            message: string;
        }[];
    }[];
};
type Input = {
    name: string;
    label: string;
    type?: string;
    value?: string;
    optional?: boolean;
    options?: {
        id: string;
        label: string;
    }[];
};
const control = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900";
const button = "rounded-lg bg-[#123F35] px-4 py-2 text-white disabled:opacity-50";
function options(rows: Entry[]) { return rows.map(r => ({ id: r.id, label: [r.code, r.label || r.display_name || r.name].filter(Boolean).join(" · ") })); }
function select(name: string, label: string, rows: Entry[], optional = false): Input { return { name, label, options: options(rows), optional }; }
function Panel({ title, children }: {
    title: string;
    children: ReactNode;
}) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-3 text-xl font-semibold text-[#123F35]">{title}</h2>{children}</section>; }
function ActionForm({ title, inputs, submit, busy, children }: {
    title: string;
    inputs: Input[];
    submit: (data: Record<string, string>) => Promise<void>;
    busy: boolean;
    children?: ReactNode;
}) {
    return <details className="my-3 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-medium">{title}</summary><form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; void submit(values); }}>
 {inputs.map(f => <label key={f.name} className="text-sm font-medium">{f.label}{f.optional ? " (optional)" : ""}{f.options ? <select name={f.name} className={control} required={!f.optional} defaultValue={f.value || ""}><option value="">Choose…</option>{f.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select> : <input name={f.name} type={f.type || "text"} className={control} defaultValue={f.value || ""} required={!f.optional} maxLength={f.name === "p_reason" ? 1000 : 500} minLength={f.name === "p_reason" ? 10 : undefined}/>}</label>)}
 {children}<div className="md:col-span-2"><button className={button} disabled={busy}>{title}</button></div></form></details>;
}
const reason: Input = { name: "p_reason", label: "Reason for this change (at least 10 characters)" };
const kinds = (values: string[]) => values.map(id => ({ id, label: id.replaceAll("_", " ") }));
function Table({ rows, columns, timeZone = "UTC" }: {
    rows: Entry[];
    columns: (keyof Entry)[];
    timeZone?: string;
}) { return rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns.map(k => <th className="border-b p-2" key={k}>{k.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}>{columns.map(k => <td key={k} className="border-b p-2">{r[k] ? ["valid_from","valid_until","created_at","expires_at"].includes(k) ? formatWorkspaceDate(r[k]!,r.time_zone||timeZone) : k==="kind" ? r[k]!.replaceAll("_"," ") : r[k] : "—"}</td>)}</tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No records yet.</p>; }
function download(text: string, name: string, type: string) { const href = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = href; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000); }
type Announcement = { id: string; title: string; body: string; created_at: string; expires_at: string };

function AnnouncementFeed({ path, api, timeZone }: {
    path: string;
    api: ReturnType<typeof createAccountApi>["api"];
    timeZone: string;
}) {
    const [items, setItems] = useState<Announcement[] | null>(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        api(path).then(data => { if (active) setItems(data); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [api, path]);
    if (error) return <p role="alert">Announcements are unavailable. Use Refresh announcements to try again.</p>;
    if (!items) return <p role="status">Loading announcements…</p>;
    if (!items.length) return <p>No current announcements for this community.</p>;
    return <ul className="space-y-4">{items.map(item => <li key={item.id} className="border-b pb-3">
        <h3 className="font-semibold">{item.title}</h3>
        <p className="whitespace-pre-wrap break-words">{item.body}</p>
        <p className="text-sm text-slate-600">Posted {formatWorkspaceDate(item.created_at, timeZone)} · Expires {formatWorkspaceDate(item.expires_at, timeZone)}</p>
    </li>)}</ul>;
}

type Ticket = { id: string; property_id: string; description: string; status: string; created_at: string };

function TicketQueue({ tenant, community, api, administrator, properties, timeZone }: {
    tenant: string;
    community: string;
    api: ReturnType<typeof createAccountApi>["api"];
    administrator: boolean;
    properties: Entry[];
    timeZone: string;
}) {
    const [tickets, setTickets] = useState<Ticket[] | null>(null);
    const [error, setError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [revision, refresh] = useState(0);
    useEffect(() => {
        let active = true;
        api(`tickets?tenant=${tenant}&community=${community}`)
            .then(data => { if (active) setTickets(data); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [api, tenant, community, revision]);
    async function save(fields: Record<string, string | null>) {
        setBusy(true);
        setMessage("");
        try {
            const result = await api("tickets", {
                p_tenant: tenant, p_community: community, p_property: null, p_description: null,
                p_ticket: null, p_status: null, p_reason: null, ...fields,
            });
            setMessage(`Ticket saved. Reference ${result.id}.`);
            setError(false);
            refresh(n => n + 1);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Ticket could not be saved.");
        } finally {
            setBusy(false);
        }
    }
    return <Panel title="Service tickets">
        {error ? <p role="alert">Tickets are unavailable.</p> : !tickets
            ? <p role="status">Loading tickets…</p>
            : tickets.length === 0 ? <p>No tickets for this community.</p>
            : <ul className="space-y-4">{tickets.map(ticket => <li className="border-b pb-3" key={ticket.id}>
                <p className="font-semibold">{ticket.status.replaceAll("_", " ")} · {formatWorkspaceDate(ticket.created_at, timeZone)}</p>
                <p className="whitespace-pre-wrap break-words">{ticket.description}</p>
                <p className="break-all text-sm">Reference {ticket.id}</p>
                {administrator && ticket.status !== "resolved" && <ActionForm
                    title={ticket.status === "open" ? "Start work" : "Resolve ticket"} busy={busy} inputs={[reason]}
                    submit={values => save({ ...values, p_ticket: ticket.id, p_status: ticket.status === "open" ? "in_progress" : "resolved" })}/>}
            </li>)}</ul>}
        <button type="button" className="my-3 underline" onClick={() => { setError(false); refresh(n => n + 1); }}>Refresh tickets</button>
        {!administrator && properties.length > 0 && <ActionForm title="Submit service ticket" busy={busy}
            inputs={[{ name: "p_property", label: "Property", options: properties.map(p => ({ id: p.id, label: p.label || p.code || p.id })) },
                { name: "p_description", label: "Describe the issue" }]}
            submit={save}/>}
        <p role="status" className="break-words">{message}</p>
    </Panel>;
}

export function CommunityWorkspace() {
    const [{ api }] = useState(() => createAccountApi());
    const [fileReader] = useState(() => createRegistryFileReader());
    const [index, setIndex] = useState<Index | null>(null), [tenant, setTenant] = useState(""), [community, setCommunity] = useState(""), [property, setProperty] = useState("");
    const [announcementRefresh, refreshAnnouncements] = useState(0);
    const [allocations, setAllocations] = useState<Entry[]>([]);
    const [setup, setSetup] = useState<Setup | null>(null), [registry, setRegistry] = useState<Registry | null>(null), [properties, setProperties] = useState<Entry[]>([]), [detail, setDetail] = useState<{
        property: Entry;
        time_zone: string;
        relationships: Entry[];
        allocations: Entry[];
    } | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null), [importKind, setImportKind] = useState("property"), [csv, setCsv] = useState("");
    const [busy, setBusy] = useState(true), [message, setMessage] = useState("");
    const generation = useRef(0), mounted = useRef(true);
    const current = index?.setups.find(s => s.tenant_id === tenant);
    const context = index?.contexts.find(s => s.tenant_id === tenant);
    const submitted = setup?.tenant.status === "onboarding" && setup.setup.submitted_revision === setup.setup.revision;
    const administrator = !!current?.administrator || !!context?.roles.some(r => r.role === "association_admin" && !r.community_id);
    async function loadIndex() { const data: Index = await api("community/index"); if (mounted.current)
        setIndex(data); }
    useEffect(() => { mounted.current = true; loadIndex().catch(e => setMessage(e.message)).finally(() => setBusy(false)); return () => { mounted.current = false; generation.current++; fileReader.clear(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
    async function load(t: string, epoch: number) {
        const [s, r, p, a] = await Promise.all([index?.setups.some(x => x.tenant_id === t) ? api(`community/${t}/setup`) : null, administrator ? api(`community/${t}/registry`) : null, context && !context.support_only ? api(`tenants/${t}/properties`) : [], administrator ? api(`community/${t}/allocations`) : []]);
        if (epoch !== generation.current || !mounted.current)
            return;
        setSetup(s);
        setRegistry(r);
        setProperties(p);
        setAllocations(a);
    }
    useEffect(() => {
        const epoch = ++generation.current;
        fileReader.clear();
        setSetup(null);
        setRegistry(null);
        setAllocations([]);
        setProperties([]);
        setCommunity("");
        setProperty("");
        setDetail(null);
        setPreview(null);
        setCsv("");
        setMessage("");
        if (!tenant)
            return;
        setBusy(true);
        load(tenant, epoch).catch(e => { if (epoch === generation.current)
            setMessage(e.message); }).finally(() => { if (epoch === generation.current)
            setBusy(false); });
    }, [tenant, administrator]); // eslint-disable-line react-hooks/exhaustive-deps
    async function run(work: () => Promise<void>) { if (busy)
        return; const epoch = generation.current; setBusy(true); setMessage(""); try {
        await work();
        if (epoch === generation.current)
            setMessage("Done. The latest records are shown below.");
    }
    catch (e) {
        if (epoch === generation.current)
            setMessage(e instanceof Error ? e.message : "Request failed.");
    }
    finally {
        if (epoch === generation.current)
            setBusy(false);
    } }
    async function mutate(name: string, data: Record<string, unknown>) { await api(`community/${name}`, data); await loadIndex(); if (tenant)
        await load(tenant, generation.current); }
    function command(action: string, values: Record<string, string>) { return run(async () => { const { p_reason, ...raw } = values; const data: Record<string, unknown> = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== "")); if (action === "community") {
        const labels: Record<string, string> = {};
        for (const key of Object.keys(data)) {
            if (key.startsWith("label_")) {
                labels[key.slice(6)] = String(data[key]);
                delete data[key];
            }
        }
        data.structure_labels = labels;
    } await mutate(action.startsWith("allocation_") ? "allocation" : "registry_command", { p_tenant: tenant, p_action: action.startsWith("allocation_") ? action.slice(11) : action, p_data: data, p_reason }); }); }
    const associations = [...new Map([...(index?.contexts || []), ...(index?.setups || [])].map(x => [x.tenant_id, x])).values()];
    const communities = registry?.communities || context?.communities || [];
    const timeZone = setup?.tenant.time_zone || context?.time_zone || "UTC";
    const scoped = (rows: Entry[]) => community ? rows.filter(x => x.community_id === community) : rows;
    const form = (title: string, action: string, inputs: Input[]) => <ActionForm key={`${tenant}:${community}:${action}`} title={title} inputs={[...inputs, reason]} busy={busy} submit={v => command(action, v)}/>;
    return <main className="min-h-screen bg-[#F6F7F3] text-slate-800 md:flex">
 <aside className="bg-[#123F35] p-6 text-white md:w-72 md:shrink-0"><Link href="/" className="text-2xl font-semibold">Enclavix</Link><p className="mt-1 text-sm text-emerald-100">Community workspace</p><nav className="my-6 flex flex-col gap-3"><a href="#overview">Overview and setup</a>{administrator && <><a href="#registry">Property registry</a><a href="#imports">Imports</a><a href="#exports">Export and offboarding</a></>}<Link href="/finance">Assessments and payments</Link><Link href="/account">Account, MFA and access</Link></nav><p className="text-sm text-emerald-100">Synthetic engineering only. Finance uses a separate authorized workspace; gate operations and Android release remain disabled.</p></aside>
 <div className="min-w-0 flex-1 space-y-6 p-5 md:p-8"><header><p className="text-sm uppercase tracking-widest text-slate-500">Association operations</p><h1 className="text-3xl font-semibold text-[#123F35]">Your community, clearly organized</h1><p className="mt-2">Sign in and verify MFA through <Link className="underline" href="/account">your account</Link> before staff actions. Sensitive changes require a sign-in within 10 minutes.</p></header>
 <div role="status" aria-live="polite" className="rounded-lg border border-amber-200 bg-amber-50 p-3">{busy ? "Loading or saving…" : message || (tenant ? "Choose a community or property to view its records." : "Choose an authorized association to begin.")}</div>
 <Panel title="Association context"><div className="grid gap-4 md:grid-cols-2"><label>Association<select className={control} value={tenant} disabled={busy} onChange={e => setTenant(e.target.value)}><option value="">Choose an association</option>{associations.map(x => <option key={x.tenant_id} value={x.tenant_id}>{x.name}</option>)}</select></label><label>Community<select className={control} value={community} disabled={busy} onChange={e => { generation.current++; fileReader.clear(); setMessage(""); setCommunity(e.target.value); setProperty(""); setDetail(null); setPreview(null); setCsv(""); }}><option value="">All authorized communities</option>{communities.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>{index && !associations.length && <p className="mt-3">No association access yet. An operator must nominate the first administrator; residents request access from their association.</p>}</Panel>
 {tenant && community && context && !context.support_only && <Panel title="Community announcements">
 <AnnouncementFeed key={`${tenant}:${community}:${announcementRefresh}`} path={`announcements?tenant=${tenant}&community=${community}`} api={api} timeZone={communities.find(c => c.id === community)?.time_zone || timeZone}/>
 <button type="button" className="mt-3 underline" onClick={() => refreshAnnouncements(n => n + 1)}>Refresh announcements</button>
 {context.roles.some(role => role.role === "association_admin" && !role.community_id) && <ActionForm
 key={`${tenant}:${community}:publish`} title="Publish announcement" busy={busy}
 inputs={[{ name: "p_title", label: "Title" }, { name: "p_body", label: "Announcement text" }, { name: "p_expires_at", label: "Expiry with time zone (ISO 8601)" }, reason]}
 submit={values => run(async () => {
     await api("announcements", { ...values, p_tenant: tenant, p_community: community, p_property: null });
     refreshAnnouncements(n => n + 1);
     setMessage("Announcement published.");
 })}/>}
 </Panel>}
 {tenant && community && context && !context.support_only && <TicketQueue
    key={`${tenant}:${community}:tickets`} tenant={tenant} community={community} api={api}
    administrator={context.roles.some(role => role.role === "association_admin" && !role.community_id)}
    properties={scoped(properties)} timeZone={communities.find(c => c.id === community)?.time_zone || timeZone}/>}
 {index?.operator && <Panel title="Create an association sandbox"><p>Nominate a different, already verified account. A second operator must review the completed setup. This does not authorize real resident data.</p><ActionForm title="Create setup" busy={busy} inputs={[{ name: "tenant_key", label: "Unique association key" }, { name: "legal_name", label: "Legal association name" }, { name: "administrator_email", label: "Nominated administrator email", type: "email" }, { name: "authority_ref", label: "Authority evidence reference (synthetic)" }, { name: "currency", label: "Currency", value: "PHP" }, { name: "time_zone", label: "Time zone", value: "Asia/Manila" }, { name: "locale", label: "Locale", value: "en-PH" }, reason]} submit={v => run(async () => { const { p_reason, ...p_data } = v; await mutate("create", { p_data, p_reason }); })}/></Panel>}
 <div id="overview">{setup && <Panel title={`${setup.tenant.name} · ${setup.tenant.status}`}><p>{setup.tenant.currency} · {setup.tenant.time_zone} · {setup.tenant.locale} · revision {String(setup.setup.revision)}. Sandbox only.</p>{submitted && <p role="status" className="my-3 rounded-lg bg-emerald-50 p-3">Checklist submitted for independent review. Further setup edits require resubmission.</p>}<ol className="my-3 space-y-1">{Object.entries(setup.checklist).map(([key, value]) => <li key={key}>{typeof value === "boolean" ? (value ? "✓" : "○") : value} {key.replaceAll("_", " ")}</li>)}</ol>
 {administrator && <><p>Complete configuration, create communities and locations, then add properties. Resolve or cancel every import before submission.</p><ActionForm key={`${tenant}:settings:${setup.setup.revision}`} title="Save onboarding configuration" busy={busy} inputs={[...["address", "brand_name", "accent_color", "billing_day", "notification_contact", "support_contact", "privacy_notice_ref"].map(name => ({ name, label: name.replaceAll("_", " "), value: String(setup.setup[name] ?? ""), type: name === "billing_day" ? "number" : name === "notification_contact" ? "email" : "text" })), { name: "opening_balance_state", label: "Opening balances", value: String(setup.setup.opening_balance_state), options: kinds(["pending", "no_opening_balances", "deferred_to_s04"]) }, reason]} submit={v => run(async () => { const { p_reason, ...p_data } = v; await mutate("settings", { p_tenant: tenant, p_data, p_reason }); })}/>{setup.tenant.status === "onboarding" && <ActionForm title="Submit checklist for independent review" inputs={[reason]} busy={busy || submitted} submit={v => run(() => mutate("submit", { p_tenant: tenant, ...v }))}/>}</>}
 {index?.operator && setup.tenant.status === "onboarding" && <><p>Review the authority reference: {String(setup.setup.authority_ref)}. The creator and nominated administrator cannot approve this setup.</p><ActionForm title="Verify and activate sandbox" inputs={[reason]} busy={busy || !!current?.creator || !current?.submitted} submit={v => run(() => mutate("activate", { p_tenant: tenant, p_revision: setup.setup.revision, ...v }))}><label className="md:col-span-2"><input type="checkbox" required className="mr-2"/>I independently verified the authority reference and activation checklist for this synthetic sandbox.</label></ActionForm></>}
 </Panel>}</div>
 {registry && administrator && <div id="registry" className="space-y-5"><Panel title="1 · Community structure">{form("Add community", "community", [{ name: "code", label: "Community code" }, { name: "name", label: "Community name" }, { name: "kind", label: "Type", options: kinds(["village", "condominium"]) }, { name: "time_zone", label: "Time zone", value: setup?.tenant.time_zone || "Asia/Manila" }, ...(["phase", "block", "tower", "floor", "property"].map(name => ({ name: `label_${name}`, label: `Custom term for ${name}`, optional: true })))])}<Table rows={registry.communities} columns={["code", "name", "kind"]}/>{form("Add location", "location", [select("community_id", "Community", communities), select("parent_id", "Parent location", scoped(registry.locations), true), { name: "code", label: "Unique location code" }, { name: "label", label: "Location label" }, { name: "kind", label: "Location type", options: kinds(["phase", "block", "tower", "floor"]) }])}<Table rows={scoped(registry.locations)} columns={["code", "label", "kind"]}/></Panel>
 <Panel title="2 · Properties and shared assets">{form("Add property", "property", [select("community_id", "Community", communities), select("location_id", "Location", scoped(registry.locations)), { name: "code", label: "Property code" }, { name: "label", label: "Property label" }, { name: "kind", label: "Property type", options: kinds(["lot", "townhouse_unit", "condominium_unit"]) }, { name: "lot_area_sqm", label: "Lot area (square metres)", optional: true }, { name: "floor_area_sqm", label: "Floor area (square metres)", optional: true }, { name: "ownership_share", label: "Ownership share", optional: true }])}<Table rows={scoped(registry.properties)} columns={["code", "label", "kind"]}/>{form("Update property details", "property_update", [select("id", "Property", scoped(registry.properties)), { name: "label", label: "New label" }, { name: "lot_area_sqm", label: "Lot area", optional: true }, { name: "floor_area_sqm", label: "Floor area", optional: true }, { name: "ownership_share", label: "Ownership share", optional: true }])}{form("Add shared asset", "asset", [select("community_id", "Community", communities), select("location_id", "Location", scoped(registry.locations)), { name: "code", label: "Asset code" }, { name: "label", label: "Asset label" }, { name: "kind", label: "Asset type", options: kinds(["parking", "storage", "amenity", "elevator", "gate"]) }, { name: "capacity", label: "Capacity", type: "number", optional: true }])}<Table rows={scoped(registry.assets)} columns={["code", "label", "kind"]}/></Panel>
 <Panel title="Asset allocation records"><p>Link asset registry records to properties with effective dates. These records do not enable booking, capacity enforcement, gate access or financial charges. Changes to your own property require another administrator.</p>{form("Record asset allocation", "allocation_assign", [select("asset_id", "Asset", scoped(registry.assets)),select("property_id", "Property", scoped(registry.properties)),{name:"kind",label:"Allocation type",options:kinds(["ownership","use"])},{name:"valid_from",label:"Effective from (ISO time zone, blank = now)",optional:true},{name:"valid_until",label:"Effective until (ISO time zone)",optional:true}])}<Table rows={scoped(allocations)} columns={["asset_code","property_code","kind","status","valid_from","valid_until"]}/>{form("End current asset allocation","allocation_end",[select("id","Current allocation",scoped(allocations).filter(x=>x.status==="current").map(x=>({...x,label:`${x.asset_code} · ${x.property_code} · ${x.kind}`}))),{name:"valid_until",label:"End on (ISO time zone, blank = now)",optional:true}])}{form("Cancel scheduled asset allocation","allocation_cancel",[select("id","Scheduled allocation",scoped(allocations).filter(x=>x.status==="scheduled").map(x=>({...x,label:`${x.asset_code} · ${x.property_code} · ${x.kind}`})))])}</Panel>
 <Panel title="3 · People and effective relationships"><p>Contacts do not automatically receive an account or staff role. Verify access separately in the account workspace. You cannot change your own property entitlements here.</p>{form("Add contact", "person", [{ name: "external_key", label: "Stable contact key" }, { name: "name", label: "Display name" }, { name: "kind", label: "Contact type", options: kinds(["individual", "organization"]) }, { name: "email", label: "Email", type: "email", optional: true }])}<Table rows={registry.people} columns={["display_name", "kind"]}/>{form("Update contact", "person_update", [select("id", "Contact", registry.people), { name: "name", label: "Display name" }, { name: "email", label: "Email", type: "email", optional: true }])}{form("Assign relationship", "relationship", [select("property_id", "Property", scoped(registry.properties)), select("person_id", "Person", registry.people), { name: "kind", label: "Relationship", options: kinds(["owner", "tenant", "occupant", "representative"]) }, select("represented_person_id", "Represented person", registry.people, true), { name: "valid_from", label: "Effective from (ISO 8601 with time zone, blank = now)", optional: true }, { name: "valid_until", label: "Effective until (ISO 8601 with time zone)", optional: true }, { name: "primary_contact", label: "Primary contact", options: kinds(["false", "true"]), value: "false" }, { name: "billing_contact", label: "Billing responsibility", options: kinds(["false", "true"]), value: "false" }])}
 <Table rows={scoped(registry.relationships).map(r => ({ ...r, label: registry.properties.find(p => p.id === r.property_id)?.label, name: registry.people.find(p => p.id === r.person_id)?.display_name, time_zone: communities.find(c=>c.id===r.community_id)?.time_zone }))} columns={["label", "name", "kind", "valid_from", "valid_until"]}/>
 {form("End current relationship", "end_relationship", [select("id", "Relationship", scoped(registry.relationships).map(r => ({ ...r, label: `${registry.people.find(p => p.id === r.person_id)?.display_name} · ${registry.properties.find(p => p.id === r.property_id)?.code} · ${r.kind} · ${r.valid_from}` })))])}
 {form("Transfer ownership or tenancy", "transfer", [select("property_id", "Property", scoped(registry.properties)), select("old_person_id", "Current person", registry.people), select("new_person_id", "New person", registry.people), { name: "kind", label: "Transfer type", options: kinds(["owner", "tenant"]) }, { name: "valid_from", label: "Effective date (ISO 8601 with time zone, blank = now)", optional: true }])}<p className="text-sm">Transfers preserve relationship history. Finance and ledger cutover remain disabled until S04.</p></Panel></div>}
 {registry && <><div id="imports"><Panel title="Import and reconcile registry records"><p>Use existing community/location/contact codes. Import contacts and properties before relationships. Preview writes no registry records; commit revalidates and saves the whole batch together. Row numbers count data rows, excluding the CSV header.</p><label className="mt-3 block">Import type<select className={control} value={importKind} disabled={busy} onChange={e => { fileReader.clear(); setImportKind(e.target.value); setCsv(""); setPreview(null); }}>{Object.keys(importTemplates).map(k => <option key={k}>{k}</option>)}</select></label><button className="my-3 underline" onClick={() => download(importTemplates[importKind], `${importKind}-template.csv`, "text/csv")}>Download synthetic CSV template</button><label className="block">CSV file<input className={control} type="file" accept=".csv,text/csv" disabled={busy} onChange={e => { const file = e.target.files?.[0]; fileReader.clear(); setPreview(null); setCsv(""); if (file) void fileReader.read(file, setCsv, setMessage); }}/></label><ActionForm title="Validate import preview" inputs={[reason]} busy={busy || !csv} submit={v => run(async () => { const staged = await api("community/import_stage", { p_tenant: tenant, p_kind: importKind, p_rows: parseRegistryCsv(csv), ...v }); const p = await api(`community/${tenant}/import_view/${staged.batch_id}`); setPreview(p); await load(tenant, generation.current); })}/>
 {registry.imports.map(b => <button key={b.id} className="mr-3 underline" disabled={busy} onClick={() => void run(async () => { setPreview(await api(`community/${tenant}/import_view/${b.id}`)); })}>{formatWorkspaceDate(b.created_at!,timeZone)} · {b.status}</button>)}
 {preview && <div className="mt-4 rounded-lg border p-3"><p>Batch status: {preview.batch.status}. {preview.rows.length} rows; {preview.rows.filter(r => r.status === "valid" || r.status === "applied").length} valid/applied.</p><p className="break-all text-xs">Source fingerprint: {preview.batch.source_sha256}</p><ul>{preview.rows.map(r => <li key={r.row}>Row {r.row}: {r.status}{r.issues.map(x => ` · ${x.message}`).join("")}<dl className="mb-3 ml-4 text-xs">{Object.entries(r.raw).map(([key, value]) => <div key={key}><dt className="inline font-semibold">{key.replaceAll("_", " ")}: </dt><dd className="inline">{String(value)}</dd></div>)}</dl></li>)}</ul><ActionForm title="Commit reviewed batch" inputs={[reason]} busy={busy || preview.batch.status !== "validated"} submit={v => run(async () => { await mutate("import_commit", { p_tenant: tenant, p_batch: preview.batch.id, p_expected_hash: preview.batch.source_sha256, ...v }); setPreview(await api(`community/${tenant}/import_view/${preview.batch.id}`)); })}><label className="md:col-span-2"><input type="checkbox" required className="mr-2"/>I reconciled all rows against the source and confirm this entire synthetic batch.</label></ActionForm><ActionForm title="Cancel staged batch" inputs={[reason]} busy={busy || !["staged", "validated"].includes(preview.batch.status)} submit={v => run(async () => { await mutate("import_cancel", { p_tenant: tenant, p_batch: preview.batch.id, ...v }); setPreview(null); })}/></div>}</Panel></div>
 <div id="exports"><Panel title="Scoped export and offboarding staging"><p>Exports contain association registry data and document metadata, without login bindings, file contents or financial balances. Downloads expire after 24 hours. Staging an offboarding request does not close the association, terminate access or delete data.</p><ActionForm title="Prepare registry export" inputs={[reason]} busy={busy} submit={v => run(() => mutate("export_create", { p_tenant: tenant, ...v }))}/><ul>{registry.exports.map(x => <li className="my-2" key={x.id}><a className="underline" href={`/api/v1/community/${tenant}/export/${x.id}`}>Download export from {formatWorkspaceDate(x.created_at!,timeZone)}</a> · expires {formatWorkspaceDate(x.expires_at!,timeZone)}</li>)}</ul><ActionForm title="Stage offboarding review" inputs={[select("p_export", "Reviewed export", registry.exports.map(x => ({ ...x, label: formatWorkspaceDate(x.created_at!,timeZone) }))), reason]} busy={busy} submit={v => run(() => mutate("offboarding", { p_tenant: tenant, ...v }))}><label className="md:col-span-2"><input type="checkbox" required className="mr-2"/>I reviewed this export and understand this only stages a future offboarding review.</label></ActionForm><Table rows={registry.offboarding} timeZone={timeZone} columns={["status", "reason", "created_at"]}/></Panel></div></>}
 {context && !context.support_only && <Panel title="Authorized property context"><label>Property<select className={control} value={property} disabled={busy} onChange={e => { const p = e.target.value; setProperty(p); setDetail(null); if (p)
        void run(async () => { const [info, assets] = await Promise.all([api(`community/${tenant}/property/${p}`),api(`community/${tenant}/property_allocations/${p}`)]);setDetail({...info,allocations:assets}); }); }}><option value="">Choose your property</option>{scoped(properties).map(p => <option key={p.id} value={p.id}>{p.code} · {p.label}</option>)}</select></label>{detail && <div className="mt-3"><h3 className="font-semibold">{detail.property.code} · {detail.property.label}</h3><p>{detail.property.kind?.replaceAll("_"," ")}</p><p className="text-sm">Dates shown in {detail.time_zone}.</p><h4 className="mt-3 font-medium">Current asset records</h4><Table rows={detail.allocations} timeZone={detail.time_zone} columns={["asset_code","kind","valid_from","valid_until"]}/>{detail.relationships.length ? <ul>{detail.relationships.map((r, i) => <li key={i}>{r.kind} · from {formatWorkspaceDate(r.valid_from!,detail.time_zone)} {r.valid_until ? `until ${formatWorkspaceDate(r.valid_until,detail.time_zone)}` : ""}</li>)}</ul> : <p>Staff property access; no personal relationship is asserted.</p>}</div>}</Panel>}
 <footer className="text-sm text-slate-500">S03 engineering workspace · sandbox data only · <Link className="underline" href="/account">Manage identity and access</Link></footer></div></main>;
}
