"use client";

import { useState } from "react";
import { 
  CalendarDays, 
  Plus, 
  Users, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  X,
  Waves,
  Trees,
  Utensils,
  PartyPopper
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { INITIAL_RESERVATIONS } from "@/lib/data/mock-data";
import { Reservation, AmenityType, ReservationStatus } from "@/types/database";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface FacilityInfo {
  type: AmenityType;
  name: string;
  capacity: string;
  fee: number;
  deposit: number;
  description: string;
  icon: any;
}

const FACILITIES: FacilityInfo[] = [
  {
    type: "CLUBHOUSE_FUNCTION_ROOM",
    name: "Clubhouse Function Hall",
    capacity: "Up to 50 Guests",
    fee: 3500,
    deposit: 2000,
    description: "Fully air-conditioned hall with AV sound system, banquet tables, and pantry kitchen for private family celebrations.",
    icon: PartyPopper,
  },
  {
    type: "SWIMMING_POOL_DECK",
    name: "Swimming Pool Deck & Cabanas",
    capacity: "Up to 25 Guests",
    fee: 1500,
    deposit: 1000,
    description: "20-meter lap pool, kids wading zone, and shaded sun cabanas. Strict sanitary policy (no pets on deck).",
    icon: Waves,
  },
  {
    type: "GARDEN_PAVILION",
    name: "Enclave Garden Pavilion",
    capacity: "Up to 30 Guests",
    fee: 1200,
    deposit: 800,
    description: "Covered outdoor gazebo surrounded by landscaped greens and pocket park. Ideal for intimate brunches and children's parties.",
    icon: Trees,
  },
  {
    type: "BBQ_GRILL_AREA",
    name: "BBQ Grill & Picnic Area",
    capacity: "Up to 20 Guests",
    fee: 800,
    deposit: 500,
    description: "Equipped with stainless steel charcoal grills, prep sinks, and outdoor bench seating for weekend cookouts.",
    icon: Utensils,
  }
];

export default function ResidentAmenitiesPage() {
  const myPropertyId = "b2000000-0000-0000-0000-000000000001"; // Block 2 Lot 1
  const [reservations, setReservations] = useState<Reservation[]>(
    INITIAL_RESERVATIONS.filter((r) => r.property_id === myPropertyId)
  );

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<AmenityType>("CLUBHOUSE_FUNCTION_ROOM");
  const [eventPurpose, setEventPurpose] = useState("");
  const [estimatedGuests, setEstimatedGuests] = useState(25);
  const [startDate, setStartDate] = useState("2026-09-05T14:00");
  const [durationHours, setDurationHours] = useState(4);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenBooking = (type: AmenityType) => {
    setSelectedFacility(type);
    setIsBookModalOpen(true);
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();

    const facility = FACILITIES.find((f) => f.type === selectedFacility)!;
    const startIso = new Date(startDate).toISOString();
    const endIso = new Date(new Date(startDate).getTime() + durationHours * 60 * 60 * 1000).toISOString();

    const newRes: Reservation = {
      id: `20000000-0000-0000-0000-${String(reservations.length + 50).padStart(12, "0")}`,
      property_id: myPropertyId,
      amenity: selectedFacility,
      start_time: startIso,
      end_time: endIso,
      status: "PENDING_APPROVAL",
      estimated_guests: estimatedGuests,
      event_purpose: eventPurpose.trim(),
      deposit_amount: facility.deposit,
      fee_amount: facility.fee,
      approved_by: null,
      notes: "Submitted by resident via portal. Awaiting Admin review.",
      created_at: new Date().toISOString(),
    };

    setReservations([newRes, ...reservations]);
    setIsBookModalOpen(false);
    setSuccessMessage(`Booking request for ${facility.name} submitted! The HOA Admin will review your schedule.`);
    setEventPurpose("");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-emerald-700" />
            Clubhouse & Amenity Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block 2, Lot 1 • Reserve exclusive enclave facilities for private gatherings and celebrations.
          </p>
        </div>

        <Button
          onClick={() => setIsBookModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Book an Amenity
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Facilities Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FACILITIES.map((facility) => {
          const Icon = facility.icon;

          return (
            <Card key={facility.type} className="border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{facility.name}</CardTitle>
                      <CardDescription className="text-xs text-slate-500">{facility.capacity}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-emerald-700 text-white text-xs">
                    {formatCurrency(facility.fee)} / slot
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {facility.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center border border-slate-100">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(facility.deposit)} (Refundable)</span>
                </div>

                <Button
                  onClick={() => handleOpenBooking(facility.type)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                >
                  Reserve {facility.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* My Bookings Tracker */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
          <CardTitle className="text-sm font-bold text-slate-900">
            My Unit Amenity Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reservations.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 text-center italic">
              You have no active amenity reservations.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reservations.map((res) => (
                <div key={res.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {FACILITIES.find((f) => f.type === res.amenity)?.name}
                      </span>
                      <Badge variant={res.status === "CONFIRMED" ? "default" : "warning"} className="text-[10px]">
                        {res.status}
                      </Badge>
                    </div>
                    <p className="text-slate-600 font-medium">{res.event_purpose || res.purpose || "Event"} ({res.estimated_guests || res.guest_count || 10} Guests)</p>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Schedule: {formatDateTime(res.start_time)} to {formatDateTime(res.end_time)}
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <div className="font-bold text-emerald-800 text-sm">{formatCurrency(res.fee_amount || res.rental_fee || 0)}</div>
                    <span className="text-[10px] text-slate-400">Deposit: {formatCurrency(res.deposit_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                  Reserve Facility
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Unit: Block 2, Lot 1
                </CardDescription>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateReservation} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Enclave Facility</label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value as AmenityType)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  {FACILITIES.map((f) => (
                    <option key={f.type} value={f.type}>
                      {f.name} — {formatCurrency(f.fee)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Event Name / Purpose</label>
                <Input
                  placeholder="e.g. 7th Birthday Party / Family Reunion"
                  value={eventPurpose}
                  onChange={(e) => setEventPurpose(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Duration</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value))}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={6}>6 Hours (Standard)</option>
                    <option value={8}>8 Hours (Full Afternoon)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Estimated Number of Guests</label>
                <Input
                  type="number"
                  value={estimatedGuests}
                  onChange={(e) => setEstimatedGuests(parseInt(e.target.value) || 1)}
                  min={1}
                  max={60}
                  required
                  className="text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                  Submit Reservation Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
