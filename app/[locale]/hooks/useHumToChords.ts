import { useState, useEffect, useRef, useCallback } from 'react';

// Frequencies to Note mapping
function freqToNoteName(freq: number): string {
  const noteNum = 12 * Math.log2(freq / 440) + 69;
  const roundedNote = Math.round(noteNum);
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return NOTE_NAMES[roundedNote % 12];
}

// Basic Harmonic engine to deduce a chord from a set of notes
function deduceChord(notes: string[]): string {
  if (notes.length === 0) return "";
  
  // Count occurrences
  const counts: Record<string, number> = {};
  notes.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  
  // The most sung note usually implies the root or a strong interval
  const uniqueNotes = Array.from(new Set(notes));
  const root = notes[0]; // simplistic assumption: first note of phrase is root

  if (uniqueNotes.length === 1) return root; // Only sang one note
  
  // Check for minor third (3 semitones) vs major third (4 semitones)
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootIdx = NOTE_NAMES.indexOf(root);
  
  let isMinor = false;
  
  for (const note of uniqueNotes) {
    if (note === root) continue;
    const idx = NOTE_NAMES.indexOf(note);
    let diff = idx - rootIdx;
    if (diff < 0) diff += 12;
    
    // Minor 3rd detected
    if (diff === 3) isMinor = true;
  }
  
  return isMinor ? `${root}m` : root;
}

export type Phrase = {
  id: string;
  notes: string[];
  suggestedChord: string;
};

export function useHumToChords() {
  const [isRecording, setIsRecording] = useState(false);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('low');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const noiseGateThreshold = useRef<number>(0.005);
  
  // State for quantization
  const lastNoteRef = useRef<{ note: string, startMs: number, lastSeenMs: number } | null>(null);
  const activePhraseBuffer = useRef<string[]>([]);
  const silenceStartMs = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("HTTPS required");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } 
      });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      await ctx.audioWorklet.addModule('/pitchProcessor.js');
      
      const source = ctx.createMediaStreamSource(stream);
      const pitchNode = new AudioWorkletNode(ctx, 'pitch-processor');
      source.connect(pitchNode);

      // Simple baseline for test, real app would do 3s calibration here too
      let isCalibrating = true;
      let noiseSamples: number[] = [];

      pitchNode.port.onmessage = (event) => {
         const { freq, rms } = event.data;
         const now = Date.now();
         
         if (isCalibrating) {
            noiseSamples.push(rms);
            if (noiseSamples.length > 50) {
               const avgNoise = noiseSamples.reduce((a,b) => a+b, 0) / noiseSamples.length;
               noiseGateThreshold.current = Math.max(0.001, avgNoise * 1.5);
               if (avgNoise > 0.05) setNoiseLevel('high');
               else if (avgNoise > 0.015) setNoiseLevel('medium');
               else setNoiseLevel('low');
               isCalibrating = false;
            }
            return;
         }

         if (rms < noiseGateThreshold.current) {
            // SILENCE MODE
            if (!silenceStartMs.current) silenceStartMs.current = now;
            
            // If silence is held for > 1.2 seconds, wrap up the phrase!
            if (now - silenceStartMs.current > 1200 && activePhraseBuffer.current.length > 0) {
              const resultingChord = deduceChord(activePhraseBuffer.current);
              setPhrases(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                notes: [...activePhraseBuffer.current],
                suggestedChord: resultingChord
              }]);
              activePhraseBuffer.current = [];
              setActiveNotes([]); // clear UI
            }
            return;
         }
         
         // ACTIVE VOICE MODE
         silenceStartMs.current = null; // reset silence

         if (freq > 50 && freq < 2000) {
            const noteName = freqToNoteName(freq);
            
            if (!lastNoteRef.current || lastNoteRef.current.note !== noteName) {
              // Note changed
              if (lastNoteRef.current) {
                const holdDuration = now - lastNoteRef.current.startMs;
                // If held for > 150ms, it's an intentional musical note!
                if (holdDuration > 150) {
                  const finalNote = lastNoteRef.current.note;
                  activePhraseBuffer.current.push(finalNote);
                  setActiveNotes([...activePhraseBuffer.current]);
                }
              }
              // Register new note start
              lastNoteRef.current = { note: noteName, startMs: now, lastSeenMs: now };
            } else {
              // Still holding same note
              lastNoteRef.current.lastSeenMs = now;
            }
         }
      };

      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording, phrases, activeNotes, noiseLevel };
}
