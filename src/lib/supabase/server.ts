import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured, runtimeEnvironment } from "../env.server";

/** New client per request. No service key or pooled mutable principal. */
export async function createClient(bearer?: string) {
  if (process.env.ENCLAVIX_APP_ENV !== "production" || !isSupabaseConfigured()) {
    throw new Error("Real authentication is unavailable in mock demo mode");
  }
  const url = runtimeEnvironment("NEXT_PUBLIC_SUPABASE_URL")!;
  const key = runtimeEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
  const noCacheFetch: typeof fetch = (input, init) => fetch(input, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (bearer) return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` }, fetch: noCacheFetch },
  });
  const jar = await cookies();
  return createServerClient(url, key, {
    auth: { flowType: "pkce", experimental: { appendPkceFlowIdToRedirects: true } },
    global: { fetch: noCacheFetch },
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => { for (const { name, value, options } of values) jar.set(name, value, options); },
    },
  });
}
