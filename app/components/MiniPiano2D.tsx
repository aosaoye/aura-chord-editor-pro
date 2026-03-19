import React from 'react';
import type { Chord } from '../config/config';
import { getChordKeys } from '../helpers/chordToPianoKeys';

const THEME_COLORS: Record<string, string> = {
  "theme-purple": "#7c3aed",
  "theme-blue": "#3b82f6",
  "theme-green": "#10b981",
  "theme-rose": "#e11d48",
  "theme-orange": "#f97316",
  "theme-yellow": "#eab308",
  "theme-mono": "#171717"
};

export default function MiniPiano2D({ chord, themeColor = "theme-purple", className = "" }: { chord: Chord, themeColor?: string, className?: string }) {
  // 21 teclas blancas = 3 octavas.
  const numOctaves = 3;
  const keys = [];
  
  const OCTAVE_PATTERN = [
    { isBlack: false, whiteOffset: 0 },   // C
    { isBlack: true, whiteOffset: 0.5 },  // C#
    { isBlack: false, whiteOffset: 1 },   // D
    { isBlack: true, whiteOffset: 1.5 },  // D#
    { isBlack: false, whiteOffset: 2 },   // E
    { isBlack: false, whiteOffset: 3 },   // F
    { isBlack: true, whiteOffset: 3.5 },  // F#
    { isBlack: false, whiteOffset: 4 },   // G
    { isBlack: true, whiteOffset: 4.5 },  // G#
    { isBlack: false, whiteOffset: 5 },   // A
    { isBlack: true, whiteOffset: 5.5 },  // A#
    { isBlack: false, whiteOffset: 6 },   // B
  ];

  for (let oct = 0; oct < numOctaves; oct++) {
    for (let i = 0; i < 12; i++) {
        const pattern = OCTAVE_PATTERN[i];
        keys.push({
          index: oct * 12 + i,
          isBlack: pattern.isBlack,
          xPos: pattern.whiteOffset + (oct * 7)
        });
    }
  }

  // Active keys start from C2 according to getChordKeys base calculation
  const activeKeysRaw = getChordKeys(chord.rootNote, chord.variation, chord.bassNote);
  
  // No longer squish individual notes (wrapping distorts the voicing/inversion). 
  // It fits within 3 octaves natively.
  const normalizedActiveKeys = activeKeysRaw;

  const totalWhiteKeys = numOctaves * 7;
  const hexColor = THEME_COLORS[themeColor] || "#7c3aed";

  return (
    <svg 
      viewBox={`0 0 ${totalWhiteKeys * 20} 80`} 
      className={`w-full max-w-[200px] h-auto drop-shadow-sm ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* RENDER WHITE KEYS FIRST */}
      {keys.filter(k => !k.isBlack).map((k) => {
        const isActive = normalizedActiveKeys.includes(k.index);
        return (
          <g key={k.index}>
            <rect 
              x={k.xPos * 20} 
              y={0} 
              width={20} 
              height={80} 
              rx={1}
              fill={isActive ? hexColor : "#f8fafc"}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            {isActive && (
              <circle cx={k.xPos * 20 + 10} cy={65} r={3.5} fill="#ffffff" />
            )}
          </g>
        );
      })}

      {/* RENDER BLACK KEYS ON TOP */}
      {keys.filter(k => k.isBlack).map((k) => {
        const isActive = normalizedActiveKeys.includes(k.index);
        return (
          <g key={k.index}>
            <rect 
              x={k.xPos * 20 + 3.5} 
              y={0} 
              width={13} 
              height={48} 
              rx={1}
              fill={isActive ? hexColor : "#1e293b"}
              stroke="#0f172a"
              strokeWidth="0.5"
            />
            {isActive && (
               <circle cx={k.xPos * 20 + 10} cy={38} r={2.5} fill="#ffffff" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
