"use client";

import { useState } from "react";
import { 
  LifeBuoy, 
  Search, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  ShieldAlert, 
  Dog, 
  Receipt, 
  Car, 
  HelpCircle, 
  UserCheck,
  Eye,
  X,
  MessageSquare
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
import { INITIAL_TICKETS, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
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

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("IN_PROGRESS");
  const [assignedRole, setAssignedRole] = useState("c0000000-0000-0000-0000-000000000003"); // Default Security Guard
  const [notification, setNotification] = useState<string | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const prop = INITIAL_PROPERTIES.find((p) => p.id === t.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">Open (New)</Badge>;
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

  const handleOpenDetail = (t: Ticket) => {
    setActiveTicket(t);
    setResolutionNotes(t.resolution_notes || "");
    setTicketStatus(t.status);
    setAssignedRole(t.assigned_to_id || "c0000000-0000-0000-0000-000000000003");
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    const updated = tickets.map((t) =>
      t.id === activeTicket.id
        ? {
            ...t,
            status: ticketStatus,
            resolution_notes: resolutionNotes.trim() || null,
            assigned_to_id: assignedRole,
            updated_at: new Date().toISOString(),
          }
        : t
    );

    setTickets(updated);
    setActiveTicket(null);
    setNotification(`Helpdesk ticket #${activeTicket.id.slice(-4)} updated successfully.`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-7 h-7 text-emerald-700" />
          Maintenance & Incident Helpdesk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Triage resident service inquiries, dispatch maintenance crews, and manage security disputes.
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
              Total Support Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{tickets.length} Tickets</div>
            <p className="text-xs text-slate-500 mt-1">Logged across all units</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-amber-50/40 border-amber-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              In Progress / Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length} Active
            </div>
            <p className="text-xs text-amber-700 mt-1">Assigned to staff</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-emerald-50/40 border-emerald-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Resolved Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length} Closed
            </div>
            <p className="text-xs text-emerald-700 mt-1">Resolution confirmed</p>
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
                placeholder="Search subject, description, or Block/Lot..."
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
                <option value="ALL">All Categories</option>
                <option value="MAINTENANCE_REPAIR">🔧 Maintenance & Repair</option>
                <option value="SECURITY_INCIDENT">🛡️ Security Incident</option>
                <option value="PET_COMPLAINT">🐕 Domestic Pet Complaint</option>
                <option value="PARKING_DISPUTE">🚗 Parking Dispute</option>
                <option value="BILLING_INQUIRY">💰 Billing & Statement Inquiry</option>
                <option value="GENERAL_INQUIRY">ℹ️ General Inquiry</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open (New)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
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
                <TableHead className="font-bold text-xs">Date</TableHead>
                <TableHead className="font-bold text-xs">Category</TableHead>
                <TableHead className="font-bold text-xs">Subject</TableHead>
                <TableHead className="font-bold text-xs">Unit</TableHead>
                <TableHead className="font-bold text-xs">Assigned To</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No tickets found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === t.property_id);
                  const Icon = CATEGORY_ICONS[t.category] || HelpCircle;

                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {formatDateTime(t.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{t.category.replace(/_/g, " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 max-w-xs truncate">
                        {t.subject}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {t.assigned_to_id ? "Staff Assigned" : "Unassigned"}
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(t)}
                          className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Triage
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

      {/* Triage Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                    {activeTicket.category.replace(/_/g, " ")}
                  </Badge>
                  {getStatusBadge(activeTicket.status)}
                </div>
                <CardTitle className="text-base font-bold text-white mt-1">
                  {activeTicket.subject}
                </CardTitle>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveResolution} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Resident Description:</span>
                <p className="text-slate-800 leading-relaxed">{activeTicket.description}</p>
              </div>

              {activeTicket.photo_attachment_url && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block text-[11px]">Attached Photo Evidence:</span>
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeTicket.photo_attachment_url} alt="Attachment" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Assign To Staff / Role</label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="c0000000-0000-0000-0000-000000000003">Rodrigo Bautista (Security Guard)</option>
                    <option value="c0000000-0000-0000-0000-000000000002">Ma. Elena Cruz (Treasurer)</option>
                    <option value="c0000000-0000-0000-0000-000000000001">Carlos Valdez (Super Admin)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Update Ticket Status</label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Resolution & Action Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record steps taken, maintenance dispatch schedules, or resolution details..."
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setActiveTicket(null)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
