"use client";

import { useState, useCallback, KeyboardEvent, useEffect, useRef } from "react";
import type { Chord } from "../config/config";

interface ChordEditorMenuProps {
  initialChord: Chord | null;
  onSave: (newChord: Chord | null) => void;
  onCancel: () => void;
}

const ROOT_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const VARIATIONS = ["", "m", "maj7", "m7", "7", "sus4", "sus2", "dim", "aug", "m7b5", "dim7", "add9", "m9", "maj9", "9", "11", "13", "#5"];

export default function ChordEditorMenu({
  initialChord,
  onSave,
  onCancel,
}: ChordEditorMenuProps) {
  const [rootNote, setRootNote] = useState<string>(initialChord?.rootNote || "C");
  const [variation, setVariation] = useState<string>(initialChord?.variation || "");
  const [bassNote, setBassNote] = useState<string>(initialChord?.bassNote || "");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const select = containerRef.current?.querySelector("select");
    if (select) select.focus();
  }, []);

  const handleApply = useCallback(() => {
    const newId =
      initialChord?.id ?? `chord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    onSave({ id: newId, rootNote, variation, bassNote: bassNote || undefined });
  }, [initialChord, rootNote, variation, bassNote, onSave]);

  const handleRemove = useCallback(() => {
    onSave(null);
  }, [onSave]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleApply();
      }
    },
    [onCancel, handleApply]
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Editor de acorde"
      className="flex flex-col gap-4 sm:gap-6 p-5 sm:p-6 pb-12 sm:pb-6 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.15)] sm:shadow-2xl sm:shadow-black/10 outline-none w-full sm:w-max animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300 border-t sm:border border-gray-100 rounded-t-3xl sm:rounded-xl"
    >
      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-6">
        {/* Select de la Nota Raíz */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="root-note-select"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"
          >
            Nota
          </label>
          <select
            id="root-note-select"
            value={rootNote}
            onChange={(e) => setRootNote(e.target.value)}
            className="border-b border-gray-200 py-1.5 bg-transparent hover:border-black focus:border-black focus:outline-none transition-colors cursor-pointer font-medium text-gray-900 text-base"
            aria-label="Seleccionar nota raíz"
          >
            {ROOT_NOTES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        {/* Select de la Variación */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="variation-select"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"
          >
            Sufijo
          </label>
          <select
            id="variation-select"
            value={variation}
            onChange={(e) => setVariation(e.target.value)}
            className="border-b border-gray-200 py-1.5 bg-transparent hover:border-black focus:border-black focus:outline-none transition-colors cursor-pointer font-medium text-gray-900 text-base"
            aria-label="Seleccionar variación del acorde"
          >
            {VARIATIONS.map((varType) => (
              <option key={varType} value={varType}>
                {varType === "" ? "MAYOR" : varType}
              </option>
            ))}
          </select>
        </div>

        {/* Select del Bajo (Híbrido) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="bass-note-select"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]"
          >
            Bajo ( / )
          </label>
          <select
            id="bass-note-select"
            value={bassNote}
            onChange={(e) => setBassNote(e.target.value)}
            className="border-b border-gray-200 py-1.5 bg-transparent hover:border-black focus:border-black focus:outline-none transition-colors cursor-pointer font-medium text-gray-900 text-base"
            aria-label="Seleccionar nota de bajo"
          >
            <option value="">Ninguno</option>
            {ROOT_NOTES.map((note) => (
              <option key={note} value={note}>
                /{note}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controles y Botones */}
      <div className="flex justify-between items-center mt-2 sm:mt-0 pt-4 sm:pt-5 border-t border-gray-100">
        <button
          onClick={handleRemove}
          className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase hover:text-red-500 transition-colors focus:outline-none"
          aria-label="Quitar acorde"
        >
          Quitar
        </button>

        <div className="flex gap-3 sm:gap-5 items-center">
          <button
            onClick={onCancel}
            className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase hover:text-black transition-colors focus:outline-none hidden sm:block"
            aria-label="Cancelar edición"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="text-[10px] font-bold tracking-[0.15em] bg-black text-white hover:bg-gray-800 uppercase px-6 py-3 sm:py-2.5 rounded-full sm:rounded-none transition-all active:scale-95 focus:outline-none w-full sm:w-auto text-center"
            aria-label="Aplicar cambios"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}