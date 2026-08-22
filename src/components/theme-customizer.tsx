"use client";

import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunitySettings, UITheme } from "@/lib/context/community-settings";

interface ThemeOption {
  id: UITheme;
  name: string;
  subtitle: string;
  colors: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: "executive",
    name: "Executive Emerald",
    subtitle: "Admin & Official HOA theme",
    colors: ["#059669", "#047857", "#ecfdf5"],
  },
  {
    id: "treasury",
    name: "Treasury Gold",
    subtitle: "Finance & Accounting theme",
    colors: ["#d97706", "#b45309", "#fffbeb"],
  },
  {
    id: "ocean",
    name: "Ocean Azure",
    subtitle: "Resident & Homeowner theme",
    colors: ["#0284c7", "#0369a1", "#f0f9ff"],
  },
  {
    id: "tactical",
    name: "Tactical Obsidian",
    subtitle: "Security & Guard Kiosk theme",
    colors: ["#f59e0b", "#0f172a", "#1e293b"],
  },
  {
    id: "dark",
    name: "Midnight Modern",
    subtitle: "Dark Mode experience",
    colors: ["#6366f1", "#111827", "#0b0f19"],
  },
];

export function ThemeCustomizer() {
  const { settings, setTheme } = useCommunitySettings();
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = THEMES.find((t) => t.id === settings.activeTheme) || THEMES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-xs transition-all cursor-pointer"
        title="Switch UI Theme Palette"
      >
        <span
          className="w-2.5 h-2.5 rounded-full ring-1 ring-white/50 shrink-0"
          style={{ backgroundColor: activeOption.colors[0] }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-300" />
        <span className="hidden md:inline text-[11px] font-medium">{activeOption.name.split(" ")[0]}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white p-3 shadow-2xl ring-1 ring-black/10 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Persona UI Theme
              </span>
              <p className="text-xs text-slate-500">Instant workspace color palette:</p>
            </div>

            <div className="py-2 space-y-1.5">
              {THEMES.map((theme) => {
                const isSelected = settings.activeTheme === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-100 ring-1 ring-slate-300 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center -space-x-1">
                        {theme.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 leading-tight">{theme.name}</div>
                        <div className="text-[10px] text-slate-400 leading-none mt-0.5">{theme.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
