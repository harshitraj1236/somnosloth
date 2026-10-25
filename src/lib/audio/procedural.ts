import type { SoundscapeType } from "../../types/sleep";

/**
 * Procedural Web Audio Engine
 * Generates continuous non-looping rain, fire, and cosmic ambient sound
 * without downloading external MP3/WAV files.
 */
export class ProceduralSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isRunning = false;

  init(type: SoundscapeType, volume = 0.5): boolean {
    if (typeof window === "undefined") return false;

    this.stop();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Ensure audio context is running (iOS user-gesture resume)
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      if (type === "cosmos") {
        this.createCosmosDrone();
      } else {
        this.createNoiseSoundscape(type);
      }

      this.isRunning = true;
      return true;
    } catch (e) {
      console.warn("[ProceduralSoundscape] Failed to initialize AudioContext:", e);
      return false;
    }
  }

  private createNoiseSoundscape(type: "rain" | "fire"): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Integrated brownian noise
      outputSample(i, white);
    }

    function outputSample(i: number, white: number) {
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= type === "rain" ? 3.0 : 4.0;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    if (type === "rain") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    } else {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    }

    noiseSource.connect(filter);
    filter.connect(this.masterGain);
    noiseSource.start();
    this.noiseSource = noiseSource;
  }

  private createCosmosDrone(): void {
    if (!this.ctx || !this.masterGain) return;

    // Harmonic fundamental drones (108Hz and 110Hz generate a relaxing 2Hz delta beat)
    const freqs = [108, 110, 216];
    this.oscillators = [];

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    droneGain.connect(this.masterGain);

    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.connect(droneGain);
      osc.start();
      this.oscillators.push(osc);
    }
  }

  fadeToSilence(durationSeconds: number, onComplete?: () => void): void {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const currentGain = this.masterGain.gain.value;
    this.masterGain.gain.setValueAtTime(currentGain, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + durationSeconds);

    setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, durationSeconds * 1000);
  }

  setVolume(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
  }

  stop(): void {
    this.isRunning = false;

    if (this.noiseSource) {
      try {
        (this.noiseSource as AudioBufferSourceNode).stop();
      } catch (e) {}
      this.noiseSource = null;
    }

    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch (e) {}
    }
    this.oscillators = [];

    if (this.ctx && this.ctx.state !== "closed") {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.masterGain = null;
  }

  get active(): boolean {
    return this.isRunning;
  }
}
