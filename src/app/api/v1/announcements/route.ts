import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bearerFrom, checkMutation, fields, readJson, RequestError, uuid } from "@/lib/auth/request";

export const dynamic = "force-dynamic";

function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: {
    "Cache-Control": "private, no-store",
    Vary: "Cookie, Authorization",
  } });
}

async function authorizedClient(request: Request) {
  const client = await createClient(bearerFrom(request));
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email_confirmed_at) throw new RequestError("Sign in", 401);
  return client;
}

function failure(error: unknown) {
  const status = error instanceof RequestError ? error.status : error instanceof SyntaxError ? 400 : 503;
  return reply({ error: { code: status === 503 ? "unavailable" : "request_denied" }, request_id: crypto.randomUUID() }, status);
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const client = await authorizedClient(request);
    const { data, error } = await client.rpc("enclavix_announcement_feed", {
      p_tenant: uuid(query.get("tenant")),
      p_community: uuid(query.get("community")),
    });
    if (error) throw new RequestError("Feed unavailable", 503);
    return reply({ data });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkMutation(request, bearerFrom(request));
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[A-Za-z0-9._:-]{1,128}$/.test(key)) throw new RequestError("Request key required");
    const keys = ["p_tenant", "p_community", "p_property", "p_title", "p_body", "p_expires_at", "p_reason"];
    const args = fields(await readJson(request, 65536), [...keys, "p_publish_at", "p_previous", "p_document"]);
    if (keys.some(key => !Object.hasOwn(args, key))) throw new RequestError("Missing fields");
    uuid(args.p_tenant);
    uuid(args.p_community);
    if (args.p_property !== null) uuid(args.p_property);
    for (const key of ["p_title", "p_body", "p_expires_at", "p_reason"]) {
      if (typeof args[key] !== "string") throw new RequestError("Invalid field");
    }
    if (args.p_previous != null) uuid(args.p_previous);
    if (args.p_document != null) uuid(args.p_document);
    if (args.p_publish_at != null && typeof args.p_publish_at !== "string") throw new RequestError("Invalid publication date");
    const client = await authorizedClient(request);
    const { data, error } = await client.rpc("enclavix_announcement_publish", args).setHeader("Idempotency-Key", key);
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "23505" ? 409
        : /^(22|23)/.test(error.code) ? 400 : 503;
      throw new RequestError("Publish failed", status);
    }
    return reply({ data: { id: data } });
  } catch (error) {
    return failure(error);
  }
}
