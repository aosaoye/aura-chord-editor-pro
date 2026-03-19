import { useState, useEffect, useRef, useCallback } from 'react';

// Frecuencias exactas de las cuerdas de la guitarra estándar
const GUITAR_STRINGS = [
  { note: 'E2', freq: 82.41, string: 6 },
  { note: 'A2', freq: 110.00, string: 5 },
  { note: 'D3', freq: 146.83, string: 4 },
  { note: 'G3', freq: 196.00, string: 3 },
  { note: 'B3', freq: 246.94, string: 2 },
  { note: 'E4', freq: 329.63, string: 1 }
];

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

export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number>(0);
  const [closestString, setClosestString] = useState<{ note: string, freq: number, string: number } | null>(null);
  const [cents, setCents] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startTuning = useCallback(async () => {
    try {
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
    } catch (err) {
      console.error("No se pudo acceder al micrófono", err);
      alert("Por favor, permite el acceso al micrófono para usar el afinador.");
    }
  }, []);

  const stopTuning = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsListening(false);
    setPitch(0);
    setCents(0);
    setClosestString(null);
  }, []);

  const updatePitch = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    if (freq !== -1) {
      setPitch(freq);
      
      // Encontrar la cuerda más cercana
      let closest = GUITAR_STRINGS[0];
      let minDiff = Math.abs(freq - GUITAR_STRINGS[0].freq);
      for (let i = 1; i < GUITAR_STRINGS.length; i++) {
        const diff = Math.abs(freq - GUITAR_STRINGS[i].freq);
        if (diff < minDiff) {
          closest = GUITAR_STRINGS[i];
          minDiff = diff;
        }
      }
      setClosestString(closest);

      // Calcular los "cents" (desviación: 1 cent = 1/100 de un semitono)
      const centsOff = Math.floor(1200 * Math.log2(freq / closest.freq));
      // Limitamos el rango visual entre -50 y +50 cents
      setCents(Math.max(-50, Math.min(50, centsOff)));
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return stopTuning; // Cleanup on unmount
  }, [stopTuning]);

  return { isListening, startTuning, stopTuning, pitch, closestString, cents };
}
