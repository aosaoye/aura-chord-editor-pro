// pitchProcessor.js
// Runs in the AudioWorkletGlobalScope (background thread)

const MIN_SAMPLES = 0; // Se usará la longitud enviada

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  // Volume passed via port so UI can use it for Noise Gate calibration
  if (rms < 0.001) return { freq: -1, rms }; 

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

  return { freq: sampleRate / T0, rms };
}

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 2048 is a good size for YIN/AutoCorrelate at 44.1kHz (detects down to ~40Hz)
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.framesToCollect = this.bufferSize / 128; // Web Audio gives us 128 frames per process() call
    this.frameCount = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      
      // Copy incoming 128 frames into our larger buffer
      this.buffer.set(channelData, this.frameCount * 128);
      this.frameCount++;

      if (this.frameCount >= this.framesToCollect) {
        // We have enough data to run pitch detection
        const { freq, rms } = autoCorrelate(this.buffer, sampleRate);
        
        this.port.postMessage({ freq, rms });
        
        this.frameCount = 0;
      }
    }
    // Keep processor alive
    return true;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
