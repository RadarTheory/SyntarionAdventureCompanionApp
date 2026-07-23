// SYNTARION MUSIC ENGINE
// Singleton dual-deck native media engine with crossfades.
// Consumers: MenuJukebox (landing), DJ Console (DM mode), combat hooks.

const R2_BASE = 'https://pub-e285d3c995214371936d1f94dd10ed90.r2.dev';

const CROSSFADE_SECONDS = 4;

class MusicEngine {
  constructor() {
    this.decks = null;        // [{ audio, fadeTimer }, ...]
    this.activeDeck = 0;
    this.currentTrack = null; // track row from soundtrack_tracks
    this.queue = [];          // upcoming track rows
    this.onTrackChange = null; // callback(track) for UI
    this._fading = false;
    this._watchTimer = null;
    this._muted = false;
    this._volume = 0.7;
  }

  // Must be called from a user gesture (autoplay policy).
  init() {
    if (this.decks) return;

    this.decks = [0, 1].map((index) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = 0;
      audio.addEventListener('ended', () => {
        if (index === this.activeDeck && !this._fading) {
          this._fading = true;
          this.playNext();
        }
      });
      return { audio, fadeTimer: null };
    });
  }

  trackUrl(track) {
    if (track.url) return track.url;
    const filePath = track.path || track.filename || track.file_path || '';
    const encodedPath = String(filePath).split('/').map(encodeURIComponent).join('/');
    return `${R2_BASE}/${encodedPath}`;
  }

  setQueue(tracks) {
    this.queue = [...tracks];
  }

  async play(track) {
    this.init();

    const incoming = this.decks[1 - this.activeDeck];
    const outgoing = this.decks[this.activeDeck];

    incoming.audio.src = this.trackUrl(track);
    incoming.audio.volume = 0;
    try {
      await incoming.audio.play();
    } catch (err) {
      if (err?.name !== 'AbortError') console.warn('Music play failed:', this.trackUrl(track), err);
      incoming.audio.removeAttribute('src');
      incoming.audio.load();
      return { ok: false, error: err, track };
    }

    this._fadeAudio(incoming, this._effectiveVolume(), CROSSFADE_SECONDS);

    if (this.currentTrack) {
      const oldAudio = outgoing.audio;
      this._fadeAudio(outgoing, 0, CROSSFADE_SECONDS, () => {
        oldAudio.pause();
        oldAudio.removeAttribute('src');
        oldAudio.load();
      });
    }

    this.activeDeck = 1 - this.activeDeck;
    this.currentTrack = track;
    this._fading = false;
    this.onTrackChange?.(track);
    this._watchOutro();
    return { ok: true, track };
  }

  playNext() {
    if (this.queue.length === 0) return { ok: false };
    const next = this.queue.shift();
    this.queue.push(next); // rotate so the pool loops
    return this.play(next);
  }

  _watchOutro() {
    window.clearInterval(this._watchTimer);
    const deck = this.decks[this.activeDeck];

    const tick = () => {
      const { audio } = deck;
      if (!audio.duration || this._fading) return;

      const remaining = audio.duration - audio.currentTime;

      if (remaining <= CROSSFADE_SECONDS + 0.5) {
        this._fading = true;
        this.playNext();
      }
    };
    this._watchTimer = window.setInterval(tick, 500);
  }

  setVolume(v) {
    this._volume = v;
    if (this.decks && !this._muted) {
      this.decks[this.activeDeck].audio.volume = this._effectiveVolume();
    }
  }

  setMuted(muted) {
    this._muted = muted;
    if (this.decks) {
      this.decks[this.activeDeck].audio.volume = this._effectiveVolume();
    }
  }

  // Pause in place — unlike stop(), this does NOT clear currentTrack or fire
  // onTrackChange, so nothing downstream mistakes "paused" for "no track" and
  // silently re-triggers playback (that was the bug: stop()'s onTrackChange(null)
  // reset currentTrack to a fallback track, which cascaded into new callback
  // references and re-armed the autoplay-unlock click listener).
  pause() {
    if (!this.decks) return;
    window.clearInterval(this._watchTimer);
    this.decks[this.activeDeck].audio.pause();
  }

  resume() {
    if (!this.decks || !this.currentTrack) return;
    this.decks[this.activeDeck].audio.play().catch(() => {});
    this._watchOutro();
  }

  // DM-controlled manual fade (independent of the volume slider), e.g. "fade out for a cutscene".
  // A fade to 0 is a hard pass: it actually pauses the deck and halts the
  // outro auto-advance timer, so nothing (not the outro watcher, not an
  // unrelated slider change) can silently undo it. Fading back up resumes
  // playback first, then ramps the volume.
  fadeTo(volume, seconds) {
    if (!this.decks) return;
    const deck = this.decks[this.activeDeck];
    const goingSilent = volume <= 0;

    if (!goingSilent && deck.audio.paused && this.currentTrack) {
      deck.audio.play().catch(() => {});
      this._watchOutro();
    }

    this._fadeAudio(deck, volume, seconds, () => {
      if (goingSilent) {
        window.clearInterval(this._watchTimer);
        deck.audio.pause();
      }
    });
  }

  stop() {
    window.clearInterval(this._watchTimer);
    if (!this.decks) return;
    this.decks.forEach(d => {
      this._fadeAudio(d, 0, 0.4, () => {
        d.audio.pause();
        d.audio.removeAttribute('src');
        d.audio.load();
      });
    });
    this.currentTrack = null;
    this.onTrackChange?.(null);
  }

  _effectiveVolume() {
    return this._muted ? 0 : this._volume;
  }

  _clearFade(deck) {
    if (!deck.fadeTimer) return;
    window.clearInterval(deck.fadeTimer);
    deck.fadeTimer = null;
  }

  _fadeAudio(deck, targetVolume, seconds, onComplete) {
    this._clearFade(deck);

    const audio = deck.audio;
    const from = audio.volume;
    const to = Math.min(1, Math.max(0, targetVolume));
    const durationMs = Math.max(0, seconds * 1000);

    if (durationMs === 0) {
      audio.volume = to;
      onComplete?.();
      return;
    }

    const startedAt = performance.now();
    deck.fadeTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = from + (to - from) * progress;

      if (progress >= 1) {
        this._clearFade(deck);
        onComplete?.();
      }
    }, 50);
  }
}

const musicEngine = new MusicEngine();
export default musicEngine;
