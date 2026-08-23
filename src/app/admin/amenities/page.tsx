"use client";

import { useState } from "react";
import { 
  CalendarDays, 
  Search, 
  Check, 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  AlertCircle,
  Eye,
  Plus
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
import { INITIAL_RESERVATIONS, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Reservation, AmenityType, ReservationStatus } from "@/types/database";
import { formatDateTime, formatCurrency } from "@/lib/utils";

const AMENITY_LABELS: Record<AmenityType, string> = {
  CLUBHOUSE_FUNCTION_ROOM: "Clubhouse Function Room",
  MULTIFUNCTION_HALL: "Multifunction Hall",
  SWIMMING_POOL_DECK: "Swimming Pool Deck",
  SWIMMING_POOL: "Swimming Pool",
  GARDEN_PAVILION: "Garden Pavilion",
  BBQ_GRILL_AREA: "BBQ Grill & Picnic Area",
};

export default function AdminAmenitiesPage() {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAmenity, setSelectedAmenity] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredReservations = reservations.filter((r) => {
    const prop = INITIAL_PROPERTIES.find((p) => p.id === r.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const purpose = r.event_purpose || r.purpose || "";
    const matchesSearch =
      purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (AMENITY_LABELS[r.amenity] && AMENITY_LABELS[r.amenity].toLowerCase().includes(searchQuery.toLowerCase())) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAmenity = selectedAmenity === "ALL" || r.amenity === selectedAmenity;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;

    return matchesSearch && matchesAmenity && matchesStatus;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Confirmed</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApprove = (id: string) => {
    setReservations(
      reservations.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "CONFIRMED",
              approved_by: "c0000000-0000-0000-0000-000000000001",
              notes: "Reservation confirmed by Admin. Gate security informed.",
            }
          : r
      )
    );
    setActiveReservation(null);
    setNotification("Amenity reservation approved and scheduled!");
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCancel = (id: string) => {
    setReservations(
      reservations.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
    );
    setActiveReservation(null);
    setNotification("Reservation marked as cancelled.");
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-emerald-700" />
          Amenity Reservations & Master Calendar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, approve, and manage community bookings for the Clubhouse, Swimming Pool Deck, Garden Pavilion, and BBQ area.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Clubhouse Function Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">₱3,500 / slot</div>
            <p className="text-[11px] text-slate-500">Air-conditioned (50 pax)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Swimming Pool Deck
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">₱1,500 / slot</div>
            <p className="text-[11px] text-slate-500">Lap pool & cabanas (25 pax)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Garden Pavilion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">₱1,200 / slot</div>
            <p className="text-[11px] text-slate-500">Outdoor greenery (30 pax)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-emerald-50/40 border-emerald-200/60">
          <CardHeader className="pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-900">
              {reservations.filter((r) => r.status === "PENDING_APPROVAL").length} Booking Requests
            </div>
            <p className="text-[11px] text-emerald-700">Action required</p>
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
                placeholder="Search purpose, amenity, or Block/Lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Enclave Amenities</option>
                <option value="CLUBHOUSE_FUNCTION_ROOM">Clubhouse Function Room</option>
                <option value="SWIMMING_POOL_DECK">Swimming Pool Deck</option>
                <option value="GARDEN_PAVILION">Garden Pavilion</option>
                <option value="BBQ_GRILL_AREA">BBQ Grill Area</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Reservation Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
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
                <TableHead className="font-bold text-xs">Amenity</TableHead>
                <TableHead className="font-bold text-xs">Event Purpose</TableHead>
                <TableHead className="font-bold text-xs">Booked Lot</TableHead>
                <TableHead className="font-bold text-xs">Schedule Window</TableHead>
                <TableHead className="font-bold text-xs">Guests</TableHead>
                <TableHead className="font-bold text-xs">Fee + Deposit</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No reservations found matching search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map((res) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === res.property_id);

                  return (
                    <TableRow key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-xs text-slate-900">
                        {AMENITY_LABELS[res.amenity]}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        {res.event_purpose || res.purpose || "Community Event"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {formatDateTime(res.start_time)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {res.estimated_guests || res.guest_count || 10} Pax
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-800">
                        {formatCurrency(res.fee_amount || res.rental_fee || 0)}
                        <span className="text-[10px] text-slate-400 block font-normal">+{formatCurrency(res.deposit_amount)} Dep</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(res.status)}</TableCell>
                      <TableCell className="text-right">
                        {res.status === "PENDING_APPROVAL" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(res.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-7 text-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(res.id)}
                              className="h-7 text-xs text-rose-700 hover:bg-rose-50"
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveReservation(res)}
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

      {/* Details Modal */}
      {activeReservation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  Booking Details: {AMENITY_LABELS[activeReservation.amenity]}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Purpose: {activeReservation.event_purpose || activeReservation.purpose || "Event"}
                </CardDescription>
              </div>
              <button onClick={() => setActiveReservation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Schedule:</span>
                  <span className="font-bold text-slate-900">{formatDateTime(activeReservation.start_time)} to {formatDateTime(activeReservation.end_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Attendees:</span>
                  <span className="font-semibold text-slate-900">{activeReservation.estimated_guests || activeReservation.guest_count || 10} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rental Fee:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(activeReservation.fee_amount || activeReservation.rental_fee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refundable Deposit:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(activeReservation.deposit_amount)}</span>
                </div>
                {activeReservation.notes && (
                  <div className="pt-1.5 border-t border-slate-200 text-slate-600 italic">
                    {activeReservation.notes}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" onClick={() => setActiveReservation(null)} className="text-xs">
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
