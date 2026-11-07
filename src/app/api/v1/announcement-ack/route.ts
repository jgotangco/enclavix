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

export async function POST(request: Request) {
  try {
    checkMutation(request, bearerFrom(request));
    const args = fields(await readJson(request, 1024), ["p_tenant", "p_community", "p_announcement"]);
    uuid(args.p_tenant);
    uuid(args.p_community);
    uuid(args.p_announcement);
    const client = await authorizedClient(request);
    const { data, error } = await client.rpc("enclavix_announcement_ack", args);
    if (error) throw new RequestError("Acknowledgment unavailable", error.code === "42501" ? 403 : 503);
    return reply({ data });
  } catch (error) {
    return failure(error);
  }
}
