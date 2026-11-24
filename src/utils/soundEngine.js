class StudioSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.ambientNodes = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbient();
      this.playClick();
    } else {
      this.stopAmbient();
    }
    return this.enabled;
  }

  startAmbient() {
    const ctx = this.ensureContext();
    if (!ctx || this.ambientNodes) return;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.032, ctx.currentTime + 1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    // Warm dark ambient chord (C2, G2, D3, E3)
    const freqs = [65.41, 98.0, 146.83, 164.81];
    const oscs = freqs.map((f, idx) => {
      const o = ctx.createOscillator();
      o.type = idx % 2 === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (idx - 1.5) * 4;
      o.connect(filter);
      o.start();
      return o;
    });

    filter.connect(master);
    master.connect(ctx.destination);
    this.ambientNodes = { oscs, master, filter };
  }

  stopAmbient() {
    if (!this.ambientNodes || !this.ctx) return;
    const { oscs, master } = this.ambientNodes;
    const now = this.ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => {
      oscs.forEach((o) => {
        try { o.stop(); } catch {}
      });
    }, 450);
    this.ambientNodes = null;
  }

  playHover() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
    g.gain.setValueAtTime(0.025, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playClick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}

export const soundEngine = new StudioSoundEngine();
