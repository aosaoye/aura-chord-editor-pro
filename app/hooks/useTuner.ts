import { useState, useEffect, useRef, useCallback } from 'react';

export type TunerInstrument = 'guitar' | 'bass' | 'ukulele' | 'violin' | 'chromatic';

export const INSTRUMENT_STRINGS = {
  guitar: [
    { note: 'E2', freq: 82.41, string: 6 },
    { note: 'A2', freq: 110.00, string: 5 },
    { note: 'D3', freq: 146.83, string: 4 },
    { note: 'G3', freq: 196.00, string: 3 },
    { note: 'B3', freq: 246.94, string: 2 },
    { note: 'E4', freq: 329.63, string: 1 }
  ],
  bass: [
    { note: 'E1', freq: 41.20, string: 4 },
    { note: 'A1', freq: 55.00, string: 3 },
    { note: 'D2', freq: 73.42, string: 2 },
    { note: 'G2', freq: 98.00, string: 1 }
  ],
  ukulele: [
    { note: 'G4', freq: 392.00, string: 4 },
    { note: 'C4', freq: 261.63, string: 3 },
    { note: 'E4', freq: 329.63, string: 2 },
    { note: 'A4', freq: 440.00, string: 1 }
  ],
  violin: [
    { note: 'G3', freq: 196.00, string: 4 },
    { note: 'D4', freq: 293.66, string: 3 },
    { note: 'A4', freq: 440.00, string: 2 },
    { note: 'E5', freq: 659.25, string: 1 }
  ]
};

// Algoritmo de Autocorrelación para detectar el tono (Pitch Detection)
function autoCorrelate(buf: Float32Array, sampleRate: number) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // No hay suficiente volumen (ruido de fondo)

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE - i; j++)
      c[i] = c[i] + buf[j] * buf[j + i];

  let d = 0; while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[maxval], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * maxval) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export function useTuner(instrument: TunerInstrument = 'chromatic') {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number>(0);
  const [closestString, setClosestString] = useState<{ note: string, freq: number, string: number } | null>(null);
  const [cents, setCents] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  const instrumentRef = useRef<TunerInstrument>(instrument);
  useEffect(() => {
    instrumentRef.current = instrument;
  }, [instrument]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startTuning = useCallback(async () => {
    try {
      setError(null);
      
      // En HTTP puro fuera de localhost, navigator.mediaDevices es undefined por seguridad del navegador.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El acceso al micrófono requiere una conexión segura (HTTPS) o localhost.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsListening(true);
      updatePitch();
    } catch (err: any) {
      // Evitamos usar alert() o console.error para no disparar el overlay rojo del entorno de desarrollo de Next.js
      setError(err.message === "El acceso al micrófono requiere una conexión segura (HTTPS) o localhost." 
        ? err.message 
        : "Permiso denegado o micrófono no encontrado.");
    }
  }, []);

  const stopTuning = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    
    // Evitar crasheo si el contexto ya estaba cerrado o fallido
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    setIsListening(false);
    setPitch(0);
    setCents(0);
    setClosestString(null);
  }, []);

  // Mantenemos un historial de frecuencias para filtro de mediana (suavizado)
  const pitchHistoryRef = useRef<number[]>([]);

  const getMedianPitch = (freq: number) => {
    pitchHistoryRef.current.push(freq);
    if (pitchHistoryRef.current.length > 5) {
      pitchHistoryRef.current.shift();
    }
    const sorted = [...pitchHistoryRef.current].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const rawFreq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    // Filter valid pitches
    if (rawFreq !== -1 && rawFreq > 20 && rawFreq < 2000) {
      
      const freq = getMedianPitch(rawFreq);
      setPitch(freq);
      
      const currentInst = instrumentRef.current;
      let targetFreq = 440;
      let targetNote = "A4";
      let targetStringNum = 0;

      if (currentInst === 'chromatic') {
        const noteNum = 12 * Math.log2(freq / 440) + 69;
        const roundedNote = Math.round(noteNum);
        const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const noteName = NOTE_NAMES[roundedNote % 12];
        const octave = Math.floor(roundedNote / 12) - 1;
        
        targetFreq = 440 * Math.pow(2, (roundedNote - 69) / 12);
        targetNote = `${noteName}${octave}`;
        targetStringNum = 0;
      } else {
        const strings = INSTRUMENT_STRINGS[currentInst] || INSTRUMENT_STRINGS.guitar;
        let minRatio = Infinity;
        let bestTarget = strings[0];

        for (const str of strings) {
          const ratioDiff = Math.abs(Math.log2(freq / str.freq));
          if (ratioDiff < minRatio) {
            minRatio = ratioDiff;
            bestTarget = str;
          }
        }
        targetFreq = bestTarget.freq;
        targetNote = bestTarget.note;
        targetStringNum = bestTarget.string;
      }
      
      setClosestString({ 
        note: targetNote, 
        freq: targetFreq, 
        string: targetStringNum 
      });

      const centsOff = Math.floor(1200 * Math.log2(freq / targetFreq));
      setCents(Math.max(-50, Math.min(50, centsOff)));
    } else {
       // Opcional: limpiar la mediana si hay silencio para no arrastrar la cola
       if (rawFreq === -1 && pitchHistoryRef.current.length > 0) {
         pitchHistoryRef.current.shift();
       }
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return stopTuning; // Cleanup on unmount
  }, [stopTuning]);

  return { isListening, startTuning, stopTuning, pitch, closestString, cents, error };
}
