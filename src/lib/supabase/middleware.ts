import { type NextRequest, NextResponse } from "next/server";
import { isDemoModeAllowedServer } from "../env.server";

const PUBLIC_PATHS = new Set(["/", "/login", "/about", "/robots.txt", "/favicon.ico"]);
const ROLES = new Set(["SUPER_ADMIN", "TREASURER", "GUARD", "RESIDENT"]);

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Production identity and durable workflows arrive in S02+. Never expose mocks to real users.
  if (!isDemoModeAllowedServer()) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "production_not_enabled");
    return NextResponse.redirect(url);
  }
  const role = request.cookies.get("demo_user_role")?.value;
  if (!role || !ROLES.has(role)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  const allowed = (pathname === "/admin" || pathname.startsWith("/admin/"))
    ? role === "SUPER_ADMIN" || role === "TREASURER"
    : (pathname === "/guard" || pathname.startsWith("/guard/"))
      ? role === "GUARD" || role === "SUPER_ADMIN"
      : (pathname === "/resident" || pathname.startsWith("/resident/"))
        ? role === "RESIDENT" || role === "SUPER_ADMIN" : false;
  if (allowed) return NextResponse.next();
  const home = role === "SUPER_ADMIN" || role === "TREASURER" ? "/admin" : role === "GUARD" ? "/guard" : "/resident";
  return NextResponse.redirect(new URL(home, request.url));
}
