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
    const { data, error } = await client.rpc("enclavix_privacy_list", {
      p_tenant: uuid(query.get("tenant")),
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
    const keys = ["p_tenant", "p_kind", "p_detail", "p_request", "p_reason"];
    const args = fields(await readJson(request, 16384), keys);
    if (keys.some(key => !Object.hasOwn(args, key))) throw new RequestError("Missing fields");
    uuid(args.p_tenant);
    if (args.p_request !== null) uuid(args.p_request);
    for (const key of ["p_kind", "p_detail", "p_reason"]) {
      if (args[key] !== null && typeof args[key] !== "string") throw new RequestError("Invalid field");
    }
    const client = await authorizedClient(request);
    const { data, error } = await client.rpc("enclavix_privacy_write", args).setHeader("Idempotency-Key", key);
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "23505" ? 409
        : /^(22|23)/.test(error.code) ? 400 : 503;
      throw new RequestError("Privacy request failed", status);
    }
    return reply({ data: { id: data } });
  } catch (error) {
    return failure(error);
  }
}
