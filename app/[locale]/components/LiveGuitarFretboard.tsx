"use client";

import React, { useMemo } from 'react';
import type { Chord } from '../config/config';
import { getGuitarFingering } from '../helpers/guitarChords';

const THEME_COLORS: Record<string, string> = {
  "theme-purple": "#7c3aed",
  "theme-blue": "#3b82f6",
  "theme-green": "#10b981",
  "theme-rose": "#e11d48",
  "theme-orange": "#f97316",
  "theme-yellow": "#eab308",
  "theme-mono": "#171717"
};

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export default function LiveGuitarFretboard({ activeChord, themeColor = "theme-purple" }: { activeChord?: Chord | null, themeColor?: string }) {
  const color = THEME_COLORS[themeColor] || "#7c3aed";

  const numFrets = 14; 
  const width = 800;
  const height = 180;
  
  const leftMargin = 30; // Nut
  const rightMargin = 20;
  const topMargin = 20;
  const bottomMargin = 20;

  const stringSpacing = (height - topMargin - bottomMargin) / 5;
  const fretSpacing = (width - leftMargin - rightMargin) / numFrets;

  const fingering = useMemo(() => {
    if (!activeChord) return null;
    return getGuitarFingering(activeChord.rootNote, activeChord.variation);
  }, [activeChord]);

  const INLAY_FRETS = [3, 5, 7, 9, 12];

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent py-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="drop-shadow-2xl">
        
        {/* Wood Texture Background */}
        <rect x={leftMargin} y={topMargin - 5} width={width - leftMargin - rightMargin} height={height - topMargin - bottomMargin + 10} fill="#1a1412" rx="2" />

        {/* Frets */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => {
          const x = leftMargin + i * fretSpacing;
          const isNut = i === 0;
          return (
            <line
              key={`fret-${i}`}
              x1={x}
              y1={topMargin - 5}
              x2={x}
              y2={height - bottomMargin + 5}
              stroke={isNut ? "#e5e7eb" : "#4b5563"}
              strokeWidth={isNut ? 5 : 2}
            />
          );
        })}

        {/* Fret Markers (Inlays) */}
        {INLAY_FRETS.map(fret => {
          if (fret > numFrets) return null;
          const x = leftMargin + (fret - 0.5) * fretSpacing;
          const yCenter = topMargin + (2.5 * stringSpacing);

          if (fret === 12) {
            // Double dots for 12th
            return (
              <g key={`inlay-${fret}`} opacity={0.3}>
                <circle cx={x} cy={topMargin + 1.5 * stringSpacing} r={4} fill="#e5e7eb" />
                <circle cx={x} cy={topMargin + 3.5 * stringSpacing} r={4} fill="#e5e7eb" />
              </g>
            );
          }
          return (
             <circle key={`inlay-${fret}`} cx={x} cy={yCenter} r={5} fill="#e5e7eb" opacity={0.3} />
          );
        })}

        {/* Fret Numbers below the neck */}
        {Array.from({ length: numFrets }).map((_, i) => {
           const x = leftMargin + (i + 0.5) * fretSpacing;
           return (
             <text key={`fn-${i}`} x={x} y={height - 2} fill="#6b7280" fontSize="10" textAnchor="middle" fontWeight="bold">
               {i + 1}
             </text>
           )
        })}

        {/* Strings */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = topMargin + i * stringSpacing;
          // Thicker strings at the top (visually index 0 is low E)
          const thickness = 3 - (i * 0.4);
          return (
            <g key={`string-${i}`}>
              {/* String Name on the left of nut */}
              <text x={leftMargin - 15} y={y + 4} fill="#9ca3af" fontSize="12" fontWeight="bold" textAnchor="middle">
                {STRING_NAMES[i]}
              </text>
              <line
                x1={leftMargin}
                y1={y}
                x2={width - rightMargin}
                y2={y}
                stroke="#d1d5db"
                strokeWidth={thickness}
                opacity={0.8}
              />
            </g>
          );
        })}

        {/* Logic for Barre (Cejilla) */}
        {(() => {
          if (!fingering) return null;
          const activeFrets = fingering.frets.filter((f) => f > 0);
          const minPlayedFret = activeFrets.length > 0 ? Math.min(...activeFrets) : -1;
          const minFretIndices = fingering.frets.map((f, i) => (f === minPlayedFret ? i : -1)).filter((i) => i !== -1);

          let hasBarre = false;
          let barreStartIdx = -1;
          let barreEndIdx = -1;

          if (minFretIndices.length >= 2) {
            const span = minFretIndices[minFretIndices.length - 1] - minFretIndices[0];
            if (span >= 2) { 
              // More than 2 strings bounded usually indicates a barre check
              hasBarre = true;
              barreStartIdx = minFretIndices[0];
              barreEndIdx = minFretIndices[minFretIndices.length - 1];
            }
          }

          if (hasBarre && minPlayedFret > 0 && minPlayedFret <= numFrets) {
            const x = leftMargin + (minPlayedFret - 0.5) * fretSpacing;
            // High string is index 5 (bottom), low string is index 0 (top)
            const yStart = topMargin + barreStartIdx * stringSpacing;
            const yEnd = topMargin + barreEndIdx * stringSpacing;
            
            return (
              <rect
                key="barre-overlay"
                x={x - 10}
                y={yStart - 10}
                width={20}
                height={yEnd - yStart + 20}
                rx={10}
                ry={10}
                fill={color}
                opacity={0.45}
                style={{ filter: `drop-shadow(0 0 15px ${color})` }}
                className="animate-in zoom-in duration-300"
              />
            );
          }
          return null;
        })()}

        {/* Pressed Notes */}
        {fingering && fingering.frets.map((fretIndex, stringIndex) => {
           const y = topMargin + stringIndex * stringSpacing;

           if (fretIndex === -1) {
             return (
               <text key={`x-${stringIndex}`} x={leftMargin - 15} y={y + 4} fill="#ef4444" fontSize="14" fontWeight="black" textAnchor="middle" opacity={0.8}>
                 X
               </text>
             );
           }
           if (fretIndex === 0) {
             return (
               <circle key={`o-${stringIndex}`} cx={leftMargin - 15} cy={y} r={6} fill="transparent" stroke={color} strokeWidth={2} />
             );
           }

           // The actual pressed fret (absolute)
           // If baseFret > 1, the fret index absolute = baseFret + relative - 1
           // Our algorithm gives absolute frets directly!
           if (fretIndex > 0 && fretIndex <= numFrets) {
             const x = leftMargin + (fretIndex - 0.5) * fretSpacing;
             return (
               <g key={`note-${stringIndex}`} className="animate-in zoom-in duration-300">
                 <circle cx={x} cy={y} r={12} fill={color} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
                 {/* Inner glow dot */}
                 <circle cx={x} cy={y} r={4} fill="#ffffff" opacity={0.5} />
               </g>
             );
           }
           return null;
        })}
      </svg>
    </div>
  );
}
