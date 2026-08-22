"use client";

import { useState } from "react";
import { 
  Car, 
  Search, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  X,
  AlertTriangle,
  FileText,
  User,
  SlidersHorizontal
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
import { INITIAL_VEHICLES, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Vehicle, ParkingSlotType, VehicleType } from "@/types/database";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlotType, setSelectedSlotType] = useState<string>("ALL");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [newPropertyId, setNewPropertyId] = useState(INITIAL_PROPERTIES[0].id);
  const [newPlate, setNewPlate] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("SUV");
  const [newRfid, setNewRfid] = useState("");
  const [newMakeModel, setNewMakeModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newOrCrNumber, setNewOrCrNumber] = useState("");
  const [newDesignatedParking, setNewDesignatedParking] = useState<ParkingSlotType>("IN_GARAGE");

  // Selected property vehicle stats for modal
  const selectedProp = INITIAL_PROPERTIES.find((p) => p.id === newPropertyId) || INITIAL_PROPERTIES[0];
  const propVehicles = vehicles.filter((v) => v.property_id === newPropertyId && v.is_active);
  const propGarageVehicles = propVehicles.filter((v) => v.designated_parking === "IN_GARAGE");
  const propCurbVehicles = propVehicles.filter((v) => v.designated_parking === "CARPORT_CURB_PARALLEL");
  const propMaxAllowed = (selectedProp.carport_capacity || 2) + (selectedProp.curb_parallel_allowance || 1);
  const isQuotaReached = propVehicles.length >= propMaxAllowed;

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.rfid_tag_no && v.rfid_tag_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.make_model && v.make_model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.driver_name && v.driver_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.or_cr_number && v.or_cr_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSlot = selectedSlotType === "ALL" || v.designated_parking === selectedSlotType;
    const matchesType = selectedVehicleType === "ALL" || (v.vehicle_type || "SUV") === selectedVehicleType;

    return matchesSearch && matchesSlot && matchesType;
  });

  const curbCount = vehicles.filter((v) => v.designated_parking === "CARPORT_CURB_PARALLEL" && v.is_active).length;
  const garageCount = vehicles.filter((v) => v.designated_parking === "IN_GARAGE" && v.is_active).length;

  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    // Check curbside quota for this lot
    if (newDesignatedParking === "CARPORT_CURB_PARALLEL") {
      const existingCurb = vehicles.filter(
        (v) => v.property_id === newPropertyId && v.designated_parking === "CARPORT_CURB_PARALLEL" && v.is_active
      );

      const maxCurb = selectedProp.curb_parallel_allowance ?? 1;
      if (existingCurb.length >= maxCurb) {
        setNotification({
          type: "error",
          message: `Curbside Limit Exceeded: Block ${selectedProp.block_number} Lot ${selectedProp.lot_number} already has ${existingCurb.length}/${maxCurb} active curbside permit(s).`,
        });
        return;
      }
    }

    const newVehicle: Vehicle = {
      id: `d0000000-0000-0000-0000-${String(vehicles.length + 1).padStart(12, "0")}`,
      property_id: newPropertyId,
      plate_number: newPlate.toUpperCase().trim(),
      vehicle_type: newVehicleType,
      rfid_tag_no: newRfid.trim() || `RFID-GE-${String(vehicles.length + 100).padStart(5, "0")}`,
      make_model: newMakeModel.trim(),
      color: newColor.trim(),
      driver_name: newDriverName.trim() || null,
      or_cr_number: newOrCrNumber.trim() || null,
      designated_parking: newDesignatedParking,
      sticker_valid_year: 2026,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setVehicles([newVehicle, ...vehicles]);
    setIsAddModalOpen(false);
    setNewPlate("");
    setNewMakeModel("");
    setNewColor("");
    setNewDriverName("");
    setNewOrCrNumber("");
    setNewRfid("");

    setNotification({
      type: "success",
      message: `Vehicle ${newVehicle.plate_number} (${newVehicle.make_model}) registered for Block ${selectedProp.block_number} Lot ${selectedProp.lot_number} with RFID ${newVehicle.rfid_tag_no}.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = (id: string) => {
    setVehicles(
      vehicles.map((v) =>
        v.id === id ? { ...v, is_active: !v.is_active } : v
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === "success"
              ? "bg-slate-900 text-white border-emerald-500"
              : "bg-rose-900 text-white border-rose-500"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Car className="w-7 h-7 text-emerald-700" />
            Vehicles & Parking Master Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered resident vehicles, vehicle types, RFID gate credentials, and lot quota enforcement.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register New Vehicle
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Registered</p>
              <p className="text-xl font-black text-slate-900">{vehicles.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">In-Garage Parked</p>
              <p className="text-xl font-black text-slate-900">{garageCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Curbside Parallel</p>
              <p className="text-xl font-black text-slate-900">{curbCount} Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">2026 RFID Stickers</p>
              <p className="text-xl font-black text-purple-900">{vehicles.filter(v => v.is_active).length} Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search plate, make, RFID, driver, lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Slot Filter */}
            <select
              value={selectedSlotType}
              onChange={(e) => setSelectedSlotType(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700"
            >
              <option value="ALL">All Parking Slots</option>
              <option value="IN_GARAGE">In Garage</option>
              <option value="CARPORT_CURB_PARALLEL">Curbside Parallel</option>
            </select>

            {/* Vehicle Type Filter */}
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="SUV">SUV</option>
              <option value="SEDAN">Sedan</option>
              <option value="VAN">Van</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="PICKUP">Pickup</option>
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="EV">Electric Vehicle (EV)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-xs">Plate Number</TableHead>
                <TableHead className="font-bold text-xs">Type</TableHead>
                <TableHead className="font-bold text-xs">Make & Model / Color</TableHead>
                <TableHead className="font-bold text-xs">Registered Driver</TableHead>
                <TableHead className="font-bold text-xs">Assigned Lot</TableHead>
                <TableHead className="font-bold text-xs">Parking Slot</TableHead>
                <TableHead className="font-bold text-xs">RFID Tag / OR-CR</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                    No vehicles found matching your query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((veh) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === veh.property_id);

                  return (
                    <TableRow key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[11px] font-bold">
                            {veh.plate_number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {veh.vehicle_type || "SUV"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-800 font-medium">
                        <div>{veh.make_model || "Unspecified"}</div>
                        <span className="text-[10px] text-slate-400">{veh.color || "Standard"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{veh.driver_name || "Homeowner"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={veh.designated_parking === "CARPORT_CURB_PARALLEL" ? "default" : "secondary"}
                          className={veh.designated_parking === "CARPORT_CURB_PARALLEL" ? "bg-amber-100 text-amber-900 border-amber-300" : ""}
                        >
                          {veh.designated_parking === "CARPORT_CURB_PARALLEL" ? "Curbside Parallel" : "In Garage"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        <div>{veh.rfid_tag_no || "No RFID"}</div>
                        {veh.or_cr_number && (
                          <span className="text-[10px] text-slate-400 font-sans block">{veh.or_cr_number}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={veh.is_active ? "default" : "destructive"}>
                          {veh.is_active ? "Active" : "Revoked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(veh.id)}
                          className="h-7 text-xs"
                        >
                          {veh.is_active ? "Deactivate" : "Activate"}
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

      {/* Registration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-400" />
                  Register Resident Vehicle
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Assign parking slot, verify property allowance, and issue gate RFID
                </CardDescription>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleRegisterVehicle} className="p-6 space-y-4 overflow-y-auto">
              {/* Property Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Assign to Property (150 Lots)</label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  required
                >
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number} ({p.unit_address})
                    </option>
                  ))}
                </select>

                {/* Quota Usage Banner for Selected Property */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  isQuotaReached
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}>
                  <div>
                    <span className="font-bold">Lot Quota Usage: </span>
                    <span>{propVehicles.length} of {propMaxAllowed} slots occupied</span>
                  </div>
                  <div className="text-[11px] font-medium">
                    Garage: {propGarageVehicles.length}/{selectedProp.carport_capacity || 2} • Curb: {propCurbVehicles.length}/{selectedProp.curb_parallel_allowance || 1}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">License Plate Number</label>
                  <Input
                    placeholder="e.g. NCD 1928"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    required
                    className="text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                    required
                  >
                    <option value="SUV">SUV / Crossover</option>
                    <option value="SEDAN">Sedan</option>
                    <option value="VAN">Van / MPV</option>
                    <option value="HATCHBACK">Hatchback</option>
                    <option value="PICKUP">Pickup Truck</option>
                    <option value="MOTORCYCLE">Motorcycle / Scooter</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Make & Model</label>
                  <Input
                    placeholder="e.g. Toyota Fortuner 2.8 LTD"
                    value={newMakeModel}
                    onChange={(e) => setNewMakeModel(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Color</label>
                  <Input
                    placeholder="e.g. Attitude Black"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Driver / Registered Name</label>
                  <Input
                    placeholder="e.g. Juan Dela Cruz"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">LTO OR/CR Number</label>
                  <Input
                    placeholder="e.g. ORCR-2026-102941"
                    value={newOrCrNumber}
                    onChange={(e) => setNewOrCrNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">RFID Tag No. (Automatic or Custom)</label>
                <Input
                  placeholder="e.g. RFID-GE-00199"
                  value={newRfid}
                  onChange={(e) => setNewRfid(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Designated Parking Slot</label>
                <select
                  value={newDesignatedParking}
                  onChange={(e) => setNewDesignatedParking(e.target.value as ParkingSlotType)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <option value="IN_GARAGE">IN_GARAGE (Inside Unit Carport)</option>
                  <option value="CARPORT_CURB_PARALLEL">
                    CARPORT_CURB_PARALLEL (Above Curb - Max {selectedProp.curb_parallel_allowance || 1})
                  </option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Confirm Registration
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
