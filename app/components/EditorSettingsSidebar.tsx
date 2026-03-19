import React from "react";
import { useState } from "react";
import Link from "next/link";
import { LayoutSettings } from "../config/config";
import type { Song, Chord } from "../config/config";
import { parseTextToSong } from "../config/parseTextToSong";
import { formatChordText, NotationType } from "../helpers/chordFormatter";
import InteractiveCapoSelector from "./InteractiveCapoSelector";

interface EditorSettingsSidebarProps {
  isReadOnly: boolean;
  songPrice: number;
  setSongPrice: (price: number) => void;
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
}

export default function EditorSettingsSidebar({
  isReadOnly,
  songPrice,
  setSongPrice,
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
  setIncludeChordsDictionary
}: EditorSettingsSidebarProps) {
  return (
    <aside className="w-full lg:w-64 bg-background rounded-xl shadow-lg lg:shadow-xl border border-border p-5 sm:p-6 flex flex-col gap-6 lg:gap-8 static lg:sticky top-36 z-30 shrink-0">
      <div className="pb-4 border-b border-border">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">Sesión Activa</h3>
        <p className="text-[10px] text-muted-foreground mt-1">Herramientas globales de partitura.</p>
      </div>

      <div className="flex flex-col gap-6">
        {!isReadOnly && (
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Precio en Marketplace</label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">€</span>
              <input
                type="text"
                inputMode="numeric"
                value={songPrice > 0 ? songPrice : ""}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if (!val) { setSongPrice(0); return; }
                  const parsed = val.length > 1 && val.startsWith('0') && !val.startsWith('0.') ? val.substring(1) : val;
                  setSongPrice(Number(parsed));
                }}
                className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 text-sm font-medium outline-none focus:border-primary text-foreground transition-colors"
              />
            </div>
            <p className={`text-[9px] font-bold mt-1 ${songPrice > 0 ? "text-primary" : "text-gray-500 font-light"}`}>
              {songPrice > 0 ? `Se publicará como Obra Premium por €${songPrice}.` : "Deja 0 para compartir libremente en la comunidad."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Transpositor Inteligente</label>
          <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button onClick={() => handleTranspose(-1)} className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border-r border-gray-200 dark:border-gray-800 transition-colors">-1</button>
            <button onClick={() => handleTranspose(1)} className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">+1</button>
          </div>
          <p className="text-[9px] font-light text-gray-500 mt-1">Sube o baja medio tono todos los acordes al instante.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Visor Inmersivo</label>
          <button
            onClick={() => setShow3DPiano(!show3DPiano)}
            className={`py-3 px-4 rounded-lg flex items-center justify-between transition-colors shadow-sm text-xs font-bold uppercase tracking-widest border ${show3DPiano ? 'bg-primary text-primary-foreground border-transparent' : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
          >
            <span className="flex items-center gap-3">Mostrar Piano 3D</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${show3DPiano ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>{show3DPiano ? 'ACTIVO' : 'OFF'}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Diseño de Página (Columnas)</label>
          <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
            {[0, 1, 2, 3].map((colVal) => (
              <button
                key={colVal}
                onClick={() => {
                  setEditorColumns(colVal);
                  updateLayout({ columns: colVal });
                }}
                className={`flex-1 py-3 text-xs font-bold transition-colors border-r last:border-r-0 border-gray-200 dark:border-gray-800
                ${(editorColumns === colVal || layout.columns === colVal)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
              >
                {colVal === 0 ? 'AUTO' : colVal}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Tipografía y Separación</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 mb-1">Letra (px)</span>
              <input 
                type="number" 
                value={layout.baseFontSize || 16}
                onChange={(e) => updateLayout({ baseFontSize: Number(e.target.value) || 16 })}
                className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded py-2 px-3 text-sm focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 mb-1">Interlineado</span>
              <input 
                type="number" 
                step="0.1"
                value={layout.lineHeight || 2}
                onChange={(e) => updateLayout({ lineHeight: Number(e.target.value) || 2 })}
                className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded py-2 px-3 text-sm focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-col mt-1">
              <span className="text-[10px] text-gray-400 mb-1">Acordes (px)</span>
              <input 
                type="number" 
                value={layout.chordFontSize || 14}
                onChange={(e) => updateLayout({ chordFontSize: Number(e.target.value) || 14 })}
                className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded py-2 px-3 text-sm focus:border-primary outline-none transition-colors"
              />
            </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Alineación</label>
          <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
            {[
              { id: 'justify-start', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12' },
              { id: 'justify-center', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' },
              { id: 'justify-end', icon: 'M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25' }
            ].map((align) => (
              <button
                key={align.id}
                onClick={() => updateLayout({ alignment: align.id })}
                className={`flex-1 py-3 flex justify-center items-center transition-colors border-r last:border-r-0 border-gray-200 dark:border-gray-800
                ${layout.alignment === align.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d={align.icon} /></svg>
              </button>
            ))}
          </div>
        </div>

        {layout.notation === 'roman' && (
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Tono Base (Romanos)</label>
            <select
              value={songKey} onChange={(e) => setSongKey(e.target.value)}
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 text-sm text-gray-800 dark:text-white outline-none cursor-pointer"
            >
              {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Instrumento</label>
          <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              onClick={() => updateLayout({ instrument: 'piano' })}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-r border-gray-200 dark:border-gray-800
              ${(!layout.instrument || layout.instrument === 'piano') ? 'bg-primary text-primary-foreground' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            >
              Piano
            </button>
            <button
              onClick={() => updateLayout({ instrument: 'guitar' })}
              className={`flex-1 py-3 text-xs font-bold transition-colors
              ${layout.instrument === 'guitar' ? 'bg-primary text-primary-foreground' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            >
              Guitarra
            </button>
          </div>
        </div>

        {layout.instrument === 'guitar' && (
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Capo (Traste)</label>
            <InteractiveCapoSelector 
              currentCapo={layout.capo || 0}
              onChange={(newCapo) => updateLayout({ capo: newCapo })}
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4">
         <button
            onClick={() => setIncludeChordsDictionary(!includeChordsDictionary)}
            className={`py-2 px-4 rounded flex items-center justify-between transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest border ${includeChordsDictionary ? 'bg-primary text-primary-foreground border-transparent' : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
          >
            <span>Diccionario de Acordes</span>
            <div className={`w-3 h-3 rounded-full ${includeChordsDictionary ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          </button>
         <button
            onClick={() => updateLayout({ showChords: !layout.showChords })}
            className={`py-2 px-4 rounded flex items-center justify-between transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest border ${!layout.showChords ? 'bg-primary text-primary-foreground border-transparent' : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
          >
            <span>Ocultar Letra (Solo Acordes)</span>
            <div className={`w-3 h-3 rounded-full ${!layout.showChords ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          </button>
        <Link href="/settings" className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary hover:text-black dark:hover:text-white transition-colors flex items-center justify-between group">
          Abrir Ajustes Globales
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </aside>
  );
}
