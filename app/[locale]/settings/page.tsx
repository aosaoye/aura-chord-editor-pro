"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useGlobalSettings, themeClasses } from "../context/SettingsContext";
import { useTheme } from "next-themes";
import type { NotationType } from "../helpers/chordFormatter";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, isHydrated } = useGlobalSettings();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isHydrated || !mounted) return null;

  const selectClasses = "w-full bg-transparent border-b border-border py-3 text-sm font-medium text-foreground outline-none focus:border-primary cursor-pointer transition-colors appearance-none pr-8 relative";

  return (
    <div className={`min-h-[100svh] bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary/30 selection:text-foreground ${settings.colorTheme}`}>
      <Navbar variant="border" />
      
      <div className="pt-36 pb-32 px-6 md:px-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-6 text-foreground leading-none">
          Preferencias <span className="font-serif italic font-bold">Globales</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-20 max-w-2xl leading-relaxed border-l-[1px] border-border pl-4">
          Personaliza tu experiencia de composición. Todos los ajustes de tipografía, formato y diseño se guardarán localmente en este entorno y se aplicarán de forma global a tus proyectos.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-32">
          
          {/* BLOQUE: ESTÉTICA Y TEMAS */}
          <section className="flex flex-col gap-10">
            <div className="border-b border-border pb-4">
               <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted-foreground">Tema Visual</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              <label className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Modo de Apariencia</label>
              <div className="flex bg-foreground/5 p-1 rounded-full border border-border w-full">
                {["system", "light", "dark"].map((t) => (
                  <button 
                    key={t} onClick={() => setTheme(t)}
                    className={`flex-1 py-3 px-4 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all focus:outline-none ${theme === t ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 border border-transparent' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t === "system" ? "Sistema" : t === "light" ? "Claro" : "Oscuro"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Acentos del Sistema</label>
              <div className="grid grid-cols-2 gap-4">
                {themeClasses.map((palette) => (
                  <div 
                    key={palette.id}
                    onClick={() => updateSettings({ colorTheme: palette.id })}
                    className={`cursor-pointer group flex items-center gap-4 py-3 px-4 rounded-full border transition-all duration-300 ${settings.colorTheme === palette.id ? 'border-primary bg-primary/5' : 'border-border bg-foreground/5 hover:border-foreground/20 hover:bg-foreground/10'}`}
                  >
                     <div className={`w-3 h-3 rounded-full ${palette.bg} shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-transform duration-300`} />
                     <span className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${settings.colorTheme === palette.id ? 'text-primary' : 'text-muted-foreground'}`}>
                       {palette.label}
                     </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BLOQUE: TIPOGRAFÍA Y DISEÑO */}
          <section className="flex flex-col gap-10">
            <div className="border-b border-border pb-4">
               <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted-foreground">Diseño de Partitura</h2>
            </div>

            <div className="flex items-center gap-6">
               <div className="w-1/3">
                 <label className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Tipografía</label>
               </div>
               <div className="w-2/3 relative">
                 <select 
                   value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                   className={selectClasses}
                 >
                   <option value="font-sans" className="bg-[#05060A]">Modern Sans (Por Defecto)</option>
                   <option value="font-serif" className="bg-[#05060A]">Classic Serif</option>
                   <option value="font-mono" className="bg-[#05060A]">Monospace Code</option>
                   <option value="font-[Arial]" className="bg-[#05060A]">Arial Clásica</option>
                   <option value="font-[Georgia]" className="bg-[#05060A]">Georgia Serif</option>
                 </select>
                 <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none text-[10px]">▼</span>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="w-1/3">
                 <label className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Tamaño Base</label>
               </div>
               <div className="w-2/3 relative">
                 <select 
                   value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: e.target.value })}
                   className={selectClasses}
                 >
                   <option value="text-sm" className="bg-[#05060A]">A4 (Impreso)</option>
                   <option value="text-base" className="bg-[#05060A]">Estándar</option>
                   <option value="text-lg" className="bg-[#05060A]">Grande (Display)</option>
                   <option value="text-xl" className="bg-[#05060A]">Extra Grande</option>
                   <option value="text-2xl" className="bg-[#05060A]">Jumbo</option>
                 </select>
                 <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none text-[10px]">▼</span>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="w-1/3">
                 <label className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase leading-relaxed">Lectura y Espaciado</label>
               </div>
               <div className="w-2/3 grid grid-cols-2 gap-4">
                 <div className="relative">
                   <select 
                     value={settings.lineHeight} onChange={(e) => updateSettings({ lineHeight: e.target.value })}
                     className={selectClasses}
                   >
                     <option value="leading-normal" className="bg-[#05060A]">Estrecho</option>
                     <option value="leading-loose" className="bg-[#05060A]">Amplio</option>
                     <option value="leading-[3]" className="bg-[#05060A]">Ultra</option>
                   </select>
                   <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none text-[10px]">▼</span>
                 </div>
                 <div className="relative">
                   <select 
                     value={settings.alignment} onChange={(e) => updateSettings({ alignment: e.target.value })}
                     className={selectClasses}
                   >
                     <option value="justify-start" className="bg-[#05060A]">Izquierda</option>
                     <option value="justify-center" className="bg-[#05060A]">Centro</option>
                     <option value="justify-end" className="bg-[#05060A]">Derecha</option>
                   </select>
                   <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none text-[10px]">▼</span>
                 </div>
               </div>
            </div>

            <div className="flex items-start gap-6 border-t border-border pt-10 mt-6 relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen"></div>
               
               <div className="w-1/3 relative z-10">
                 <label className="text-[9px] font-bold tracking-[0.3em] text-primary uppercase flex flex-col gap-1">
                   <span>Notación</span>
                   <span>Global</span>
                 </label>
               </div>
               
               <div className="w-2/3 relative z-10 flex flex-col gap-4">
                 <div className="relative">
                   <select 
                     value={settings.notation} onChange={(e) => updateSettings({ notation: e.target.value as NotationType })}
                     className={selectClasses}
                   >
                     <option value="english" className="bg-[#05060A]">Americano (C, D, E)</option>
                     <option value="spanish" className="bg-[#05060A]">Latino (Do, Re, Mi)</option>
                     <option value="roman" className="bg-[#05060A]">Grados Romanos (I, ii, V)</option>
                   </select>
                   <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none text-[10px]">▼</span>
                 </div>
                 <p className="text-[8px] text-muted-foreground leading-relaxed mt-2 max-w-xs font-mono">
                   Este es el núcleo de transcripción. Alterar el sistema afectará la visibilidad en todos tus proyectos visuales.
                 </p>
               </div>
            </div>

          </section>
        </div>
        
        {/* ACTION / BACK BOTONES */}
        <div className="mt-32 flex justify-center">
           <Link href="/editor" className="group rounded-full p-4 border border-border bg-foreground/5 hover:bg-foreground/10 hover:border-border/50 text-foreground transition-all duration-500 shadow-xl overflow-hidden relative">
              <span className="sr-only">Volver al Estudio</span>
              <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-2 transition-transform duration-500" strokeWidth={1} />
           </Link>
        </div>
      </div>
    </div>
  );
}
