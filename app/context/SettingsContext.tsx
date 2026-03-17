"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { NotationType } from "../helpers/chordFormatter";

export interface GlobalSettings {
  columns: number;
  fontFamily: string;
  alignment: string;
  fontSize: string;
  lineHeight: string;
  colorTheme: string;
  notation: NotationType;
}

const defaultSettings: GlobalSettings = {
  columns: 1,
  fontFamily: "font-sans",
  alignment: "justify-start",
  fontSize: "text-lg",
  lineHeight: "leading-[3]",
  colorTheme: "theme-violet",
  notation: "english",
};

export const SettingsContext = createContext<{
  settings: GlobalSettings;
  updateSettings: (updates: Partial<GlobalSettings>) => void;
  isHydrated: boolean;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  isHydrated: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chordpro-settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Error cargando configuración guardada", e);
      }
    }
    setIsHydrated(true);
  }, []);

  const updateSettings = (updates: Partial<GlobalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("chordpro-settings", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (isHydrated) {
      // Remove all theme classes first
      const themeClasses = ['theme-violet', 'theme-amber', 'theme-forest', 'theme-default', 'theme-blue', 'theme-red', 'theme-orange', 'theme-cyan'];
      document.documentElement.classList.remove(...themeClasses);
      // Add the current color theme
      if (settings.colorTheme) {
        document.documentElement.classList.add(settings.colorTheme);
      }
    }
  }, [settings.colorTheme, isHydrated]);

  if (!isHydrated) return <div className="invisible">{children}</div>; // Prevent hydration mismatch

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isHydrated }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useGlobalSettings = () => useContext(SettingsContext);
