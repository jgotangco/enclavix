import { NextResponse } from "next/server";
import { createClient as privilegedClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { runtimeEnvironment } from "@/lib/env.server";
import { bearerFrom, checkMutation, fields, readJson, RequestError, uuid } from "@/lib/auth/request";
import { proofBytes, proofHash, scanProof } from "@/lib/finance/proof.server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization", "X-Content-Type-Options": "nosniff" };
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers });
function result<T>(r: { data: T; error: unknown }): T {
  if (r.error) { const code = (r.error as { code?: string }).code || ""; throw new RequestError("Request denied", code === "42501" ? 403 : code === "23505" ? 409 : ["23503", "23514", "23502", "22P02", "22023", "22007", "22008", "22003"].includes(code) ? 400 : 503); }
  return r.data;
}
function fail(error: unknown) { const status = error instanceof RequestError ? error.status : error instanceof SyntaxError ? 400 : 503; return reply({ error: { code: ({ 400: "invalid_request", 401: "unauthenticated", 403: "forbidden", 404: "not_found", 409: "conflict", 413: "too_large", 415: "json_required", 503: "unavailable" } as Record<number, string>)[status] || "request_denied" }, request_id: crypto.randomUUID() }, status); }
async function clientFor(request: Request) { const client = await createClient(bearerFrom(request)); const u = await client.auth.getUser(); if (u.error || !u.data.user?.email_confirmed_at) throw new RequestError("Sign in", 401); return client; }
function backend() {
  const key = runtimeEnvironment("SUPABASE_SERVICE_ROLE_KEY"); if (!key) throw new RequestError("Private storage unavailable", 503);
  return privilegedClient(runtimeEnvironment("NEXT_PUBLIC_SUPABASE_URL")!, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(15000) }) } });
}
const commands: Record<string, string[]> = { opening_preview: ["p_tenant", "p_community", "p_rows", "p_reason"], prepare: ["p_tenant", "p_community", "p_kind", "p_data", "p_reason"], decide: ["p_tenant", "p_request", "p_approve", "p_reason"], generate: ["p_tenant", "p_batch", "p_limit", "p_reason"], submit: ["p_tenant", "p_property", "p_data"] };
export async function POST(request: Request) {
  try {
    checkMutation(request, bearerFrom(request)); const path = new URL(request.url).pathname.slice("/api/v1/finance/".length);
    if (path !== "upload" && !Object.hasOwn(commands, path)) throw new RequestError("Unknown command", 404);
    const key = request.headers.get("idempotency-key"); if (!key || !/^[A-Za-z0-9._:-]{1,128}$/.test(key)) throw new RequestError("Request key required");
    const client = await clientFor(request);
    if (path === "upload") {
      const b = fields(await readJson(request, 7_000_000), ["p_tenant", "p_property", "content_type", "base64"]);
      const bytes = proofBytes(b.base64, b.content_type); const hash = proofHash(bytes); const tenant = uuid(b.p_tenant);
      // Reserve performs live tenant/property authorization before scanner/storage receives bytes.
      const doc = result(await client.rpc("enclavix_finance_proof_reserve", { p_tenant: tenant, p_property: uuid(b.p_property), p_sha256: hash, p_size: bytes.length, p_type: b.content_type }).setHeader("Idempotency-Key", key)) as { id: string; object_path: string };
      const clean = await scanProof(bytes, b.content_type as string); const store = backend();
      if (clean) {
        const uploaded = await store.storage.from("tenant-private").upload(doc.object_path, bytes, { contentType: b.content_type as string, upsert: false, cacheControl: "0" });
        if (uploaded.error) {
          // A dropped upload response may leave the exact immutable object in storage. Verify, never overwrite.
          const prior = await store.storage.from("tenant-private").download(doc.object_path);
          if (prior.error || prior.data.size > 5242880 || proofHash(new Uint8Array(await prior.data.arrayBuffer())) !== hash) throw new RequestError("Storage unavailable", 503);
        }
      }
      const completed = result(await store.rpc("enclavix_finance_proof_complete", { p_tenant: tenant, p_document: doc.id, p_sha256: hash, p_clean: clean }));
      if (!clean || !completed) throw new RequestError("Proof rejected", 400);
      const current = result(await client.rpc("enclavix_finance_proof", { p_tenant: tenant, p_document: doc.id })) as { status: string };
      if (current.status !== "clean") throw new RequestError("Proof unavailable", 503);
      return reply({ data: { id: doc.id, status: "clean" } });
    }
    const keys = commands[path]; const b = fields(await readJson(request, ["prepare", "opening_preview"].includes(path) ? 1_048_576 : 8192), keys);
    if (keys.some(k => !Object.hasOwn(b, k))) throw new RequestError("Missing fields");
    for (const k of ["p_tenant", "p_community", "p_request", "p_batch", "p_property"]) if (k in b) uuid(b[k]);
    return reply({ data: result(await client.rpc(`enclavix_finance_${path}`, b).setHeader("Idempotency-Key", key)) });
  } catch (error) { return fail(error); }
}
export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const path = url.pathname.slice("/api/v1/finance/".length); const client = await clientFor(request);
    if (path === "index") return reply({ data: result(await client.rpc("enclavix_finance_index")) });
    const proof = path.match(/^([^/]+)\/proof\/([^/]+)$/);
    if (proof) {
      const args = { p_tenant: uuid(proof[1]), p_document: uuid(proof[2]) };
      const doc = result(await client.rpc("enclavix_finance_proof", args)) as { object_path?: string; sha256: string; size_bytes: string };
      if (!doc.object_path) throw new RequestError("Proof unavailable", 404);
      const file = await backend().storage.from("tenant-private").download(doc.object_path);
      if (file.error || file.data.size > 5242880) throw new RequestError("Proof unavailable", 503);
      const bytes = new Uint8Array(await file.data.arrayBuffer());
      if (String(bytes.length) !== doc.size_bytes || proofHash(bytes) !== doc.sha256) throw new RequestError("Proof integrity failure", 503);
      result(await client.rpc("enclavix_finance_proof", args)); // live authorization again after storage I/O
      return new Response(bytes, { headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": 'attachment; filename="payment-evidence"', "Content-Security-Policy": "sandbox; default-src 'none'" } });
    }
    if (path !== "report" && path !== "export") throw new RequestError("Unknown route", 404);
    if ([...url.searchParams.keys()].some(k => !["tenant", "community", "property", "from", "until"].includes(k)) || [...url.searchParams.keys()].some(k => url.searchParams.getAll(k).length !== 1)) throw new RequestError("Invalid query");
    const data = result(await client.rpc("enclavix_finance_report", { p_tenant: uuid(url.searchParams.get("tenant")), p_community: uuid(url.searchParams.get("community")), p_property: url.searchParams.get("property") ? uuid(url.searchParams.get("property")) : null, p_from: url.searchParams.get("from"), p_until: url.searchParams.get("until") })) as { truncated: boolean };
    if (path === "export") {
      if (data.truncated) throw new RequestError("Narrow report range before export", 413);
      return new Response(JSON.stringify(data, null, 2), { headers: { ...headers, "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="enclavix-reconciliation.json"', "Content-Security-Policy": "sandbox; default-src 'none'" } });
    }
    return reply({ data });
  } catch (error) { return fail(error); }
}
