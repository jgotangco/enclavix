"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Car, 
  Dog, 
  Receipt, 
  Calendar, 
  KeyRound, 
  LifeBuoy, 
  Megaphone, 
  LogOut, 
  Menu, 
  X, 
  MapPin, 
  ChevronRight,
  Sparkles,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { UserProfileModal } from "@/components/user-profile-modal";
import { useCommunitySettings } from "@/lib/context/community-settings";

const RESIDENT_NAV = [
  { label: "My Home", href: "/resident", icon: Home },
  { label: "Statements & Dues", href: "/resident/billing", icon: Receipt },
  { label: "My Vehicles", href: "/resident/vehicles", icon: Car },
  { label: "Domestic Pets", href: "/resident/pets", icon: Dog },
  { label: "Visitor Passes", href: "/resident/visitors", icon: KeyRound },
  { label: "Book Amenities", href: "/resident/amenities", icon: Calendar },
  { label: "Helpdesk", href: "/resident/tickets", icon: LifeBuoy },
  { label: "Community Feed", href: "/resident/announcements", icon: Megaphone },
];

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useCommunitySettings();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Juan Dela Cruz");
  const [userEmail, setUserEmail] = useState("resident@enclavehoa.com");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const matchName = document.cookie.match(/demo_user_name=([^;]+)/);
    const matchEmail = document.cookie.match(/demo_user_email=([^;]+)/);
    if (matchName) setUserName(decodeURIComponent(matchName[1]));
    if (matchEmail) setUserEmail(decodeURIComponent(matchEmail[1]));
  }, []);

  const handleSignOut = () => {
    document.cookie = "demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      {/* Resident Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Property Lot Badge */}
            <div className="flex items-center gap-3">
              <Link href="/resident" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                  {settings.villageName.substring(0, 1) || "E"}
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-white tracking-tight text-xs block leading-tight truncate max-w-[160px]">
                    {settings.villageName}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase">
                    Resident Portal
                  </span>
                </div>
              </Link>

              {/* Property Identification Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Block 2, Lot 1</span>
                <span className="text-slate-400 hidden md:inline">• 260 m²</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {RESIDENT_NAV.slice(0, 6).map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/resident" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-emerald-700 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors text-left"
                title="Edit My Profile & Password"
              >
                <Avatar className="w-8 h-8 border border-emerald-500/60">
                  <AvatarFallback className="bg-emerald-800 text-emerald-200 text-xs font-bold">
                    {userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{userName}</p>
                  <p className="text-[10px] text-emerald-400">Homeowner • Block 2 Lot 1</p>
                </div>
              </button>

              <ThemeCustomizer />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
                className="h-8 text-xs font-medium bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white hidden md:flex items-center gap-1"
                title="Profile & Password"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile</span>
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

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* User Profile & Password Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          initialName={userName}
          initialEmail={userEmail}
          initialRole="RESIDENT"
        />

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
            {RESIDENT_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/resident" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-emerald-700 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              );
            })}

            {/* Mobile About Link */}
            <div className="pt-2 mt-2 border-t border-slate-800">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800"
              >
                <Sparkles className="w-4 h-4" />
                <span>About Enclavix v2.0</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Resident Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Resident Portal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>{settings.villageName} • Enclavix Resident Portal</div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="hover:text-emerald-700 font-semibold text-slate-700">About Enclavix</Link>
            <span>•</span>
            <Link href="/" className="hover:text-emerald-700">Public Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
