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

// Algoritmo de Autocorrelación movido a public/pitchProcessor.js (AudioWorklet)
// para liberar el hilo principal de React.

export function useTuner(instrument: TunerInstrument = 'chromatic') {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number>(0);
  const [closestString, setClosestString] = useState<{ note: string, freq: number, string: number } | null>(null);
  const [cents, setCents] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('low');
  const noiseGateThreshold = useRef<number>(0.005); // Default threshold

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

      // Solicitamos a la API el audio más puro y crudo posible (Raw Capture)
      // Desactivamos los filtros nativos del navegador que destruyen los armónicos musicales
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        } 
      });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Cargar nuestro AudioWorklet pre-compilado para sacar la matemática del Main Thread
      await ctx.audioWorklet.addModule('/pitchProcessor.js');
      
      const source = ctx.createMediaStreamSource(stream);
      const pitchNode = new AudioWorkletNode(ctx, 'pitch-processor');
      
      // Conectar el nodo (no lo conectamos a destination para no hacer feedback)
      source.connect(pitchNode);

      // Fase de Calibración de Ruido (Noise Gate)
      setIsCalibrating(true);
      let noiseSamples: number[] = [];
      let stopCalibration = false;

      // Escuchar cálculos asíncronos del Worklet
      pitchNode.port.onmessage = (event) => {
         const { freq, rms } = event.data;
         
         if (isCalibrating && !stopCalibration) {
            noiseSamples.push(rms);
            if (noiseSamples.length > 50) { // ~1.5 segundos a 44.1kHz / 2048
               const avgNoise = noiseSamples.reduce((a,b) => a+b, 0) / noiseSamples.length;
               noiseGateThreshold.current = Math.max(0.001, avgNoise * 1.5); // 150% por encima del ruido base
               
               // Evaluar la calidad del entorno acústico
               if (avgNoise > 0.05) setNoiseLevel('high');
               else if (avgNoise > 0.015) setNoiseLevel('medium');
               else setNoiseLevel('low');

               setIsCalibrating(false);
               stopCalibration = true;
            }
            return; // Exit here while calibrating
         }

         if (rms < noiseGateThreshold.current) {
            handleNoSignal();
            return;
         }
         
         handleValidPitch(freq);
      };

      setIsListening(true);
    } catch (err: any) {
      // Evitamos usar alert() o console.error para no disparar el overlay rojo del entorno de desarrollo de Next.js
      setError(err.message === "El acceso al micrófono requiere una conexión segura (HTTPS) o localhost." 
        ? err.message 
        : "Permiso denegado o micrófono no encontrado.");
    }
  }, []);

  const stopTuning = useCallback(() => {
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

  const handleNoSignal = () => {
       if (pitchHistoryRef.current.length > 0) {
         pitchHistoryRef.current.shift();
       }
  };

  const handleValidPitch = (rawFreq: number) => {
    // Filter valid pitches mathematically
    if (rawFreq > 20 && rawFreq < 2000) {
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
    }
  };

  useEffect(() => {
    return stopTuning; // Cleanup on unmount
  }, [stopTuning]);

  return { isListening, startTuning, stopTuning, pitch, closestString, cents, error, isCalibrating, noiseLevel };
}
