"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useGlobalSettings } from "../context/SettingsContext";
import { useTheme } from "next-themes";
import type { NotationType } from "../helpers/chordFormatter";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { settings, updateSettings, isHydrated } = useGlobalSettings();
  const { theme, setTheme } = useTheme();
  
  // Mounted state to avoid hydration mismatch when accessing next-themes
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isHydrated || !mounted) return null;

  return (
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary selection:text-white ${settings.colorTheme}`}>
      <Navbar 
      variant="default"
      />
      
      <div className="pt-36 pb-32 px-6 sm:px-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-4">
          Preferencias Globales
        </h1>
        <p className="text-sm text-muted-foreground mb-16 max-w-2xl leading-relaxed">
          Personaliza tu experiencia. Todos los ajustes de tipografía, formato y diseño se guardarán localmente y se aplicarán de forma global a tus partituras exportadas.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
          
          {/* BLOQUE: ESTÉTICA Y TEMAS */}
          <section className="flex flex-col gap-8">
            <div className="border-b border-border pb-4">
               <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">Tema Visual</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Modo de Apariencia</label>
              <div className="grid grid-cols-3 gap-2 bg-muted p-1.5 rounded-xl border border-border">
                {["system", "light", "dark"].map((t) => (
                  <button 
                    key={t} onClick={() => setTheme(t)}
                    className={`py-3 rounded-lg text-xs font-bold capitalize transition-all focus:outline-none ${theme === t ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t === "system" ? "Sistema" : t === "light" ? "Claro" : "Oscuro"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Paleta de Color (Acentos)</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "theme-violet", label: "Violeta", bg: "bg-indigo-600" },
                  { id: "theme-amber", label: "ÁMBAR", bg: "bg-amber-600" },
                  { id: "theme-forest", label: "BOSQUE", bg: "bg-emerald-700" }
                ].map((palette) => (
                  <div 
                    key={palette.id}
                    onClick={() => updateSettings({ colorTheme: palette.id })}
                    className={`cursor-pointer group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${settings.colorTheme === palette.id ? 'border-foreground bg-accent' : 'border-border bg-background hover:border-foreground/30'}`}
                  >
                     <div className={`w-8 h-8 rounded-full ${palette.bg} shadow-inner group-hover:scale-110 transition-transform`} />
                     <span className="text-[9px] font-bold tracking-widest uppercase text-center">{palette.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BLOQUE: TIPOGRAFÍA */}
          <section className="flex flex-col gap-8">
            <div className="border-b border-border pb-4">
               <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">Diseño de Partitura</h2>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Familia de Fuente</label>
               <select 
                 value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                 className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
               >
                 <option value="font-sans">Modern Sans (Defecto)</option>
                 <option value="font-serif">Classic Serif</option>
                 <option value="font-mono">Monospace Code</option>
                 <option value="font-[Arial]">Arial Clásica</option>
                 <option value="font-[Georgia]">Georgia Serif</option>
                 <option value="font-[Impact]">Impact Display</option>
               </select>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Tamaño del Texto</label>
               <select 
                 value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: e.target.value })}
                 className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
               >
                 <option value="text-sm">Pequeño (Ideal para A4 impreso)</option>
                 <option value="text-base">Normal</option>
                 <option value="text-lg">Grande (Para Tablet/Stage)</option>
                 <option value="text-xl">Extra Grande</option>
                 <option value="text-2xl">Ultra Gigante</option>
               </select>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Columnas por Página</label>
               <select 
                 value={settings.columns || 3} onChange={(e) => updateSettings({ columns: parseInt(e.target.value) })}
                 className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
               >
                 <option value={1}>1 Columna (Lineal clásico)</option>
                 <option value={2}>2 Columnas</option>
                 <option value={3}>3 Columnas (Compacto PDF)</option>
                 <option value={4}>4 Columnas (Modo Super Denso)</option>
               </select>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Espaciado y Alineación</label>
               <div className="grid grid-cols-2 gap-4">
                 <select 
                   value={settings.lineHeight} onChange={(e) => updateSettings({ lineHeight: e.target.value })}
                   className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                 >
                   <option value="leading-normal">Interlineado Estrecho</option>
                   <option value="leading-loose">Interlineado Amplio</option>
                   <option value="leading-[3]">Ultra Amplio</option>
                 </select>

                 <select 
                   value={settings.alignment} onChange={(e) => updateSettings({ alignment: e.target.value })}
                   className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
                 >
                   <option value="justify-start">Izquierda</option>
                   <option value="justify-center">Centro</option>
                   <option value="justify-end">Derecha</option>
                 </select>
               </div>
            </div>

            <div className="flex flex-col gap-3 pt-6">
               <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Sistema de Cifrado</label>
               <select 
                 value={settings.notation} onChange={(e) => updateSettings({ notation: e.target.value as NotationType })}
                 className="w-full bg-background border-b-2 border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors"
               >
                 <option value="english">Americano (C, D, E)</option>
                 <option value="spanish">Latino (Do, Re, Mi)</option>
                 <option value="roman">Grados Romanos (I, ii, V)</option>
               </select>
               <p className="text-[11px] text-muted-foreground font-medium mt-1">Este ajuste afecta a todas tus partituras existentes y futuras.</p>
            </div>

          </section>
        </div>
        
        <div className="mt-24 pt-8 border-t border-border flex justify-between items-center px-4 sm:px-0">
          <Link href="/editor" className="group flex items-center gap-4 text-primary font-bold text-sm tracking-widest uppercase hover:text-foreground transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-background transition-colors">
               &larr;
            </div>
            Volver al Estudio
          </Link>
        </div>
      </div>
    </div>
  );
}
