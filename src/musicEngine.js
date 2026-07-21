// ─── SYNTARION MUSIC ENGINE ───────────────────────────────
// Singleton dual-deck Web Audio engine with volume-aware crossfades.
// Consumers: MenuJukebox (landing), DJ Console (DM mode), combat hooks.

const R2_BASE = 'https://pub-e285d3c995214371936d1f94dd10ed90.r2.dev';

const CROSSFADE_SECONDS = 4;
const OUTRO_WATCH_WINDOW = 12;   // start analysing this many secs before track end
const QUIET_THRESHOLD = 0.04;    // RMS level considered "outro quiet"
const QUIET_HOLD_MS = 1500;      // must stay quiet this long to trigger early fade

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.decks = null;        // [{ audio, source, gain, analyser }, ...]
    this.activeDeck = 0;
    this.currentTrack = null; // track row from soundtrack_tracks
    this.queue = [];          // upcoming track rows
    this.onTrackChange = null; // callback(track) for UI
    this._fading = false;
    this._quietSince = null;
    this._rafId = null;
    this._muted = false;
    this._volume = 0.7;
  }

  // Must be called from a user gesture (autoplay policy).
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.ctx.destination);

    this.decks = [0, 1].map(() => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      const source = this.ctx.createMediaElementSource(audio);
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(gain);
      gain.connect(analyser);
      analyser.connect(this.masterGain);
      return { audio, source, gain, analyser };
    });
  }

  trackUrl(track) {
    return `${R2_BASE}/${encodeURIComponent(track.filename)}`;
  }

  setQueue(tracks) {
    this.queue = [...tracks];
  }

  async play(track) {
    this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const incoming = this.decks[1 - this.activeDeck];
    const outgoing = this.decks[this.activeDeck];

    incoming.audio.src = this.trackUrl(track);
    try {
      await incoming.audio.play();
    } catch (err) {
      console.error('Music play failed:', err);
      return;
    }

    const now = this.ctx.currentTime;
    incoming.gain.gain.cancelScheduledValues(now);
    incoming.gain.gain.setValueAtTime(0.0001, now);
    incoming.gain.gain.exponentialRampToValueAtTime(1, now + CROSSFADE_SECONDS);

    if (this.currentTrack) {
      outgoing.gain.gain.cancelScheduledValues(now);
      outgoing.gain.gain.setValueAtTime(Math.max(outgoing.gain.gain.value, 0.0001), now);
      outgoing.gain.gain.exponentialRampToValueAtTime(0.0001, now + CROSSFADE_SECONDS);
      const oldAudio = outgoing.audio;
      setTimeout(() => { oldAudio.pause(); oldAudio.src = ''; }, CROSSFADE_SECONDS * 1000 + 200);
    }

    this.activeDeck = 1 - this.activeDeck;
    this.currentTrack = track;
    this._fading = false;
    this._quietSince = null;
    this.onTrackChange?.(track);
    this._watchOutro();
  }

  playNext() {
    if (this.queue.length === 0) return;
    const next = this.queue.shift();
    this.queue.push(next); // rotate so the pool loops
    this.play(next);
  }

  // ── Volume-aware transition: watch the active deck's outro ──
  _watchOutro() {
    cancelAnimationFrame(this._rafId);
    const deck = this.decks[this.activeDeck];
    const data = new Float32Array(deck.analyser.fftSize);

    const tick = () => {
      const { audio } = deck;
      if (!audio.duration || this._fading) return;

      const remaining = audio.duration - audio.currentTime;

      // Hard fallback: crossfade regardless when nearly over
      if (remaining <= CROSSFADE_SECONDS + 0.5) {
        this._fading = true;
        this.playNext();
        return;
      }

      // Smart trigger: sustained quiet inside the outro window
      if (remaining <= OUTRO_WATCH_WINDOW) {
        deck.analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);

        if (rms < QUIET_THRESHOLD) {
          if (this._quietSince === null) this._quietSince = performance.now();
          else if (performance.now() - this._quietSince > QUIET_HOLD_MS) {
            this._fading = true;
            this.playNext();
            return;
          }
        } else {
          this._quietSince = null;
        }
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  setVolume(v) {
    this._volume = v;
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  setMuted(muted) {
    this._muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this._volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    cancelAnimationFrame(this._rafId);
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.decks.forEach(d => {
      d.gain.gain.cancelScheduledValues(now);
      d.gain.gain.setTargetAtTime(0.0001, now, 0.4);
      setTimeout(() => { d.audio.pause(); d.audio.src = ''; }, 1500);
    });
    this.currentTrack = null;
    this.onTrackChange?.(null);
  }
}

const musicEngine = new MusicEngine();
export default musicEngine;