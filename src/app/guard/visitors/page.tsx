"use client";

import { useState } from "react";
import { 
  KeyRound, 
  Search, 
  CheckCircle2, 
  LogOut, 
  Clock, 
  UserCheck, 
  QrCode, 
  Plus, 
  Car, 
  MapPin,
  X,
  ShieldCheck,
  Check
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

export default function GuardVisitorsPage() {
  const [passes, setPasses] = useState<VisitorPass[]>(INITIAL_VISITOR_PASSES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isQuickPassModalOpen, setIsQuickPassModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick Pass Form
  const [newPropertyId, setNewPropertyId] = useState(INITIAL_PROPERTIES[0].id);
  const [visitorName, setVisitorName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

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

  const handleCheckIn = (id: string) => {
    const now = new Date().toISOString();
    setPasses(
      passes.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "CHECKED_IN",
              checked_in_at: now,
              checked_by_guard_id: "c0000000-0000-0000-0000-000000000003",
            }
          : p
      )
    );
    const pass = passes.find((p) => p.id === id);
    setNotification(`Gate clearance approved: ${pass?.visitor_name} checked in at Gate 1.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCheckOut = (id: string) => {
    const now = new Date().toISOString();
    setPasses(
      passes.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "CHECKED_OUT",
              checked_out_at: now,
            }
          : p
      )
    );
    const pass = passes.find((p) => p.id === id);
    setNotification(`Departure logged: ${pass?.visitor_name} checked out.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `MR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const newPass: VisitorPass = {
      id: `30000000-0000-0000-0000-${String(passes.length + 10).padStart(12, "0")}`,
      property_id: newPropertyId,
      visitor_name: visitorName.trim(),
      plate_number: plateNumber.toUpperCase().trim() || null,
      expected_arrival: now,
      valid_until: validUntil,
      pass_code: code,
      status: "CHECKED_IN",
      checked_in_at: now,
      checked_out_at: null,
      checked_by_guard_id: "c0000000-0000-0000-0000-000000000003",
      created_at: now,
    };

    setPasses([newPass, ...passes]);
    setIsQuickPassModalOpen(false);
    setNotification(`Direct Gate Entry: Pass ${code} created & checked in.`);
    setVisitorName("");
    setPlateNumber("");
    setTimeout(() => setNotification(null), 4000);
  };

  const getPassBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-amber-500 text-slate-950 font-bold">Active / Expected</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-emerald-500 text-slate-950 font-bold">Inside Enclave</Badge>;
      case "CHECKED_OUT":
        return <Badge variant="secondary" className="bg-slate-800 text-slate-300">Checked Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
            Visitor Gate Clearance & QR Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validates Dual-Gate QR passes for deliveries, guests, and contractors.
          </p>
        </div>

        <Button
          onClick={() => setIsQuickPassModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Issue Gate 1 Walk-In Entry Pass
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Scan / Type 6-Digit Pass Code (e.g. MR-8921), visitor name, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs font-semibold focus-visible:ring-amber-500"
          />
        </div>
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Expected / Active</option>
            <option value="CHECKED_IN">Inside Enclave (Checked-In)</option>
            <option value="CHECKED_OUT">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Passes Table */}
      <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="font-bold text-xs text-slate-400">Pass Code</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Visitor Name</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Plate Number</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Destination Lot</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Time Window</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Status</TableHead>
                <TableHead className="text-right font-bold text-xs text-slate-400">Gate Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPasses.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No visitor passes found for this query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPasses.map((p) => {
                  const prop = INITIAL_PROPERTIES.find((prop) => prop.id === p.property_id);

                  return (
                    <TableRow key={p.id} className="border-slate-800 hover:bg-slate-900/60 transition-colors">
                      <TableCell className="font-mono font-black text-sm text-amber-400">
                        {p.pass_code}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-white">
                        {p.visitor_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {p.plate_number || "Walk-In"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-400">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {formatDateTime(p.expected_arrival)}
                      </TableCell>
                      <TableCell>{getPassBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        {p.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs px-3"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Check In
                          </Button>
                        )}
                        {p.status === "CHECKED_IN" && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckOut(p.id)}
                            className="bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-white font-bold h-8 text-xs px-3 border border-slate-700"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1" /> Check Out
                          </Button>
                        )}
                        {p.status === "CHECKED_OUT" && (
                          <span className="text-xs text-slate-500 font-mono">
                            Out @ {formatDateTime(p.checked_out_at)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Walk-in Pass Modal */}
      {isQuickPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Issue Walk-in / Courier Entry Pass
              </CardTitle>
              <button onClick={() => setIsQuickPassModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleQuickCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Destination Property</label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-white"
                  required
                >
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number} ({p.unit_address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Visitor / Courier Name</label>
                <Input
                  placeholder="e.g. GrabExpress / Shopee Courier"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                  className="text-xs bg-slate-950 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vehicle Plate / Motorcycle (Optional)</label>
                <Input
                  placeholder="e.g. 123-NCR"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="text-xs font-mono uppercase bg-slate-950 border-slate-700 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsQuickPassModalOpen(false)} className="text-xs bg-slate-800 text-white border-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                  Issue Pass & Log In
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
