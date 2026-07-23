// Shared factory for looping "bed" buses (Environment, Ambience): a single current
// track, crossfaded dual-deck like musicEngine, but no queue/family rotation —
// the DM just picks one bed at a time per category.

const DEFAULT_CROSSFADE_SECONDS = 3;

export function createBedEngine(busName, { crossfadeSeconds = DEFAULT_CROSSFADE_SECONDS } = {}) {
  let decks = null;
  let activeDeck = 0;
  let currentUrl = null;
  let volume = 0.7;
  let muted = false;

  function effectiveVolume() {
    return muted ? 0 : volume;
  }

  function clearFade(deck) {
    if (!deck.fadeTimer) return;
    window.clearInterval(deck.fadeTimer);
    deck.fadeTimer = null;
  }

  function fadeAudio(deck, targetVolume, seconds, onComplete) {
    clearFade(deck);

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
        clearFade(deck);
        onComplete?.();
      }
    }, 50);
  }

  function init() {
    if (decks) return;
    decks = [0, 1].map(() => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 0;
      return { audio, fadeTimer: null };
    });
  }

  async function play(url) {
    init();
    if (!url || url === currentUrl) return { ok: true };

    const incoming = decks[1 - activeDeck];
    const outgoing = decks[activeDeck];
    const hadTrack = currentUrl !== null;

    incoming.audio.src = url;
    incoming.audio.volume = 0;
    try {
      await incoming.audio.play();
    } catch (err) {
      if (err?.name !== 'AbortError') console.warn(`${busName} bed play failed:`, url, err);
      incoming.audio.removeAttribute('src');
      incoming.audio.load();
      return { ok: false, error: err };
    }

    fadeAudio(incoming, effectiveVolume(), crossfadeSeconds);

    if (hadTrack) {
      const oldAudio = outgoing.audio;
      fadeAudio(outgoing, 0, crossfadeSeconds, () => {
        oldAudio.pause();
        oldAudio.removeAttribute('src');
        oldAudio.load();
      });
    }

    activeDeck = 1 - activeDeck;
    currentUrl = url;
    return { ok: true };
  }

  function stop() {
    if (!decks) return;
    decks.forEach(deck => {
      fadeAudio(deck, 0, 0.4, () => {
        deck.audio.pause();
        deck.audio.removeAttribute('src');
        deck.audio.load();
      });
    });
    currentUrl = null;
  }

  function setVolume(v) {
    volume = v;
    if (decks && !muted) decks[activeDeck].audio.volume = effectiveVolume();
  }

  function setMuted(m) {
    muted = m;
    if (decks) decks[activeDeck].audio.volume = effectiveVolume();
  }

  // DM-controlled manual fade, independent of the volume slider.
  function fadeTo(targetVolume, seconds) {
    if (!decks) return;
    fadeAudio(decks[activeDeck], targetVolume, seconds);
  }

  return {
    play,
    stop,
    setVolume,
    setMuted,
    fadeTo,
    get currentUrl() { return currentUrl; },
  };
}

export const environmentEngine = createBedEngine('environment');
export const ambienceEngine = createBedEngine('ambience');
