"use client";

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  // Create 1 second of white noise
  const bufferSize = ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// Simple piano synthesizer using the Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Map notes like "C3" to frequencies
  private readonly NOTE_FREQUENCIES: Record<string, number> = {
    "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  };

  private noiseBuffer: AudioBuffer | null = null;

  private pianoRawBuffers: Record<string, ArrayBuffer> = {};
  private pianoSamples: Record<string, AudioBuffer | null> = {};

  private guitarRawBuffers: Record<string, ArrayBuffer> = {};
  private guitarSamples: Record<string, AudioBuffer | null> = {};

  constructor() {
    if (typeof window !== "undefined") {
        // Pre-fetch Salamander Grand Piano (Yamaha C5) samples silently to avoid waiting for user interaction
        ["C2", "C3", "C4", "C5", "C6"].forEach(anchor => {
             fetch(`https://tonejs.github.io/audio/salamander/${anchor}.mp3`)
             .then(r => r.arrayBuffer())
             .then(b => { this.pianoRawBuffers[anchor] = b; })
             .catch(e => console.warn("Failed to prefetch piano sample", anchor, e));
        });

        // Pre-fetch Acoustic Guitar Steel samples from MusyngKite 
        ["C2", "C3", "C4", "C5", "C6"].forEach(anchor => {
             fetch(`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_guitar_steel-mp3/${anchor}.mp3`)
             .then(r => r.arrayBuffer())
             .then(b => { this.guitarRawBuffers[anchor] = b; })
             .catch(e => console.warn("Failed to prefetch guitar sample", anchor, e));
        });
    }
  }

  private init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.isInitialized = true;
      
      // Decode any prefetched raw buffers immediately when ctx unlocks
      Object.keys(this.pianoRawBuffers).forEach(async anchor => {
        if (this.pianoSamples[anchor] === undefined) {
           this.pianoSamples[anchor] = null;
           try {
             const b = await this.ctx!.decodeAudioData(this.pianoRawBuffers[anchor].slice(0));
             this.pianoSamples[anchor] = b;
           } catch(e) { console.error("Error decoding piano", anchor, e); }
        }
      });
      Object.keys(this.guitarRawBuffers).forEach(async anchor => {
        if (this.guitarSamples[anchor] === undefined) {
           this.guitarSamples[anchor] = null;
           try {
             const b = await this.ctx!.decodeAudioData(this.guitarRawBuffers[anchor].slice(0));
             this.guitarSamples[anchor] = b;
           } catch(e) { console.error("Error decoding guitar", anchor, e); }
        }
      });
      
    } catch (e) {
      console.warn("AudioContext not supported in this browser");
    }
  }

  // Resumes audio context if it was suspended (autoplay policy)
  private async ensureRunning() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  public playChord(notes: (string | number)[], instrument: 'piano' | 'guitar' = 'piano') {
    this.ensureRunning().then(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      if (!this.noiseBuffer) {
        this.noiseBuffer = createWhiteNoiseBuffer(this.ctx);
      }

      const masterGain = this.ctx.createGain();
      // Ajuste de volumen principal por instrumento para no saturar
      masterGain.gain.value = (instrument === 'guitar' ? 1.0 : 0.7) / Math.max(1, notes.length * 0.5);
      masterGain.connect(this.ctx.destination);

      notes.forEach((noteRaw, index) => {
        let note = noteRaw;
        if (typeof noteRaw === "number") {
          const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
          const octave = Math.floor(noteRaw / 12) + 3;
          note = `${noteNames[(noteRaw % 12 + 12) % 12]}${octave}`;
        }
        
        const freq = this.NOTE_FREQUENCIES[note as string];
        // Strum effect for guitar (each string plucked slightly later mimicking a pick going down)
        const timeOffset = instrument === 'guitar' ? index * 0.04 : index * 0.01;
        const attackTime = now + timeOffset;

        if (instrument === 'piano') {
           const match = (note as string).match(/([A-G]#?)(\d)/);
           let playedWithSample = false;
           
           if (match) {
             const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
             const noteName = match[1];
             const octave = parseInt(match[2], 10);
             const indexInOctave = noteNames.indexOf(noteName);
             
             let anchorOctave = octave;
             let semitones = indexInOctave;
             if (indexInOctave > 6) {
               // Shift to the next octave's C to minimize pitch shift distortion
               anchorOctave += 1;
               semitones = indexInOctave - 12;
             }
             
             // Clamp anchor octave to our available samples
             if (anchorOctave < 2) { anchorOctave = 2; semitones = indexInOctave + (octave - 2) * 12; }
             if (anchorOctave > 6) { anchorOctave = 6; semitones = indexInOctave + (octave - 6) * 12; }
             
             const anchorNote = `C${anchorOctave}`;
             const buffer = this.pianoSamples[anchorNote];
             
             if (buffer) {
                playedWithSample = true;
                const source = this.ctx!.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = Math.pow(2, semitones / 12);
                
                const gainNode = this.ctx!.createGain();
                // Acústica realista: Ataque inmediato, sustain natural larguísimo, ligero release
                gainNode.gain.setValueAtTime(1, attackTime);
                gainNode.gain.setTargetAtTime(0, attackTime + 2.5, 0.8);
                
                source.connect(gainNode);
                gainNode.connect(masterGain);
                source.start(attackTime);
             }
           }
           
           // Fallback Si la red falló o el buffer no decodificó a tiempo
           if (!playedWithSample) {
             // Alta Calidad Sintética: Rhodes Electric Piano (FM/Sine Mix)
             const osc1 = this.ctx!.createOscillator();
             const osc2 = this.ctx!.createOscillator();
             const osc3 = this.ctx!.createOscillator();
             osc1.type = "sine";
             osc2.type = "triangle";
             osc3.type = "sine";
             
             osc1.frequency.setValueAtTime(freq, attackTime);
             osc2.frequency.setValueAtTime(freq * 1.002, attackTime); 
             osc3.frequency.setValueAtTime(freq * 2, attackTime);
             
             const mainGain = this.ctx!.createGain();
             mainGain.gain.setValueAtTime(0, attackTime);
             mainGain.gain.linearRampToValueAtTime(1, attackTime + 0.02);
             mainGain.gain.exponentialRampToValueAtTime(0.5, attackTime + 0.5);
             mainGain.gain.exponentialRampToValueAtTime(0.001, attackTime + 3.0);

             const bellGain = this.ctx!.createGain();
             bellGain.gain.setValueAtTime(0, attackTime);
             bellGain.gain.linearRampToValueAtTime(0.3, attackTime + 0.01);
             bellGain.gain.exponentialRampToValueAtTime(0.001, attackTime + 0.3);

             const filter = this.ctx!.createBiquadFilter();
             filter.type = "lowpass";
             filter.frequency.setValueAtTime(2500, attackTime);
             filter.frequency.exponentialRampToValueAtTime(500, attackTime + 1.5);
             filter.Q.value = 1.2;

             osc1.connect(mainGain);
             osc2.connect(mainGain);
             osc3.connect(bellGain);
             
             mainGain.connect(filter);
             bellGain.connect(filter);
             filter.connect(masterGain);

             osc1.start(attackTime);
             osc2.start(attackTime);
             osc3.start(attackTime);
             osc1.stop(attackTime + 3);
             osc2.stop(attackTime + 3);
             osc3.stop(attackTime + 0.5);
           }
        } else {
           const match = (note as string).match(/([A-G]#?)(\d)/);
           let playedWithSample = false;
           
           if (match) {
             const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
             const noteName = match[1];
             const octave = parseInt(match[2], 10);
             const indexInOctave = noteNames.indexOf(noteName);
             
             let anchorOctave = octave;
             let semitones = indexInOctave;
             if (indexInOctave > 6) {
               anchorOctave += 1;
               semitones = indexInOctave - 12;
             }
             
             if (anchorOctave < 2) { anchorOctave = 2; semitones = indexInOctave + (octave - 2) * 12; }
             if (anchorOctave > 6) { anchorOctave = 6; semitones = indexInOctave + (octave - 6) * 12; }
             
             const anchorNote = `C${anchorOctave}`;
             const buffer = this.guitarSamples[anchorNote];
             
             if (buffer) {
                playedWithSample = true;
                const source = this.ctx!.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = Math.pow(2, semitones / 12);
                
                const gainNode = this.ctx!.createGain();
                // Acústica realista: Ataque inmediato, ligera resonancia y fader
                gainNode.gain.setValueAtTime(1.5, attackTime); // Boost slight volume because acoustic samples are quiet
                gainNode.gain.setTargetAtTime(0.001, attackTime + 3.0, 0.5); // Natural slow decay 
                
                source.connect(gainNode);
                gainNode.connect(masterGain);
                source.start(attackTime);
             }
           }
           
           if (!playedWithSample) {
             // Fallback minimalista por si el internet falla (sin gatos atropellados)
             const osc1 = this.ctx!.createOscillator();
             osc1.type = "sine";
             osc1.frequency.setValueAtTime(freq, attackTime);
             
             const gainNode = this.ctx!.createGain();
             gainNode.gain.setValueAtTime(0, attackTime);
             gainNode.gain.linearRampToValueAtTime(1, attackTime + 0.005);
             gainNode.gain.exponentialRampToValueAtTime(0.1, attackTime + 0.4);
             gainNode.gain.exponentialRampToValueAtTime(0.001, attackTime + 1.5);

             osc1.connect(gainNode);
             gainNode.connect(masterGain);
             osc1.start(attackTime);
             osc1.stop(attackTime + 1.5);
           }
        }
      });
    });
  }
}

export const audioEngine = typeof window !== "undefined" ? new AudioEngine() : null;
