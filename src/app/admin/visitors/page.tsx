"use client";

import { useState } from "react";
import { 
  KeyRound, 
  Search, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Car, 
  UserCheck,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { INITIAL_VISITOR_PASSES, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { VisitorPass } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

export default function AdminVisitorsPage() {
  const [passes] = useState<VisitorPass[]>(INITIAL_VISITOR_PASSES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const filteredPasses = passes.filter((p) => {
    const prop = INITIAL_PROPERTIES.find((prop) => prop.id === p.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      p.pass_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.plate_number && p.plate_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Active / Expected</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Inside Enclave</Badge>;
      case "CHECKED_OUT":
        return <Badge variant="secondary">Checked Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <KeyRound className="w-7 h-7 text-emerald-700" />
          Visitor Passes & Gate Access Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Master access log for all guest, delivery, and contractor passes across dual-gate enclave security.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Passes Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{passes.length} Passes</div>
            <p className="text-xs text-slate-500 mt-1">For current month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-emerald-50/40 border-emerald-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Currently Inside Enclave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {passes.filter((p) => p.status === "CHECKED_IN").length} Visitors
            </div>
            <p className="text-xs text-emerald-700 mt-1">Checked in at Gate 1</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-amber-50/40 border-amber-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Expected Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {passes.filter((p) => p.status === "ACTIVE").length} Guests
            </div>
            <p className="text-xs text-amber-700 mt-1">Pending arrival</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search pass code (MR-XXXX), visitor name, plate, or Block/Lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs"
              >
                <option value="ALL">All Gate Statuses</option>
                <option value="ACTIVE">Active / Expected</option>
                <option value="CHECKED_IN">Inside Enclave (Checked-In)</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-xs">Pass Code</TableHead>
                <TableHead className="font-bold text-xs">Visitor / Guest</TableHead>
                <TableHead className="font-bold text-xs">Destination Lot</TableHead>
                <TableHead className="font-bold text-xs">Plate No.</TableHead>
                <TableHead className="font-bold text-xs">Arrival Window</TableHead>
                <TableHead className="font-bold text-xs">Gate Check-In / Out</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No visitor passes found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPasses.map((p) => {
                  const prop = INITIAL_PROPERTIES.find((prop) => prop.id === p.property_id);

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-slate-900">
                        {p.pass_code}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {p.visitor_name}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {p.plate_number || "Walk-In"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDateTime(p.expected_arrival)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {p.checked_in_at ? (
                          <span>In: {formatDateTime(p.checked_in_at)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {p.checked_out_at && (
                          <span className="block text-[10px] text-slate-400">Out: {formatDateTime(p.checked_out_at)}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
