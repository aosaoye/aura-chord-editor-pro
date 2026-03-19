"use client";

import { useState } from "react";
import { useFloating, offset, flip, shift, autoUpdate, useClick, useDismiss, useInteractions, FloatingPortal } from "@floating-ui/react";

interface InteractiveCapoSelectorProps {
  currentCapo: number;
  onChange: (newCapo: number) => void;
}

export default function InteractiveCapoSelector({ currentCapo, onChange }: InteractiveCapoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCapo, setTempCapo] = useState(currentCapo);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (open) setTempCapo(currentCapo); // Reset temp to current when opening
    },
    placement: "right-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(16), flip(), shift({ padding: 10 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, currentCapo - 1))}
          className="w-8 h-10 rounded bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-colors"
        >
          -
        </button>

        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          className="flex-1 h-10 bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm"
          title="Abrir selector visual de Capo"
        >
          {currentCapo > 0 ? `TRASTE ${currentCapo}` : 'SIN CAPO'}
        </button>

        <button
          onClick={() => onChange(Math.min(12, currentCapo + 1))}
          className="w-8 h-10 rounded bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-colors"
        >
          +
        </button>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[9999] bg-white dark:bg-[#1a1a1a] p-4 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 w-full text-center">
              Seleccionar Traste
            </div>

            <div className="relative w-[140px] h-[340px] bg-slate-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-700 rounded-t-lg shadow-inner flex overflow-hidden">
              {/* Cuerdas */}
              <div className="absolute inset-0 flex justify-between px-3 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[1.5px] h-full bg-slate-300 dark:bg-slate-600 shadow-[1px_0_2px_rgba(0,0,0,0.1)]"></div>
                ))}
              </div>

              {/* Trastes (Filas interactivas) */}
              <div className="absolute inset-0 flex flex-col pt-2">
                {[...Array(12)].map((_, fretIndex) => {
                  const fretNumber = fretIndex + 1;
                  const isHoveredOrSelected = tempCapo === fretNumber;
                  const isTrueSelected = currentCapo === fretNumber;

                  return (
                    <div
                      key={fretNumber}
                      onClick={() => setTempCapo(fretNumber === tempCapo ? 0 : fretNumber)}
                      className={`relative flex-1 group cursor-pointer border-b-2 border-slate-300 dark:border-slate-600 border-opacity-60 flex items-center transition-colors ${isHoveredOrSelected ? 'bg-primary/20 dark:bg-primary/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      {/* Marcadores de traste redondos clasicos */}
                      {[3, 5, 7, 9].includes(fretNumber) && (
                        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 opacity-60"></div>
                      )}
                      {fretNumber === 12 && (
                        <div className="absolute left-1/2 -translate-x-1/2 flex gap-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 opacity-60"></div>
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 opacity-60"></div>
                        </div>
                      )}

                      {/* Botonzazo de Cancelar X a la derecha cuando esta activo */}
                      {isHoveredOrSelected && (
                        <div 
                          className="absolute -right-8 w-6 h-6 flex items-center justify-center text-red-500 font-bold hover:scale-110 active:scale-95 transition-transform"
                          onClick={(e) => { e.stopPropagation(); setTempCapo(0); }}
                        >
                          ✕
                        </div>
                      )}

                      {/* Dibujo del Capo */}
                      {isHoveredOrSelected && (
                        <div className="absolute inset-x-1 h-3/5 top-1/2 -translate-y-1/2 bg-slate-800 dark:bg-slate-200 rounded-[2px] shadow-lg flex items-center justify-between px-2 z-10">
                           <span className="text-[8px] font-black text-white dark:text-black tracking-[0.2em]">CAPO</span>
                           <span className="text-[7px] font-black text-white/50 dark:text-black/50">{fretNumber}ª</span>
                        </div>
                      )}

                      {/* Numeración izquierda */}
                      <span className={`absolute -left-5 text-[9px] font-bold ${isHoveredOrSelected ? 'text-primary' : 'text-gray-400'}`}>
                        {fretNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 w-full">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onChange(tempCapo);
                  setIsOpen(false);
                }}
                className="flex-[1.5] py-2 bg-primary text-primary-foreground rounded text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                OK
              </button>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
