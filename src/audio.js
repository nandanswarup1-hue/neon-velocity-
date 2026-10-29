// Procedural Web Audio API sound synthesizer
// Zero external sound asset dependencies - works instantly everywhere!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bpm = 128;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else if (!this.bgmPlaying) {
      this.startBGM();
    }
    return this.isMuted;
  }

  playShift() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCollect(combo = 1) {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const baseFreq = 523.25; // C5
    const multiplier = Math.min(2.0, 1 + (combo - 1) * 0.1);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * multiplier, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * multiplier * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  playPowerup() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [330, 440, 554, 659, 880];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.04;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  playShieldBreak() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playCrash() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise buffer for explosion
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  startBGM() {
    if (this.isMuted || this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.step = 0;

    const bassNotes = [110, 110, 110, 130.81, 110, 110, 146.83, 123.47];
    const synthNotes = [440, 523.25, 659.25, 587.33, 440, 523.25, 783.99, 659.25];
    const interval = (60 / this.bpm) / 4 * 1000;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass pulse on every 16th beat
      const bassFreq = bassNotes[Math.floor(this.step / 2) % bassNotes.length];
      if (this.step % 2 === 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassFreq / 2, now);
        bGain.gain.setValueAtTime(0.08, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.12);
      }

      // Arp melodic tick
      if (this.step % 4 === 2) {
        const aOsc = this.ctx.createOscillator();
        const aGain = this.ctx.createGain();
        const sFreq = synthNotes[this.step % synthNotes.length];
        aOsc.type = 'sine';
        aOsc.frequency.setValueAtTime(sFreq, now);
        aGain.gain.setValueAtTime(0.04, now);
        aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        aOsc.connect(aGain);
        aGain.connect(this.ctx.destination);
        aOsc.start(now);
        aOsc.stop(now + 0.08);
      }

      this.step = (this.step + 1) % 64;
    }, interval);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundEngine();
