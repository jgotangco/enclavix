import { requestOrigin } from "@/lib/auth/request";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && code.length < 2048) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/account", requestOrigin(request)), { headers: { "Cache-Control": "no-store" } });
    } catch { /* Invalid or unavailable provider fails closed. */ }
  }
  return NextResponse.redirect(new URL("/login?error=invalid_callback", requestOrigin(request)), { headers: { "Cache-Control": "no-store" } });
}
