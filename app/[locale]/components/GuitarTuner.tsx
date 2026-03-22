"use client";

import { useState, useEffect } from "react";
import { useTuner, TunerInstrument } from "../hooks/useTuner";

const INSTRUMENTS: { id: TunerInstrument, label: string }[] = [
  { id: 'guitar', label: 'Guitarra' },
  { id: 'ukulele', label: 'Ukelele' },
  { id: 'bass', label: 'Bajo' },
  { id: 'violin', label: 'Violín' },
  { id: 'chromatic', label: 'Cromático' }
];

export default function GuitarTuner({ onClose, isStandalone = false }: { onClose?: () => void, isStandalone?: boolean }) {
  const [instrument, setInstrument] = useState<TunerInstrument>('guitar');
  const { isListening, startTuning, stopTuning, pitch, closestString, cents, error, isCalibrating, noiseLevel } = useTuner(instrument);

  // Lock body and HTML scroll when Tuner is open to prevent double scrollbars, ONLY if not standalone
  useEffect(() => {
    if (isStandalone) return;
    
    const originalBodyStyle = window.getComputedStyle(document.body).overflow;  
    const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;  
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyStyle;
      document.documentElement.style.overflow = originalHtmlStyle;
    };
  }, [isStandalone]);

  // Consider in tune if within +/- 3 cents
  const isInTune = Math.abs(cents) <= 3;
  const hasSignal = pitch > 0;

  // Needle Rotation: -50 cents = -90 degrees, +50 cents = 90 degrees
  const needleRotation = (cents / 50) * 90;

  let statusText = "ESPERANDO SEÑAL...";
  let statusColor = "text-zinc-600";
  
  if (isCalibrating) {
    statusText = "CALIBRANDO RUIDO AMBIENTE...";
    statusColor = "text-amber-500 animate-pulse";
  } else if (hasSignal && closestString) {
    if (isInTune) {
      statusText = "AFINACIÓN PERFECTA";
      statusColor = "text-teal-400";
    } else if (cents < -3) {
      statusText = "APRETAR CUERDA ▲";
      statusColor = "text-amber-400";
    } else {
      statusText = "AFLOJAR CUERDA ▼";
      statusColor = "text-orange-500";
    }
  }

  return (
    <div className={isStandalone ? "w-full min-h-[100svh] bg-[#0A0C10] text-white flex flex-col relative font-sans animate-in fade-in duration-300" : "fixed inset-0 z-[9999] bg-[#0A0C10] text-white overflow-y-auto overflow-x-hidden font-sans animate-in fade-in duration-300"}>
      
      {/* Background Decor (Fixed so it stays centered while scrolling) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Main scrolling wrapper for small tablets/phones */}
      <div className="min-h-[100svh] flex flex-col items-center justify-center relative py-20 px-4 w-full">

        {/* Top Banner & Back Button */}
        <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-10">
          {onClose && (
            <button onClick={() => { stopTuning(); onClose(); }} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors tracking-[0.2em] text-xs uppercase font-bold">
              <span className="text-lg leading-none mb-1">&larr;</span> Volver
            </button>
          )}
        </div>

        <div className="flex flex-col items-center w-full max-w-2xl px-2 sm:px-6 relative z-10 mt-10">
        
        <h2 className="text-[10px] tracking-[0.4em] font-bold text-zinc-500 uppercase mb-8">Afinador Inteligente</h2>

        {/* Instrument Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-16 bg-white/5 p-2 rounded-full border border-white/5 backdrop-blur-md shadow-2xl">
          {INSTRUMENTS.map(inst => (
            <button
              key={inst.id}
              onClick={() => {
                setInstrument(inst.id);
                // Restart tuner implicitly if listening? 
                // Currently just changing state works because useTuner listens to it.
              }}
              className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                instrument === inst.id 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]' 
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {inst.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center h-48 bg-red-500/5 border border-red-500/10 rounded-[2rem] p-8 text-center max-w-sm w-full mx-auto">
            <span className="text-red-400 mb-2 font-bold uppercase tracking-[0.2em] text-[10px]">Error de Sistema</span>
            <p className="text-zinc-500 text-xs leading-relaxed">{error}</p>
          </div>
        ) : (
          <>
            {/* INDICADOR DE ENTORNO LIMPIO (Noise Level Traffic Light) */}
            {!isCalibrating && isListening && noiseLevel !== 'low' && (
              <div className={`mb-12 px-6 py-3 rounded-[1rem] text-[9px] font-bold tracking-widest uppercase flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4 w-full max-w-sm text-center shadow-lg backdrop-blur-md ${noiseLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] shrink-0 ${noiseLevel === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                    <span className="text-[10px]">{noiseLevel === 'high' ? "Entorno Ruidoso" : "Ruido Moderado"}</span>
                  </div>
                  <span className="text-zinc-500 mt-1 capitalize-none lowercase text-[10px] font-medium tracking-normal border-t border-white/5 pt-2">
                    {noiseLevel === 'high' ? 'Podría fallar la detección. Acércate al micrófono o silencia el cuarto.' : 'Se detectó fondo moderado. Canta con claridad.'}
                  </span>
              </div>
            )}

            {/* The DIAL */}
            <div className="relative w-80 h-40 mb-16 flex justify-center overflow-hidden">
              
              {/* Outer Arc (Gray) */}
              <div className="absolute top-0 w-80 h-80 rounded-full border-[3px] border-zinc-800 border-t-transparent border-l-transparent -rotate-45" />

              {/* Tick marks (Simulated by repeating radial gradients if needed, or simple arc) */}
              <div className="absolute top-2 w-[19.5rem] h-[19.5rem] rounded-full border border-zinc-800/50 border-t-transparent border-l-transparent -rotate-45 border-dashed" />
              
              {/* Center Tune Arc (Green) */}
              <div 
                className="absolute top-0 w-80 h-80 rounded-full border-t-[4px] border-transparent border-t-teal-500 border-l-transparent rotate-45 opacity-40 blur-[1px]" 
                style={{ clipPath: 'polygon(46% 0, 54% 0, 50% 50%)' }} 
              />

              {/* Central Needle Glow */}
              <div className="absolute bottom-0 w-full h-[100px] bg-teal-500/10 blur-[40px] rounded-full opacity-50"></div>

              {/* THE NEEDLE */}
              <div 
                className="absolute bottom-0 w-[3px] h-36 origin-bottom rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{ 
                  transform: `rotate(${hasSignal ? needleRotation : 0}deg)`,
                  backgroundColor: hasSignal ? (isInTune ? '#2dd4bf' : (cents < -3 ? '#fbbf24' : '#f97316')) : '#3f3f46',
                  boxShadow: hasSignal ? `0 0 20px ${isInTune ? '#2dd4bf' : (cents < -3 ? '#fbbf24' : '#f97316')}` : 'none'
                }}
              >
                 {/* Pivot Base */}
                 <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-[#0A0C10] border-4 border-inherit" />
              </div>
            </div>

            {/* STATUS & NOTE DISPLAY */}
            <div className="flex flex-col items-center justify-center min-h-[160px] relative">
              
              {hasSignal && closestString ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                  <div className="flex items-start text-white mb-2 relative">
                    <span className={`text-[7rem] leading-none font-bold tracking-tighter ${isInTune ? 'text-teal-400 drop-shadow-[0_0_30px_rgba(45,212,191,0.4)]' : ''}`}>
                      {closestString.note.charAt(0)}
                    </span>
                    <span className={`text-4xl mt-2 font-light ${isInTune ? 'text-teal-400 text-opacity-80' : 'text-zinc-500'}`}>
                      {closestString.note.substring(1)}
                    </span>
                    {instrument !== 'chromatic' && closestString.string > 0 && (
                      <span className="absolute -left-12 top-4 text-xs font-bold text-zinc-600 uppercase tracking-widest border border-zinc-800 rounded-full w-8 h-8 flex items-center justify-center">
                        {closestString.string}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-zinc-600 font-mono text-xs tracking-[0.2em]">{pitch.toFixed(1)} HZ</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-800">
                  <span className="text-[7rem] leading-none font-light tracking-tighter mb-2">-</span>
                  <div className="w-16 h-1 bg-zinc-800/50 rounded-full mb-4"></div>
                </div>
              )}

              {/* Feedback Text */}
              <p className={`absolute -bottom-8 text-[10px] font-bold tracking-[0.3em] uppercase transition-colors duration-500 ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </>
        )}

        {/* BOTTOM CONTROLS */}
        <div className="mt-16 md:mt-24 mb-10 w-full flex justify-center">
          {error ? (
             onClose ? (
               <button 
                 onClick={onClose}
                 className="px-14 py-5 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:bg-white/10 active:scale-95 transition-all w-64 shadow-xl"
               >
                 Salir
               </button>
             ) : (
                <div className="px-14 py-5 bg-white/5 border border-white/10 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full text-center w-64 shadow-xl select-none">
                  Fallo de Micrófono
                </div>
             )
          ) : !isListening ? (
             <button 
               onClick={startTuning}
               className="px-14 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all w-64 shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
             >
               Comenzar
             </button>
          ) : (
             <button 
               onClick={stopTuning}
               className="px-14 py-5 bg-transparent border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:bg-zinc-900 hover:text-white active:scale-95 transition-all w-64"
             >
               Pausar / Detener
             </button>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}
