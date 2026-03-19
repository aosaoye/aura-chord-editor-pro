"use client";

import { useState, useCallback } from "react";
import { 
  useFloating, autoUpdate, offset, flip, shift, 
  useClick, useDismiss, useInteractions, FloatingPortal 
} from '@floating-ui/react';
import type { Syllable, Chord } from "../config/config";
import ChordEditorMenu from "./ChordEditorMenu";
import { formatChordText, NotationType } from "../helpers/chordFormatter";

export interface SyllableProps {
  syllable: Syllable;
  onChordChange: (syllableId: string, newChord: Chord | null) => void;
  nextHasChord?: boolean;
  notation?: NotationType;
  songKey?: string;
  readOnly?: boolean;
  showChords?: boolean;
}

export default function SyllableComponent({ 
  syllable, onChordChange, nextHasChord = true, notation = 'english', songKey = 'C', readOnly = false, showChords = true
}: SyllableProps) {
  const { id, text, chord } = syllable;
  const [isOpen, setIsOpen] = useState(false);

  // 🚀 SENIOR FIX: Floating UI gestiona el popover. Previene el layout thrashing y asegura 
  // que el menú nunca se salga de la pantalla del móvil.
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8), // Separación de 8px entre sílaba y menú
      flip({ fallbackAxisSideDirection: 'end' }), // Si no cabe abajo, se voltea arriba
      shift({ padding: 10 }) // Evita que se salga por los bordes laterales de la pantalla
    ],
  });

  const click = useClick(context, { enabled: !readOnly });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleActionClick = useCallback(() => {
     if (chord) {
         window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: { chord } }));
     }
  }, [chord]);

  const handleSave = useCallback((newChord: Chord | null) => {
    setIsOpen(false);
    onChordChange(id, newChord);
  }, [id, onChordChange]);

  return (
    <>
      <span 
        ref={refs.setReference}
        {...getReferenceProps({
          onClick: handleActionClick,
          onKeyDown: (e) => {
            if ((e.key === "Enter" || e.key === " ") && chord) {
              window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: { chord } }));
            }
          }
        })}
        role="button"
        tabIndex={0}
        className={
          "relative inline-flex flex-col items-start group transition-all duration-300 outline-none rounded-sm " +
          (readOnly ? "cursor-default" : "cursor-pointer hover:bg-black/[0.04] focus-visible:bg-black/5 focus-visible:ring-1 focus-visible:ring-black")
        }
        aria-label={`Sílaba: ${text}, Acorde: ${chord ? chord.rootNote + chord.variation : "ninguno"}`}
      >
        {showChords && (
          <span className="min-h-[1.5em] w-full flex items-end justify-start mb-0.5 text-[length:var(--chord-font)] font-bold text-primary tracking-tight select-none opacity-90 group-hover:opacity-100 transition-opacity relative" aria-hidden="true">
            {chord ? (() => {
              const formatted = formatChordText(chord, notation, songKey);
              return (
                <span className={`group-active:scale-95 transition-transform duration-100 ${nextHasChord ? 'pr-2' : 'absolute left-0 bottom-0 whitespace-nowrap'}`}>
                  <span className="text-[1.05em]">{formatted.root}</span>
                  {formatted.variation && <span className="text-[0.65em] ml-[1px] font-normal tracking-wider relative -top-[0.25em]">{formatted.variation}</span>}
                  {formatted.bass && <span className="text-[0.8em] font-normal opacity-80 ml-[0.5px]">/{formatted.bass}</span>}
                </span>
              );
            })() : (
               <span className={`opacity-0 ${!readOnly ? 'group-hover:opacity-100' : ''} flex items-end justify-center pb-0.5 text-[0.8em] font-light text-gray-400 transition-opacity absolute left-1/2 -translate-x-1/2 w-full pointer-events-none`}>+</span>
            )}
          </span>
        )}
        <span className="text-[length:var(--base-font)] text-foreground font-normal tracking-normal leading-tight">{text}</span>
      </span>

      {/* Floating Portal teletransporta el menú al final del body para evitar problemas de Z-Index */}
      {isOpen && (
        <FloatingPortal>
          <div className="fixed inset-0 z-[990] sm:hidden bg-black/20 backdrop-blur-sm animate-in fade-in" />
          <div 
            ref={refs.setFloating} 
            style={floatingStyles} 
            {...getFloatingProps()}
            className="z-[999] text-black shadow-2xl rounded-xl"
          >
            <ChordEditorMenu
              initialChord={chord}
              onSave={handleSave}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}