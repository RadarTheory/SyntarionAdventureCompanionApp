// One-shot pool engine for the SFX bus: fires overlapping, non-looping sounds
// that punch over every other bus. No crossfade, no queue — just play and forget.

class SfxEngine {
  constructor() {
    this._active = new Set();
    this._volume = 0.85;
    this._muted = false;
    this._fadeTimer = null;
  }

  _effectiveVolume() {
    return this._muted ? 0 : this._volume;
  }

  async play(url) {
    if (!url) return { ok: false };

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.volume = this._effectiveVolume();

    const cleanup = () => {
      this._active.delete(audio);
      audio.removeAttribute('src');
    };
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);

    this._active.add(audio);

    try {
      await audio.play();
      return { ok: true, audio };
    } catch (err) {
      if (err?.name !== 'AbortError') console.warn('SFX play failed:', url, err);
      cleanup();
      return { ok: false, error: err };
    }
  }

  stopAll() {
    this._active.forEach(audio => {
      audio.pause();
      audio.removeAttribute('src');
    });
    this._active.clear();
  }

  // Stops one specific one-shot (the Audio instance returned from play()'s
  // { ok, audio }) without touching any others still in flight.
  stop(audio) {
    if (!audio || !this._active.has(audio)) return;
    audio.pause();
    audio.removeAttribute('src');
    this._active.delete(audio);
  }

  setVolume(v) {
    this._volume = v;
    if (!this._muted) {
      this._active.forEach(audio => { audio.volume = this._effectiveVolume(); });
    }
  }

  setMuted(muted) {
    this._muted = muted;
    this._active.forEach(audio => { audio.volume = this._effectiveVolume(); });
  }

  // DM-controlled manual fade (independent of the volume slider) — fades the
  // baseline volume applied to both currently-active and future one-shots.
  fadeTo(targetVolume, seconds) {
    if (this._fadeTimer) {
      window.clearInterval(this._fadeTimer);
      this._fadeTimer = null;
    }

    const from = this._volume;
    const to = Math.min(1, Math.max(0, targetVolume));
    const durationMs = Math.max(0, seconds * 1000);
    const apply = () => {
      if (!this._muted) this._active.forEach(audio => { audio.volume = this._effectiveVolume(); });
    };

    if (durationMs === 0) {
      this._volume = to;
      apply();
      return;
    }

    const startedAt = performance.now();
    this._fadeTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      this._volume = from + (to - from) * progress;
      apply();

      if (progress >= 1) {
        window.clearInterval(this._fadeTimer);
        this._fadeTimer = null;
      }
    }, 50);
  }
}

const sfxEngine = new SfxEngine();
export default sfxEngine;
