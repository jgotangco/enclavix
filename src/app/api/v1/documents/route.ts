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

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const client = await clientFor(request);
    return reply({ data: result(await client.rpc("enclavix_documents", {
      p_tenant: uuid(query.get("tenant")),
      p_community: uuid(query.get("community")),
    })) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    checkMutation(request, bearerFrom(request));
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[A-Za-z0-9._:-]{1,128}$/.test(key)) throw new RequestError("Request key required");
    const body = fields(await readJson(request, 7_000_000), [
      "tenant", "community", "property", "previous", "title", "audience", "reason", "base64", "content_type",
    ]);
    const tenant = uuid(body.tenant);
    const type = body.content_type;
    if (typeof type !== "string") throw new RequestError("Content type required");
    for (const field of ["title", "audience", "reason"]) {
      if (typeof body[field] !== "string") throw new RequestError("Invalid metadata");
    }
    const bytes = proofBytes(body.base64, type);
    const hash = proofHash(bytes);
    const client = await clientFor(request);
    const store = backend();
    const doc = result(await client.rpc("enclavix_document_reserve", {
      p_tenant: tenant, p_community: uuid(body.community),
      p_property: body.property === null ? null : uuid(body.property),
      p_previous: body.previous === null ? null : uuid(body.previous),
      p_title: body.title, p_audience: body.audience, p_reason: body.reason,
      p_hash: hash, p_size: bytes.length, p_type: type,
    }).setHeader("Idempotency-Key", key)) as { id: string; object_path: string };
    const clean = await scanProof(bytes, type);
    if (clean) {
      const bucket = store.storage.from("tenant-private");
      const uploaded = await bucket.upload(doc.object_path, bytes, { contentType: type, upsert: false, cacheControl: "0" });
      if (uploaded.error) {
        const prior = await bucket.download(doc.object_path);
        if (prior.error || prior.data.size !== bytes.length ||
          proofHash(new Uint8Array(await prior.data.arrayBuffer())) !== hash) throw new RequestError("Storage unavailable", 503);
      }
    }
    const completed = result(await store.rpc("enclavix_document_complete", {
      p_tenant: tenant, p_document: doc.id, p_hash: hash, p_clean: clean,
    }));
    if (!clean || !completed) throw new RequestError("Document rejected", 400);
    return reply({ data: { id: doc.id } });
  } catch (error) {
    return fail(error);
  }
}
