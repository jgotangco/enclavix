import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bearerFrom, checkMutation, fields, readJson, RequestError, uuid } from "@/lib/auth/request";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization", "X-Content-Type-Options": "nosniff" };
function reply(data: unknown, status = 200) { return NextResponse.json(data, { status, headers }); }
function fail(error: unknown) {
    const status = error instanceof RequestError ? error.status : error instanceof SyntaxError ? 400 : 503;
    return reply({ error: { code: ({ 400: "invalid_request", 401: "unauthenticated", 403: "forbidden", 404: "not_found", 409: "conflict", 413: "too_large", 415: "json_required", 503: "unavailable" } as Record<number, string>)[status] || "request_denied" }, request_id: crypto.randomUUID() }, status);
}
function result(value: {
    data: unknown;
    error: unknown;
}) {
    if (value.error) {
        const code = (value.error as {
            code?: string;
        }).code;
        throw new RequestError("Request denied", code === "42501" ? 403 : code === "23505" ? 409 : ["23503", "23514", "23502", "22P02", "22023", "22007", "22008", "22003"].includes(code || "") ? 400 : 503);
    }
    return value.data;
}
async function clientFor(request: Request) {
    const client = await createClient(bearerFrom(request));
    const verified = await client.auth.getUser();
    if (verified.error || !verified.data.user?.email_confirmed_at)
        throw new RequestError("Sign in", 401);
    return client;
}
const commands: Record<string, string[]> = {
    create: ["p_data", "p_reason"], settings: ["p_tenant", "p_data", "p_reason"], submit: ["p_tenant", "p_reason"], activate: ["p_tenant", "p_revision", "p_reason"],
    registry_command: ["p_tenant", "p_action", "p_data", "p_reason"], import_stage: ["p_tenant", "p_kind", "p_rows", "p_reason"],
    import_commit: ["p_tenant", "p_batch", "p_expected_hash", "p_reason"], import_cancel: ["p_tenant", "p_batch", "p_reason"],
    export_create: ["p_tenant", "p_reason"], offboarding: ["p_tenant", "p_export", "p_reason"],
};
export async function POST(request: Request) {
    try {
        checkMutation(request, bearerFrom(request));
        const name = new URL(request.url).pathname.slice("/api/v1/community/".length);
        const keys = commands[name];
        if (!Object.hasOwn(commands, name))
            throw new RequestError("Unknown command", 404);
        const body = fields(await readJson(request, name === "import_stage" ? 1048576 : 8192), keys);
        if (keys.some(k => !Object.hasOwn(body, k)))
            throw new RequestError("Missing fields");
        for (const k of ["p_tenant", "p_batch", "p_export"])
            if (k in body)
                uuid(body[k]);
        const key = request.headers.get("idempotency-key");
        if (!key || !/^[A-Za-z0-9._:-]{1,128}$/.test(key))
            throw new RequestError("Request key required");
        const client = await clientFor(request);
        return reply({ data: result(await client.rpc(`enclavix_s03_${name}`, body).setHeader("Idempotency-Key", key)) });
    }
    catch (error) {
        return fail(error);
    }
}
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.slice("/api/v1/community/".length).split("/");
        const client = await clientFor(request);
        if (path.length === 1 && path[0] === "index")
            return reply({ data: result(await client.rpc("enclavix_s03_index")) });
        if (path.length < 2 || path.length > 3)
            throw new RequestError("Unknown route", 404);
        const [tenant, kind, id] = path;
        const args: Record<string, string> = { p_tenant: uuid(tenant) };
        if (["setup", "registry"].includes(kind) && path.length === 2)
            return reply({ data: result(await client.rpc(`enclavix_s03_${kind}`, args)) });
        const names: Record<string, string> = { property: "p_property", import_view: "p_batch", export: "p_export" };
        if (!Object.hasOwn(names, kind) || !id)
            throw new RequestError("Unknown route", 404);
        args[names[kind]] = uuid(id);
        const data = result(await client.rpc(`enclavix_s03_${kind}`, args));
        if (kind === "export")
            return new Response(JSON.stringify(data, null, 2), { headers: { ...headers, "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="enclavix-registry.json"', "Content-Security-Policy": "sandbox; default-src 'none'" } });
        return reply({ data });
    }
    catch (error) {
        return fail(error);
    }
}
