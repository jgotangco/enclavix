import Link from "next/link";
import { 
  Receipt, 
  Car, 
  Dog, 
  KeyRound, 
  Calendar, 
  ShieldCheck, 
  Upload, 
  QrCode, 
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function ResidentDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            Homeowner Unit: Block 2, Lot 1
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome Home, Juan Dela Cruz
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Your unit is allocated with 2 Garage Slots + 1 Curbside Parallel Slot. All anti-rabies pet vaccinations are currently up to date.
          </p>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Dues Card */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                Current Statement
              </CardTitle>
              <Badge variant="warning" className="text-[10px]">Unpaid</Badge>
            </div>
            <CardDescription className="text-xs">
              September 2026 Monthly Dues Statement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Lot Area (260 m² × ₱25):</span>
                <span className="font-semibold text-slate-900">₱6,500.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Base Maintenance Fee:</span>
                <span className="font-semibold text-slate-900">₱500.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Mother Subdivision Dues:</span>
                <span className="font-semibold text-slate-900">₱300.00</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Due (Due Sept 15):</span>
                <span className="text-emerald-700">{formatCurrency(7300)}</span>
              </div>
            </div>

            <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload GCash / Bank Slip
            </Button>
          </CardContent>
        </Card>

        {/* Vehicles & Curbside Allowance */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-700" />
                Vehicles & Parking
              </CardTitle>
              <Badge variant="default" className="text-[10px]">Compliant</Badge>
            </div>
            <CardDescription className="text-xs">
              2 Registered Vehicles (1 Garage + 1 Curbside)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">NDX 4821 • Fortuner (Black)</div>
                  <div className="text-[10px] text-slate-500">RFID: RFID-MR-00124</div>
                </div>
                <Badge variant="secondary" className="text-[10px]">In Garage</Badge>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">ABC 9988 • Civic (White)</div>
                  <div className="text-[10px] text-slate-500">RFID: RFID-MR-00125</div>
                </div>
                <Badge variant="default" className="text-[10px] bg-emerald-100 text-emerald-800">
                  Curb Parallel (1/1)
                </Badge>
              </div>
            </div>

            <Link href="/resident/vehicles" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs hover:border-emerald-600">
                Manage Registered Vehicles
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Domestic Pets Hub */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Dog className="w-4 h-4 text-amber-700" />
                Domestic Pets Registry
              </CardTitle>
              <Badge variant="default" className="text-[10px]">Vaccinated</Badge>
            </div>
            <CardDescription className="text-xs">
              Anti-rabies tracking & Poop-Scoop policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">Mochi (Golden Retriever)</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Rabies valid until Nov 30, 2026</div>
                </div>
                <Badge variant="default" className="text-[10px]">Dog</Badge>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">Luna (British Shorthair)</div>
                  <div className="text-[10px] text-amber-700 font-medium">Rabies renewal: Sept 15, 2026</div>
                </div>
                <Badge variant="secondary" className="text-[10px]">Cat</Badge>
              </div>
            </div>

            <Link href="/resident/pets" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs hover:border-emerald-600">
                Upload New Vaccine Card
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Visitor QR Pass & Quick Amenity Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Visitor Pass */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Active Visitor Gate Pass
              </CardTitle>
              <CardDescription className="text-xs">
                Valid for Dual-Gate security clearance
              </CardDescription>
            </div>
            <Link href="/resident/visitors" className="text-xs font-semibold text-emerald-700 hover:underline">
              Create New Pass
            </Link>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Badge variant="default" className="text-xs font-mono font-bold tracking-widest px-2.5 py-0.5">
                    PASS: MR-8921
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-800">Active</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">Ricardo Morales (Catering Crew)</div>
                <p className="text-xs text-slate-500">Plate: NBI 5543 • Friday, Aug 28 (12:00 PM - 9:00 PM)</p>
              </div>
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 shadow-xs shrink-0">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenity Booking Quick Status */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Clubhouse & Pool Bookings
              </CardTitle>
              <CardDescription className="text-xs">
                Your upcoming reservation schedule
              </CardDescription>
            </div>
            <Link href="/resident/amenities" className="text-xs font-semibold text-emerald-700 hover:underline">
              Book Facility
            </Link>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="text-xs">Multifunction Hall</Badge>
                <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">Confirmed</Badge>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                Friday, August 28, 2026 (2:00 PM - 7:00 PM)
              </div>
              <p className="text-xs text-slate-600">
                Purpose: Daughter 7th Birthday Celebration (25 Guests) • Deposit Paid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
