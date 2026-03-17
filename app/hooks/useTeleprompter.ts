import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Song, Chord } from '../config/config';

interface ChordCue {
  chord: Chord;
  startTime: number;
}

interface TimelineCue {
  lineId: string;
  startTime: number;
  endTime: number;
  chords: ChordCue[];
}

export function useTeleprompter(song: Song | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [activeChord, setActiveChord] = useState<Chord | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. RECALCULAR TIMELINE DINÁMICO (SOPORTA REPETICIONES x4)
  const timeline = useMemo(() => {
    if (!song) return [];
    const flatTimeline: TimelineCue[] = [];
    let currentTime = 0;
    const beatDurationSecs = 60 / song.bpm;
    
    // Generador Aplanado y Multiplicado: Desenrollamos la canción en memoria RAM (O(N))
    for (const section of song.sections) {
      const secRepeats = section.repeat || 1;
      
      for (let s = 0; s < secRepeats; s++) {
        for (const line of section.lines) {
          const lineRepeats = line.repeat || 1;
          
          for (let l = 0; l < lineRepeats; l++) {
            // Re-calculamos matemáticamente ignorando el JSON estático
            const lineDurationSecs = line.beats * beatDurationSecs;
            
            // Construcción Cronológica de Acordes dentro de la línea
            const chords: ChordCue[] = [];
            let totalSyllables = 0;
            line.words.forEach(w => totalSyllables += w.syllables.length);
            
            const timePerSyllable = totalSyllables > 0 ? lineDurationSecs / totalSyllables : 0;
            let sylIndex = 0;
            
            line.words.forEach(w => {
              w.syllables.forEach(syl => {
                if (syl.chord) {
                  chords.push({
                    chord: syl.chord,
                    startTime: currentTime + (sylIndex * timePerSyllable)
                  });
                }
                sylIndex++;
              });
            });

            flatTimeline.push({
              lineId: line.id,
              startTime: currentTime,
              endTime: currentTime + lineDurationSecs,
              chords
            });
            currentTime += lineDurationSecs;
          }
        }
      }
    }
    return flatTimeline;
  }, [song]);

  // Ref para evitar Stale Closures en el loop de requestAnimationFrame
  const timelineRef = useRef<TimelineCue[]>(timeline);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // 2. Bucle ultra-rápido de requestAnimationFrame
  const loop = useCallback((currentTimeTimestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = currentTimeTimestamp;
    const elapsedSeconds = (currentTimeTimestamp - startTimeRef.current) / 1000;

    let currentActiveLine: string | null = null;
    let currentActiveChord: Chord | null = null;
    const currentTimeline = timelineRef.current;
    
    // Búsqueda en el Timeline Dinámico
    for (const cue of currentTimeline) {
      if (elapsedSeconds >= cue.startTime && elapsedSeconds < cue.endTime) {
        currentActiveLine = cue.lineId;
        
        // Motor Sub-Cronológico: Averiguando qué acorde pisa exactamente este segundo
        if (cue.chords.length > 0) {
          currentActiveChord = cue.chords[0].chord; 
          for (const cc of cue.chords) {
             if (elapsedSeconds >= cc.startTime) {
               currentActiveChord = cc.chord;
             }
          }
        }
        break;
      }
    }

    // Auto-Pause Inteligente Premium (Al terminar la canción)
    if (currentTimeline.length > 0 && elapsedSeconds >= currentTimeline[currentTimeline.length - 1].endTime) {
       setIsPlaying(false);
       setActiveLineId(null);
       setActiveChord(null);
       startTimeRef.current = null;
       return; // Detiene el bucle forzadamente e impide requestAnimationFrame
    }

    setActiveLineId((prev) => {
      if (prev !== currentActiveLine) return currentActiveLine;
      return prev;
    });

    setActiveChord((prev) => {
      if (prev?.id !== currentActiveChord?.id) return currentActiveChord;
      return prev;
    });

    // Enlazamos al MISMO loop, pero leeremos de timelineRef
    animationFrameRef.current = requestAnimationFrame(loop);
  }, []); // Sin dependencias de estado para que sea infinito e inmutable

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextIsPlaying = !prev;
      
      if (nextIsPlaying) {
        // Al darle al Play
        startTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        // Al darle al Pause
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setActiveLineId(null);
        setActiveChord(null);
      }
      
      return nextIsPlaying;
    });
  }, [loop]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return { isPlaying, activeLineId, activeChord, togglePlay };
}
