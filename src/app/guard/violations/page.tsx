"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  Car, 
  Dog, 
  Camera, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert,
  X,
  FileImage,
  Eye
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
import { INITIAL_VIOLATIONS, INITIAL_PROPERTIES, INITIAL_PETS } from "@/lib/data/mock-data";
import { Violation, ViolationType } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

const VIOLATION_OPTIONS: { type: ViolationType; label: string; group: "PARKING" | "PET" }[] = [
  { type: "NOT_ABOVE_CURB_PARALLEL", label: "Parked on Asphalt (Not Elevated Above Curb)", group: "PARKING" },
  { type: "EXCEEDED_CURB_PARKING", label: "Exceeded 1-Curbside Parallel Allowance", group: "PARKING" },
  { type: "ROAD_OBSTRUCTION", label: "Blocking 2-Way Roadway Clearance", group: "PARKING" },
  { type: "UNCOLLECTED_PET_WASTE", label: "Uncollected Pet Waste (Poop-Scoop Non-compliance)", group: "PET" },
  { type: "OFF_LEASH_PET", label: "Domestic Pet Off-Leash in Common Area", group: "PET" },
  { type: "EXOTIC_OR_NON_DOMESTIC_ANIMAL", label: "Prohibited Non-Domestic / Exotic Animal", group: "PET" },
  { type: "PET_NOISE_DISTURBANCE", label: "Persistent Pet Barking / Noise Disturbance", group: "PET" },
];

export default function GuardViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>(INITIAL_VIOLATIONS);
  const [selectedPropertyId, setSelectedPropertyId] = useState(INITIAL_PROPERTIES[2].id); // Block 1 Lot 3 default
  const [category, setCategory] = useState<ViolationType>("NOT_ABOVE_CURB_PARALLEL");
  const [plateNumber, setPlateNumber] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("In front of Block 1 Lot 3");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600");
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmitViolation = (e: React.FormEvent) => {
    e.preventDefault();

    const newViolation: Violation = {
      id: `f0000000-0000-0000-0000-${String(violations.length + 10).padStart(12, "0")}`,
      property_id: selectedPropertyId,
      violation_category: category,
      plate_number: plateNumber.toUpperCase().trim() || null,
      pet_id: null,
      photo_evidence_url: photoUrl,
      incident_location: incidentLocation.trim(),
      notes: notes.trim() || "Security patrol on-site violation citation.",
      fine_amount: 500.00,
      status: "FINE_ASSESSED",
      reported_by_guard_id: "c0000000-0000-0000-0000-000000000003",
      created_at: new Date().toISOString(),
    };

    setViolations([newViolation, ...violations]);
    setNotification(`Citation logged: ${category.replace(/_/g, " ")} recorded with photo proof. ₱500 fine attached to unit.`);
    setPlateNumber("");
    setNotes("");
    setTimeout(() => setNotification(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          Security Patrol Incident & Compliance Logger
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Issue photo-backed citations for illegal roadway parking, curb violations, and pet waste non-compliance.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* Main Grid: Form on Left, Patrol History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (1 col) */}
        <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              Log Incident Citation
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Captures timestamp, photo snapshot, and unit ID
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmitViolation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Violation Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ViolationType)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white"
                >
                  <optgroup label="🚗 Parking & Roadway Violations">
                    {VIOLATION_OPTIONS.filter((o) => o.group === "PARKING").map((o) => (
                      <option key={o.type} value={o.type}>{o.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🐕 Domestic Pet Non-Compliance">
                    {VIOLATION_OPTIONS.filter((o) => o.group === "PET").map((o) => (
                      <option key={o.type} value={o.type}>{o.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Offending Property Lot</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white"
                  required
                >
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vehicle Plate No. (Optional for Pets)</label>
                <Input
                  placeholder="e.g. WXX 1029"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="text-xs font-mono uppercase bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Exact Incident Location</label>
                <Input
                  placeholder="e.g. In front of Block 1 Lot 3 / Parkway Strip"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  required
                  className="text-xs bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Photo Evidence Snapshot</label>
                <div className="p-3 border border-slate-700 rounded-lg bg-slate-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileImage className="w-4 h-4 text-emerald-400" />
                    <span>Evidence_Photo_Patrol.jpg</span>
                  </div>
                  <Badge variant="default" className="bg-emerald-600 text-[10px]">Attached</Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Patrol Officer Remarks</label>
                <Input
                  placeholder="e.g. Vehicle parked flat on roadway blocking village trucks."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-900/60 text-[11px] text-rose-300 space-y-1">
                <span className="font-bold block">Enclave Penalty Schedule:</span>
                <span>Submitting logs a ₱500 standard fine attached to the unit&apos;s next monthly dues invoice.</span>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 shadow-md"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" /> Submit Security Citation
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Patrol History Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Security Citation Patrol Logbook
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-900 border-b border-slate-800">
                  <TableRow className="border-slate-800">
                    <TableHead className="font-bold text-xs text-slate-400">Timestamp</TableHead>
                    <TableHead className="font-bold text-xs text-slate-400">Category</TableHead>
                    <TableHead className="font-bold text-xs text-slate-400">Property Unit</TableHead>
                    <TableHead className="font-bold text-xs text-slate-400">Plate / Target</TableHead>
                    <TableHead className="font-bold text-xs text-slate-400">Fine</TableHead>
                    <TableHead className="font-bold text-xs text-slate-400">Status</TableHead>
                    <TableHead className="text-right font-bold text-xs text-slate-400">Photo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((v) => {
                    const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);

                    return (
                      <TableRow key={v.id} className="border-slate-800 hover:bg-slate-900/60 transition-colors">
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {formatDateTime(v.created_at)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-white">
                          {v.violation_category.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-emerald-400">
                          {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {v.plate_number || "Pet Incident"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-rose-400">
                          ₱{v.fine_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={v.status === "FINE_ASSESSED" ? "destructive" : "warning"} className="text-[10px]">
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {v.photo_evidence_url ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActivePhotoModal(v.photo_evidence_url)}
                              className="h-7 text-xs bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Proof
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                Security Photographic Citation Evidence
              </CardTitle>
              <button onClick={() => setActivePhotoModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhotoModal}
                  alt="Citation evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
