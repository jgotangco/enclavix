"use client";

import { useState } from "react";
import { 
  LifeBuoy, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  ShieldAlert, 
  Dog, 
  Receipt, 
  Car, 
  HelpCircle, 
  Upload, 
  MessageSquare,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { INITIAL_TICKETS } from "@/lib/data/mock-data";
import { Ticket, TicketCategory, TicketStatus } from "@/types/database";
import { formatDateTime } from "@/lib/utils";

const CATEGORY_ICONS: Partial<Record<TicketCategory, any>> = {
  MAINTENANCE_REPAIR: Wrench,
  MAINTENANCE: Wrench,
  SECURITY_INCIDENT: ShieldAlert,
  SECURITY: ShieldAlert,
  PET_COMPLAINT: Dog,
  PET_VIOLATION: Dog,
  PARKING_DISPUTE: Car,
  PARKING_VIOLATION: Car,
  BILLING_INQUIRY: Receipt,
  BILLING: Receipt,
  GENERAL_INQUIRY: HelpCircle,
  GENERAL: HelpCircle,
  COMPLAINT: HelpCircle,
};

export default function ResidentTicketsPage() {
  const myPropertyId = "b2000000-0000-0000-0000-000000000001"; // Block 2 Lot 1
  const [tickets, setTickets] = useState<Ticket[]>(
    INITIAL_TICKETS.filter((t) => t.property_id === myPropertyId)
  );

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("MAINTENANCE_REPAIR");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">Open (Pending)</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Resolved</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket: Ticket = {
      id: `40000000-0000-0000-0000-${String(tickets.length + 50).padStart(12, "0")}`,
      property_id: myPropertyId,
      resident_id: "c0000000-0000-0000-0000-000000000004",
      category,
      subject: subject.trim(),
      description: description.trim(),
      photo_attachment_url: null,
      status: "OPEN",
      assigned_to_id: null,
      resolution_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets([newTicket, ...tickets]);
    setIsSubmitModalOpen(false);
    setSuccessMessage("Service request submitted! The HOA administration will dispatch personnel shortly.");
    setSubject("");
    setDescription("");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-emerald-700" />
            Maintenance & Service Helpdesk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block 2, Lot 1 • Submit repair requests, report security concerns, or ask dues billing questions.
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Submit Service Request
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.map((t) => {
          const Icon = CATEGORY_ICONS[t.category] || HelpCircle;

          return (
            <Card key={t.id} className="border-slate-200 shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{t.subject}</CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {t.category.replace(/_/g, " ")} • {formatDateTime(t.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(t.status)}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <p className="text-slate-700 leading-relaxed">{t.description}</p>

                {t.resolution_notes && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block text-[11px]">
                      HOA Action & Response:
                    </span>
                    <p className="text-emerald-800">{t.resolution_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Request Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-400" />
                  Submit Service Request
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Unit: Block 2, Lot 1
                </CardDescription>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Request Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <option value="MAINTENANCE_REPAIR">🔧 Maintenance & Repair (Streetlights, Drainage, Landscape)</option>
                  <option value="SECURITY_INCIDENT">🛡️ Security Incident / Noise Concern</option>
                  <option value="PET_COMPLAINT">🐕 Pet Waste / Off-leash Issue</option>
                  <option value="PARKING_DISPUTE">🚗 Blocked Driveway / Parking Concern</option>
                  <option value="BILLING_INQUIRY">💰 Dues & Statement Inquiry</option>
                  <option value="GENERAL_INQUIRY">ℹ️ General Community Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Subject Summary</label>
                <Input
                  placeholder="e.g. Streetlamp flickering in front of my unit"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue with specific locations or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
