"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronsUpDown, 
  Minus, 
  Plus, 
  Music, 
  Settings2, 
  LayoutGrid, 
  ListPlus, 
  Activity, 
  BookOpen, 
  PencilLine, 
  Printer, 
  Download,
  Guitar,
  Type,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from "lucide-react";
import type { NotationType } from "../helpers/chordFormatter";
import InteractiveCapoSelector from "./InteractiveCapoSelector";
import { useMetronome } from "../hooks/useMetronome";

interface EditorSettingsSidebarProps {
  isReadOnly: boolean;
  handleTranspose: (val: number) => void;
  show3DPiano: boolean;
  setShow3DPiano: (val: boolean) => void;
  editorColumns: number;
  setEditorColumns: (val: number) => void;
  layout: any;
  updateLayout: (updates: Partial<any>) => void;
  songKey: string;
  setSongKey: (key: string) => void;
  includeChordsDictionary: boolean;
  setIncludeChordsDictionary: (val: boolean) => void;
  onPlayTeleprompter?: () => void;
  onOpenExport?: () => void;
}

// Tooltip/Divider helpers
const Divider = () => <div className="h-[1px] w-full bg-border my-2 opacity-50" />;

export default function EditorSettingsSidebar({
  isReadOnly,
  handleTranspose,
  show3DPiano,
  setShow3DPiano,
  editorColumns,
  setEditorColumns,
  layout,
  updateLayout,
  songKey,
  setSongKey,
  includeChordsDictionary,
  setIncludeChordsDictionary,
  onPlayTeleprompter,
  onOpenExport
}: EditorSettingsSidebarProps) {

  // A local state to toggle expanded drawers, just in case "Capo", "Acordes" etc need inline expansion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const { 
    isPlaying: isMetronomePlaying, toggleMetronome, 
    bpm, setBpm, 
    soundType, setSoundType,
    beatsPerMeasure, setBeatsPerMeasure,
    breakPoints, setBreakPoints,
    currentMeasure
  } = useMetronome(120);

  const toggleExpand = (row: string) => {
    setExpandedRow(prev => prev === row ? null : row);
  };

  const handlePrint = () => {
    window.print();
  };

  // Base text sizes for the ( A  Texto  A ) controller
  const currentSize = layout.baseFontSize || 16;
  const handleScaleText = (delta: number) => {
    updateLayout({ baseFontSize: Math.max(10, Math.min(60, currentSize + delta)) });
  };

  const btnClass = "w-full flex items-center gap-3 px-4 py-2.5 bg-background border border-border text-foreground rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm";
  const iconClass = "w-4 h-4 text-muted-foreground shrink-0";

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-2 static lg:sticky top-28 z-30 shrink-0 pb-12">
      
      {/* 1. Desplazar (Teleprompter) */}
      <button onClick={onPlayTeleprompter} className={btnClass}>
        <ChevronsUpDown className={iconClass} />
        <span className="flex-1 text-left">Desplazar</span>
      </button>

      {/* 2. Texto (Scale) */}
      <div className="flex items-center justify-between bg-background border border-border rounded-xl shadow-sm overflow-hidden text-sm font-medium text-foreground">
         <button onClick={() => handleScaleText(-2)} className="p-3 hover:bg-accent transition-colors border-r border-border focus:outline-none">
            <span className="text-xs font-bold font-serif opacity-70">A-</span>
         </button>
         <span className="flex-1 text-center py-2.5">Texto</span>
         <button onClick={() => handleScaleText(2)} className="p-3 hover:bg-accent transition-colors border-l border-border focus:outline-none">
            <span className="text-sm font-bold font-serif">A+</span>
         </button>
      </div>

      {/* 3. Transpositor (- 1/2 +) */}
      <div className="flex items-center justify-between bg-background border border-border rounded-xl shadow-sm text-sm font-medium text-foreground overflow-hidden">
         <button onClick={() => handleTranspose(-1)} className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors border-r border-border focus:outline-none">
            <Minus className="w-4 h-4" />
         </button>
         <span className="flex-1 text-center py-2.5 px-2 tracking-widest font-mono text-muted-foreground">1/2</span>
         <button onClick={() => handleTranspose(1)} className="p-3 bg-green-500/5 hover:bg-green-500/10 text-green-500 transition-colors border-l border-border focus:outline-none">
            <Plus className="w-4 h-4" />
         </button>
      </div>

      {/* 4. Acordes (Show/Hide) */}
      <button onClick={() => updateLayout({ showChords: !layout.showChords })} className={btnClass}>
        <Guitar className={iconClass} />
        <span className="flex-1 text-left">Acordes {layout.showChords === false ? "(Ocultos)" : ""}</span>
      </button>

      {/* 4.5. Marcadores de Acordes (Timelines) */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm bg-background border border-border">
         <button onClick={() => toggleExpand("timelines")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-all text-sm font-medium">
           <div className="flex items-center gap-3">
              <Minus className={layout.showTimelines ? 'w-4 h-4 text-primary shrink-0' : iconClass} />
              <span className={layout.showTimelines ? 'text-primary font-bold' : ''}>Timelines de Acordes</span>
           </div>
         </button>
         <div className={`overflow-hidden transition-all ease-in-out duration-300 ${(layout.showTimelines || expandedRow === "timelines") ? "max-h-40 opacity-100 border-t border-border bg-muted/20" : "max-h-0 opacity-0"}`}>
            <div className="p-4 flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Mostrar líneas</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={layout.showTimelines || false} onChange={() => updateLayout({ showTimelines: !layout.showTimelines })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
               </div>
               
               {layout.showTimelines && (
                 <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estilo de Color</span>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => updateLayout({ timelineColor: 'multicolor' })}
                          className={`w-6 h-6 rounded-full border border-gray-200 shadow-sm flex items-center justify-center transition-all ${(!layout.timelineColor || layout.timelineColor === 'multicolor') ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'}`}
                          style={{ background: 'conic-gradient(#0ea5e9, #16a34a, #a855f7, #e11d48, #ea580c, #0ea5e9)' }}
                          title="Multicolor Automático"
                       />
                       {["#0ea5e9", "#16a34a", "#a855f7", "#e11d48", "#ea580c", "#334155"].map((clr) => (
                           <button 
                             key={clr}
                             onClick={() => updateLayout({ timelineColor: clr })}
                             className={`w-6 h-6 rounded-full border shadow-sm transition-all ${layout.timelineColor === clr ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105 border-transparent'}`}
                             style={{ backgroundColor: clr }}
                             title="Color Sólido"
                           />
                       ))}
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* 4.1 Instrumento (Piano/Guitarra) */}
      <div className="flex items-center justify-between bg-background border border-border rounded-xl shadow-sm text-sm font-medium text-foreground overflow-hidden">
         <button 
            onClick={() => updateLayout({ instrument: 'piano' })} 
            className={`flex-1 text-center py-2.5 px-2 tracking-widest text-[10px] uppercase font-bold transition-colors border-r border-border focus:outline-none ${layout.instrument === 'piano' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}
         >
            Piano
         </button>
         <button 
            onClick={() => updateLayout({ instrument: 'guitar' })} 
            className={`flex-1 text-center py-2.5 px-2 tracking-widest text-[10px] uppercase font-bold transition-colors focus:outline-none ${layout.instrument === 'guitar' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}
         >
            Guitarra
         </button>
      </div>

      {/* 6. Capo */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm bg-background border border-border">
         <button onClick={() => toggleExpand("capo")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-all text-sm font-medium">
           <div className="flex items-center gap-3">
              <span className="w-4 h-4 font-mono font-black text-muted-foreground text-[10px] leading-tight border border-muted-foreground/30 flex items-center justify-center rounded">C</span>
              <span>Capo {(layout.capo || 0) > 0 ? `(${layout.capo} fret)` : ''}</span>
           </div>
         </button>
         <div className={`overflow-hidden transition-all ease-in-out duration-300 ${expandedRow === "capo" ? "max-h-40 opacity-100 border-t border-border bg-muted/20" : "max-h-0 opacity-0"}`}>
            <div className="p-4">
              <InteractiveCapoSelector currentCapo={layout.capo || 0} onChange={(newCapo) => updateLayout({ capo: newCapo })} />
            </div>
         </div>
      </div>

      {/* 7. Diseño de Página (Columns, Orientation, Layout, Margin) */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm bg-background border border-border">
         <button onClick={() => toggleExpand("diseño")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-all text-sm font-medium">
           <div className="flex items-center gap-3">
              <LayoutGrid className={iconClass} />
              <span>Diseño de Página</span>
           </div>
         </button>
         <div className={`overflow-hidden transition-all ease-in-out duration-300 ${expandedRow === "diseño" ? "max-h-[800px] opacity-100 border-t border-border bg-muted/20" : "max-h-0 opacity-0"}`}>
            <div className="p-3 flex flex-col gap-4">
               
               {/* Orientation */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Orientación</span>
                 <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                   {['portrait', 'landscape'].map((ori) => (
                     <button
                       key={ori}
                       onClick={() => updateLayout({ orientation: ori })}
                       className={`flex-1 py-1.5 text-[10px] uppercase font-bold transition-colors border-r last:border-r-0 border-border
                       ${(layout.orientation === ori || (!layout.orientation && ori === 'portrait')) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                     >
                       {ori === 'portrait' ? 'Vertical' : 'Horizontal'}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Page Size */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tamaño</span>
                 <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                   {['A4', 'CARTA'].map((size) => (
                     <button
                       key={size}
                       onClick={() => updateLayout({ pageSize: size })}
                       className={`flex-1 py-1.5 text-[10px] uppercase font-bold transition-colors border-r last:border-r-0 border-border
                       ${(layout.pageSize === size || (!layout.pageSize && size === 'A4')) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                     >
                       {size}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Margins */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Márgenes</span>
                 <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                   {[
                     { id: 'estrecho', label: 'Estrecho' },
                     { id: 'normal', label: 'Normal' },
                     { id: 'amplio', label: 'Ancho' }
                   ].map((mrg) => (
                     <button
                       key={mrg.id}
                       onClick={() => updateLayout({ margin: mrg.id })}
                       className={`flex-1 py-1.5 text-[10px] uppercase font-bold transition-colors border-r last:border-r-0 border-border
                       ${(layout.margin === mrg.id || (!layout.margin && mrg.id === 'normal')) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                     >
                       {mrg.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Columns */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Columnas</span>
                 <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                   {[1, 2, 3, 4].map((colVal) => (
                     <button
                       key={colVal}
                       onClick={() => { setEditorColumns(colVal); updateLayout({ columns: colVal }); }}
                       className={`flex-1 py-1.5 text-[10px] font-bold transition-colors border-r last:border-r-0 border-border
                       ${(editorColumns === colVal || layout.columns === colVal) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                     >
                       {colVal}
                     </button>
                   ))}
                 </div>
               </div>

                {/* Alineación */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Alineación</span>
                  <div className="flex bg-background border border-border rounded-lg overflow-hidden p-0.5 gap-0.5">
                    {[
                      { id: 'justify-start', icon: <AlignLeft className="w-4 h-4" /> },
                      { id: 'justify-center', icon: <AlignCenter className="w-4 h-4" /> },
                      { id: 'justify-end', icon: <AlignRight className="w-4 h-4" /> },
                      { id: 'justify-between', icon: <AlignJustify className="w-4 h-4" /> }
                    ].map((align) => (
                      <button
                        key={align.id}
                        onClick={() => updateLayout({ alignment: align.id as any })}
                        className={`flex-1 flex justify-center py-1.5 rounded-md transition-all
                        ${(layout.alignment === align.id || (!layout.alignment && align.id === 'justify-start')) 
                          ? 'bg-primary text-primary-foreground shadow-sm scale-100' 
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground scale-95 hover:scale-100'}`}
                      >
                        {align.icon}
                      </button>
                    ))}
                  </div>
                </div>

               {/* Line Height (Interlineado) */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Interlineado</span>
                 <div className="flex items-center justify-between bg-background border border-border rounded-lg overflow-hidden p-0.5">
                   <button onClick={() => updateLayout({ lineHeight: Math.max(1, (layout.lineHeight || 1.5) - 0.25) })} className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground border-r border-border"><Minus className="w-3 h-3" /></button>
                   <span className="font-mono text-xs font-bold w-12 text-center">{(layout.lineHeight || 1.5).toFixed(2)}</span>
                   <button onClick={() => updateLayout({ lineHeight: Math.min(4, (layout.lineHeight || 1.5) + 0.25) })} className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground border-l border-border"><Plus className="w-3 h-3" /></button>
                 </div>
               </div>

               {/* Casing (Letra) */}
               <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">MAYÚS/minús Letra</span>
                 <select
                   value={layout.casing || 'default'}
                   onChange={(e) => updateLayout({ casing: e.target.value })}
                   className="w-full bg-background border border-border p-2 rounded-lg text-xs font-bold uppercase hover:bg-accent transition-colors outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                 >
                   <option value="default">Aa Oración</option>
                   <option value="uppercase">AA MAYÚSCULAS</option>
                   <option value="lowercase">aa minúsculas</option>
                 </select>
               </div>

               <Divider />

               <button onClick={() => setShow3DPiano(!show3DPiano)} className={`py-2 text-[10px] uppercase font-bold rounded-lg border ${show3DPiano ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'} transition-colors mt-2`}>
                  {show3DPiano ? 'Ocultar Piano 3D' : 'Mostrar Piano 3D'}
               </button>
            </div>
         </div>
      </div>

      <Divider />

      {/* 8. Agregar a la lista */}
      <button onClick={() => alert("Próximamente: Añade esta obra a tus playlists y repertorios en la Nube.")} className={btnClass}>
        <ListPlus className={iconClass} />
        <span className="flex-1 text-left">Agregar a la lista</span>
      </button>

      <Divider />

      {/* 9. Metrónomo Profesional */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm bg-background border border-border">
         <button onClick={() => toggleExpand("metronomo")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-all text-sm font-medium">
           <div className="flex items-center gap-3">
              <Activity className={isMetronomePlaying ? "w-4 h-4 text-primary animate-pulse" : iconClass} />
              <span className={isMetronomePlaying ? "text-primary font-bold" : ""}>Metrónomo PRO</span>
           </div>
           {isMetronomePlaying && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{bpm} / {beatsPerMeasure}</span>}
         </button>
         <div className={`overflow-hidden transition-all ease-in-out duration-300 ${expandedRow === "metronomo" ? "max-h-[500px] opacity-100 border-t border-border bg-muted/20" : "max-h-0 opacity-0"}`}>
            <div className="p-4 flex flex-col gap-4">
               {/* Controls */}
               <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between bg-background p-1 rounded-lg border border-border">
                   <button onClick={() => setBpm(b => Math.max(40, b - 5))} className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground"><Minus className="w-3 h-3" /></button>
                   <div className="flex flex-col items-center">
                     <span className="font-mono font-black text-xl leading-none">{bpm}</span>
                     <span className="text-[8px] uppercase tracking-widest text-muted-foreground">BPM</span>
                   </div>
                   <button onClick={() => setBpm(b => Math.min(240, b + 5))} className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /></button>
                 </div>

                 <div className="flex items-center justify-between text-xs font-medium">
                   <span className="text-muted-foreground">Compás</span>
                   <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5">
                     {[3, 4, 6].map(b => (
                       <button
                         key={b}
                         onClick={() => setBeatsPerMeasure(b)}
                         className={`px-3 py-1 rounded ${beatsPerMeasure === b ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground'}`}
                       >
                         {b}/4
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="flex items-center justify-between text-xs font-medium">
                   <span className="text-muted-foreground">Sonido</span>
                   <select 
                     value={soundType}
                     onChange={(e) => setSoundType(e.target.value as any)}
                     className="bg-background border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                   >
                     <option value="click">Clásico</option>
                     <option value="drum">Batería</option>
                     <option value="clap">Palmas</option>
                   </select>
                 </div>
               </div>

               {/* Breakpoints (Time Signature automation) */}
               <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Automatización</span>
                   <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">Compás actual: {currentMeasure}</span>
                 </div>
                 <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                   {breakPoints.length === 0 ? (
                     <p className="text-[10px] text-muted-foreground italic text-center py-2">Sin cambios programados.</p>
                   ) : (
                     breakPoints.map((bp, i) => (
                       <div key={i} className="flex justify-between items-center text-[10px] bg-background border border-border p-1.5 rounded">
                         <span className="font-bold text-primary">Barra {bp.measure}</span>
                         <span className="text-muted-foreground text-right">{bp.bpm ? `${bp.bpm} BPM` : ''} {bp.beatsPerMeasure ? `· ${bp.beatsPerMeasure}/4` : ''}</span>
                         <button onClick={() => setBreakPoints(list => list.filter(x => x.measure !== bp.measure))} className="text-red-500 hover:opacity-70 ml-2">×</button>
                       </div>
                     ))
                   )}
                 </div>
                 <button 
                   onClick={() => {
                     const m = parseInt(prompt("¿En qué compás (barra) ocurre el cambio?", String(currentMeasure + 1)) || "0");
                     if (m > 0) {
                       const nbpm = parseInt(prompt("¿Nuevo BPM? (deja vacío para mantener)", String(bpm)) || "0");
                       const np = parseInt(prompt("¿Nuevo patrón? (ej: 3 para 3/4)", String(beatsPerMeasure)) || "0");
                       setBreakPoints(list => {
                          const newList = list.filter(x => x.measure !== m); // overwrite if exists
                          newList.push({ measure: m, ...(nbpm > 0 && {bpm: nbpm}), ...(np > 0 && {beatsPerMeasure: np}) });
                          return newList.sort((a,b) => a.measure - b.measure);
                       });
                     }
                   }}
                   className="text-[10px] border border-dashed border-primary/50 text-primary py-1.5 rounded hover:bg-primary/5 transition-colors font-medium flex items-center justify-center gap-1"
                 >
                   <Plus className="w-3 h-3" /> Añadir Cambio de Tempo/Tempo
                 </button>
               </div>

               <button onClick={toggleMetronome} className={`w-full py-2.5 mt-1 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${isMetronomePlaying ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20'}`}>
                 {isMetronomePlaying ? 'Detener' : 'Iniciar'}
               </button>
            </div>
         </div>
      </div>

      {/* 10. Diccionario */}
      <button onClick={() => setIncludeChordsDictionary(!includeChordsDictionary)} className={`${btnClass} ${includeChordsDictionary ? 'ring-1 ring-primary bg-primary/5 border-primary/20' : ''}`}>
        <BookOpen className={includeChordsDictionary ? 'w-4 h-4 text-primary shrink-0' : iconClass} />
        <span className={`flex-1 text-left ${includeChordsDictionary ? 'text-primary font-bold' : ''}`}>Diccionario</span>
        {includeChordsDictionary && <div className="w-2 h-2 rounded-full bg-primary" />}
      </button>

      <Divider />



      {/* 13. Descargar aco... */}
      <button onClick={onOpenExport} className={btnClass}>
        <Download className={iconClass} />
        <span className="flex-1 text-left truncate">Descargar aco...</span>
      </button>

    </aside>
  );
}
