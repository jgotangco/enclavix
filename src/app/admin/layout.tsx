"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  Home, 
  Car, 
  Dog, 
  AlertTriangle, 
  Receipt, 
  Calendar, 
  KeyRound, 
  LifeBuoy, 
  Megaphone, 
  Settings, 
  Users,
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { UserProfileModal } from "@/components/user-profile-modal";
import { useCommunitySettings } from "@/lib/context/community-settings";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: Home },
  { label: "150 Lots Master", href: "/admin/properties", icon: Building2 },
  { label: "User Accounts & Roles", href: "/admin/users", icon: Users },
  { label: "Vehicles & Parking", href: "/admin/vehicles", icon: Car },
  { label: "Domestic Pets", href: "/admin/pets", icon: Dog },
  { label: "Security & Violations", href: "/admin/violations", icon: AlertTriangle },
  { label: "Billing & Invoices", href: "/admin/billing", icon: Receipt },
  { label: "Amenity Bookings", href: "/admin/amenities", icon: Calendar },
  { label: "Visitor Gate Passes", href: "/admin/visitors", icon: KeyRound },
  { label: "Helpdesk Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Community Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useCommunitySettings();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Carlos Valdez");
  const [userRole, setUserRole] = useState("SUPER_ADMIN");
  const [userEmail, setUserEmail] = useState("admin@enclavehoa.com");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    // Read demo cookies or auth state
    const matchName = document.cookie.match(/demo_user_name=([^;]+)/);
    const matchRole = document.cookie.match(/demo_user_role=([^;]+)/);
    const matchEmail = document.cookie.match(/demo_user_email=([^;]+)/);
    if (matchName) setUserName(decodeURIComponent(matchName[1]));
    if (matchRole) setUserRole(decodeURIComponent(matchRole[1]));
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
    <div className="min-h-screen flex bg-slate-100/70">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              {settings.villageName.substring(0, 1) || "E"}
            </div>
            <div className="truncate">
              <span className="font-bold text-white tracking-tight text-xs block leading-tight truncate">
                {settings.villageName}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            HOA Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-emerald-200"
                        : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
              </Link>
            );
          })}
        </div>

        {/* About Enclavix Link */}
        <div className="px-4 py-2 border-t border-slate-800">
          <Link
            href="/about"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors py-1 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>About Enclavix v2.0</span>
          </Link>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="p-2.5 rounded-lg bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar className="w-8 h-8 border border-emerald-500/30">
                <AvatarFallback className="bg-emerald-900 text-emerald-200 text-xs font-bold">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {userName}
                </p>
                <Badge variant="default" className="text-[9px] px-1.5 py-0 mt-0.5 bg-emerald-500/20 text-emerald-300 border-none">
                  {userRole}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors rounded-md hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-900 font-semibold">{settings.villageName}</span>
              <span>/</span>
              <span>Administration</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              150 Lots Live
            </div>

            <ThemeCustomizer />

            {/* Profile Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left"
              title="Edit Profile & Password"
            >
              <Avatar className="w-7 h-7 border border-emerald-600">
                <AvatarFallback className="bg-slate-900 text-white text-[11px] font-bold">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                  <span>{userName}</span>
                </div>
                <div className="text-[10px] text-slate-400">Admin Account</div>
              </div>
            </button>

            {/* Prominent Red Sign Out Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="h-8 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200 bg-rose-50/60 flex items-center gap-1 shadow-xs transition-colors shrink-0"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* User Profile & Password Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          initialName={userName}
          initialEmail={userEmail}
          initialRole={userRole}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
