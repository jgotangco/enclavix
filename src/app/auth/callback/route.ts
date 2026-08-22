import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const profile = data as { role: UserRole } | null;

        if (profile?.role === "SUPER_ADMIN" || profile?.role === "TREASURER") {
          return NextResponse.redirect(`${origin}/admin`);
        } else if (profile?.role === "GUARD") {
          return NextResponse.redirect(`${origin}/guard`);
        } else {
          return NextResponse.redirect(`${origin}/resident`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page or login with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
