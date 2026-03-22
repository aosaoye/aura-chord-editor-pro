"use client";

import { useState, useCallback } from "react";
import { parseTextToSong } from "../config/parseTextToSong";
import type { Song } from "../config/config";

interface SongImporterProps {
  onImport: (parsedSong: Song) => void;
}

export default function SongImporter({ onImport }: SongImporterProps) {
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState(120);
  const [rawLyrics, setRawLyrics] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // a) Validamos (defensa simple)
    if (!title.trim() || !rawLyrics.trim()) {
      showToast("Introduce título y letra para continuar.");
      return;
    }

    // b) Magia: Inyectamos nuestros estados al parser para tener un JSON inmenso al vuelo
    const parsedSong = parseTextToSong(rawLyrics, title, bpm);
    
    // c) Pasamos el resultado a onImport (estado padre)
    onImport(parsedSong);
  };

  return (
    <div className="pt-48 pb-24 px-10 max-w-4xl mx-auto flex flex-col gap-20 bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary selection:text-white">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out fill-mode-both">
        <h1 className="text-6xl sm:text-7xl font-light tracking-tight text-foreground leading-[1.1]">
          Eleva tu <br/><span className="font-semibold text-primary">composición.</span>
        </h1>
        <p className="text-muted-foreground font-light text-xl max-w-md">
          Un entorno minimalista y preciso para estructurar, silabear y armonizar tus letras.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-14 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 ease-out fill-mode-both">
        
        <div className="flex flex-col sm:flex-row gap-12">
          <div className="flex-1 space-y-3 group">
            <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
              Título de la obra
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sonata de Invierno"
              className="w-full border-b border-border py-3 bg-transparent text-2xl font-light text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30"
            />
          </div>

          <div className="w-32 space-y-3 group">
            <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
              Tempo (BPM)
            </label>
            <input 
              type="number" 
              min="30" max="300"
              required
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full border-b border-border py-3 bg-transparent text-foreground text-2xl font-light focus:outline-none focus:border-primary transition-all text-center placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <div className="space-y-6 group flex-1">
          <div className="flex justify-between items-end border-b border-border pb-2 transition-colors group-focus-within:border-primary">
              <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
                Estructura Lírica
              </label>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:block">
                Soporta tags como [Verso], [Coro]
              </span>
          </div>
          <textarea 
            required
            value={rawLyrics}
            onChange={(e) => setRawLyrics(e.target.value)}
            placeholder="[Verso]&#10;Comienza a escribir o pega tu letra aquí...&#10;&#10;Usa doble salto de línea para separar estrofas."
            className="w-full min-h-[350px] bg-transparent text-foreground text-lg font-light leading-relaxed focus:outline-none transition-all resize-none placeholder:text-muted-foreground/30"
          ></textarea>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
            <button 
              type="submit" 
              className="px-12 py-5 bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 flex items-center gap-4 border border-transparent"
            >
              Generar Lienzo
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </button>
        </div>
      </form>

      {/* TOAST ELEGANTE */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-foreground text-background px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {toastMsg}
           </div>
        </div>
      )}
    </div>
  );
}