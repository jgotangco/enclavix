"use client";

import { useState } from "react";
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Car, 
  Dog, 
  Receipt, 
  User, 
  Edit3, 
  Plus, 
  Eye,
  CheckCircle2,
  X
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
import { INITIAL_PROPERTIES, INITIAL_VEHICLES, INITIAL_PETS } from "@/lib/data/mock-data";
import { Property, OccupancyStatus } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

export default function PropertiesMasterPage() {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<string>("ALL");
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>("ALL");
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Property>>({});
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Filter properties
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.block_number.includes(searchQuery) ||
      prop.lot_number.includes(searchQuery) ||
      prop.unit_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.notes && prop.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBlock = selectedBlock === "ALL" || prop.block_number === selectedBlock;
    const matchesOccupancy =
      selectedOccupancy === "ALL" || prop.occupancy === selectedOccupancy;

    return matchesSearch && matchesBlock && matchesOccupancy;
  });

  const getOccupancyBadge = (status: OccupancyStatus) => {
    switch (status) {
      case "OWNER_OCCUPIED":
        return <Badge variant="default">Owner Occupied</Badge>;
      case "TENANTED":
        return <Badge variant="info">Tenanted</Badge>;
      case "VACANT_LOT":
        return <Badge variant="warning">Vacant Lot</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleOpenDetail = (prop: Property) => {
    setActiveProperty(prop);
    setEditFormData(prop);
    setIsEditing(false);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProperty) return;

    const updated = properties.map((p) =>
      p.id === activeProperty.id ? { ...p, ...editFormData, updated_at: new Date().toISOString() } : p
    );
    setProperties(updated);
    setActiveProperty({ ...activeProperty, ...editFormData } as Property);
    setIsEditing(false);
    setSaveNotification(`Property Block ${activeProperty.block_number} Lot ${activeProperty.lot_number} successfully updated.`);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-700" />
            150 Lots Master Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete enclave registry of residential units with area calculations, occupancy status, and quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs px-3 py-1 font-bold">
            Total Inventory: {properties.length} Lots
          </Badge>
        </div>
      </div>

      {saveNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveNotification}
        </div>
      )}

      {/* Filter and Search Controls */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search Block, Lot, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Block Filter */}
            <div>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Blocks (1 to 8 • 150 Lots)</option>
                <option value="1">Block 1 (20 Lots)</option>
                <option value="2">Block 2 (20 Lots)</option>
                <option value="3">Block 3 (20 Lots)</option>
                <option value="4">Block 4 (20 Lots)</option>
                <option value="5">Block 5 (20 Lots)</option>
                <option value="6">Block 6 (20 Lots)</option>
                <option value="7">Block 7 (20 Lots)</option>
                <option value="8">Block 8 (10 Lots)</option>
              </select>
            </div>

            {/* Occupancy Filter */}
            <div>
              <select
                value={selectedOccupancy}
                onChange={(e) => setSelectedOccupancy(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Occupancy Types</option>
                <option value="OWNER_OCCUPIED">Owner Occupied</option>
                <option value="TENANTED">Tenanted</option>
                <option value="VACANT_LOT">Vacant Lot</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[120px] font-bold text-xs">Unit</TableHead>
                <TableHead className="font-bold text-xs">Full Address</TableHead>
                <TableHead className="font-bold text-xs">Lot Area (m²)</TableHead>
                <TableHead className="font-bold text-xs">Estimated Monthly Dues</TableHead>
                <TableHead className="font-bold text-xs">Occupancy</TableHead>
                <TableHead className="font-bold text-xs">Vehicles / Pets</TableHead>
                <TableHead className="text-right font-bold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No properties match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((prop) => {
                  const estDues = prop.lot_area_sqm * 25 + 500 + 300;
                  const unitVehicles = INITIAL_VEHICLES.filter((v) => v.property_id === prop.id);
                  const unitPets = INITIAL_PETS.filter((p) => p.property_id === prop.id);

                  return (
                    <TableRow key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Blk {prop.block_number} Lot {prop.lot_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {prop.unit_address}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop.lot_area_sqm} m²
                        <span className="text-[10px] text-slate-400 block font-normal">Floor: {prop.floor_area_sqm || "—"} m²</span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-800">
                        {formatCurrency(estDues)}
                        <span className="text-[10px] text-slate-400 block font-normal">₱25/m² + Base Fees</span>
                      </TableCell>
                      <TableCell>{getOccupancyBadge(prop.occupancy)}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-slate-700">
                            <Car className="w-3.5 h-3.5 text-sky-700" /> {unitVehicles.length}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <Dog className="w-3.5 h-3.5 text-amber-700" /> {unitPets.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(prop)}
                          className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Lot
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

      {/* Lot Detail Modal / Drawer */}
      {activeProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white shadow-2xl border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                    Block {activeProperty.block_number} Lot {activeProperty.lot_number}
                  </Badge>
                  {getOccupancyBadge(activeProperty.occupancy)}
                </div>
                <CardTitle className="text-lg font-bold text-white mt-1">
                  Property Master Profile
                </CardTitle>
              </div>
              <button
                onClick={() => setActiveProperty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto flex-1 space-y-6">
              {!isEditing ? (
                <>
                  {/* Basic Specifications */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Lot Area:</span>
                      <span className="font-bold text-slate-900 text-sm">{activeProperty.lot_area_sqm} m²</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Floor Area:</span>
                      <span className="font-bold text-slate-900 text-sm">{activeProperty.floor_area_sqm || "N/A"} m²</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Carport Garage:</span>
                      <span className="font-bold text-slate-900 text-sm">{activeProperty.carport_capacity} Slots</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Curb Allowance:</span>
                      <span className="font-bold text-emerald-700 text-sm">{activeProperty.curb_parallel_allowance} Parallel Max</span>
                    </div>
                  </div>

                  {/* Monthly Dues Computation Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-700" />
                      Monthly Association Dues Formula
                    </h4>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Lot Area Dues ({activeProperty.lot_area_sqm} m² × ₱25.00):</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(activeProperty.lot_area_sqm * 25)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Maintenance Fee:</span>
                        <span className="font-semibold text-slate-900">₱500.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Mother Subdivision Association Dues:</span>
                        <span className="font-semibold text-slate-900">₱300.00</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-bold text-emerald-900 text-sm">
                        <span>Standard Monthly Bill:</span>
                        <span>{formatCurrency(activeProperty.lot_area_sqm * 25 + 500 + 300)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Vehicles */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-sky-700" />
                      Registered Vehicles for Unit
                    </h4>
                    {INITIAL_VEHICLES.filter((v) => v.property_id === activeProperty.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                        No vehicles registered yet for this property.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {INITIAL_VEHICLES.filter((v) => v.property_id === activeProperty.id).map((veh) => (
                          <div key={veh.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{veh.plate_number} • {veh.make_model}</div>
                              <div className="text-[10px] text-slate-500">RFID: {veh.rfid_tag_no || "None"}</div>
                            </div>
                            <Badge variant={veh.designated_parking === "CARPORT_CURB_PARALLEL" ? "default" : "secondary"}>
                              {veh.designated_parking === "CARPORT_CURB_PARALLEL" ? "Curbside Parallel" : "In Garage"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registered Pets */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Dog className="w-4 h-4 text-amber-700" />
                      Registered Domestic Pets
                    </h4>
                    {INITIAL_PETS.filter((p) => p.property_id === activeProperty.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                        No domestic pets registered for this unit.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {INITIAL_PETS.filter((p) => p.property_id === activeProperty.id).map((pet) => (
                          <div key={pet.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{pet.name} ({pet.species}) - {pet.breed}</div>
                              <div className="text-[10px] text-slate-500">Rabies Expiry: {pet.vaccination_expiry_date || "Unknown"}</div>
                            </div>
                            <Badge variant={pet.is_vaccinated ? "default" : "destructive"}>
                              {pet.is_vaccinated ? "Vaccinated" : "Unvaccinated"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {activeProperty.notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-900">
                      <strong>Remarks:</strong> {activeProperty.notes}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setActiveProperty(null)} className="text-xs">
                      Close
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Unit Parameters
                    </Button>
                  </div>
                </>
              ) : (
                /* Edit Mode Form */
                <form onSubmit={handleSaveProperty} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Lot Area (m²)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.lot_area_sqm || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, lot_area_sqm: parseFloat(e.target.value) || 0 })}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Floor Area (m²)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.floor_area_sqm || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, floor_area_sqm: parseFloat(e.target.value) || 0 })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Occupancy Status</label>
                      <select
                        value={editFormData.occupancy || "OWNER_OCCUPIED"}
                        onChange={(e) => setEditFormData({ ...editFormData, occupancy: e.target.value as OccupancyStatus })}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                      >
                        <option value="OWNER_OCCUPIED">Owner Occupied</option>
                        <option value="TENANTED">Tenanted</option>
                        <option value="VACANT_LOT">Vacant Lot</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Garage Slots Capacity</label>
                      <Input
                        type="number"
                        min="1"
                        max="6"
                        value={editFormData.carport_capacity ?? 2}
                        onChange={(e) => setEditFormData({ ...editFormData, carport_capacity: parseInt(e.target.value) || 2 })}
                        className="text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Curbside Parallel Allowance</label>
                      <Input
                        type="number"
                        min="0"
                        max="3"
                        value={editFormData.curb_parallel_allowance ?? 1}
                        onChange={(e) => setEditFormData({ ...editFormData, curb_parallel_allowance: parseInt(e.target.value) || 1 })}
                        className="text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-between text-xs text-sky-900 font-semibold">
                    <span>Total Allowed Vehicles for this Unit:</span>
                    <span className="px-2 py-0.5 bg-sky-600 text-white rounded-md text-xs">
                      {(editFormData.carport_capacity ?? 2) + (editFormData.curb_parallel_allowance ?? 1)} Vehicles Max
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Address Details</label>
                    <Input
                      value={editFormData.unit_address || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, unit_address: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Notes / Resident Remarks</label>
                    <Input
                      value={editFormData.notes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="e.g. Corner lot, President residence..."
                      className="text-xs"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
