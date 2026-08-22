import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Database, UserRole } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Demo / Dev Mode Cookie check: Allows instant local testing without live Supabase cloud auth
  const demoRoleCookie = request.cookies.get("demo_user_role")?.value as UserRole | undefined;

  const pathname = request.nextUrl.pathname;

  // Skip auth check for public assets, static files, login page, and public root
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return response;
  }

  // Handle protected portal routes
  let activeRole: UserRole | null = demoRoleCookie || null;

  if (!activeRole) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = data as { role: UserRole } | null;
    activeRole = profile?.role || "RESIDENT";
  }

  // RBAC Access Evaluation
  if (pathname.startsWith("/admin")) {
    if (activeRole !== "SUPER_ADMIN" && activeRole !== "TREASURER") {
      return redirectByRole(activeRole, request);
    }
  } else if (pathname.startsWith("/guard")) {
    if (activeRole !== "GUARD" && activeRole !== "SUPER_ADMIN") {
      return redirectByRole(activeRole, request);
    }
  } else if (pathname.startsWith("/resident")) {
    if (activeRole !== "RESIDENT" && activeRole !== "SUPER_ADMIN") {
      return redirectByRole(activeRole, request);
    }
  }

  return response;
}

function redirectByRole(role: UserRole, request: NextRequest) {
  const url = request.nextUrl.clone();
  url.searchParams.delete("returnTo");
  if (role === "SUPER_ADMIN" || role === "TREASURER") {
    url.pathname = "/admin";
  } else if (role === "GUARD") {
    url.pathname = "/guard";
  } else {
    url.pathname = "/resident";
  }
  return NextResponse.redirect(url);
}
