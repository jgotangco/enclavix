"use client";

import { useState } from "react";
import { 
  KeyRound, 
  Plus, 
  QrCode, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Car, 
  User, 
  X,
  Send,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { INITIAL_VISITOR_PASSES } from "@/lib/data/mock-data";
import { VisitorPass } from "@/types/database";
import { formatDateTime } from "@/lib/utils";
import { useCommunitySettings } from "@/lib/context/community-settings";

export default function ResidentVisitorsPage() {
  const { settings } = useCommunitySettings();
  const myPropertyId = "b2000000-0000-0000-0000-000000000001"; // Block 2 Lot 1
  const [passes, setPasses] = useState<VisitorPass[]>(
    INITIAL_VISITOR_PASSES.filter((p) => p.property_id === myPropertyId)
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSharePass, setActiveSharePass] = useState<VisitorPass | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [visitorName, setVisitorName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [arrivalDate, setArrivalDate] = useState("2026-08-28T14:00");
  const [validHours, setValidHours] = useState(6);

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();

    const code = `MR-${Math.floor(1000 + Math.random() * 9000)}`;
    const arrival = new Date(arrivalDate).toISOString();
    const validUntil = new Date(new Date(arrivalDate).getTime() + validHours * 60 * 60 * 1000).toISOString();

    const newPass: VisitorPass = {
      id: `30000000-0000-0000-0000-${String(passes.length + 30).padStart(12, "0")}`,
      property_id: myPropertyId,
      visitor_name: visitorName.trim(),
      plate_number: plateNumber.toUpperCase().trim() || null,
      expected_arrival: arrival,
      valid_until: validUntil,
      pass_code: code,
      status: "ACTIVE",
      checked_in_at: null,
      checked_out_at: null,
      checked_by_guard_id: null,
      created_at: new Date().toISOString(),
    };

    setPasses([newPass, ...passes]);
    setIsAddModalOpen(false);
    setActiveSharePass(newPass);
    setSuccessMessage(`Visitor Pass ${code} created successfully! Share the pass code or QR with your guest.`);
    setVisitorName("");
    setPlateNumber("");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const getShareText = (p: VisitorPass) => {
    return `Hello ${p.visitor_name}! Here is your entry pass for ${settings.villageName} (inside ${settings.motherVillageName}):\n\n🔑 Pass Code: ${p.pass_code}\n🏡 Destination: Block 2, Lot 1\n⏰ Valid: ${formatDateTime(p.expected_arrival)}\n\nPlease present this code or QR at the security gate.`;
  };

  const handleCopyLink = (p: VisitorPass) => {
    navigator.clipboard.writeText(getShareText(p));
    setCopiedNotification(`Pass details copied to clipboard! Ready to paste into WhatsApp, Viber, or SMS.`);
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-emerald-700" />
            Visitor Passes & Gate QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block 2, Lot 1 • Generate dual-gate security clearance for guests, deliveries, and service contractors.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Visitor Pass
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {copiedNotification && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Share2 className="w-4 h-4 text-sky-600 shrink-0" />
          {copiedNotification}
        </div>
      )}

      {/* Active Passes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {passes.map((pass) => (
          <Card key={pass.id} className="border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="font-mono font-bold tracking-widest text-xs px-2.5 py-0.5 bg-slate-900 text-white">
                    {pass.pass_code}
                  </Badge>
                  <Badge variant={pass.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                    {pass.status === "ACTIVE" ? "Active / Expected" : pass.status}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(pass)}
                  className="h-7 text-xs flex items-center gap-1 text-emerald-700 hover:bg-emerald-50"
                >
                  <Copy className="w-3 h-3" /> Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">{pass.visitor_name}</h3>
                  <p className="text-xs text-slate-600">Plate: <strong>{pass.plate_number || "Walk-In"}</strong></p>
                  <div className="text-xs text-slate-500 pt-1">
                    <span className="block font-medium">Valid Arrival: {formatDateTime(pass.expected_arrival)}</span>
                    <span className="text-[11px] text-slate-400">Valid Until: {formatDateTime(pass.valid_until)}</span>
                  </div>
                </div>
                <div
                  onClick={() => setActiveSharePass(pass)}
                  className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-xs cursor-pointer hover:border-emerald-500 transition-colors shrink-0"
                >
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Dual-Gate Clearance
                </span>
                <button
                  onClick={() => setActiveSharePass(pass)}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  View Large QR Pass →
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dual Gate Advisory */}
      <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Dual-Gate Enclave Clearance Advisory
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1.5 text-emerald-900 leading-relaxed">
          <p>
            {settings.villageName} is located within the greater <strong>{settings.motherVillageName}</strong>. Guests must present this pass at the {settings.motherVillageName} perimeter gate, then proceed to the {settings.villageName} boom barrier where security scans the code.
          </p>
        </CardContent>
      </Card>

      {/* Large QR Share Modal */}
      {activeSharePass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white shadow-2xl border-slate-200 overflow-hidden text-center">
            <CardHeader className="bg-slate-900 text-white pb-3 flex flex-row items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Official Gate Pass</span>
                <CardTitle className="text-base font-bold text-white">{settings.villageName}</CardTitle>
              </div>
              <button onClick={() => setActiveSharePass(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Badge variant="default" className="text-base font-mono font-black tracking-widest px-4 py-1 bg-emerald-700 text-white">
                  {activeSharePass.pass_code}
                </Badge>
                <h3 className="font-bold text-slate-900 text-base pt-2">{activeSharePass.visitor_name}</h3>
                <p className="text-xs text-slate-500">Destination: Block 2, Lot 1 (Juan Dela Cruz)</p>
              </div>

              {/* Large QR */}
              <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-center shadow-inner">
                <QrCode className="w-full h-full text-slate-900" />
              </div>

              <div className="text-[11px] text-slate-500">
                Valid: {formatDateTime(activeSharePass.expected_arrival)} to {formatDateTime(activeSharePass.valid_until)}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={() => handleCopyLink(activeSharePass)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share to WhatsApp / Viber / SMS
                </Button>
                <Button variant="outline" onClick={() => setActiveSharePass(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-400" />
                  Generate New Visitor Pass
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Unit: Block 2, Lot 1
                </CardDescription>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreatePass} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Visitor / Contractor / Courier Name</label>
                <Input
                  placeholder="e.g. Maria Santos (Visitor) / Shopee Delivery"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Vehicle License Plate (Optional)</label>
                <Input
                  placeholder="e.g. NBD 1234 (Leave blank if walk-in)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Expected Arrival</label>
                  <Input
                    type="datetime-local"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Validity Window</label>
                  <select
                    value={validHours}
                    onChange={(e) => setValidHours(parseInt(e.target.value))}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value={2}>2 Hours (Delivery / Drop-off)</option>
                    <option value={6}>6 Hours (Standard Visit)</option>
                    <option value={12}>12 Hours (Half-Day Contractor)</option>
                    <option value={24}>24 Hours (Full Day Event)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                  Generate Code & QR Pass
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
