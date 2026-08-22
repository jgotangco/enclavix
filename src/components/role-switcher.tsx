"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  BadgeDollarSign, 
  UserCheck, 
  ShieldCheck, 
  ChevronDown, 
  Check, 
  UserCog,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/database";

interface RoleOption {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  route: string;
  icon: any;
  color: string;
}

const ROLES: RoleOption[] = [
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    name: "Carlos Valdez",
    email: "admin@enclavehoa.com",
    route: "/admin",
    icon: Building2,
    color: "bg-emerald-600",
  },
  {
    role: "TREASURER",
    label: "Treasurer",
    name: "Ma. Elena Cruz",
    email: "treasurer@enclavehoa.com",
    route: "/admin/billing",
    icon: BadgeDollarSign,
    color: "bg-teal-600",
  },
  {
    role: "RESIDENT",
    label: "Resident (Blk 2 Lot 1)",
    name: "Juan Dela Cruz",
    email: "resident@enclavehoa.com",
    route: "/resident",
    icon: UserCheck,
    color: "bg-sky-600",
  },
  {
    role: "GUARD",
    label: "Gate Security Guard",
    name: "Rodrigo Bautista",
    email: "guard@enclavehoa.com",
    route: "/guard",
    icon: ShieldCheck,
    color: "bg-amber-600",
  },
];

export function RoleSwitcher({ currentRole }: { currentRole?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectRole = (option: RoleOption) => {
    document.cookie = `demo_user_role=${option.role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `demo_user_name=${encodeURIComponent(option.name)}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `demo_user_email=${encodeURIComponent(option.email)}; path=/; max-age=86400; SameSite=Lax`;

    setIsOpen(false);
    router.push(option.route);
    router.refresh();
  };

  const handleLogout = () => {
    document.cookie = "demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "demo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs font-semibold flex items-center gap-1.5 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-xs"
      >
        <UserCog className="w-3.5 h-3.5 text-emerald-700" />
        <span>Switch Persona</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </Button>

      {isOpen && (\n        <>\n          <div className=\"fixed inset-0 z-40\" onClick={() => setIsOpen(false)} />\n          <div className=\"absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/5 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95\">\n            <div className=\"px-3 py-2\">\n              <span className=\"text-[10px] font-bold text-slate-400 uppercase tracking-wider block\">\n                1-Click Role Switcher\n              </span>\n              <p className=\"text-xs text-slate-500\">Select any persona to test its dedicated portal:</p>\n            </div>\n\n            <div className=\"py-1 space-y-1\">\n              {ROLES.map((r) => {\n                const Icon = r.icon;\n                const isCurrent = currentRole === r.role;\n\n                return (\n                  <button\n                    key={r.role}\n                    onClick={() => handleSelectRole(r)}\n                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${\n                      isCurrent\n                        ? \"bg-emerald-50 text-emerald-900 font-semibold\"\n                        : \"hover:bg-slate-100 text-slate-700\"\n                    }`}\n                  >\n                    <div className=\"flex items-center gap-2.5\">\n                      <div className={`w-7 h-7 rounded-lg ${r.color} text-white flex items-center justify-center font-bold text-xs`}>\n                        <Icon className=\"w-4 h-4\" />\n                      </div>\n                      <div>\n                        <div className=\"font-semibold text-slate-900 leading-tight\">{r.name}</div>\n                        <div className=\"text-[11px] text-slate-500\">{r.label}</div>\n                      </div>\n                    </div>\n                    {isCurrent && <Check className=\"w-4 h-4 text-emerald-700\" />}\n                  </button>\n                );\n              })}\n            </div>\n\n            <div className=\"pt-1\">\n              <button\n                onClick={handleLogout}\n                className=\"w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors\"\n              >\n                <LogOut className=\"w-3.5 h-3.5\" />\n                <span>Go to Login Screen</span>\n              </button>\n            </div>\n          </div>\n        </>\n      )}\n    </div>\n  );\n}\n