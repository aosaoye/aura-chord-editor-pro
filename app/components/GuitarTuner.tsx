"use client";

import { useTuner } from "../hooks/useTuner";

export default function GuitarTuner({ onClose }: { onClose: () => void }) {
  const { isListening, startTuning, stopTuning, pitch, closestString, cents } = useTuner();

  // El estado ideal es cuando la diferencia está entre -3 y +3 cents
  const isInTune = Math.abs(cents) <= 3;
  const hasSignal = pitch > 0;

  // Rotación de la aguja: -50 cents = -90 grados (izq), +50 cents = 90 grados (der)
  const needleRotation = (cents / 50) * 90;

  return (
    <div className="fixed inset-0 z-[999] bg-[#0F1115] text-white flex flex-col items-center justify-center font-sans animate-in fade-in duration-300">
      
      {/* Botón de cierre */}
      <button onClick={() => { stopTuning(); onClose(); }} className="absolute top-10 left-10 opacity-50 hover:opacity-100 transition-opacity tracking-widest text-xs uppercase font-bold">
        ← Volver
      </button>

      <div className="flex flex-col items-center w-full max-w-md p-8">
        
        <h2 className="text-sm tracking-[0.3em] font-bold text-gray-500 uppercase mb-16">Afinador Inteligente</h2>

        {/* DIAL PRINCIPAL */}
        <div className="relative w-72 h-36 mb-12 flex justify-center overflow-hidden">
          {/* Arco decorativo fondo */}
          <div className="absolute top-0 w-72 h-72 rounded-full border-2 border-gray-800 border-t-transparent border-l-transparent -rotate-45" />
          
          {/* Zona de afinación perfecta (Centro) */}
          <div className="absolute top-0 w-72 h-72 rounded-full border-t-4 border-transparent border-t-[#22c55e] border-l-transparent rotate-45 opacity-20" style={{ clipPath: 'polygon(45% 0, 55% 0, 50% 50%)' }} />

          {/* LA AGUJA */}
          <div 
            className="absolute bottom-0 w-1 h-32 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ 
              transform: `rotate(${hasSignal ? needleRotation : 0}deg)`,
              backgroundColor: hasSignal ? (isInTune ? '#22c55e' : '#ef4444') : '#374151',
              boxShadow: isInTune ? '0 0 15px #22c55e' : 'none'
            }}
          >
             {/* Círculo base de la aguja */}
             <div className="absolute -bottom-2 -left-1.5 w-4 h-4 rounded-full bg-inherit" />
          </div>
        </div>

        {/* INDICADOR DE NOTA */}
        <div className="flex flex-col items-center h-40">
          {hasSignal && closestString ? (
            <>
              <div className="flex items-start">
                <span className={`text-8xl font-black tracking-tighter transition-colors ${isInTune ? 'text-green-500' : 'text-white'}`}>
                  {closestString.note.charAt(0)}
                </span>
                <span className="text-2xl text-gray-400 mt-2 font-bold">{closestString.note.charAt(1)}</span>
              </div>
              <p className="text-gray-500 font-mono mt-4 text-sm">{pitch.toFixed(1)} Hz</p>
              
              <div className="mt-6 flex items-center gap-4">
                 <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${cents < -3 ? 'text-red-500' : 'text-gray-700'}`}>Bajo</span>
                 <span className={`w-3 h-3 rounded-full transition-all duration-300 ${isInTune ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-800'}`} />
                 <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${cents > 3 ? 'text-red-500' : 'text-gray-700'}`}>Alto</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <span className="text-6xl font-black tracking-tighter mb-4 transition-colors">-</span>
              <p className="text-sm font-bold tracking-widest uppercase">Esperando señal...</p>
            </div>
          )}
        </div>

        {/* CONTROLES */}
        <div className="mt-20">
          {!isListening ? (
             <button 
               onClick={startTuning}
               className="px-12 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all"
             >
               Comenzar
             </button>
          ) : (
             <button 
               onClick={stopTuning}
               className="px-12 py-4 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-red-500/20 active:scale-95 transition-all"
             >
               Detener
             </button>
          )}
        </div>

      </div>
    </div>
  );
}
