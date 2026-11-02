import { exchangeCallback } from "@/lib/auth/callback";
import { requestOrigin } from "@/lib/auth/request";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && code.length < 2048) {
    try {
      const client = await createClient();
      if (await exchangeCallback(client.auth, url)) return NextResponse.redirect(new URL("/account", requestOrigin(request)), { headers: { "Cache-Control": "no-store" } });
    } catch { /* Invalid or unavailable provider fails closed. */ }
  }
  return NextResponse.redirect(new URL("/login?error=invalid_callback", requestOrigin(request)), { headers: { "Cache-Control": "no-store" } });
}
