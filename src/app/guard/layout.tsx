"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Search, 
  KeyRound, 
  AlertTriangle, 
  Users, 
  User,
  LogOut, 
  Radio, 
  Menu, 
  X,
  ScanLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { UserProfileModal } from "@/components/user-profile-modal";
import { useCommunitySettings } from "@/lib/context/community-settings";

const GUARD_NAV = [
  { label: "Plate & Pass Lookup", href: "/guard", icon: Search },
  { label: "Visitor Check-In", href: "/guard/visitors", icon: KeyRound },
  { label: "Log Violation", href: "/guard/violations", icon: AlertTriangle },
  { label: "Resident Directory", href: "/guard/directory", icon: Users },
];

export default function GuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useCommunitySettings();
  const pathname = usePathname();
  const router = useRouter();
  const [guardName, setGuardName] = useState("Rodrigo Bautista");
  const [guardEmail, setGuardEmail] = useState("guard@enclavehoa.com");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const matchName = document.cookie.match(/demo_user_name=([^;]+)/);
    const matchEmail = document.cookie.match(/demo_user_email=([^;]+)/);
    if (matchName) setGuardName(decodeURIComponent(matchName[1]));
    if (matchEmail) setGuardEmail(decodeURIComponent(matchEmail[1]));
  }, []);

  const handleSignOut = () => {
    document.cookie = "demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Guard Kiosk Header */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  {settings.villageName} Security Kiosk
                </span>
                <Badge variant="warning" className="text-[10px] bg-amber-500 text-slate-950 font-bold">
                  GATE 1
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {settings.motherVillageName} & {settings.villageName} Barrier Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs transition-colors text-left"
              title="Edit Profile & Password"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300">Duty Guard:</span>
              <span className="font-bold text-white">{guardName}</span>
            </button>

            <ThemeCustomizer />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(true)}
              className="h-8 text-xs font-medium bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-1"
              title="Profile & Password"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Profile</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="h-8 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/80 border-rose-800/80 bg-rose-950/40 flex items-center gap-1 shadow-xs transition-colors shrink-0"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* User Profile & Password Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          initialName={guardName}
          initialEmail={guardEmail}
          initialRole="GUARD"
        />

        {/* High-Contrast Touch Navigation Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
          {GUARD_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/guard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md scale-[1.02]"
                    : "bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Guard Workstation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
