"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UITheme = "executive" | "treasury" | "ocean" | "tactical" | "dark";

export interface CommunitySettings {
  villageName: string;
  motherVillageName: string;
  enclaveAddress: string;
  contactPhone: string;
  guardHousePhone: string;
  emergencyHotline: string;
  currencySymbol: string;
  baseRatePerSqm: number;
  baseMonthlyFee: number;
  motherVillageFee: number;
  defaultCarportCapacity: number;
  defaultCurbAllowance: number;
  activeTheme: UITheme;
}

const DEFAULT_SETTINGS: CommunitySettings = {
  villageName: "Grand Enclave Residences",
  motherVillageName: "Premier Subdivision",
  enclaveAddress: "100 Enclave Boulevard, Metro Manila, Philippines",
  contactPhone: "+63 2 8800 1000",
  guardHousePhone: "+63 2 8800 1001",
  emergencyHotline: "+63 917 800 9000",
  currencySymbol: "₱",
  baseRatePerSqm: 25,
  baseMonthlyFee: 500,
  motherVillageFee: 300,
  defaultCarportCapacity: 2,
  defaultCurbAllowance: 1,
  activeTheme: "executive",
};

interface CommunitySettingsContextType {
  settings: CommunitySettings;
  updateSettings: (newSettings: Partial<CommunitySettings>) => void;
  setTheme: (theme: UITheme) => void;
  resetToDefaults: () => void;
}

const CommunitySettingsContext = createContext<CommunitySettingsContextType | undefined>(undefined);

const STORAGE_KEY = "enclave_hoa_settings_v2";

export function CommunitySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CommunitySettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      // Clear legacy storage keys if present
      localStorage.removeItem("m_residences_community_settings");
      localStorage.removeItem("community_settings");

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If old legacy name was cached, overwrite with new generic default
        if (parsed.villageName?.includes("M-Residences") || parsed.motherVillageName?.includes("Alpha Village")) {
          setSettings(DEFAULT_SETTINGS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        } else {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.warn("Failed to load community settings from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const applyThemeToDOM = (theme: UITheme) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "tactical") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applyThemeToDOM(settings.activeTheme);
    } catch (e) {
      console.warn("Failed to save community settings to localStorage:", e);
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<CommunitySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.activeTheme) {
        applyThemeToDOM(newSettings.activeTheme);
      }
      return updated;
    });
  };

  const setTheme = (theme: UITheme) => {
    applyThemeToDOM(theme);
    setSettings((prev) => ({ ...prev, activeTheme: theme }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <CommunitySettingsContext.Provider
      value={{
        settings,
        updateSettings,
        setTheme,
        resetToDefaults,
      }}
    >
      {children}
    </CommunitySettingsContext.Provider>
  );
}

export function useCommunitySettings() {
  const context = useContext(CommunitySettingsContext);
  if (!context) {
    throw new Error("useCommunitySettings must be used within a CommunitySettingsProvider");
  }
  return context;
}
