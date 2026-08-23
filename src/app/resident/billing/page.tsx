"use client";

import { useState } from "react";
import { 
  Receipt, 
  Upload, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  FileText, 
  Download, 
  Printer, 
  ArrowRight,
  X,
  CreditCard,
  Building2,
  ShieldCheck
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
import { INITIAL_INVOICES } from "@/lib/data/mock-data";
import { Invoice, InvoiceStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ResidentBillingPage() {
  const myPropertyId = "b2000000-0000-0000-0000-000000000001"; // Block 2 Lot 1
  const [invoices, setInvoices] = useState<Invoice[]>(
    INITIAL_INVOICES.filter((i) => i.property_id === myPropertyId)
  );

  // Modals
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [referenceNo, setReferenceNo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Paid & Verified</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge variant="warning">Verification Pending</Badge>;
      case "UNPAID":
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleUploadPaymentProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    setIsUploading(true);
    setTimeout(() => {
      const updated = invoices.map((inv) => {
        if (inv.id === activePaymentInvoice.id) {
          return {
            ...inv,
            status: "PENDING_VERIFICATION" as InvoiceStatus,
            payment_method: paymentMethod,
            payment_reference_no: referenceNo.trim(),
            proof_of_payment_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
            notes: `Proof uploaded on ${new Date().toLocaleDateString()}`,
          };
        }
        return inv;
      });

      setInvoices(updated);
      setIsUploading(false);
      setActivePaymentInvoice(null);
      setReferenceNo("");
      setSuccessMessage("Payment slip submitted! The HOA Treasurer will review and issue your Official Receipt.");
      setTimeout(() => setSuccessMessage(null), 5000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-700" />
            Statements & Online Dues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block 2, Lot 1 (260 m²) • Itemized monthly association statements and Official Receipts
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Itemized Calculation Formula Card */}
      <Card className="border-slate-200 shadow-xs bg-slate-900 text-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Standard Unit Monthly Assessment Breakdown
            </CardTitle>
            <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
              Rate: ₱25.00 / m²
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">1. Lot Area Fee</span>
              <span className="font-bold text-white text-base">₱6,500.00</span>
              <span className="text-[10px] text-slate-400 block">260 m² × ₱25.00</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">2. Base Fixed Fee</span>
              <span className="font-bold text-white text-base">₱500.00</span>
              <span className="text-[10px] text-slate-400 block">Clubhouse & Guardhouse</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block text-[11px]">3. Mother Subdivision Fee</span>
              <span className="font-bold text-white text-base">₱300.00</span>
              <span className="text-[10px] text-slate-400 block">Subdivision Security Gates</span>
            </div>

            <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-600/60 space-y-1">
              <span className="text-emerald-300 block text-[11px] font-semibold">Standard Total Due</span>
              <span className="font-extrabold text-emerald-400 text-lg">₱7,300.00</span>
              <span className="text-[10px] text-emerald-200/80 block">Due every 15th</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
          <CardTitle className="text-sm font-bold text-slate-900">
            Billing History & Statements
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-xs">Period</TableHead>
                <TableHead className="font-bold text-xs">Lot Area</TableHead>
                <TableHead className="font-bold text-xs">Breakdown (Area + Base + Mother Fee)</TableHead>
                <TableHead className="font-bold text-xs">Total Due</TableHead>
                <TableHead className="font-bold text-xs">Due Date</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono font-bold text-xs text-slate-900">
                    {inv.billing_period}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {inv.lot_area_snapshot} m²
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    ₱{inv.sqm_amount} + ₱{inv.base_fixed_amount} + ₱{inv.mother_village_amount}
                  </TableCell>
                  <TableCell className="text-xs font-extrabold text-emerald-800">
                    {formatCurrency(inv.total_due)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-right">
                    {inv.status === "UNPAID" && (
                      <Button
                        size="sm"
                        onClick={() => setActivePaymentInvoice(inv)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-7 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Upload className="w-3.5 h-3.5" /> Pay via GCash
                      </Button>
                    )}
                    {inv.status === "PENDING_VERIFICATION" && (
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                    {inv.status === "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveReceiptInvoice(inv)}
                        className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> View OR
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pay / Upload Slip Modal */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Submit Payment Proof • {activePaymentInvoice.billing_period}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Total Due: {formatCurrency(activePaymentInvoice.total_due)}
                </CardDescription>
              </div>
              <button onClick={() => setActivePaymentInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleUploadPaymentProof} className="p-6 space-y-4">
              {/* GCash Payment Instructions */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-3">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 block">GCash / BDO HOA Treasury Account</span>
                  <p className="text-slate-600">
                    Account: <strong>Grand Enclave HOA Inc.</strong><br />
                    GCash Number: <strong>0917-800-HOA1 (0917 800 4621)</strong>
                  </p>
                  <p className="text-[11px] text-sky-800">
                    Please transfer exactly <strong>{formatCurrency(activePaymentInvoice.total_due)}</strong> and save the reference number.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Payment Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="BDO Online">BDO Online Transfer</option>
                    <option value="BPI Online">BPI Online Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Transaction Reference No.</label>
                  <Input
                    placeholder="e.g. 98172635123"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    required
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Upload Transfer Slip Screenshot</label>
                <div className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-slate-50/50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-600 block font-medium">Click to select screenshot or drag image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setActivePaymentInvoice(null)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  {isUploading ? "Uploading..." : "Confirm & Submit Slip"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Official Receipt (OR) Modal */}
      {activeReceiptInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-emerald-800 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Official Receipt</span>
                </div>
                <CardTitle className="text-base font-bold text-white mt-1">
                  Grand Enclave Homeowners Association
                </CardTitle>
              </div>
              <button onClick={() => setActiveReceiptInvoice(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center pb-3 border-b border-slate-100 space-y-1">
                <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-900 font-mono">
                  OR-2026-0881
                </Badge>
                <p className="text-xs text-slate-500">Date Paid: {formatDate(activeReceiptInvoice.paid_at || activeReceiptInvoice.due_date)}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Received From:</span>
                  <span className="font-bold text-slate-900">Juan Dela Cruz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Address:</span>
                  <span className="text-slate-800">Block 2 Lot 1 (260 m²)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Period:</span>
                  <span className="font-semibold text-slate-900">{activeReceiptInvoice.billing_period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Reference:</span>
                  <span className="font-mono text-slate-800">{activeReceiptInvoice.payment_reference_no || "GCASH-98172635123"}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-700">{formatCurrency(activeReceiptInvoice.total_due)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] text-center border border-emerald-200">
                Verified by HOA Treasury • Electronic Official Receipt Valid for Community Clearance
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.print()} className="text-xs flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print OR
                </Button>
                <Button variant="default" onClick={() => setActiveReceiptInvoice(null)} className="text-xs bg-emerald-700">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
