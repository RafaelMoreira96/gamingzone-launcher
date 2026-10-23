// Multi-profile Procedural Lo-Fi / Synth Ambient Engine
// Pure Web Audio API: 100% offline, zero assets, zero network requests, ultra-lightweight
import { LoFiProfileType } from "../types";

export interface LoFiProfileMetadata {
  id: LoFiProfileType;
  name: string;
  tag: string;
  desc: string;
  color: string;
  cycleIntervalSeconds: number;
}

export const LOFI_PROFILES: Record<LoFiProfileType, LoFiProfileMetadata> = {
  "cozy-synth": {
    id: "cozy-synth",
    name: "Cozy Bedroom Synth",
    tag: "Relax / Melódico",
    desc: "Acordes quentes de sintetizador vintage analógico com filtro lowpass aveludado",
    color: "#B347FF",
    cycleIntervalSeconds: 7,
  },
  "rainy-cafe": {
    id: "rainy-cafe",
    name: "Rainy Afternoon Cafe",
    tag: "Chuva / Lofi Suave",
    desc: "Harmonias em tons menores pontuadas por ruído marrom suave simulando chuva na janela",
    color: "#00E5FF",
    cycleIntervalSeconds: 8,
  },
  "cyber-chill": {
    id: "cyber-chill",
    name: "Cyberpunk Chill Lounge",
    tag: "Futurista / Deep",
    desc: "Ondas triangulares espaciais, oitavas graves e ressonância etérea inspirada em Blade Runner",
    color: "#FCEE0A",
    cycleIntervalSeconds: 6.5,
  },
  "dreamy-retro": {
    id: "dreamy-retro",
    name: "8-Bit Dreamy Nostalgia",
    tag: "Chiptune / Sonhador",
    desc: "Acordes sutis de arpejos 8-bit com modulação suave remetendo a clássicos da era 16-bit",
    color: "#00E676",
    cycleIntervalSeconds: 6,
  },
  "night-drive": {
    id: "night-drive",
    name: "Midnight Synth Drive",
    tag: "Outrun / Noturno",
    desc: "Progressões cinematográficas com sub-graves encorpados e texturas atmosféricas",
    color: "#FF2A85",
    cycleIntervalSeconds: 7.5,
  },
};

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.25;
  private currentProfile: LoFiProfileType = "cozy-synth";
  private timer: number | null = null;
  private chordIndex: number = 0;
  private currentNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  // Chord progressions per profile (frequencies in Hz)
  private readonly chordBanks: Record<LoFiProfileType, number[][]> = {
    "cozy-synth": [
      // Dmaj9
      [146.83, 220.0, 277.18, 369.99, 329.63],
      // Bm9
      [123.47, 185.0, 220.0, 293.66, 277.18],
      // Gmaj7(#11)
      [98.0, 146.83, 185.0, 246.94, 277.18],
      // A6/9
      [110.0, 164.81, 220.0, 293.66, 329.63],
    ],
    "rainy-cafe": [
      // Fmaj7
      [87.31, 130.81, 174.61, 220.0, 261.63],
      // Am7
      [110.0, 164.81, 220.0, 261.63, 329.63],
      // Dm7
      [73.42, 146.83, 174.61, 220.0, 261.63],
      // Bbmaj7
      [116.54, 174.61, 233.08, 293.66, 349.23],
    ],
    "cyber-chill": [
      // Cm9
      [65.41, 130.81, 196.0, 233.08, 293.66],
      // Abmaj7
      [103.83, 155.56, 207.65, 261.63, 311.13],
      // Fm9
      [87.31, 130.81, 174.61, 207.65, 261.63],
      // Bb11
      [116.54, 174.61, 233.08, 261.63, 349.23],
    ],
    "dreamy-retro": [
      // Cmaj7
      [130.81, 196.0, 246.94, 329.63],
      // Em7
      [164.81, 246.94, 293.66, 392.0],
      // Fmaj9
      [174.61, 261.63, 329.63, 392.0],
      // G6
      [196.0, 293.66, 392.0, 440.0],
    ],
    "night-drive": [
      // Em9
      [82.41, 164.81, 246.94, 293.66, 369.99],
      // Cmaj7(#11)
      [130.81, 196.0, 246.94, 329.63, 369.99],
      // D6/9
      [73.42, 146.83, 220.0, 293.66, 329.63],
      // Bm7
      [123.47, 185.0, 220.0, 293.66, 369.99],
    ],
  };

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

  public getProfile(): LoFiProfileType {
    return this.currentProfile;
  }

  public setProfile(profile: LoFiProfileType) {
    this.currentProfile = profile;
    this.chordIndex = 0;
    if (this.isPlaying) {
      // Re-trigger immediately with new profile
      this.playNextChord();
      this.resetTimer();
    }
  }

  public start(initialVolume?: number, profile?: LoFiProfileType) {
    if (typeof initialVolume === "number") {
      this.volume = Math.max(0, Math.min(1, initialVolume));
    }
    if (profile) {
      this.currentProfile = profile;
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
      this.resetTimer();
    } catch (e) {
      console.warn("Ambient audio start error:", e);
    }
  }

  private resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const meta = LOFI_PROFILES[this.currentProfile] || LOFI_PROFILES["cozy-synth"];
    this.timer = window.setInterval(() => {
      if (this.isPlaying) {
        this.playNextChord();
      }
    }, meta.cycleIntervalSeconds * 1000);
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
    this.start(this.volume, this.currentProfile);
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
    const chords = this.chordBanks[this.currentProfile] || this.chordBanks["cozy-synth"];
    const chord = chords[this.chordIndex % chords.length];
    this.chordIndex++;

    // Gently fade out old chord over 2.4s
    for (const item of this.currentNodes) {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(item.gain.gain.value, now);
        item.gain.gain.linearRampToValueAtTime(0.0001, now + 2.4);
        item.osc.stop(now + 2.5);
      } catch (_) {}
    }
    this.currentNodes = [];

    // Filter node adjusted by profile
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";

    if (this.currentProfile === "cyber-chill") {
      filter.frequency.setValueAtTime(950, now);
      filter.Q.setValueAtTime(2.2, now);
    } else if (this.currentProfile === "rainy-cafe") {
      filter.frequency.setValueAtTime(620, now);
      filter.Q.setValueAtTime(1.0, now);
    } else if (this.currentProfile === "dreamy-retro") {
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(0.8, now);
    } else if (this.currentProfile === "night-drive") {
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.8, now);
    } else {
      filter.frequency.setValueAtTime(750, now);
      filter.Q.setValueAtTime(1.2, now);
    }

    filter.connect(this.masterGain);

    // Build oscillators for the chord
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Waveform character based on profile
      if (this.currentProfile === "dreamy-retro") {
        osc.type = idx % 2 === 0 ? "square" : "triangle";
      } else if (this.currentProfile === "cyber-chill") {
        osc.type = "sawtooth";
      } else {
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
      }

      // Detune for lush analog warmth / chorus effect
      const detuneCents = (idx % 2 === 0 ? 3.5 : -3.5);
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      const targetGain =
        (this.currentProfile === "cyber-chill" ? 0.03 : 0.055) / Math.sqrt(chord.length);

      noteGain.gain.setValueAtTime(0.0001, now);
      // Soft gentle attack
      noteGain.gain.linearRampToValueAtTime(targetGain, now + 2.0);
      // Decay & sustain
      noteGain.gain.linearRampToValueAtTime(targetGain * 0.72, now + 5.2);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now);
      this.currentNodes.push({ osc, gain: noteGain });
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
