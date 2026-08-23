"use client";

import { useState } from "react";
import { 
  Dog, 
  Plus, 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  X,
  Eye,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { INITIAL_PETS } from "@/lib/data/mock-data";
import { Pet, PetSpecies } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function ResidentPetsPage() {
  const myPropertyId = "b2000000-0000-0000-0000-000000000001";
  const [pets, setPets] = useState<Pet[]>(
    INITIAL_PETS.filter((p) => p.property_id === myPropertyId)
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPetDoc, setSelectedPetDoc] = useState<Pet | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("DOG");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [vaccineExpiry, setVaccineExpiry] = useState("");

  const today = new Date("2026-08-22");

  const getPetVaccineBadge = (pet: Pet) => {
    if (!pet.vaccination_expiry_date) return <Badge variant="destructive">Unvaccinated</Badge>;
    const exp = new Date(pet.vaccination_expiry_date);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="destructive">Expired {Math.abs(diffDays)}d ago</Badge>;
    } else if (diffDays <= 30) {
      return <Badge variant="warning">Renewal Due in {diffDays}d</Badge>;
    } else {
      return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Vaccinated (Valid)</Badge>;
    }
  };

  const handleRegisterPet = (e: React.FormEvent) => {
    e.preventDefault();

    const newPet: Pet = {
      id: `e0000000-0000-0000-0000-${String(pets.length + 50).padStart(12, "0")}`,
      property_id: myPropertyId,
      owner_id: "c0000000-0000-0000-0000-000000000004",
      name: petName.trim(),
      species,
      breed: breed.trim(),
      color_markings: color.trim(),
      is_vaccinated: !!vaccineExpiry,
      vaccination_expiry_date: vaccineExpiry || null,
      vaccine_card_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPets([...pets, newPet]);
    setIsAddModalOpen(false);
    setSuccessMessage(`Domestic pet ${newPet.name} registered and submitted for security verification.`);
    setPetName("");
    setBreed("");
    setColor("");
    setVaccineExpiry("");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Dog className="w-7 h-7 text-emerald-700" />
            My Domestic Pets & Health Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Block 2, Lot 1 • Domesticated Pets Registry & Anti-Rabies Compliance
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Register New Pet
        </Button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Pet Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pets.map((pet) => (
          <Card key={pet.id} className="border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Dog className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">{pet.name}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {pet.species} • {pet.breed || "Standard"}
                    </CardDescription>
                  </div>
                </div>
                {getPetVaccineBadge(pet)}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Color Markings</span>
                  <span className="font-semibold text-slate-900">{pet.color_markings || "—"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Vaccine Expiration</span>
                  <span className="font-semibold text-slate-900">{formatDate(pet.vaccination_expiry_date)}</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {pet.vaccine_card_url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPetDoc(pet)}
                    className="text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Rabies Card
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">No card uploaded</span>
                )}
                <Button size="sm" variant="outline" className="text-xs">
                  <Upload className="w-3.5 h-3.5 mr-1" /> Update Vaccine
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Pet Rules Card */}
      <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Enclave Domestic Pet & Waste Disposal Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-emerald-900 leading-relaxed">
          <p>
            • <strong>Leash & Waste Bag Policy:</strong> All dogs must be on a handheld leash in village roads and parkway green strips. Handlers must carry waste scoop bags at all times.
          </p>
          <p>
            • <strong>Pool Prohibition:</strong> Domestic pets are strictly forbidden on the Clubhouse swimming pool deck or pool water for sanitary reasons.
          </p>
          <p>
            • <strong>Automatic Fines:</strong> Security cameras and patrol officers log uncollected waste citations with photographic evidence. Confirmed violations attach a ₱500 fine to the next monthly dues statement.
          </p>
        </CardContent>
      </Card>

      {/* Document Modal */}
      {selectedPetDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold text-white">
                Rabies Vaccine Certificate: {selectedPetDoc.name}
              </CardTitle>
              <button onClick={() => setSelectedPetDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPetDoc.vaccine_card_url!}
                  alt={`Rabies certificate for ${selectedPetDoc.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-bold text-slate-900">{formatDate(selectedPetDoc.vaccination_expiry_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Dog className="w-5 h-5 text-emerald-400" />
                  Register Domestic Pet
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Unit: Block 2, Lot 1
                </CardDescription>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleRegisterPet} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pet Name</label>
                  <Input
                    placeholder="e.g. Max"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Species</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as PetSpecies)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="DOG">Dog (Domesticated)</option>
                    <option value="CAT">Cat (Domesticated)</option>
                    <option value="OTHER_DOMESTICATED">Other Domesticated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Breed</label>
                  <Input
                    placeholder="e.g. Beagle / Corgi"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Color / Markings</label>
                  <Input
                    placeholder="e.g. Tricolor / Black ears"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Annual Anti-Rabies Vaccination Expiry</label>
                <Input
                  type="date"
                  value={vaccineExpiry}
                  onChange={(e) => setVaccineExpiry(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                  Submit Registration
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
