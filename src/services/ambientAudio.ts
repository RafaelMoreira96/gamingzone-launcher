// Ambient Lo-Fi / Retro Synth procedural audio engine
// Pure Web Audio API - zero dependencies, zero network requests, offline-ready

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.3;
  private timer: number | null = null;
  private chordIndex: number = 0;
  private currentNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  // Dreamy retro chord progressions (frequencies in Hz)
  private readonly chords: number[][] = [
    // Dmaj9
    [146.83, 220.0, 277.18, 369.99, 329.63],
    // Bm9
    [123.47, 185.0, 220.0, 293.66, 277.18],
    // Gmaj7 (#11)
    [98.0, 146.83, 185.0, 246.94, 277.18],
    // A6/9
    [110.0, 164.81, 220.0, 293.66, 329.63],
  ];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start(initialVolume?: number) {
    if (typeof initialVolume === "number") {
      this.volume = Math.max(0, Math.min(1, initialVolume));
    }
    if (this.isPlaying) {
      if (typeof initialVolume === "number") {
        this.setVolume(initialVolume);
      }
      return;
    }
    try {
      this.initContext();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      }
      this.isPlaying = true;
      this.playNextChord();
      // Cycle chord every 7 seconds
      this.timer = window.setInterval(() => {
        if (this.isPlaying) {
          this.playNextChord();
        }
      }, 7000);
    } catch (e) {
      console.warn("Ambient audio start error:", e);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.fadeCurrentNodesOut();
  }

  public pause() {
    this.stop();
  }

  public resume() {
    this.start();
  }

  private fadeCurrentNodesOut() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const item of this.currentNodes) {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(item.gain.gain.value, now);
        item.gain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        item.osc.stop(now + 1.25);
      } catch (_) {}
    }
    this.currentNodes = [];
  }

  private playNextChord() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.chordIndex % this.chords.length];
    this.chordIndex++;

    // Gently fade out old chord over 2.5s
    for (const item of this.currentNodes) {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(item.gain.gain.value, now);
        item.gain.gain.linearRampToValueAtTime(0.0001, now + 2.5);
        item.osc.stop(now + 2.6);
      } catch (_) {}
    }
    this.currentNodes = [];

    // Filter node for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.2, now);
    filter.connect(this.masterGain);

    // Build soft chord oscillators
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Alternate subtle wave types for rich harmony
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      // Slight chorus detune
      const detuneCents = (idx % 2 === 0 ? 3.5 : -3.5);
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      const targetGain = 0.05 / Math.sqrt(chord.length);
      noteGain.gain.setValueAtTime(0.0001, now);
      // Soft gentle 2.2s attack
      noteGain.gain.linearRampToValueAtTime(targetGain, now + 2.2);
      // Gentle decay/sustain
      noteGain.gain.linearRampToValueAtTime(targetGain * 0.75, now + 5.5);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now);
      this.currentNodes.push({ osc, gain: noteGain });
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
