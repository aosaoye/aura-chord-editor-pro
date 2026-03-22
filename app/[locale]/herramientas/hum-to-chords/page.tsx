"use client";

import { useHumToChords } from '../../hooks/useHumToChords';
import Link from 'next/link';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function HumToChordsPage() {
  const { isRecording, startRecording, stopRecording, phrases, activeNotes, noiseLevel } = useHumToChords();

  return (
    <main className="min-h-[100svh] bg-[#0A0C10] text-foreground font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-10">
        <Link href="/herramientas" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors tracking-[0.2em] text-xs uppercase font-bold">
          <span className="text-lg leading-none mb-1">&larr;</span> Volver
        </Link>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight mb-2 text-center text-white">Hum-to-Chords <span className="text-xs uppercase tracking-widest text-primary/80 align-top ml-2">Beta</span></h1>
        <p className="text-muted-foreground text-center mb-16 text-sm md:text-base max-w-md">
          Tararea una línea vocal continua. Cuando te detengas, Aura Titán calculará los acordes base.
        </p>

        {isRecording && noiseLevel !== 'low' && (
           <div className={`mb-8 px-6 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-md ${noiseLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] shrink-0 ${noiseLevel === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
              <span>{noiseLevel === 'high' ? "Entorno Ruidoso: Precisión Baja" : "Ruido de Fondo Detectado"}</span>
           </div>
        )}

        {/* Grabador Activo */}
        <div className="w-full flex flex-col items-center justify-center min-h-[180px] p-8 bg-white/5 border border-white/10 rounded-[2.5rem] mb-12 backdrop-blur-sm relative">
          
          {isRecording ? (
            <div className="flex flex-col items-center w-full">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-red-400 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Escuchando
              </span>
              
              <div className="flex items-center gap-4 flex-wrap justify-center min-h-[60px]">
                {activeNotes.length === 0 ? (
                  <span className="text-zinc-600 font-medium tracking-widest uppercase text-sm">Esperando señal...</span>
                ) : (
                  activeNotes.map((note, idx) => (
                    <div key={idx} className="flex flex-col items-center animate-in zoom-in duration-300">
                      <span className="text-3xl md:text-4xl font-black text-white">{note}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-zinc-500 font-medium tracking-widest uppercase text-sm mb-6">Motor Apagado</span>
              <Mic size={48} className="text-zinc-700" />
            </div>
          )}

        </div>

        {/* Resultados */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 min-h-[120px]">
          {phrases.map((phrase, i) => (
             <div key={phrase.id} className="bg-primary/10 border border-primary/20 rounded-[1.5rem] p-6 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 relative group">
               <span className="absolute top-4 left-4 text-[9px] font-bold text-primary/50 uppercase tracking-widest">Compás {i + 1}</span>
               
               <h3 className="text-4xl font-black text-white mb-2 mt-4">{phrase.suggestedChord || '?'}</h3>
               <div className="text-[10px] tracking-widest text-zinc-400 text-center font-medium mt-auto">
                 {phrase.notes.join(' - ')}
               </div>
             </div>
          ))}
          {phrases.length === 0 && !isRecording && (
            <div className="col-span-full text-center text-zinc-600 text-[10px] tracking-widest uppercase font-bold mt-10">
              Inicia el micrófono para generar el primer bloque
            </div>
          )}
        </div>

        {/* Controles */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-3 px-10 py-5 rounded-full text-[11px] font-black tracking-[0.3em] uppercase transition-all shadow-xl hover:scale-105 active:scale-95 ${
            isRecording 
              ? 'bg-red-500 text-white shadow-[0_10px_40px_rgba(239,68,68,0.3)]' 
              : 'bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.1)]'
          }`}
        >
          {isRecording ? <><Square size={16} fill="currentColor" /> Detener Grabación</> : <><Mic size={16} /> Iniciar Motor Titán</>}
        </button>

      </div>
    </main>
  );
}
