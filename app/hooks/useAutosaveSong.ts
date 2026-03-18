// app/hooks/useAutosaveSong.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '../config/config';

// 🚀 SENIOR OPTIMIZATION: Usamos lodash.debounce para limpieza de código, 
// o un timer nativo si no quieres dependencias. Aquí usaremos el nativo.
export function useAutosaveSong(song: Song | null, isPlaying: boolean, onSaveSuccess?: () => void) {
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const prevSongRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(async () => {
    if (!song || !song.id) return;
    
    setStatus('saving');
    try {
      const response = await fetch('/api/songs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: song.id, 
            title: song.title, // Add title and bpm just in case
            bpm: song.bpm,
            parsedData: song
        }),
      });

      if (!response.ok) throw new Error("Error en servidor");

      setStatus('saved');
      setLastSaved(new Date());
      prevSongRef.current = JSON.stringify(song);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error("Autosave failed:", error);
      setStatus('error');
    }
  }, [song, onSaveSuccess]);

  useEffect(() => {
    if (!song || !song.id) return;
    
    // 🚀 FIX: if the song is playing, prevent autosave so we don't interrupt performance
    if (isPlaying) {
        return; 
    }

    const currentSongJson = JSON.stringify(song);

    if (prevSongRef.current === null) {
      prevSongRef.current = currentSongJson;
      return;
    }

    if (prevSongRef.current === currentSongJson) {
      return;
    }

    setStatus('dirty');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      save();
    }, 3000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [song, isPlaying, save]);

  const forceSave = useCallback(() => {
      if (status === 'dirty') {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          save();
      }
  }, [status, save]);

  return { status, lastSaved, forceSave };
}