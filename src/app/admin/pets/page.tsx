"use client";

import { useState } from "react";
import { 
  Dog, 
  Search, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  Calendar,
  X,
  Eye
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
import { INITIAL_PETS, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Pet, PetSpecies } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function AdminPetsPage() {
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("ALL");
  const [activePetDoc, setActivePetDoc] = useState<Pet | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [newPropertyId, setNewPropertyId] = useState(INITIAL_PROPERTIES[0].id);
  const [newName, setNewName] = useState("");
  const [newSpecies, setNewSpecies] = useState<PetSpecies>("DOG");
  const [newBreed, setNewBreed] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newVaccineUrl, setNewVaccineUrl] = useState("https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600");

  const today = new Date("2026-08-22");

  // Helper to check 30-day expiration
  const getVaccineStatus = (pet: Pet) => {
    if (!pet.is_vaccinated || !pet.vaccination_expiry_date) {
      return { label: "Unvaccinated", variant: "destructive" as const, daysLeft: -999 };
    }
    const expiry = new Date(pet.vaccination_expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, variant: "destructive" as const, daysLeft: diffDays };
    } else if (diffDays <= 30) {
      return { label: `Expires in ${diffDays} days`, variant: "warning" as const, daysLeft: diffDays };
    } else {
      return { label: "Vaccinated (Valid)", variant: "default" as const, daysLeft: diffDays };
    }
  };

  const expiringPets = pets.filter((p) => {
    const status = getVaccineStatus(p);
    return status.daysLeft >= 0 && status.daysLeft <= 30;
  });

  const expiredPets = pets.filter((p) => {
    const status = getVaccineStatus(p);
    return status.daysLeft < 0;
  });

  const filteredPets = pets.filter((p) => {
    const prop = INITIAL_PROPERTIES.find((prop) => prop.id === p.property_id);
    const propLabel = prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "";

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.breed && p.breed.toLowerCase().includes(searchQuery.toLowerCase())) ||
      propLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecies = selectedSpecies === "ALL" || p.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

  const handleRegisterPet = (e: React.FormEvent) => {
    e.preventDefault();

    const newPet: Pet = {
      id: `e0000000-0000-0000-0000-${String(pets.length + 1).padStart(12, "0")}`,
      property_id: newPropertyId,
      owner_id: "c0000000-0000-0000-0000-000000000001",
      name: newName.trim(),
      species: newSpecies,
      breed: newBreed.trim(),
      color_markings: newColor.trim(),
      is_vaccinated: !!newExpiry,
      vaccination_expiry_date: newExpiry || null,
      vaccine_card_url: newVaccineUrl,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPets([newPet, ...pets]);
    setIsAddModalOpen(false);
    setNotification(`Domestic pet ${newPet.name} registered with anti-rabies certificate.`);
    setTimeout(() => setNotification(null), 3500);

    setNewName("");
    setNewBreed("");
    setNewColor("");
    setNewExpiry("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Dog className="w-7 h-7 text-emerald-700" />
            Domestic Pet Registry & Rabies Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Governs domesticated pets compliance, mandatory anti-rabies certification, and waste policies.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Register Domestic Pet
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Expiry Warning Banner if Any Expiring Pets */}
      {(expiringPets.length > 0 || expiredPets.length > 0) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-xs">Anti-Rabies Certificate Attention Required:</span>
              <p className="text-xs text-amber-800">
                {expiringPets.length} pet(s) have certificates expiring within 30 days. {expiredPets.length} pet(s) with expired certificates.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="text-xs self-start sm:self-auto">
            Action: Automated Notices Sent
          </Badge>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Domestic Pets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pets.length} Pets</div>
            <p className="text-xs text-slate-500 mt-1">Dogs, cats & domesticated companions</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-emerald-50/40 border-emerald-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Rabies Certified Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {pets.filter((p) => getVaccineStatus(p).variant === "default").length} / {pets.length}
            </div>
            <p className="text-xs text-emerald-700 mt-1">100% compliant with annual inoculation</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-amber-50/40 border-amber-200/60">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Expiring Soon (30d) / Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {expiringPets.length + expiredPets.length} Pets
            </div>
            <p className="text-xs text-amber-700 mt-1">Automatic renewal alerts active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search pet name, breed, or Block/Lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Species (Dogs & Cats)</option>
                <option value="DOG">Dogs</option>
                <option value="CAT">Cats</option>
                <option value="OTHER_DOMESTICATED">Other Domesticated</option>
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
                <TableHead className="font-bold text-xs">Pet Name</TableHead>
                <TableHead className="font-bold text-xs">Species & Breed</TableHead>
                <TableHead className="font-bold text-xs">Color / Markings</TableHead>
                <TableHead className="font-bold text-xs">Property Location</TableHead>
                <TableHead className="font-bold text-xs">Rabies Vaccine Status</TableHead>
                <TableHead className="font-bold text-xs">Expiry Date</TableHead>
                <TableHead className="text-right font-bold text-xs">Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No registered pets found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPets.map((pet) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === pet.property_id);
                  const status = getVaccineStatus(pet);

                  return (
                    <TableRow key={pet.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-xs text-slate-900">
                        {pet.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-800">
                        <span className="font-semibold">{pet.species}</span>
                        <span className="text-[10px] text-slate-500 block">{pet.breed || "Standard Breed"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {pet.color_markings || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {prop ? `Block ${prop.block_number} Lot ${prop.lot_number}` : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {pet.vaccination_expiry_date ? formatDate(pet.vaccination_expiry_date) : "No record"}
                      </TableCell>
                      <TableCell className="text-right">
                        {pet.vaccine_card_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActivePetDoc(pet)}
                            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Card
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No File</span>
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

      {/* Vaccine Card Preview Modal */}
      {activePetDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Anti-Rabies Certificate: {activePetDoc.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {activePetDoc.species} • {activePetDoc.breed}
                </CardDescription>
              </div>
              <button onClick={() => setActivePetDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePetDoc.vaccine_card_url!}
                  alt={`Rabies certificate for ${activePetDoc.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vaccine Expiration:</span>
                  <span className="font-bold text-slate-900">{formatDate(activePetDoc.vaccination_expiry_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compliance Status:</span>
                  <span className="text-emerald-700 font-bold">Verified Domestic Inoculation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Pet Modal */}
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
                  Domesticated animals only (Dogs, Cats) with mandatory Rabies Card
                </CardDescription>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleRegisterPet} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Assign to Property</label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  required
                >
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pet Name</label>
                  <Input
                    placeholder="e.g. Bella"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Domestic Species</label>
                  <select
                    value={newSpecies}
                    onChange={(e) => setNewSpecies(e.target.value as PetSpecies)}
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
                    placeholder="e.g. Labrador / Persian"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Color / Markings</label>
                  <Input
                    placeholder="e.g. Chocolate / White paw"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Annual Rabies Vaccine Expiry Date</label>
                <Input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
                  Register Pet
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
