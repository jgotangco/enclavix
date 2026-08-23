"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  Search, 
  ShieldAlert, 
  Car, 
  Dog, 
  FileImage, 
  Eye, 
  CheckCircle2, 
  X, 
  AlertCircle,
  TrendingDown,
  DollarSign
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
import { INITIAL_VIOLATIONS, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Violation, ViolationStatus } from "@/types/database";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export default function AdminViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>(INITIAL_VIOLATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<Violation | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredViolations = violations.filter((v) => {
    const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      v.violation_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.plate_number && v.plate_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.incident_location && v.incident_location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const isParking = v.violation_category.includes("PARKING") || v.violation_category.includes("CURB") || v.violation_category.includes("ROAD");
    const isPet = v.violation_category.includes("PET") || v.violation_category.includes("ANIMAL") || v.violation_category.includes("LEASH");

    const matchesCategory =
      selectedCategory === "ALL" ||
      (selectedCategory === "PARKING" && isParking) ||
      (selectedCategory === "PET" && isPet);

    const matchesStatus = selectedStatus === "ALL" || v.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: ViolationStatus) => {
    switch (status) {
      case "FINE_ASSESSED":
        return <Badge variant="destructive">₱500 Fine Assessed</Badge>;
      case "WARNING_ISSUED":
        return <Badge variant="warning">Warning Issued</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Resolved</Badge>;
      case "DISPUTED":
        return <Badge variant="info">Disputed by Homeowner</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleUpdateStatus = (id: string, newStatus: ViolationStatus) => {
    setViolations(
      violations.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
    setActiveEvidenceModal(null);
    setNotification(`Violation record updated to ${newStatus}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const totalFines = violations
    .filter((v) => v.status === "FINE_ASSESSED")
    .reduce((sum, v) => sum + v.fine_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
          Community Security & Compliance Audits
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Master registry of photo-backed curbside parking citations, pet waste infractions, and automated billing fine assessments.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{violations.length} Incidents</div>
            <p className="text-xs text-slate-500 mt-1">Logged by Gate 1 & mobile patrol</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-rose-50/40 border-rose-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center justify-between">
              <span>Active Fines Assessed</span>
              <DollarSign className="w-4 h-4 text-rose-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{formatCurrency(totalFines)}</div>
            <p className="text-xs text-rose-700 mt-1">Attached to monthly HOA statements</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Compliance Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {violations.filter((v) => v.status === "RESOLVED").length} Resolved
            </div>
            <p className="text-xs text-slate-500 mt-1">First-offense warnings cleared</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search Block, Lot, Plate, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Violation Categories</option>
                <option value="PARKING">🚗 Curbside & Roadway Parking</option>
                <option value="PET">🐕 Pet Waste & Leash Rules</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="FINE_ASSESSED">Fine Assessed (₱500)</option>
                <option value="WARNING_ISSUED">Warning Issued</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISPUTED">Disputed</option>
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
                <TableHead className="font-bold text-xs">Timestamp</TableHead>
                <TableHead className="font-bold text-xs">Category</TableHead>
                <TableHead className="font-bold text-xs">Unit</TableHead>
                <TableHead className="font-bold text-xs">Target (Plate / Pet)</TableHead>
                <TableHead className="font-bold text-xs">Incident Location</TableHead>
                <TableHead className="font-bold text-xs">Fine Amount</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No violations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredViolations.map((v) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);

                  return (
                    <TableRow key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {formatDateTime(v.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {v.violation_category.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {v.plate_number || "Pet Incident"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {v.incident_location || "Village Parkway"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-rose-700">
                        {v.fine_amount > 0 ? formatCurrency(v.fine_amount) : "₱0.00"}
                      </TableCell>
                      <TableCell>{getStatusBadge(v.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveEvidenceModal(v)}
                          className="h-7 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Evidence & Action Modal */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-rose-400" />
                  Citation Evidence File
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {activeEvidenceModal.violation_category.replace(/_/g, " ")}
                </CardDescription>
              </div>
              <button onClick={() => setActiveEvidenceModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {activeEvidenceModal.photo_evidence_url ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeEvidenceModal.photo_evidence_url}
                    alt="Violation evidence snapshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 italic">
                  No photographic evidence attached.
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-900">{activeEvidenceModal.incident_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Plate:</span>
                  <span className="font-mono font-bold text-slate-900">{activeEvidenceModal.plate_number || "Pet violation"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Officer Report:</span>
                  <span className="text-slate-700 italic">{activeEvidenceModal.notes || "Standard citation."}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Assessed Fine:</span>
                  <span className="font-bold text-rose-700 text-sm">{formatCurrency(activeEvidenceModal.fine_amount)}</span>
                </div>
              </div>

              {/* Status change actions */}
              <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setActiveEvidenceModal(null)} className="text-xs">
                  Close
                </Button>
                {activeEvidenceModal.status !== "FINE_ASSESSED" && (
                  <Button
                    onClick={() => handleUpdateStatus(activeEvidenceModal.id, "FINE_ASSESSED")}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    Assess ₱500 Fine
                  </Button>
                )}
                {activeEvidenceModal.status !== "RESOLVED" && (
                  <Button
                    onClick={() => handleUpdateStatus(activeEvidenceModal.id, "RESOLVED")}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
