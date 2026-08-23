"use client";

import { useState } from "react";
import { 
  Settings, 
  Building2, 
  Phone, 
  Receipt, 
  Palette, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCommunitySettings, UITheme } from "@/lib/context/community-settings";

export default function AdminSettingsPage() {
  const { settings, updateSettings, setTheme, resetToDefaults } = useCommunitySettings();

  // Form State initialized from context
  const [villageName, setVillageName] = useState(settings.villageName);
  const [motherVillageName, setMotherVillageName] = useState(settings.motherVillageName);
  const [enclaveAddress, setEnclaveAddress] = useState(settings.enclaveAddress);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [guardHousePhone, setGuardHousePhone] = useState(settings.guardHousePhone);
  const [emergencyHotline, setEmergencyHotline] = useState(settings.emergencyHotline);
  const [baseRatePerSqm, setBaseRatePerSqm] = useState(settings.baseRatePerSqm);
  const [baseMonthlyFee, setBaseMonthlyFee] = useState(settings.baseMonthlyFee);
  const [motherVillageFee, setMotherVillageFee] = useState(settings.motherVillageFee);
  const [activeTheme, setActiveThemeState] = useState<UITheme>(settings.activeTheme);

  const [notification, setNotification] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      villageName,
      motherVillageName,
      enclaveAddress,
      contactPhone,
      guardHousePhone,
      emergencyHotline,
      baseRatePerSqm: Number(baseRatePerSqm),
      baseMonthlyFee: Number(baseMonthlyFee),
      motherVillageFee: Number(motherVillageFee),
      activeTheme,
    });

    setNotification("Community branding, contact hotlines, and theme settings saved successfully!");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReset = () => {
    if (confirm("Reset all settings and village branding to factory defaults?")) {
      resetToDefaults();
      setVillageName("Grand Enclave Residences");
      setMotherVillageName("Premier Subdivision");
      setEnclaveAddress("100 Enclave Boulevard, Metro Manila, Philippines");
      setContactPhone("+63 2 8800 1000");
      setGuardHousePhone("+63 2 8800 1001");
      setEmergencyHotline("+63 917 800 9000");
      setBaseRatePerSqm(25);
      setBaseMonthlyFee(500);
      setMotherVillageFee(300);
      setActiveThemeState("executive");
      setNotification("Settings restored to defaults.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white border border-emerald-500 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-700" />
            Community Branding & System Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Enclave name, Mother subdivision identity, contact hotlines, dues formulas, and persona themes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="text-xs h-9 text-slate-600 hover:text-rose-600"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Enclave Identity & Village Name */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Enclave Branding & Subdivision Identity
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Changes to the village name update dynamically across all resident receipts, visitor gate passes, and portal headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Enclave / Village Name</Label>
                <Input
                  required
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="e.g. Grand Enclave Residences"
                  className="h-9 text-xs font-semibold text-slate-900"
                />
                <p className="text-[11px] text-slate-400">Primary community name displayed to all users.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Mother Enclave / Main Subdivision</Label>
                <Input
                  required
                  value={motherVillageName}
                  onChange={(e) => setMotherVillageName(e.target.value)}
                  placeholder="e.g. Premier Subdivision"
                  className="h-9 text-xs font-semibold text-slate-900"
                />
                <p className="text-[11px] text-slate-400">Outer perimeter gate and dual-gate access authority.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Official Physical Address</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  required
                  value={enclaveAddress}
                  onChange={(e) => setEnclaveAddress(e.target.value)}
                  placeholder="100 Enclave Boulevard, Metro Manila"
                  className="pl-9 h-9 text-xs text-slate-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact Numbers & Guardhouse Hotlines */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-700" />
              Emergency Hotlines & Security Communication
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Published on resident portal quick emergency dials and gate clearance notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Administration Office</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+63 2 8920 0000"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Gate 1 Guardhouse Intercom</Label>
              <Input
                value={guardHousePhone}
                onChange={(e) => setGuardHousePhone(e.target.value)}
                placeholder="+63 2 8920 0001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">24/7 Security Emergency Mobile</Label>
              <Input
                value={emergencyHotline}
                onChange={(e) => setEmergencyHotline(e.target.value)}
                placeholder="+63 917 123 4567"
                className="h-9 text-xs font-bold text-rose-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Persona Themes Customization */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-700" />
              Persona UI Themes & Palette Engine
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Select the active color theme applied to navigation, buttons, and badges.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "executive", name: "Executive Emerald", desc: "Admin & Executive Console", color: "bg-emerald-700" },
                { id: "treasury", name: "Treasury Gold", desc: "Treasurer Finance & Billing", color: "bg-amber-600" },
                { id: "ocean", name: "Ocean Azure", desc: "Resident & Homeowner Portal", color: "bg-sky-600" },
                { id: "tactical", name: "Tactical Obsidian", desc: "Guardhouse Security Kiosk", color: "bg-slate-900 border-amber-500" },
                { id: "dark", name: "Midnight Modern", desc: "High Contrast Dark Palette", color: "bg-indigo-900" },
              ].map((theme) => {
                const isSelected = activeTheme === theme.id;

                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setActiveThemeState(theme.id as UITheme);
                      setTheme(theme.id as UITheme);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full ${theme.color} shadow-xs border`} />
                        <span className="font-bold text-slate-900">{theme.name}</span>
                      </div>
                      {isSelected && <Badge variant="default" className="text-[9px]">Active</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">{theme.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Dues Formula Settings */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              Dues & Financial Rate Formulas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Governs the monthly automated billing calculation engine for all 150 lots.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Rate per m² (₱)</Label>
              <Input
                type="number"
                step="0.5"
                value={baseRatePerSqm}
                onChange={(e) => setBaseRatePerSqm(Number(e.target.value))}
                className="h-9 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400">Multiplied by lot area (e.g. 260 m² × ₱25 = ₱6,500).</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Base Enclave Maintenance (₱)</Label>
              <Input
                type="number"
                value={baseMonthlyFee}
                onChange={(e) => setBaseMonthlyFee(Number(e.target.value))}
                className="h-9 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400">Fixed monthly upkeep & clubhouse electricity.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Mother Village Passthrough (₱)</Label>
              <Input
                type="number"
                value={motherVillageFee}
                onChange={(e) => setMotherVillageFee(Number(e.target.value))}
                className="h-9 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400">Remitted to mother subdivision main gate security.</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Vehicle & Parking Quota Policies */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Vehicle Registration & Parking Quota Policies
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Set standard default allowances for vehicles per property across all 150 lots. Custom allowances can be fine-tuned per lot.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Default Garage Carport Capacity</Label>
              <Input
                type="number"
                min="1"
                max="6"
                value={settings.defaultCarportCapacity || 2}
                onChange={(e) => updateSettings({ defaultCarportCapacity: Number(e.target.value) })}
                className="h-9 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400">Standard covered parking capacity inside property boundary.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Default Curbside Parallel Allowance</Label>
              <Input
                type="number"
                min="0"
                max="2"
                value={settings.defaultCurbAllowance || 1}
                onChange={(e) => updateSettings({ defaultCurbAllowance: Number(e.target.value) })}
                className="h-9 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400">Allowed vehicle directly parallel above carport curb.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Total Standard Quota per Lot</Label>
              <div className="h-9 px-3 bg-slate-100 rounded-md flex items-center font-bold text-slate-800 text-sm">
                {(settings.defaultCarportCapacity || 2) + (settings.defaultCurbAllowance || 1)} Vehicles Max
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">All vehicles must be registered in the system before gate RFID issuance.</p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
