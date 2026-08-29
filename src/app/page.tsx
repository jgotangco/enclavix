"use client";

import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Car, 
  Dog, 
  Receipt, 
  CalendarCheck, 
  ArrowRight,
  Sparkles,
  MapPin,
  LockKeyhole,
  Users,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCommunitySettings } from "@/lib/context/community-settings";
import { ThemeCustomizer } from "@/components/theme-customizer";

export default function HomePage() {
  const { settings } = useCommunitySettings();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              {settings.villageName.substring(0, 1) || "G"}
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                {settings.villageName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {settings.motherVillageName} Sub-Enclave
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors px-2 py-1">
              About Enclavix
            </Link>
            <ThemeCustomizer />
            <Link href="/login">
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm flex items-center gap-2 shadow-xs">
                <LockKeyhole className="w-4 h-4" />
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-16 sm:py-24 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-emerald-50/30 to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-semibold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Boutique Residential Enclave HOA System • 150 Planned Lots
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Modern Management for <span className="text-emerald-700">{settings.villageName}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Integrated community platform governing automated dues computation, curbside parking quotas, domesticated pet vaccination compliance, and dual-gate security clearance.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 shadow-md">
                    Access Portal <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  {settings.enclaveAddress}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Gateway Cards */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Role-Based Portals & Workflows
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Dedicated interfaces designed for community administrators, homeowners, and on-duty security personnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Portal Card */}
            <Card className="hover:shadow-lg transition-all border-slate-200 flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">HOA Administration</CardTitle>
                    <Badge variant="default">Admin / Treasurer</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Comprehensive command center for 150 lots directory, user role management, batch billing, violations review, and facility bookings.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    150 Lots Master Directory & Unit Profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    User Accounts & Role Permissions Changer
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Automated Area Dues & Official Receipts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Community Branding & Settings Panel
                  </li>
                </ul>
                <Link href="/admin" className="block pt-2">
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    Open Admin Console
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Resident Portal Card */}
            <Card className="hover:shadow-lg transition-all border-slate-200 flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Homeowner Portal</CardTitle>
                    <Badge variant="info">Resident</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Self-service hub for unit statements, curbside permits, pet rabies tracking, and visitor QR gate passes.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    Real-time Monthly Dues & GCash Slip Upload
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    2 Garage + 1 Curbside Vehicle Allocation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    Anti-Rabies Card Upload & Expiry Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    Instant WhatsApp & Viber Visitor Gate Passes
                  </li>
                </ul>
                <Link href="/resident" className="block pt-2">
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    Open Resident Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Guardhouse Kiosk Card */}
            <Card className="hover:shadow-lg transition-all border-slate-200 flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Security Station</CardTitle>
                    <Badge variant="warning">Gate 1 Kiosk</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Touch-friendly barrier control workstation for plate searching, visitor QR verification, and photographic violation logging.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Dual-Gate QR & 6-Digit Pass Clearance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Rapid Plate & Resident Directory Lookup
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Photo-Backed Parking & Pet Citations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Walk-in Visitor Entry Slip Generator
                  </li>
                </ul>
                <Link href="/guard" className="block pt-2">
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    Open Security Kiosk
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 {settings.villageName} Homeowners Association, Inc. • Designed and product-directed by <a href="https://github.com/jgotangco" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:text-emerald-700 underline">Jerome Gotangco</a>. Developed with Google Antigravity / Gemini.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-emerald-700 transition-colors font-semibold text-slate-700">About Enclavix</Link>
            <span>•</span>
            <a href="https://github.com/jgotangco/enclavix" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 transition-colors">GitHub Repo</a>
            <span>•</span>
            <span>Cloud Run Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
