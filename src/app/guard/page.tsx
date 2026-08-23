"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Car, 
  KeyRound, 
  Dog, 
  AlertTriangle, 
  QrCode, 
  Scan, 
  Camera, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GuardKioskPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"plate" | "pass">("plate");

  return (
    <div className="space-y-6">
      {/* Search & Verification Kiosk Banner */}
      <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Scan className="w-5 h-5 text-amber-400" />
              Quick Gate Scanner & Entry Clearance
            </h2>
            <p className="text-xs text-slate-400">
              Lookup vehicle plate numbers, RFID tags, or 6-digit visitor pass codes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setActiveTab("plate")}
              className={activeTab === "plate" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-700 text-white"}
            >
              <Car className="w-4 h-4 mr-1.5" /> Plate / RFID
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveTab("pass")}
              className={activeTab === "pass" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-700 text-white"}
            >
              <KeyRound className="w-4 h-4 mr-1.5" /> Visitor Pass Code
            </Button>
          </div>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "plate" ? "Type Plate (e.g. NDX 4821) or RFID..." : "Type Pass Code (e.g. GE-8921)..."}
            className="pl-12 h-12 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-base font-semibold focus-visible:ring-amber-500"
          />
        </div>
      </div>

      {/* Live Verification Results Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resident Vehicle Verification Card */}
        <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Car className="w-4 h-4 text-emerald-400" />
                Verified Resident Vehicle
              </CardTitle>
              <Badge className="bg-emerald-500 text-slate-950 font-bold text-xs">
                CLEAR TO ENTER
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-black text-white font-mono tracking-wider">
                  NDX 4821
                </div>
                <p className="text-xs text-slate-400 font-medium">Toyota Fortuner (Black) • 2026 Sticker</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="bg-slate-800 text-slate-200 text-xs">
                  IN_GARAGE (Slot 1/2)
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Property:</span>
                <span className="font-bold text-emerald-400">Block 2, Lot 1 (260 m²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Owner:</span>
                <span className="font-semibold text-white">Juan Dela Cruz (+63 917 444 5566)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Curbside Allowance Status:</span>
                <span className="text-slate-300">1 Curb vehicle already allocated (ABC 9988)</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Log Boom Barrier Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Visitor Pass Verification Card */}
        <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Active Guest Pass
              </CardTitle>
              <Badge className="bg-amber-500 text-slate-950 font-bold text-xs font-mono">
                CODE: GE-8921
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-extrabold text-white">
                  Ricardo Morales (Catering Crew)
                </div>
                <p className="text-xs text-slate-400 font-medium">Plate: NBI 5543 • Host: Block 2 Lot 1</p>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">
                VALID TODAY
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Valid Window:</span>
                <span className="font-semibold text-white">12:00 PM - 9:00 PM (Aug 28)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subdivision Clearance:</span>
                <span className="text-emerald-400 font-bold">Authorized Dual-Gate Pass</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="text-white">Multifunction Hall Event & Block 2 Lot 1</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Check-In Visitor & Issue Gate Pass
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions: Log Violations & Audit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-950 border-slate-800 text-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              Fast Incident / Violation Logger
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Log illegal street parking or uncollected pet waste with photo proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/guard/violations?type=parking" className="w-full">
                <Button variant="outline" className="w-full justify-center bg-slate-900 border-rose-900/60 text-rose-300 hover:bg-rose-950/40 text-xs font-bold h-11">
                  <Car className="w-4 h-4 mr-1.5" /> Parking Violation
                </Button>
              </Link>
              <Link href="/guard/violations?type=pet" className="w-full">
                <Button variant="outline" className="w-full justify-center bg-slate-900 border-amber-900/60 text-amber-300 hover:bg-amber-950/40 text-xs font-bold h-11">
                  <Dog className="w-4 h-4 mr-1.5" /> Pet Waste Log
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Curb Parking Rule Reminder
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Official Enclave Standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              Each unit is entitled to <strong>one (1) vehicle parallel-parked elevated directly above their carport curb</strong>. Any second vehicle on street or parked flat on asphalt road obstructing utility passage must receive an immediate photo citation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
