"use client";

import { useCallback } from "react";
import type { Syllable } from "../config/config"; // Importamos la interfaz del Reto 1

// Definimos qué datos necesita recibir este componente para funcionar
interface SyllableProps {
  syllable: Syllable;
  onSyllableClick: (id: string) => void;
}

export default function SyllableComponent({ syllable, onSyllableClick }: SyllableProps) {
  const { id, text, chord } = syllable;

  // Memoización para evitar renderizados innecesarios, una buena práctica en React (Performance)
  const handleClick = useCallback(() => {
    onSyllableClick(id);
  }, [id, onSyllableClick]);

  // Soporte de accesibilidad para teclado (a11y)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // Evitamos scroll no deseado de la página al pulsar espacio
        onSyllableClick(id);
      }
    },
    [id, onSyllableClick]
  );

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={
        "inline-flex flex-col items-center mx-1 px-1 rounded-md cursor-pointer transition-colors duration-200 outline-none " +
        "hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-400 group relative"
      }
      // a11y: Anunciamos la sílaba y su acorde a las tecnologías de asistencia
      aria-label={`Sílaba: ${text}, Acorde: ${
        chord ? chord.rootNote + chord.variation : "ninguno"
      }`}
    >
      {/* AQUÍ LA LÓGICA DEL ACORDE:
          Mantenemos un espacio reservado usando min-h para evitar "layout shifts" 
          cuando se añade o se elimina un acorde */}
      <span
        className="min-h-[1.5rem] min-w-[1rem] flex items-end justify-center text-sm font-bold text-indigo-500 tracking-tight select-none"
        aria-hidden="true" // Oculto porque la lectura ya está en el aria-label del padre
      >
        {chord ? (
          <span className="group-active:scale-95 transition-transform duration-100">
            <span className="text-base">{chord.rootNote}</span>
            {chord.variation && (
              <span className="text-xs ml-[1px] relative -top-[0.15rem]">
                {chord.variation}
              </span>
            )}
          </span>
        ) : (
          "\u00A0" // &nbsp; o espacio irrompible para mantener visualmente el bloque
        )}
      </span>

      {/* AQUÍ EL TEXTO DE LA SÍLABA */}
      <span className="text-lg text-gray-800 leading-tight">
        {text}
      </span>
    </span>
  );
}