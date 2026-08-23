"use client";

import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Car, 
  Receipt, 
  Dog, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Server, 
  Layers, 
  Zap, 
  KeyRound, 
  Palette, 
  Smartphone,
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Award,
  Code,
  ExternalLink,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCommunitySettings } from "@/lib/context/community-settings";
import { ThemeCustomizer } from "@/components/theme-customizer";

export default function AboutPage() {
  const { settings } = useCommunitySettings();

  const CORE_MODULES = [
    {
      icon: ShieldCheck,
      title: "Dual-Tier Gate Access & RFID Barrier Clearance",
      description: "Fast gate security scanner for boom barrier activation. Manages RFID tags, 6-digit visitor QR pass codes, delivery check-ins, and automated guard kiosk logging.",
      badge: "Security Kiosk",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300"
    },
    {
      icon: Car,
      title: "Smart Parking & Curbside Allowance Matrix",
      description: "Rigorous enforcement of property parking quotas (garage capacity + 1 curbside parallel elevated parking rule). Tracks vehicle types, license plates, and LTO OR/CR compliance.",
      badge: "Quota Enforced",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300"
    },
    {
      icon: Receipt,
      title: "Automated Dues Engine & GCash Audit",
      description: "Formula-driven billing: (Lot Area × Rate/m²) + Base HOA Fee + Mother Village Passthrough. Complete GCash and bank transfer slip verification with instant receipt generation.",
      badge: "Treasury Suite",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300"
    },
    {
      icon: Dog,
      title: "Domestic Pet Registry & Rabies Compliance",
      description: "Mandatory domesticated pet registration with annual anti-rabies vaccination expiry tracking, breed cataloging, and pet ID tags to ensure community safety.",
      badge: "Health & Safety",
      badgeColor: "bg-teal-100 text-teal-900 border-teal-300"
    },
    {
      icon: Users,
      title: "Dual-Tier Role & Officer Designation Engine",
      description: "Total separation between System Access Permissions (Super Admin, Treasurer, Guard, Resident) and Civic Officer Positions (HOA President, Secretary, Board Member, Staff).",
      badge: "Governance",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300"
    },
    {
      icon: Palette,
      title: "Real-Time Persona Theme Engine",
      description: "Instant CSS DOM transformation tailored for distinct operational contexts: Executive Emerald, Treasury Gold, Ocean Azure, Tactical Obsidian, and Midnight Modern dark mode.",
      badge: "UI / UX",
      badgeColor: "bg-pink-100 text-pink-900 border-pink-300"
    }
  ];

  const TECH_STACK = [
    { name: "Next.js 14", desc: "App Router, Server Components & Dynamic Edge Routes", icon: Zap },
    { name: "TypeScript 5", desc: "End-to-end static type safety for database models and APIs", icon: Layers },
    { name: "Tailwind CSS", desc: "Responsive utility styling with instant CSS variable theme switching", icon: Palette },
    { name: "Supabase / PostgreSQL", desc: "Row-Level Security (RLS) and relational schema design", icon: Database },
    { name: "Google Cloud Run Ready", desc: "Production containerized deployment with multi-stage Docker builds", icon: Server },
    { name: "Lucide Icons", desc: "Consistent iconography across all responsive dashboards", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md font-black text-xl tracking-tighter">
                E
              </div>
              <div>
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                  Enclavix
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  HOA & Enclave Operating System v2.0
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeCustomizer />
            <Link href="/login">
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 flex items-center gap-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="flex-1">
        <section className="relative py-16 sm:py-20 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold border border-emerald-700/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Next-Generation Residential Community Governance
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                About <span className="text-emerald-400">Enclavix</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                <strong>Enclavix</strong> is the premier, all-in-one operating platform engineered specifically for boutique gated residential communities, townhouse enclaves, and homeowners associations.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 shadow-lg shadow-emerald-950">
                    Launch Demo Portal <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-11 px-6 font-semibold">
                    View Live Community
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Enclavix / Mission */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 font-bold text-xs">
                Built for High-Trust Residential Living
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                Eliminating Community Friction from Gate to Boardroom
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Traditional HOA systems are either clunky spreadsheets or generic property management tools that fail to handle the nuanced real-world rules of boutique subdivisions: road obstructions from parallel street parking, unvaccinated pets roaming common areas, disputes over dues computations, and cumbersome paper visitor logbooks.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>Enclavix</strong> solves this by integrating every stakeholder—Homeowners, Board Officers, Treasury, and Front Gate Security Guards—into a synchronized, transparent digital ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200 bg-white p-5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">150 Lots</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Scalable Master Registry & Address Mapping</p>
              </Card>

              <Card className="border-slate-200 bg-white p-5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">100%</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Formula-driven automated dues transparency</p>
              </Card>

              <Card className="border-slate-200 bg-white p-5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
                  <Car className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">1-Curb</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Strict roadway clearance & vehicle quota rule</p>
              </Card>

              <Card className="border-slate-200 bg-white p-5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">&lt; 3 Sec</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Instant RFID scan & visitor pass lookup</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Architecture & Features */}
        <section className="py-14 bg-slate-100/70 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-2">
              <Badge className="bg-slate-900 text-white font-bold text-xs">Full Capabilities Suite</Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Architectural Pillars of Enclavix
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                Engineered for speed, strict compliance, and intuitive ease of use across all devices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CORE_MODULES.map((module, i) => {
                const Icon = module.icon;
                return (
                  <Card key={i} className="border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold ${module.badgeColor}`}>
                          {module.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {module.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {module.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <Badge variant="outline" className="text-slate-700 border-slate-300 font-bold text-xs">
              Modern Cloud-Native Foundation
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Enterprise Technology Stack
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Built on production-grade web technologies for zero latency and containerized Cloud Run deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_STACK.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{tech.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tech.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Lead Architect & Developer Section */}
        <section className="py-14 bg-gradient-to-b from-slate-100/60 to-white border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-emerald-200/80 bg-white shadow-md overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600"></div>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 text-white border-2 border-emerald-500 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0">
                    JG
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-[11px] font-bold border border-emerald-300">
                      <Code className="w-3.5 h-3.5 text-emerald-700" />
                      Lead Developer & Software Architect
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Jerome Gotangco
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Creator and lead software engineer of <strong>Enclavix</strong>. Architected the platform end-to-end to deliver high-trust community governance, formula-based accounting automation, dual-tier gate security, and seamless multi-persona role switching for modern residential enclaves.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Open Source Community Project • Released under MIT License</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/jgotangco"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>GitHub: @jgotangco</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                    <a
                      href="https://github.com/jgotangco/enclavix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors"
                    >
                      <span>Repository</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 bg-slate-900 text-white border-t border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-2xl text-white mx-auto shadow-lg">
              E
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Experience the Future of Community Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Explore live role portals for Administrators, Finance Officers, Homeowners, and Security Guards.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-md">
                  Go to Login Portal <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-sm">Enclavix</span>
            <span>•</span>
            <span>Version 2.0.0 (Cloud Run Ready)</span>
            <span>•</span>
            <span>Architected by <a href="https://github.com/jgotangco" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-700 hover:text-emerald-700 underline">Jerome Gotangco</a></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">Home</Link>
            <Link href="/about" className="text-emerald-700 font-bold">About</Link>
            <a href="https://github.com/jgotangco" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 transition-colors font-medium">GitHub</a>
            <Link href="/login" className="hover:text-emerald-700 transition-colors font-medium">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
