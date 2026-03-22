"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export type MetronomeSound = 'click' | 'drum' | 'clap';

export interface MetronomeBreakpoint {
  measure: number;
  bpm?: number;
  beatsPerMeasure?: number;
}

export function useMetronome(initialBpm: number = 120) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [soundType, setSoundType] = useState<MetronomeSound>('click');
  const [breakPoints, setBreakPoints] = useState<MetronomeBreakpoint[]>([]);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const timerWorkerRef = useRef<Worker | null>(null);
  const nextNoteTimeRef = useRef(0);
  const current16thNoteRef = useRef(0);
  const currentMeasureRef = useRef(1);

  // Keep refs for state used in scheduled callbacks to avoid stale closures
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const breakPointsRef = useRef(breakPoints);
  const soundTypeRef = useRef(soundType);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);
  useEffect(() => { breakPointsRef.current = breakPoints; }, [breakPoints]);
  useEffect(() => { soundTypeRef.current = soundType; }, [soundType]);

  const lookaheadRef = useRef(25.0); // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTimeRef = useRef(0.1); // How far ahead to schedule audio (sec)

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
  };

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpmRef.current;
    // Add beat length to last beat time
    nextNoteTimeRef.current += secondsPerBeat;
    
    // Advance the beat number, wrap to zero
    current16thNoteRef.current++;
    if (current16thNoteRef.current >= beatsPerMeasureRef.current) {
      current16thNoteRef.current = 0;
      currentMeasureRef.current++;
      
      // Update React state for UI tracking (throttled to measure boundaries)
      setCurrentMeasure(currentMeasureRef.current);

      // Check for breakpoints
      const bp = breakPointsRef.current.find(b => b.measure === currentMeasureRef.current);
      if (bp) {
        if (bp.bpm) setBpm(bp.bpm);
        if (bp.beatsPerMeasure) setBeatsPerMeasure(bp.beatsPerMeasure);
      }
    }
  }, []);

  const playNote = useCallback((beatNumber: number, time: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const type = soundTypeRef.current;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      osc.connect(envelope);
      envelope.connect(ctx.destination);
      osc.frequency.value = beatNumber === 0 ? 880.0 : 440.0;
      envelope.gain.value = 1;
      envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      osc.start(time);
      osc.stop(time + 0.03);
    } 
    else if (type === 'drum') {
      if (beatNumber === 0) {
        // Kick drum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.start(time);
        osc.stop(time + 0.5);
      } else {
        // Hi-hat (noise burst)
        const bufferSize = ctx.sampleRate * 0.1; // 100ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(time);
      }
    }
    else if (type === 'clap') {
      if (beatNumber === 0) {
        // Simple synthetic clap (three staggered noise bursts)
        for (let i = 0; i < 3; i++) {
          const tOffset = time + (i * 0.012);
          const bufferSize = ctx.sampleRate * 0.1;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1200;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.8, tOffset);
          gain.gain.exponentialRampToValueAtTime(0.01, tOffset + 0.1);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start(tOffset);
        }
      } else {
        // Small tap
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        const envelope = ctx.createGain();
        osc.connect(envelope);
        envelope.connect(ctx.destination);
        osc.frequency.value = 600.0;
        envelope.gain.value = 0.3;
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        osc.start(time);
        osc.stop(time + 0.03);
      }
    }
  }, []);

  const scheduler = useCallback(() => {
    // while there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (audioContextRef.current && nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTimeRef.current) {
      playNote(current16thNoteRef.current, nextNoteTimeRef.current);
      nextNote();
    }
  }, [nextNote, playNote]);

  const schedulerRef = useRef(scheduler);
  useEffect(() => {
    schedulerRef.current = scheduler;
  }, [scheduler]);

  useEffect(() => {
    if (isPlaying) {
      if (!timerWorkerRef.current) {
        // Create an inline worker to keep reliable timing even when tab is backgrounded
        const blob = new Blob([`
          let timerID = null;
          let interval = 25;
          
          self.onmessage = function(e) {
            if (e.data === "start") {
              timerID = setInterval(function() {
                postMessage("tick");
              }, interval);
            } else if (e.data === "stop") {
              clearInterval(timerID);
              timerID = null;
            } else if (e.data.interval) {
              interval = e.data.interval;
              if (timerID) {
                clearInterval(timerID);
                timerID = setInterval(function() {
                  postMessage("tick");
                }, interval);
              }
            }
          };
        `], { type: 'application/javascript' });
        
        timerWorkerRef.current = new Worker(URL.createObjectURL(blob));
        
        timerWorkerRef.current.onmessage = (e) => {
          if (e.data === "tick") {
            schedulerRef.current();
          }
        };
      }
      
      initAudio();
      
      // Setup first beat
      current16thNoteRef.current = 0;
      currentMeasureRef.current = 1;
      setCurrentMeasure(1);
      nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.05;
      
      timerWorkerRef.current.postMessage("start");
      
    } else {
      if (timerWorkerRef.current) {
        timerWorkerRef.current.postMessage("stop");
      }
    }

    return () => {
      if (timerWorkerRef.current) {
        timerWorkerRef.current.postMessage("stop");
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerWorkerRef.current) {
        timerWorkerRef.current.terminate();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleMetronome = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev && audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      return !prev;
    });
  }, []);

  return { 
    isPlaying, toggleMetronome, 
    bpm, setBpm, 
    beatsPerMeasure, setBeatsPerMeasure,
    soundType, setSoundType,
    breakPoints, setBreakPoints,
    currentMeasure
  };
}
