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
  const isPlayingRef = useRef(false);

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
            // Recopilar todos los acordes de la línea
            const lineChords: Chord[] = [];
            line.words.forEach(w => w.syllables.forEach(syl => {
              if (syl.chord) lineChords.push(syl.chord);
            }));

            const numChords = lineChords.length;
            // Si la línea no tiene "beats" configurado, le damos 4 tiempos a CADA acorde que tenga, o 8 tiempos por defecto.
            const totalLineBeats = (line.beats && line.beats > 0) ? line.beats : (numChords > 0 ? numChords * 4 : 8);
            const lineDurationSecs = totalLineBeats * beatDurationSecs;
            const chords: ChordCue[] = [];

            // Algoritmo de Compás (Distribución Inteligente)
            if (numChords > 0) {
              let currentBeatOffset = 0;

              for (let i = 0; i < numChords; i++) {
                let chordBeats = 1;
                if (i === numChords - 1) {
                   // El último acorde se lleva los tiempos restantes
                   chordBeats = totalLineBeats - currentBeatOffset;
                   if (chordBeats < 0) chordBeats = 1; // Fallback de seguridad
                } else {
                   // Todos los demás acorde se llevan la división entera
                   chordBeats = Math.floor(totalLineBeats / numChords);
                   if (chordBeats < 1) chordBeats = 1;
                }

                chords.push({
                   chord: lineChords[i],
                   // startTime de cada acorde es proporcional a sus beats
                   startTime: currentTime + (currentBeatOffset * beatDurationSecs)
                });
                
                currentBeatOffset += chordBeats;
              }
            }

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
    if (!isPlayingRef.current) return; // FIX: Prevenir ejecución zombi

    if (!startTimeRef.current) startTimeRef.current = currentTimeTimestamp;
    const elapsedSeconds = (currentTimeTimestamp - startTimeRef.current) / 1000;

    let currentActiveLine: string | null = null;
    let currentActiveChord: Chord | null = null;
    const currentTimeline = timelineRef.current;
    
    // Búsqueda en el Timeline Dinámico
    for (const cue of currentTimeline) {
      if (elapsedSeconds >= cue.startTime && elapsedSeconds < cue.endTime) {
        currentActiveLine = cue.lineId;
        
        // Bucle inverso (Motor Sub-Cronológico)
        if (cue.chords.length > 0) {
          currentActiveChord = cue.chords[0].chord; 
          for (let j = cue.chords.length - 1; j >= 0; j--) {
             if (elapsedSeconds >= cue.chords[j].startTime) {
               currentActiveChord = cue.chords[j].chord;
               break;
             }
          }
        }
        break; 
      }
    }

    // Auto-Pause Inteligente Premium (Al terminar la canción)
    if (currentTimeline.length > 0 && elapsedSeconds >= currentTimeline[currentTimeline.length - 1].endTime) {
       setIsPlaying(false);
       isPlayingRef.current = false;
       setActiveLineId(null);
       setActiveChord(null);
       startTimeRef.current = null;
       return; 
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
    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(loop);
    }
  }, []); 

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextIsPlaying = !prev;
      isPlayingRef.current = nextIsPlaying; // Actualizar ref sincrónicamente
      
      if (nextIsPlaying) {
        // Al darle al Play
        startTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        // Al darle al Pause
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setActiveLineId(null);
        setActiveChord(null);
        startTimeRef.current = null; // Reiniciar startTime para evitar saltos al reanudar
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
