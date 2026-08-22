import Link from "next/link";
import { 
  Building2, 
  Car, 
  Dog, 
  AlertTriangle, 
  Receipt, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master operations monitor for 150 Planned Enclave Lots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/billing">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs">
              <Receipt className="w-4 h-4" />
              Generate Monthly Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Lots Status */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enclave Lots
            </CardTitle>
            <Building2 className="w-4 h-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">99 / 99</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">92 Owner Occupied</span> • 6 Tenanted
            </p>
          </CardContent>
        </Card>

        {/* Curbside Parking Quota */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Curbside Vehicles
            </CardTitle>
            <Car className="w-4 h-4 text-sky-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">38 Active</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Badge variant="default" className="text-[10px] px-1.5 py-0">1-Curb Max</Badge>
              <span>100% Policy Adherence</span>
            </p>
          </CardContent>
        </Card>

        {/* Domestic Pets Registry */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Pets
            </CardTitle>
            <Dog className="w-4 h-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">47 Domestic</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">44 Rabies Valid</span> • 3 Due Soon
            </p>
          </CardContent>
        </Card>

        {/* Monthly Dues Collection */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              August 2026 Dues
            </CardTitle>
            <Receipt className="w-4 h-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">89.4%</div>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(542800)} collected of {formatCurrency(607200)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals & Security Compliance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Pending Invoices & Upcoming Amenity Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Invoices for Verification */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Pending Dues Payments for Verification
                </CardTitle>
                <CardDescription className="text-xs">
                  GCash and bank transfer receipts uploaded by homeowners
                </CardDescription>
              </div>
              <Link href="/admin/billing" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">Block 1, Lot 3</span>
                      <Badge variant="warning" className="text-[10px]">Verification Needed</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      August 2026 Statement (180 m² + Curb parking fine) • Ref: GCash-991823
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">{formatCurrency(5800)}</div>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 mt-1">
                      Review Slip
                    </Button>
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">Block 4, Lot 1</span>
                      <Badge variant="warning" className="text-[10px]">Verification Needed</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      August 2026 Statement (215 m²) • BDO Online Transfer
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">{formatCurrency(6175)}</div>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 mt-1">
                      Review Slip
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Amenity Reservations */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Clubhouse & Pool Reservations
                </CardTitle>
                <CardDescription className="text-xs">
                  Scheduled bookings for community amenities
                </CardDescription>
              </div>
              <Link href="/admin/reservations" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                Calendar View <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-[10px]">Multifunction Hall</Badge>
                      <span className="text-xs font-semibold text-slate-900">Block 2 Lot 1 • Juan Dela Cruz</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Friday, Aug 28, 2026 (2:00 PM - 7:00 PM) • 25 Guests
                    </p>
                    <p className="text-[11px] text-slate-500">Purpose: Daughter 7th Birthday Party Celebration</p>
                  </div>
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Confirmed
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-[10px]">Swimming Pool</Badge>
                      <span className="text-xs font-semibold text-slate-900">Block 1 Lot 4 • Patricia Reyes</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Sunday, Aug 30, 2026 (9:00 AM - 12:00 PM) • 8 Guests
                    </p>
                    <p className="text-[11px] text-slate-500">Purpose: Family morning swim (Pets strictly prohibited)</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">
                    Pending Deposit
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Recent Violations Logged by Security */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Compliance Patrol
                </CardTitle>
                <CardDescription className="text-xs">
                  Recent parking & pet waste notices
                </CardDescription>
              </div>
              <Link href="/admin/violations" className="text-xs font-semibold text-emerald-700 hover:underline">
                All Logs
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-[10px]">
                    Illegal Curb Parking
                  </Badge>
                  <span className="text-[11px] font-bold text-rose-700">₱500 Fine</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Block 1, Lot 3 • Plate: WXX 1029
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Vehicle was not parked elevated parallel directly above curb, obstructing utility and emergency vehicles.
                </p>
                <div className="text-[10px] text-slate-400">
                  Logged by Guard Rodrigo Bautista • Today
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="warning" className="text-[10px]">
                    Pet Waste Notice
                  </Badge>
                  <span className="text-[11px] font-bold text-amber-700">Warning</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Parkway Green Strip • Block 1 Lot 4 (Kobe)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Waste disposal compliance reminder issued. Camera photo recorded.
                </p>
                <div className="text-[10px] text-slate-400">
                  Logged by Security • 2 days ago
                </div>
              </div>

              <Link href="/admin/violations" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs hover:border-emerald-600 hover:text-emerald-700">
                  Security Log Audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
