"use client";

import { useState } from "react";
import { 
  Car, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  X,
  CreditCard,
  QrCode,
  User,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { INITIAL_VEHICLES, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Vehicle, ParkingSlotType, VehicleType } from "@/types/database";

export default function ResidentVehiclesPage() {
  // Block 2 Lot 1 property
  const myPropertyId = "b2000000-0000-0000-0000-000000000001";
  const myProperty = INITIAL_PROPERTIES.find((p) => p.id === myPropertyId) || INITIAL_PROPERTIES[0];
  const maxGarage = myProperty.carport_capacity || 2;
  const maxCurb = myProperty.curb_parallel_allowance || 1;
  const totalAllowance = maxGarage + maxCurb;

  const [vehicles, setVehicles] = useState<Vehicle[]>(
    INITIAL_VEHICLES.filter((v) => v.property_id === myPropertyId)
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SUV");
  const [makeModel, setMakeModel] = useState("");
  const [color, setColor] = useState("");
  const [driverName, setDriverName] = useState("");
  const [orCrNumber, setOrCrNumber] = useState("");
  const [designatedParking, setDesignatedParking] = useState<ParkingSlotType>("IN_GARAGE");

  const garageCount = vehicles.filter((v) => v.designated_parking === "IN_GARAGE" && v.is_active).length;
  const curbCount = vehicles.filter((v) => v.designated_parking === "CARPORT_CURB_PARALLEL" && v.is_active).length;
  const totalRegistered = garageCount + curbCount;
  const isFullCapacity = totalRegistered >= totalAllowance;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Quotas
    if (designatedParking === "CARPORT_CURB_PARALLEL" && curbCount >= maxCurb) {
      setErrorMessage(`Curbside Quota Exceeded: Your property has already registered ${curbCount}/${maxCurb} active curbside parallel vehicle(s). Only ${maxCurb} vehicle is permitted to park above your carport curb.`);
      return;
    }

    if (designatedParking === "IN_GARAGE" && garageCount >= maxGarage) {
      setErrorMessage(`Garage Quota Exceeded: Your property has reached the maximum ${maxGarage} indoor carport garage vehicles.`);
      return;
    }

    const newVeh: Vehicle = {
      id: `d0000000-0000-0000-0000-${String(vehicles.length + 90).padStart(12, "0")}`,
      property_id: myPropertyId,
      plate_number: plateNumber.toUpperCase().trim(),
      vehicle_type: vehicleType,
      rfid_tag_no: `RFID-GE-${Math.floor(10000 + Math.random() * 90000)}`,
      make_model: makeModel.trim(),
      color: color.trim(),
      driver_name: driverName.trim() || null,
      or_cr_number: orCrNumber.trim() || null,
      designated_parking: designatedParking,
      sticker_valid_year: 2026,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setVehicles([...vehicles, newVeh]);
    setIsAddModalOpen(false);
    setSuccessMessage(`Vehicle ${newVeh.plate_number} submitted! RFID Tag ${newVeh.rfid_tag_no} generated and active for Gate 1 boom barriers.`);
    setPlateNumber("");
    setMakeModel("");
    setColor("");
    setDriverName("");
    setOrCrNumber("");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-7 h-7 text-emerald-700" />
            My Registered Vehicles & Parking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block {myProperty.block_number}, Lot {myProperty.lot_number} • Unit Carport Garage & Curbside Parallel Allocation
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          disabled={isFullCapacity}
          className={`font-semibold text-xs flex items-center gap-1.5 shadow-xs ${
            isFullCapacity
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          <Plus className="w-4 h-4" /> Register Vehicle
        </Button>
      </div>

      {/* Quota Summary Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Property Vehicle Quota</span>
              <Badge variant="outline" className="bg-emerald-950 text-emerald-300 border-emerald-500 text-[10px]">
                {totalRegistered} / {totalAllowance} Slots Used
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Allocated: {maxGarage} Garage Slots + {maxCurb} Curbside Parallel Slot
            </p>
          </div>
        </div>

        {isFullCapacity ? (
          <div className="text-xs text-amber-300 font-medium bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-800/80">
            Quota full. Contact Admin to adjust lot capacity.
          </div>
        ) : (
          <div className="text-xs text-emerald-300 font-medium bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/80">
            {totalAllowance - totalRegistered} Slot(s) available for registration
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Allocation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Garage Slots */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Inside Carport Garage
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {garageCount} / {maxGarage} Slots Used
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Dedicated indoor townhouse garage bays
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {vehicles
              .filter((v) => v.designated_parking === "IN_GARAGE")
              .map((v, i) => (
                <div key={v.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {v.plate_number}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {v.vehicle_type || "SUV"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">{v.make_model} ({v.color})</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>RFID: <strong className="text-slate-600">{v.rfid_tag_no}</strong></span>
                      {v.driver_name && <span>• Driver: {v.driver_name}</span>}
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs bg-emerald-700">Garage Bay {i + 1}</Badge>
                </div>
              ))}

            {garageCount < maxGarage && (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                {maxGarage - garageCount} garage bay available for registration.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Curbside Parallel Slot */}
        <Card className="border-emerald-300 bg-emerald-50/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-emerald-100 bg-emerald-100/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Curbside Parallel Slot</span>
                <Badge variant="default" className="bg-emerald-700 text-white text-[10px]">
                  Strict 1-Curb Rule
                </Badge>
              </CardTitle>
              <Badge variant={curbCount >= maxCurb ? "default" : "outline"} className="text-xs">
                {curbCount} / {maxCurb} Allowed
              </Badge>
            </div>
            <CardDescription className="text-xs text-emerald-800">
              Parallel-parked elevated directly above unit curb
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {vehicles
              .filter((v) => v.designated_parking === "CARPORT_CURB_PARALLEL")
              .map((v) => (
                <div key={v.id} className="p-3 rounded-xl border border-emerald-200 bg-white flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {v.plate_number}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {v.vehicle_type || "SEDAN"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">{v.make_model} ({v.color})</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>RFID: <strong className="text-slate-600">{v.rfid_tag_no}</strong></span>
                      {v.driver_name && <span>• Driver: {v.driver_name}</span>}
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs bg-amber-600 text-white">
                    Curb Parallel
                  </Badge>
                </div>
              ))}

            {curbCount === 0 && (
              <p className="text-xs text-slate-500 italic p-3 bg-white rounded-lg border border-dashed border-emerald-200">
                You have 1 curbside parallel slot available for registration.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Community Parking Rules Advisory */}
      <Card className="border-slate-200 bg-slate-900 text-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Enclave Curbside & Roadway Regulations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-slate-300">
          <p>
            1. <strong>Mandatory Registration:</strong> All vehicles entering and parking in the community must be registered with plate number, type, and active RFID tag.
          </p>
          <p>
            2. <strong>Elevated Curb Positioning:</strong> The registered curbside vehicle must have wheels positioned securely on the elevated carport curb ramp to keep the central asphalt lane unobstructed for emergency services.
          </p>
          <p>
            3. <strong>No Extra Street Vehicles:</strong> Any unregistered or extra vehicle parked on the street is subject to security citation (₱500 standard fine automatically attached to monthly billing).
          </p>
        </CardContent>
      </Card>

      {/* Add Modal */}
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
                  Unit: Block {myProperty.block_number}, Lot {myProperty.lot_number}
                </CardDescription>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Plate Number</label>
                  <Input
                    placeholder="e.g. NCD 1928"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    required
                    className="text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
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
                    placeholder="e.g. Honda Civic RS"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Color</label>
                  <Input
                    placeholder="e.g. Platinum White"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Registered Driver Name</label>
                  <Input
                    placeholder="e.g. Juan Dela Cruz"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">LTO OR/CR No. (Optional)</label>
                  <Input
                    placeholder="e.g. ORCR-2026-00192"
                    value={orCrNumber}
                    onChange={(e) => setOrCrNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Designated Slot Request</label>
                <select
                  value={designatedParking}
                  onChange={(e) => setDesignatedParking(e.target.value as ParkingSlotType)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <option value="IN_GARAGE">
                    IN_GARAGE (Inside Townhouse Carport - {garageCount}/{maxGarage} Used)
                  </option>
                  <option value="CARPORT_CURB_PARALLEL">
                    CARPORT_CURB_PARALLEL (Above Curb - {curbCount >= maxCurb ? "ALLOCATION FULL" : `${maxCurb - curbCount} Available`})
                  </option>
                </select>
                {curbCount >= maxCurb && designatedParking === "CARPORT_CURB_PARALLEL" && (
                  <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-1">
                    ⚠️ You already have {curbCount} vehicle(s) under curbside parallel parking.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Register Vehicle & Request RFID
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
