type SfxName =
  | 'click'
  | 'count'
  | 'go'
  | 'hit'
  | 'win'
  | 'lose'
  | 'rematch'
  | 'pop'
  | 'place'
  | 'whoosh';

/**
 * Small Web-Audio synthesizer so the game has sound from day one
 * without blocking on external assets. Swap-friendly to CC0 files later.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  isMuted() {
    return this.muted;
  }

  /** must be called from a user gesture at least once */
  unlock() {
    this.ensure();
  }

  private tone(
    freq: number,
    opts: { type?: OscillatorType; dur?: number; vol?: number; delay?: number; slideTo?: number } = {},
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const { type = 'sine', dur = 0.15, vol = 0.5, delay = 0, slideTo } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  play(name: SfxName) {
    switch (name) {
      case 'click':
        this.tone(520, { type: 'triangle', dur: 0.09, vol: 0.35 });
        this.tone(760, { type: 'triangle', dur: 0.07, vol: 0.2, delay: 0.04 });
        break;
      case 'count':
        this.tone(440, { type: 'square', dur: 0.12, vol: 0.3 });
        break;
      case 'go':
        this.tone(880, { type: 'square', dur: 0.35, vol: 0.4, slideTo: 1320 });
        this.tone(1100, { type: 'triangle', dur: 0.3, vol: 0.25, delay: 0.02 });
        break;
      case 'hit':
        this.tone(200, { type: 'square', dur: 0.12, vol: 0.5, slideTo: 90 });
        this.tone(1200, { type: 'sawtooth', dur: 0.08, vol: 0.12 });
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, { type: 'triangle', dur: 0.22, vol: 0.4, delay: i * 0.12 }),
        );
        break;
      case 'lose':
        this.tone(400, { type: 'triangle', dur: 0.25, vol: 0.35, slideTo: 200 });
        this.tone(180, { type: 'triangle', dur: 0.4, vol: 0.25, delay: 0.15, slideTo: 90 });
        break;
      case 'rematch':
        this.tone(660, { type: 'triangle', dur: 0.1, vol: 0.3 });
        this.tone(880, { type: 'triangle', dur: 0.12, vol: 0.3, delay: 0.09 });
        break;
      case 'pop':
        this.tone(300, { type: 'sine', dur: 0.1, vol: 0.4, slideTo: 600 });
        break;
      case 'place':
        this.tone(500, { type: 'triangle', dur: 0.12, vol: 0.35, slideTo: 300 });
        break;
      case 'whoosh':
        this.tone(240, { type: 'sawtooth', dur: 0.3, vol: 0.15, slideTo: 800 });
        break;
    }
  }
}

export const sound = new SoundManager();
