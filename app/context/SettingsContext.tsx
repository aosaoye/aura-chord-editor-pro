"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { NotationType } from "../helpers/chordFormatter";

export interface GlobalSettings {
  fontFamily: string;
  alignment: string;
  fontSize: string;
  lineHeight: string;
  colorTheme: string;
  notation: NotationType;
}

const defaultSettings: GlobalSettings = {
  fontFamily: "font-sans",
  alignment: "justify-start",
  fontSize: "text-lg",
  lineHeight: "leading-[3]",
  colorTheme: "theme-violet",
  notation: "english",
};

export const themeClasses = [
   { id: "theme-amber", label: "Ámbar", bg: "bg-amber-600" },
   { id: "theme-forest", label: "Bosque", bg: "bg-emerald-700" },
   { id: "theme-blue", label: "Azul", bg: "bg-blue-600" },
   { id: "theme-red", label: "Rojo", bg: "bg-red-600" },
   { id: "theme-orange", label: "Naranja", bg: "bg-orange-600" },
   { id: "theme-cyan", label: "Cyan", bg: "bg-cyan-600" },
   { id: "theme-purple", label: "Morado", bg: "bg-purple-600" },
   { id: "theme-lime", label: "Lima", bg: "bg-lime-600" },
   { id: "theme-teal", label: "Teal", bg: "bg-teal-600" },
   { id: "theme-indigo", label: "Índigo", bg: "bg-indigo-600" },
   { id: "theme-violet", label: "Violeta", bg: "bg-violet-600" },
   { id: "theme-fuchsia", label: "Fucsia", bg: "bg-fuchsia-600" },
   { id: "theme-rose", label: "Rosa", bg: "bg-rose-600" },
   { id: "theme-slate", label: "Slate", bg: "bg-slate-600" },
   { id: "theme-gray", label: "Gris", bg: "bg-gray-600" },
   { id: "theme-zinc", label: "Zinc", bg: "bg-zinc-600" }
   ];

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

      document.documentElement.classList.remove(...themeClasses.map(t => t.id));
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
