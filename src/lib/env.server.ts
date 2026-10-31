/** S00 demos use bundled mocks only. Configured backends invalidate demo mode. */
export function hasBackendCredentials(): boolean {
  // Dynamic lookup also sees credentials injected at runtime into a prebuilt demo.
  return ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"].some((name) => Boolean(process.env[name]?.trim()));
}

export function isDemoModeAllowedServer(): boolean {
  return process.env.ENCLAVIX_APP_ENV === "demo" &&
    process.env.NEXT_PUBLIC_APP_ENV === "demo" && !hasBackendCredentials();
}

export function assertApplicationEnvironment(): void {
  const server = process.env.ENCLAVIX_APP_ENV;
  const client = process.env.NEXT_PUBLIC_APP_ENV;
  if (server !== "demo" && server !== "production") {
    throw new Error("ENCLAVIX_APP_ENV must be demo or production");
  }
  if (client !== server) throw new Error("Server and public application modes must agree");
  if (server === "demo" && hasBackendCredentials()) {
    throw new Error("Synthetic demos cannot configure Supabase credentials");
  }
  if (server === "production" && !isSupabaseConfigured()) {
    throw new Error("Production requires valid Supabase URL and public key");
  }
}

export function isSupabaseConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!raw || !key || /dummy|your-supabase|placeholder/i.test(raw + key)) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password &&
      url.pathname === "/" && !url.search && !url.hash;
  } catch { return false; }
}
