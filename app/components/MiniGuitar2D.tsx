import React from 'react';
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

export default function MiniGuitar2D({ chord, themeColor = "theme-purple", className = "" }: { chord: Chord, themeColor?: string, className?: string }) {
  const { frets, baseFret } = getGuitarFingering(chord.rootNote, chord.variation);
  const color = THEME_COLORS[themeColor] || "#7c3aed";

  const numFrets = 5;
  const width = 140;
  const height = 180;
  const topMargin = 30;
  const leftMargin = 30;
  const rightMargin = 10;
  const bottomMargin = 10;

  const stringSpacing = (width - leftMargin - rightMargin) / 5;
  const fretSpacing = (height - topMargin - bottomMargin) / numFrets;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm max-w-[140px]">
        
        {/* Number for base fret if it's > 1 */}
        {baseFret > 1 && (
          <text x={leftMargin - 15} y={topMargin + fretSpacing / 2 + 5} fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">
            {baseFret}
          </text>
        )}

        {/* Frets (Horizontal lines) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => {
          const y = topMargin + i * fretSpacing;
          const isNut = baseFret === 1 && i === 0;
          return (
            <line
              key={`fret-${i}`}
              x1={leftMargin}
              y1={y}
              x2={width - rightMargin}
              y2={y}
              stroke="currentColor"
              strokeWidth={isNut ? 4 : 1}
              opacity={isNut ? 1 : 0.4}
            />
          );
        })}

        {/* Strings (Vertical lines) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = leftMargin + i * stringSpacing;
          return (
            <line
              key={`string-${i}`}
              x1={x}
              y1={topMargin}
              x2={x}
              y2={height - bottomMargin}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}

        {/* Fingerings / Circles / X's / O's */}
        {frets.map((fret, stringIndex) => {
          const x = leftMargin + stringIndex * stringSpacing;

          if (fret === -1) {
            // Draw 'X'
            return (
              <text key={`note-${stringIndex}`} x={x} y={topMargin - 10} fontSize="12" fontWeight="bold" fill="#ef4444" textAnchor="middle">
                X
              </text>
            );
          }

          if (fret === 0) {
            // Draw 'O' (open string)
            return (
              <circle key={`note-${stringIndex}`} cx={x} cy={topMargin - 12} r={4} fill="transparent" stroke="currentColor" strokeWidth={1} opacity={0.5} />
            );
          }

          // Draw filled circle for pressed fret
          const renderFret = fret - baseFret;
          // Only draw if within visual bounds
          if (renderFret >= 0 && renderFret < numFrets) {
            const y = topMargin + renderFret * fretSpacing + (fretSpacing / 2);
            return (
              <circle key={`note-${stringIndex}`} cx={x} cy={y} r={7} fill={color} />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}
