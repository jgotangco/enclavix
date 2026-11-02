import { createClient as storageClient } from "@supabase/supabase-js";
import { runtimeEnvironment } from "@/lib/env.server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bearerFrom, checkMutation, fields, text, uuid, readJson } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie, Authorization", "X-Content-Type-Options": "nosniff" };
function reply(data: unknown, status = 200) { return NextResponse.json(data, { status, headers }); }
function failed(status = 403) { return reply({ error: { code: status === 401 ? "unauthenticated" : status === 503 ? "unavailable" : "request_denied" }, request_id: crypto.randomUUID() }, status); }
function result<T>(value: { data?: T; error: unknown }): NonNullable<T> { if (value.error) throw new Error("Provider denied request"); return value.data as NonNullable<T>; }

export async function GET(request: Request) {
  try {
    const client = await createClient(bearerFrom(request));
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.email_confirmed_at) return failed(401);
    const path = new URL(request.url).pathname;
    if (path === "/api/v1/session") {
      const sessions = result(await client.rpc("enclavix_sessions"));
      if (!Array.isArray(sessions) || !sessions.length) return failed(401);
      return reply({ data: { user_id: data.user.id, email: data.user.email,
        contexts: result(await client.rpc("enclavix_contexts")),
        sessions,
        factors: result(await client.auth.mfa.listFactors()).totp.map(f => ({ id: f.id, status: f.status, friendly_name: f.friendly_name })),
      } });
    }
    const document = path.match(/^\/api\/v1\/tenants\/([^/]+)\/documents\/([^/]+)$/);
    if (document) {
      const authorized = result(await client.rpc("enclavix_document", {p_tenant:uuid(document[1]),p_document:uuid(document[2])})) as {object_path:string;size_bytes:string} | null;
      if (!authorized) return failed(404);
      const key = runtimeEnvironment("SUPABASE_SERVICE_ROLE_KEY");
      if (!key) return failed(503);
      // Storage key is confined to an already-authorized download. Never return a signed URL.
      const backend = storageClient(runtimeEnvironment("NEXT_PUBLIC_SUPABASE_URL")!,key,{auth:{persistSession:false,autoRefreshToken:false}});
      if (BigInt(authorized.size_bytes)>BigInt(20971520)) return failed(413);
      const downloaded = await backend.storage.from("tenant-private").download(authorized.object_path);
      if (downloaded.error || downloaded.data.size>20971520) return failed(503);
      return new Response(downloaded.data.stream(), {headers:{...headers,"Content-Type":"application/octet-stream","Content-Disposition":'attachment; filename="document"',"Content-Security-Policy":"sandbox; default-src 'none'"}});
    }
    const match = path.match(/^\/api\/v1\/tenants\/([^/]+)\/(properties|applications|access-audit|access-directory)$/);
    if (match) {
      const tenant = uuid(match[1]);
      const contexts = result(await client.rpc("enclavix_contexts")) as { tenant_id: string }[];
      if (!contexts.some(c => c.tenant_id === tenant)) return failed();
      return reply({ data: result(await client.rpc(match[2] === "properties" ? "enclavix_properties" : match[2] === "applications" ? "enclavix_applications" : match[2] === "access-audit" ? "enclavix_access_audit" : "enclavix_access_directory", { p_tenant: tenant })) });
    }
    return failed(404);
  } catch { return failed(503); }
}

