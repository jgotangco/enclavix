"use client";

import { useState } from "react";
import { 
  Receipt, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sliders, 
  FileCheck, 
  ExternalLink,
  Eye,
  Check,
  X,
  Building2,
  TrendingUp,
  CreditCard
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
import { 
  INITIAL_INVOICES, 
  INITIAL_PROPERTIES, 
  INITIAL_BILLING_SETTINGS,
  INITIAL_VIOLATIONS 
} from "@/lib/data/mock-data";
import { Invoice, InvoiceStatus, BillingSetting } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [billingSettings, setBillingSettings] = useState<BillingSetting>(INITIAL_BILLING_SETTINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBatchGenerateOpen, setIsBatchGenerateOpen] = useState(false);
  const [activeProofInvoice, setActiveProofInvoice] = useState<Invoice | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Batch form
  const [batchPeriod, setBatchPeriod] = useState("2026-10");
  const [batchDueDate, setBatchDueDate] = useState("2026-10-15");

  // Temporary Settings Form
  const [tempSettings, setTempSettings] = useState<BillingSetting>(billingSettings);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const prop = INITIAL_PROPERTIES.find((p) => p.id === inv.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      propLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.payment_reference_no && inv.payment_reference_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.billing_period.includes(searchQuery);

    const matchesPeriod = selectedPeriod === "ALL" || inv.billing_period === selectedPeriod;
    const matchesStatus = selectedStatus === "ALL" || inv.status === selectedStatus;

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Paid & Verified</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge variant="warning">Pending Verification</Badge>;
      case "UNPAID":
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800">Unpaid</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 1-Click Batch Monthly Invoice Generation
  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if invoices for period already exist
    const existingForPeriod = invoices.some((i) => i.billing_period === batchPeriod);
    if (existingForPeriod) {
      setNotification(`Invoices for period ${batchPeriod} already generated.`);
      setIsBatchGenerateOpen(false);
      return;
    }

    const newInvoices: Invoice[] = INITIAL_PROPERTIES.map((prop, idx) => {
      const lotArea = prop.lot_area_sqm;
      const rate = billingSettings.rate_per_sqm;
      const sqmAmount = lotArea * rate;
      const baseFee = billingSettings.base_fixed_fee;
      const villageFee = billingSettings.mother_village_fee;

      // Check for unpaid violations on this property
      const unpaidViolations = INITIAL_VIOLATIONS.filter(
        (v) => v.property_id === prop.id && v.status === "FINE_ASSESSED"
      );
      const violationFines = unpaidViolations.reduce((sum, v) => sum + v.fine_amount, 0);

      const total = sqmAmount + baseFee + villageFee + violationFines;

      return {
        id: `10000000-0000-0000-0000-${String(invoices.length + idx + 10).padStart(12, "0")}`,\n        property_id: prop.id,\n        billing_period: batchPeriod,\n        lot_area_snapshot: lotArea,\n        rate_per_sqm_snapshot: rate,\n        sqm_amount: sqmAmount,\n        base_fixed_amount: baseFee,\n        mother_village_amount: villageFee,\n        special_assessments: 0.00,\n        penalty_amount: 0.00,\n        violation_fines_amount: violationFines,\n        total_due: total,\n        due_date: batchDueDate,\n        status: "UNPAID",\n        payment_method: null,\n        payment_reference_no: null,\n        proof_of_payment_url: null,\n        paid_amount: null,\n        paid_at: null,\n        verified_by: null,\n        notes: `Generated on ${new Date().toLocaleDateString()}`,\n        created_at: new Date().toISOString(),\n      };
    });

    setInvoices([...newInvoices, ...invoices]);
    setIsBatchGenerateOpen(false);
    setNotification(`Successfully generated ${newInvoices.length} monthly statements for period ${batchPeriod}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Treasurer Approve Payment & Generate OR
  const handleApprovePayment = (invId: string) => {
    const updated = invoices.map((inv) => {
      if (inv.id === invId) {
        const orSeq = Math.floor(1000 + Math.random() * 9000);
        return {
          ...inv,
          status: "PAID" as InvoiceStatus,
          paid_amount: inv.total_due,
          paid_at: new Date().toISOString(),
          verified_by: "c0000000-0000-0000-0000-000000000002",
          notes: `Official Receipt OR-2026-${orSeq} issued by Treasurer`,
        };
      }
      return inv;
    });

    setInvoices(updated);
    setActiveProofInvoice(null);
    setNotification("Payment approved and Official Receipt (OR) generated!");
    setTimeout(() => setNotification(null), 3500);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSettings(tempSettings);
    setIsSettingsOpen(false);
    setNotification("Billing rate formula parameters updated successfully.");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-700" />
            Billing & Invoicing Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automates variable $m^2$ lot dues, Mother Subdivision pass-through fee, violation fines aggregation, and OR verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTempSettings(billingSettings);
              setIsSettingsOpen(true);
            }}
            className="text-xs flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" /> Rate Settings
          </Button>

          <Button
            onClick={() => setIsBatchGenerateOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Run Monthly Batch Invoicing
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Rate Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase">
              Rate Per m²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(billingSettings.rate_per_sqm)} / m²</div>
            <p className="text-[11px] text-slate-500">Variable lot factor</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase">
              Base Fixed Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(billingSettings.base_fixed_fee)}</div>
            <p className="text-[11px] text-slate-500">HOA common facilities</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase">
              Mother Village Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(billingSettings.mother_village_fee)}</div>
            <p className="text-[11px] text-slate-500">Mother Subdivision pass-through</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-emerald-50/40 border-emerald-200/60">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-emerald-800 uppercase">
              Standard Fine Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-900">{formatCurrency(billingSettings.standard_fine_amount)}</div>
            <p className="text-[11px] text-emerald-700">Parking & Pet violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search Block, Lot, or Reference No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Billing Periods</option>
                <option value="2026-08">August 2026 (2026-08)</option>
                <option value="2026-09">September 2026 (2026-09)</option>
                <option value="2026-10">October 2026 (2026-10)</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification (Action Required)</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid & Verified</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-xs">Period</TableHead>
                <TableHead className="font-bold text-xs">Unit</TableHead>
                <TableHead className="font-bold text-xs">Lot Area (m²)</TableHead>
                <TableHead className="font-bold text-xs">Area Dues</TableHead>
                <TableHead className="font-bold text-xs">Fixed + Village</TableHead>
                <TableHead className="font-bold text-xs">Fines / Adjustments</TableHead>
                <TableHead className="font-bold text-xs">Total Due</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                    No billing statements match the filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === inv.property_id);

                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-slate-900">
                        {inv.billing_period}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {inv.lot_area_snapshot} m²
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {formatCurrency(inv.sqm_amount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatCurrency(inv.base_fixed_amount + inv.mother_village_amount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.violation_fines_amount > 0 ? (
                          <span className="font-bold text-rose-700">+{formatCurrency(inv.violation_fines_amount)}</span>
                        ) : (
                          <span className="text-slate-400">₱0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-extrabold text-emerald-800">
                        {formatCurrency(inv.total_due)}
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === "PENDING_VERIFICATION" ? (
                          <Button
                            size="sm"
                            onClick={() => setActiveProofInvoice(inv)}
                            className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold h-7 text-xs"
                          >
                            <FileCheck className="w-3.5 h-3.5 mr-1" /> Verify Slip
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveProofInvoice(inv)}
                            className="h-7 text-xs text-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Details
                          </Button>
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

      {/* Payment Proof & Verification Modal */}
      {activeProofInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Statement Verification • Period {activeProofInvoice.billing_period}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {INITIAL_PROPERTIES.find((p) => p.id === activeProofInvoice.property_id)?.unit_address}
                </CardDescription>
              </div>
              <button onClick={() => setActiveProofInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Receipt screenshot preview */}
              {activeProofInvoice.proof_of_payment_url ? (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Uploaded Payment Screenshot</span>
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProofInvoice.proof_of_payment_url}
                      alt="Proof of payment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center italic">
                  No payment proof uploaded for this statement yet.
                </div>
              )}

              {/* Details table */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method / Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeProofInvoice.payment_method || "N/A"} • {activeProofInvoice.payment_reference_no || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount Due:</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatCurrency(activeProofInvoice.total_due)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="text-slate-900 font-semibold">{formatDate(activeProofInvoice.due_date)}</span>
                </div>
                {activeProofInvoice.notes && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    {activeProofInvoice.notes}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setActiveProofInvoice(null)} className="text-xs">
                  Close
                </Button>
                {activeProofInvoice.status === "PENDING_VERIFICATION" && (
                  <Button
                    onClick={() => handleApprovePayment(activeProofInvoice.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve Payment & Issue OR
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Invoicing Modal */}
      {isBatchGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Generate Monthly Dues Batch
              </CardTitle>
              <button onClick={() => setIsBatchGenerateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleGenerateBatch} className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-900 border border-emerald-200 space-y-1">
                <span className="font-bold block">Batch Calculation Scope:</span>
                <span>Computes $(Lot \times ₱{billingSettings.rate_per_sqm}) + ₱{billingSettings.base_fixed_fee} + ₱{billingSettings.mother_village_fee}$ + unpaid parking/pet violation fines across all 99 properties.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Billing Period (YYYY-MM)</label>
                <Input
                  value={batchPeriod}
                  onChange={(e) => setBatchPeriod(e.target.value)}
                  placeholder="e.g. 2026-10"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Payment Due Date</label>
                <Input
                  type="date"
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsBatchGenerateOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Generate 99 Statements
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                HOA Billing Rate Parameters
              </CardTitle>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Rate per m² (₱)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempSettings.rate_per_sqm}
                    onChange={(e) => setTempSettings({ ...tempSettings, rate_per_sqm: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Base Fixed Fee (₱)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempSettings.base_fixed_fee}
                    onChange={(e) => setTempSettings({ ...tempSettings, base_fixed_fee: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mother Village Fee (₱)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempSettings.mother_village_fee}
                    onChange={(e) => setTempSettings({ ...tempSettings, mother_village_fee: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Standard Violation Fine (₱)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempSettings.standard_fine_amount}
                    onChange={(e) => setTempSettings({ ...tempSettings, standard_fine_amount: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Save Rate Parameters
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
