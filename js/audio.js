/**
 * Web Audio API Sound Synthesizer for NFL Score Alerts
 * Zero external audio files required. Synthesizes stadium chimes & fanfares.
 */
export class NFLAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('nfl_scoreboard_muted') === 'true';
    this.masterGain = null;
  }

  /**
   * Initialize audio context on first user gesture
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
        this.masterGain.connect(this.ctx.destination);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('nfl_scoreboard_muted', this.isMuted ? 'true' : 'false');
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Play celebratory Touchdown fanfare
   */
  playTouchdown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Fanfare notes: F4, A4, C5, F5
    const notes = [349.23, 440.00, 523.25, 698.46];
    const times = [0, 0.12, 0.24, 0.42];
    const durations = [0.15, 0.15, 0.2, 0.7];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + times[i]);

      // Subtle lowpass filter for brass-like warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + times[i]);

      gain.gain.setValueAtTime(0, now + times[i]);
      gain.gain.linearRampToValueAtTime(0.25, now + times[i] + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + durations[i]);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + times[i]);
      osc.stop(now + times[i] + durations[i] + 0.1);
    });
  }

  /**
   * Play crisp Field Goal chime
   */
  playFieldGoal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 783.99]; // C5, G5
    const times = [0, 0.15];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + times[i]);

      gain.gain.setValueAtTime(0, now + times[i]);
      gain.gain.linearRampToValueAtTime(0.3, now + times[i] + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + times[i]);
      osc.stop(now + times[i] + 0.7);
    });
  }

  /**
   * Play Turnover / Red Zone alert tone
   */
  playAlert() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }
}