export async function POST(request: Request) {
  try {
    const bearer = bearerFrom(request);
    checkMutation(request, bearer);
    if (Number(request.headers.get("content-length")) > 8192) return failed(413);

    const path = new URL(request.url).pathname.replace("/api/v1/", "");
    const body = await readJson(request);
    const client = await createClient(bearer);
    // Native clients own provider session storage/refresh/MFA, never a cookie session here.
    if (bearer && path.startsWith("auth/") && path !== "auth/logout" && path !== "auth/revoke-session") return failed(400);
    if (["auth/login", "auth/register", "auth/recover"].includes(path)) {
      const b = fields(body, path === "auth/recover" ? ["email"] : ["email", "password"]);
      const email = text(b.email, 254).trim();
      if (path === "auth/recover") {
        // Fixed local redirect; never accept a caller-controlled return URL.
        await client.auth.resetPasswordForEmail(email, { redirectTo: `${new URL(request.url).origin}/auth/callback` });
        return reply({ data: { message: "If eligible, check your email for recovery instructions." } });
      }
      const password = text(b.password, 128);
      if (path === "auth/register") {
        if (password.length < 12) return failed(400);
        await client.auth.signUp({ email, password, options: { emailRedirectTo: `${new URL(request.url).origin}/auth/callback` } });
        return reply({ data: { message: "If eligible, check your email to verify your account. Association access requires approval." } });
      }
      const login = await client.auth.signInWithPassword({ email, password });
      if (login.error || !login.data.user?.email_confirmed_at) return failed(401);
      return reply({ data: { message: "Signed in." } });
    }
    const verified = await client.auth.getUser();
    if (verified.error || !verified.data.user?.email_confirmed_at) return failed(401);
    if (path === "auth/logout") {
      const b = fields(body, ["scope"]);
      if (b.scope !== "global" && b.scope !== "local" && b.scope !== "others") return failed(400);
      result(bearer ? await client.auth.admin.signOut(bearer, b.scope) : await client.auth.signOut({ scope: b.scope }));
      return reply({ data: { message: "Sessions signed out." } });
    }
    if (path === "auth/password") {
      const b = fields(body, ["password"]); const password = text(b.password,128);
      if (password.length < 12) return failed(400);
      const sessions = result(await client.rpc("enclavix_sessions")) as {current:boolean;created_at:string}[];
      const factors = result(await client.auth.mfa.listFactors());
      const assurance = result(await client.auth.mfa.getAuthenticatorAssuranceLevel());
      if (!sessions.some(s => s.current && Date.now()-new Date(s.created_at).getTime()<600000)
        || (factors.totp.some(f => f.status === "verified") && assurance.currentLevel !== "aal2")) return failed();
      // Recovery creates a fresh provider session; enrolled MFA is still required.
      const changed = await client.auth.updateUser({ password });
      if (changed.error) return failed();
      result(await client.auth.signOut({ scope: "global" }));
      return reply({ data: { message: "Password changed. Sign in again on every device." } });
    }
    if (path === "auth/mfa/enroll") {
      fields(body, []);
      const enrollment = result(await client.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` }));
      return reply({ data: { id: enrollment.id, secret: enrollment.totp.secret, uri: enrollment.totp.uri } });
    }
    if (path === "auth/mfa/verify") {
      const b = fields(body, ["factor_id", "code"]);
      const code = text(b.code,6); if (!/^\d{6}$/.test(code)) return failed(400);
      result(await client.auth.mfa.challengeAndVerify({ factorId: uuid(b.factor_id), code }));
      return reply({ data: { message: "Authenticator verified." } });
    }
    // Named command allowlist. No arbitrary RPC names, SQL, actor, tenant claim or table payload.
    const commands: Record<string, { keys: string[]; rpc: string }> = {
      "access/apply": { keys: ["p_tenant", "p_name", "p_property"], rpc: "enclavix_apply" },
      "access/review": { keys: ["p_application", "p_person", "p_property", "p_approve", "p_reason"], rpc: "enclavix_review_application" },
      "access/invite": { keys: ["p_tenant", "p_person", "p_email", "p_reason"], rpc: "enclavix_invite" },
      "access/revoke-invitation": { keys: ["p_invitation", "p_reason"], rpc: "enclavix_revoke_invitation" },
      "access/accept": { keys: ["p_token"], rpc: "enclavix_accept_invitation" },
      "access/role": { keys: ["p_tenant", "p_member", "p_role", "p_community", "p_until", "p_revoke", "p_reason"], rpc: "enclavix_set_role" },
      "access/revoke": { keys: ["p_tenant", "p_member", "p_reason"], rpc: "enclavix_revoke_membership" },
      "access/support": { keys: ["p_tenant", "p_operator", "p_minutes", "p_revoke", "p_reason"], rpc: "enclavix_support" },
      "auth/revoke-session": { keys: ["p_session"], rpc: "enclavix_revoke_session" },
    };
    const command = commands[path]; if (!command) return failed(404);
    const args = fields(body, command.keys);
    if (command.keys.some(k => !(k in args))) return failed(400);
    return reply({ data: result(await client.rpc(command.rpc, args)) });
  } catch { return failed(); }
}
