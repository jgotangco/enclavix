"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  Car, 
  Dog, 
  MapPin, 
  Phone, 
  ShieldCheck, 
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
import { Property } from "@/types/database";

export default function GuardDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("ALL");
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

  const filteredProperties = INITIAL_PROPERTIES.filter((p) => {
    const matchesSearch =
      p.block_number.includes(searchQuery) ||
      p.lot_number.includes(searchQuery) ||
      p.unit_address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBlock = selectedBlock === "ALL" || p.block_number === selectedBlock;

    return matchesSearch && matchesBlock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-400" />
          Guard House Resident & Unit Directory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Instant contact, registered vehicle tags, and domestic pet records across all 150 enclave units.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search Block, Lot, or unit address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs font-semibold"
          />
        </div>
        <div>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white font-semibold"
          >
            <option value="ALL">All Blocks (1 to 5)</option>
            <option value="1">Block 1</option>
            <option value="2">Block 2</option>
            <option value="3">Block 3</option>
            <option value="4">Block 4</option>
            <option value="5">Block 5</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <Card className="bg-slate-950 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="font-bold text-xs text-slate-400">Unit ID</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Address</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Occupancy</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Registered Vehicles</TableHead>
                <TableHead className="font-bold text-xs text-slate-400">Domestic Pets</TableHead>
                <TableHead className="text-right font-bold text-xs text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.slice(0, 25).map((p) => {
                const vehicles = INITIAL_VEHICLES.filter((v) => v.property_id === p.id);
                const pets = INITIAL_PETS.filter((pet) => pet.property_id === p.id);

                return (
                  <TableRow key={p.id} className="border-slate-800 hover:bg-slate-900/60 transition-colors">
                    <TableCell className="font-bold text-xs text-white">
                      Block {p.block_number} Lot {p.lot_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">
                      {p.unit_address}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.occupancy === "OWNER_OCCUPIED" ? "default" : "secondary"} className="text-[10px]">
                        {p.occupancy}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-emerald-400">
                      {vehicles.length > 0 ? (
                        vehicles.map((v) => v.plate_number).join(", ")
                      ) : (
                        <span className="text-slate-500">None registered</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-amber-400">
                      {pets.length > 0 ? (
                        pets.map((pet) => `${pet.name} (${pet.species})`).join(", ")
                      ) : (
                        <span className="text-slate-500">No pets</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveProperty(p)}
                        className="h-7 text-xs bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Unit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Unit Detail Modal */}
      {activeProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Block {activeProperty.block_number} Lot {activeProperty.lot_number} Security Card
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {activeProperty.unit_address}
                </CardDescription>
              </div>
              <button onClick={() => setActiveProperty(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {/* Vehicles */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[11px]">
                  Registered Unit Vehicles (Max 1 Curb)
                </span>
                {INITIAL_VEHICLES.filter((v) => v.property_id === activeProperty.id).length === 0 ? (
                  <p className="text-slate-500 italic p-3 bg-slate-950 rounded-lg">No vehicles registered.</p>
                ) : (
                  <div className="space-y-1.5">
                    {INITIAL_VEHICLES.filter((v) => v.property_id === activeProperty.id).map((v) => (
                      <div key={v.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold font-mono text-white">{v.plate_number}</div>
                          <div className="text-slate-400">{v.make_model} ({v.color}) • {v.rfid_tag_no}</div>
                        </div>
                        <Badge variant="default" className="text-[10px]">
                          {v.designated_parking}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pets */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[11px]">
                  Domestic Pets & Rabies Status
                </span>
                {INITIAL_PETS.filter((p) => p.property_id === activeProperty.id).length === 0 ? (
                  <p className="text-slate-500 italic p-3 bg-slate-950 rounded-lg">No registered pets.</p>
                ) : (
                  <div className="space-y-1.5">
                    {INITIAL_PETS.filter((p) => p.property_id === activeProperty.id).map((p) => (
                      <div key={p.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{p.name} ({p.species})</div>
                          <div className="text-slate-400">{p.breed} • {p.color_markings}</div>
                        </div>
                        <Badge variant="default" className="text-[10px]">
                          Rabies: {p.vaccination_expiry_date || "N/A"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" onClick={() => setActiveProperty(null)} className="text-xs bg-slate-800 border-slate-700 text-white">
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
