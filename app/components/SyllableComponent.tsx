"use client";

import { useState, useCallback, useEffect } from "react";
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
}

export default function SyllableComponent({ syllable, onChordChange, nextHasChord = true, notation = 'english', songKey = 'C', readOnly = false }: SyllableProps) {
  const { id, text, chord } = syllable;
  
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = useCallback(() => {
     if (readOnly) {
         if (chord) {
             window.dispatchEvent(new CustomEvent('piano-play-chord', { detail: chord }));
         }
         return;
     }
     window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: id }));
     setIsEditing(true);
  }, [id, readOnly, chord]);

  useEffect(() => {
    const handlePickerOpened = (e: CustomEvent) => {
      if (e.detail !== id) {
        setIsEditing(false);
      }
    };
    window.addEventListener('chord-picker-opened', handlePickerOpened as EventListener);
    return () => window.removeEventListener('chord-picker-opened', handlePickerOpened as EventListener);
  }, [id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (readOnly) {
         if (event.key === "Enter" || event.key === " ") {
            if (chord) window.dispatchEvent(new CustomEvent('piano-play-chord', { detail: chord }));
         }
         return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: id }));
        setIsEditing(true);
      }
    },
    [id, readOnly, chord]
  );

  const handleSave = useCallback((newChord: Chord | null) => {
    setIsEditing(false);
    onChordChange(id, newChord);
  }, [id, onChordChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <span className="relative inline-flex flex-col items-start group">
      
      {/* Botón visual de la sílaba */}
      <span 
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={
          "inline-flex flex-col items-start transition-all duration-300 outline-none " +
          (readOnly 
            ? "cursor-default group rounded-sm" 
            : "cursor-pointer hover:bg-black/[0.04] focus-visible:bg-black/5 focus-visible:ring-1 focus-visible:ring-black group rounded-sm")
        }
        aria-label={`Sílaba: ${text}, Acorde: ${
          chord ? chord.rootNote + chord.variation : "ninguno"
        }. Pulsa para editar.`}
      >
        {/* LÓGICA DEL ACORDE (Reserva de espacio min-h) */}
        <span
          // 3. 'justify-start' para el acorde. Removido el 'min-w' que inflaba el ancho de sílabas sin acorde.
          className="min-h-[1.5rem] w-full flex items-end justify-start mb-0.5 text-sm font-semibold text-primary tracking-tight select-none opacity-90 group-hover:opacity-100 transition-opacity relative"
          aria-hidden="true" 
        >
          {chord ? (() => {
            const formatted = formatChordText(chord, notation, songKey);
            return (
              <span className={`group-active:scale-95 transition-transform duration-100 ${nextHasChord ? 'pr-2' : 'absolute left-0 bottom-0 whitespace-nowrap'}`}>
                <span className="text-[1.05rem]">{formatted.root}</span>
                {formatted.variation && (
                  <span className="text-[10px] ml-[1px] font-normal tracking-wider relative -top-[0.25rem]">
                    {formatted.variation}
                  </span>
                )}
                {formatted.bass && (
                  <span className="text-xs font-normal opacity-80 ml-[0.5px]">/{formatted.bass}</span>
                )}
              </span>
            );
          })() : (
            // El icono '+' ahora es absoluto para NO alterar el ancho real de la caja flex de la sílaba
             <span className={`opacity-0 ${!readOnly ? 'group-hover:opacity-100' : ''} flex items-end justify-center pb-0.5 text-[10px] font-light text-gray-400 transition-opacity absolute left-1/2 -translate-x-1/2 w-full pointer-events-none`}>
               +
             </span>
          )}
        </span>

        {/* TEXTO DE LA SÍLABA */}
        {/* Restaurado a font-normal sin interletraje extra para que las sílabas formen palabras cohesivas */}
        <span className="text-lg text-foreground font-normal tracking-normal leading-tight">
          {text}
        </span>
      </span>

      {isEditing && (
        <>
          {/* Fondo para cerrar en móvil */}
          <div className="fixed inset-0 z-[990] sm:hidden bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={handleCancel} />
          
          <div 
             ref={(node) => {
                if (node && node.parentElement && !node.dataset.positioned) {
                   const rect = node.parentElement.getBoundingClientRect();
                   node.style.top = `${rect.bottom + 8}px`;
                   node.style.left = `${rect.left}px`;
                   
                   // Adjust if off-screen to the right
                   const popoverWidth = 300; 
                   if (rect.left + popoverWidth > window.innerWidth) {
                      node.style.left = `${window.innerWidth - popoverWidth - 20}px`;
                   }
                   
                   // Adjust if off-screen to the bottom
                   if (rect.bottom + 200 > window.innerHeight) {
                      node.style.top = `${rect.top - 200}px`;
                   }
                   
                   node.dataset.positioned = "true";
                }
             }}
             className="fixed bottom-0 left-0 w-full sm:w-auto sm:bottom-auto z-[999] text-black shadow-2xl rounded-xl"
             style={{ position: 'fixed' }}
          >
            <ChordEditorMenu
              initialChord={chord}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </>
      )}
    </span>
  );
}