import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import musicEngine from './musicEngine';
import { environmentEngine, ambienceEngine } from './audioEngines';
import sfxEngine from './sfxEngine';
import { buildMenuMusicQueue, getMenuMusicTracks, getTrackFamilyKey, getTrackKey, loadMusicTracks } from './musicLibrary';
import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from './audioSettings';
import { DraggablePanel } from './DraggablePanel';
import DMSoundboard from './DMSoundboard';
import { useActiveGameSession } from './lib/session';
import { upsertBroadcast, useAudioBroadcast, useListeningMode, fetchBroadcastNow } from './lib/audioBroadcast';


function isMissingSourceError(error) {
  const name = error?.name || '';
  const message = error?.message || '';
  return name === 'NotSupportedError'
    || name === 'MediaError'
    || /not found|404|no supported source|failed to load/i.test(message);
}

const ICONS = {
  back: '\u23EE',
  pause: '\u23F8',
  next: '\u23ED',
  play: '\u25B6',
  decline: '\u00D7',
};

// v2: pos.y is now the widget's distance from the BOTTOM of the viewport (not
// the top), so expanding the player grows the card upward instead of pushing
// its bottom edge further down toward other bottom-anchored UI.
const MENU_MUSIC_POS_KEY = 'syntarion_menu_music_pos_v2';

function getDefaultMenuMusicPos(mobile) {
  return {
    x: mobile ? 12 : 18,
    y: mobile ? 84 : 84,
  };
}

function pointFromEvent(e) {
  return e.touches ? e.touches[0] : e;
}

export default function MenuMusicPlayer({ isMobile = false, restrictToMenu = true, isDM = false, onSoundboardToggle, campaignId = null, char = null }) {
  const [tracks, setTracks] = useState(() => getMenuMusicTracks());
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);
  const [currentTrack, setCurrentTrack] = useState(musicEngine.currentTrack || tracks[0] || null);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(!!musicEngine.currentTrack);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [missingTracks, setMissingTracks] = useState(() => new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [showSoundboard, setShowSoundboard] = useState(false);
  const playInFlightRef = useRef(false);
  const autoplayAttemptedRef = useRef(false);
  // Once music has played once, "Decline" retires for good — only Play/Pause remain.
  const [hasPlayedOnce, setHasPlayedOnce] = useState(!!musicEngine.currentTrack);

  // Live DM broadcast: a checked-in, non-DM player marked "remote" for the
  // active session mirrors the DM's soundboard instead of the ambient shuffle.
  const sessionId = useActiveGameSession(campaignId);
  const listeningMode = useListeningMode(sessionId, char?.id);
  const broadcast = useAudioBroadcast(sessionId);
  const isRemoteListener = !isDM && listeningMode === 'remote' && !!sessionId;
  const lastAppliedTrackKeyRef = useRef(null);
  const lastSfxFiredAtRef = useRef(null);

  const savedPos = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(MENU_MUSIC_POS_KEY)); } catch { return null; }
  }, []);
  const [pos, setPos] = useState(() => savedPos || getDefaultMenuMusicPos(isMobile));
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(MENU_MUSIC_POS_KEY, JSON.stringify(pos));
  }, [pos]);

  const clampPos = useCallback((x, y) => {
    const el = widgetRef.current;
    const w = el?.offsetWidth || 220;
    const h = el?.offsetHeight || 64;
    return {
      x: Math.max(4, Math.min(window.innerWidth - w - 4, x)),
      y: Math.max(4, Math.min(window.innerHeight - h - 4, y)),
    };
  }, []);

  const startDrag = (e) => {
    const p = pointFromEvent(e);
    const bottomEdgeY = window.innerHeight - pos.y;
    dragOffset.current = { x: p.clientX - pos.x, y: p.clientY - bottomEdgeY };
    dragMoved.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const p = pointFromEvent(e);
      dragMoved.current = true;
      const bottomEdgeY = p.clientY - dragOffset.current.y;
      setPos(clampPos(p.clientX - dragOffset.current.x, window.innerHeight - bottomEdgeY));
      if (e.cancelable) e.preventDefault();
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, clampPos]);

  const playableTracks = useMemo(
    () => tracks.filter(track => !missingTracks.has(getTrackKey(track))),
    [tracks, missingTracks]
  );

  useEffect(() => {
    let cancelled = false;
    loadMusicTracks({ menuOnly: restrictToMenu })
      .then(rows => {
        if (cancelled) return;
        setTracks(rows);
        setMissingTracks(new Set());
        setCurrentTrack(current => current || rows[0] || null);
      })
      .catch(err => {
        console.warn('Could not load R2 music manifest; no music tracks are available yet.', err);
        setStatusMessage('Using the confirmed R2 proof track.');
      });
    return () => { cancelled = true; };
  }, [restrictToMenu]);

  // Only sync React state here — applying volume/mute to each engine is left to the
  // dependency-scoped effects below, so changing one bus's slider never re-applies
  // another bus's (which was stomping a DM's in-progress manual music fade).
  useEffect(() => subscribeAudioSettings(setAudioSettings), []);

  useEffect(() => {
    environmentEngine.setVolume(audioSettings.environmentVolume);
    environmentEngine.setMuted(!audioSettings.environmentEnabled);
    ambienceEngine.setVolume(audioSettings.ambienceVolume);
    ambienceEngine.setMuted(!audioSettings.ambienceEnabled);
    sfxEngine.setVolume(audioSettings.sfxVolume);
    sfxEngine.setMuted(!audioSettings.sfxEnabled);
  }, [audioSettings.environmentVolume, audioSettings.environmentEnabled, audioSettings.ambienceVolume, audioSettings.ambienceEnabled, audioSettings.sfxVolume, audioSettings.sfxEnabled]);

  // Queue-building is its own effect, deliberately NOT keyed on musicVolume —
  // it used to be, which meant dragging the volume slider (which saves on
  // every input tick) rebuilt and reshuffled the whole upcoming queue and
  // reassigned onTrackChange dozens of times per second while dragging.
  useEffect(() => {
    musicEngine.setQueue(buildMenuMusicQueue(playableTracks, {
      avoidFirstFamily: getTrackFamilyKey(musicEngine.currentTrack),
      pinIntro: !musicEngine.currentTrack,
    }));

    const previous = musicEngine.onTrackChange;
    musicEngine.onTrackChange = (track) => {
      previous?.(track);
      setCurrentTrack(track || playableTracks[0] || tracks[0] || null);
      setPlaying(!!track);
      if (track) setNeedsGesture(false);
      if (isDM && sessionId && track) {
        upsertBroadcast(sessionId, campaignId, { music_track: track, music_started_at: new Date().toISOString() });
      }
    };

    return () => {
      musicEngine.onTrackChange = previous;
    };
  }, [playableTracks, tracks, isDM, sessionId, campaignId]);

  // Cheap, separate from queue-building: just pushes the current slider value.
  useEffect(() => {
    musicEngine.setVolume(audioSettings.musicVolume);
    musicEngine.setMuted(!audioSettings.musicEnabled);
  }, [audioSettings.musicVolume, audioSettings.musicEnabled]);

  const updateMediaSession = useCallback((track, playbackState = 'playing') => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = playbackState;

    if (track?.artwork && window.MediaMetadata) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title || 'Menu Music',
        artist: track.artist || 'Syntarion',
        album: track.album || 'Syntarion',
        artwork: [{ src: track.artwork, sizes: '512x512', type: 'image/png' }],
      });
    }
  }, []);

  const handlePlayResult = useCallback(async (result, attemptedTrack) => {
    if (result?.ok) {
      setHasPlayedOnce(true);
      const track = result.track || attemptedTrack;
      setPlaying(true);
      setNeedsGesture(false);
      setStatusMessage('');
      setCurrentTrack(track || null);
      updateMediaSession(track, 'playing');
      return true;
    }

    const error = result?.error;
    if (isMissingSourceError(error)) {
      const failedTrack = attemptedTrack || result?.track;
      const key = getTrackKey(failedTrack);
      if (key) setMissingTracks(prev => new Set(prev).add(key));
      setPlaying(false);
      updateMediaSession(null, 'none');
      setNeedsGesture(false);
      setStatusMessage('Track source not found. Skipping.');
      return false;
    }

    setPlaying(false);
    updateMediaSession(null, 'none');
    setNeedsGesture(true);
    setStatusMessage('Tap play to start music in this browser.');
    return false;
  }, [updateMediaSession]);

  const playSpecific = useCallback(async (track, force = false) => {
    if (!track || (!force && !audioSettings.musicEnabled) || playInFlightRef.current) return false;
    playInFlightRef.current = true;
    try {
      const result = await musicEngine.play(track);
      return await handlePlayResult(result, track);
    } finally {
      playInFlightRef.current = false;
    }
  }, [audioSettings.musicEnabled, handlePlayResult]);

  const playRelative = useCallback(async (direction) => {
    if (!playableTracks.length) return false;
    if (direction > 0) {
      const result = await musicEngine.playNext();
      return handlePlayResult(result, result?.track);
    }

    const currentFamily = getTrackFamilyKey(currentTrack);
    const reverseQueue = buildMenuMusicQueue(playableTracks, { avoidFirstFamily: currentFamily }).reverse();
    const previous = reverseQueue.find(track => getTrackFamilyKey(track) !== currentFamily) || reverseQueue[0] || playableTracks[0];
    return playSpecific(previous);
  }, [currentTrack, handlePlayResult, playableTracks, playSpecific]);

  const playNext = useCallback(() => playRelative(1), [playRelative]);
  const playBack = useCallback(() => playRelative(-1), [playRelative]);

  const startMusic = useCallback(async (force = false) => {
    if (!playableTracks.length || (!force && !audioSettings.musicEnabled)) return;
    const next = musicEngine.currentTrack && !missingTracks.has(getTrackKey(musicEngine.currentTrack))
      ? musicEngine.currentTrack
      : playableTracks[0];
    const ok = await playSpecific(next, force);
    if (!ok && playableTracks.length > 1) await playNext();
  }, [audioSettings.musicEnabled, missingTracks, playableTracks, playNext, playSpecific]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers = {
      play: () => {
        if (musicEngine.currentTrack) {
          musicEngine.resume();
          setPlaying(true);
          updateMediaSession(currentTrack, 'playing');
        } else {
          startMusic();
        }
      },
      pause: () => {
        musicEngine.pause();
        setPlaying(false);
        updateMediaSession(currentTrack, 'paused');
      },
      previoustrack: () => playBack(),
      nexttrack: () => playNext(),
      stop: () => {
        musicEngine.stop();
        setPlaying(false);
        updateMediaSession(null, 'none');
      },
    };

    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`Media session action ${action} is not supported:`, err);
      }
    });

    return () => {
      Object.keys(handlers).forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported media session actions during cleanup.
        }
      });
    };
  }, [currentTrack, playBack, playNext, startMusic, updateMediaSession]);

  useEffect(() => {
    // A remote listener's music comes from the DM's broadcast, not the
    // ambient shuffle queue — don't race the two for the deck.
    if (isRemoteListener) return undefined;
    if (!audioSettings.musicEnabled || musicEngine.currentTrack || !playableTracks.length) return undefined;

    let timer = null;
    if (!autoplayAttemptedRef.current) {
      autoplayAttemptedRef.current = true;
      timer = window.setTimeout(() => startMusic(), 250);
    }

    const unlock = () => {
      if (!musicEngine.currentTrack) startMusic();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioSettings.musicEnabled, playableTracks.length, startMusic, isRemoteListener]);

  // Mirror the DM's soundboard: new track (with a seek to "how far in" it
  // already is), new environment/ambience bed + volumes, and one-shot SFX.
  // A player marked 'table' never runs this — their device stays silent
  // since the room already has the DM's real speakers.
  useEffect(() => {
    if (!isRemoteListener || !broadcast) return;

    const incomingKey = broadcast.music_track ? getTrackKey(broadcast.music_track) : null;
    if (incomingKey && incomingKey !== lastAppliedTrackKeyRef.current) {
      lastAppliedTrackKeyRef.current = incomingKey;
      const seekSeconds = broadcast.music_started_at ? (Date.now() - Date.parse(broadcast.music_started_at)) / 1000 : 0;
      musicEngine.play(broadcast.music_track, { seekSeconds }).then(result => handlePlayResult(result, broadcast.music_track));
    }

    if (broadcast.environment_url) environmentEngine.play(broadcast.environment_url);
    if (typeof broadcast.environment_volume === 'number') environmentEngine.setVolume(broadcast.environment_volume);
    environmentEngine.setMuted(broadcast.environment_enabled === false);

    if (broadcast.ambience_url) ambienceEngine.play(broadcast.ambience_url);
    if (typeof broadcast.ambience_volume === 'number') ambienceEngine.setVolume(broadcast.ambience_volume);
    ambienceEngine.setMuted(broadcast.ambience_enabled === false);

    if (broadcast.sfx_url && broadcast.sfx_fired_at && broadcast.sfx_fired_at !== lastSfxFiredAtRef.current) {
      lastSfxFiredAtRef.current = broadcast.sfx_fired_at;
      sfxEngine.play(broadcast.sfx_url);
    }
  }, [isRemoteListener, broadcast, handlePlayResult]);

  const updateMusicVolume = (value) => {
    const next = saveAudioSettings({ ...audioSettings, musicVolume: Number(value), musicEnabled: true });
    setAudioSettings(next);
    musicEngine.setVolume(next.musicVolume);
    musicEngine.setMuted(false);
  };

  const updateBusVolume = (volumeKey, enabledKey, engine, value) => {
    const next = saveAudioSettings({ ...audioSettings, [volumeKey]: Number(value), [enabledKey]: true });
    setAudioSettings(next);
    engine.setVolume(next[volumeKey]);
    engine.setMuted(false);
    if (isDM && sessionId) {
      const busName = volumeKey === 'environmentVolume' ? 'environment' : volumeKey === 'ambienceVolume' ? 'ambience' : null;
      if (busName) upsertBroadcast(sessionId, campaignId, { [`${busName}_volume`]: next[volumeKey], [`${busName}_enabled`]: true });
    }
  };

  const togglePlay = async () => {
    if (playing) {
      musicEngine.pause();
      if (isRemoteListener) {
        environmentEngine.setMuted(true);
        ambienceEngine.setMuted(true);
      }
      setPlaying(false);
      updateMediaSession(currentTrack, 'paused');
      return;
    }

    if (musicEngine.currentTrack) {
      // Remote listeners resuming catch back up to whatever the DM is playing
      // live right now, instead of continuing from wherever they paused —
      // no accumulating delay like a TiVo-style buffer.
      if (isRemoteListener) {
        const fresh = await fetchBroadcastNow(sessionId);
        if (fresh?.music_track) {
          lastAppliedTrackKeyRef.current = getTrackKey(fresh.music_track);
          const seekSeconds = fresh.music_started_at ? (Date.now() - Date.parse(fresh.music_started_at)) / 1000 : 0;
          const result = await musicEngine.play(fresh.music_track, { seekSeconds });
          await handlePlayResult(result, fresh.music_track);
          if (fresh.environment_url) environmentEngine.play(fresh.environment_url);
          environmentEngine.setMuted(fresh.environment_enabled === false);
          if (fresh.ambience_url) ambienceEngine.play(fresh.ambience_url);
          ambienceEngine.setMuted(fresh.ambience_enabled === false);
          return;
        }
      }
      musicEngine.resume();
      setPlaying(true);
      updateMediaSession(currentTrack, 'playing');
      return;
    }

    const next = saveAudioSettings({ ...audioSettings, musicEnabled: true });
    setAudioSettings(next);
    await startMusic(true);
  };

  const declineMusic = () => {
    musicEngine.stop();
    const next = saveAudioSettings({ ...audioSettings, musicEnabled: false });
    setAudioSettings(next);
    setPlaying(false);
    updateMediaSession(null, 'none');
    setNeedsGesture(false);
    setStatusMessage('Menu music is off.');
  };

  if (!tracks.length) return null;

  const active = expanded || hovered;
  const title = currentTrack?.title || 'Menu Music';
  const artist = currentTrack?.artist || 'Syntarion';
  const album = currentTrack?.album || 'Syntarion';
  const artwork = currentTrack?.artwork;
  const volume = Math.round(audioSettings.musicVolume * 100);

  return (
    <>
    <div
      ref={widgetRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        left: pos.x,
        bottom: pos.y,
        zIndex: 48,
        width: expanded ? (isMobile ? 'min(calc(100vw - 24px), 304px)' : 292) : (isMobile ? 206 : 218),
        maxWidth: 'calc(100vw - 24px)',
        opacity: active ? 1 : 0.7,
        transform: active ? 'translateY(0)' : 'translateY(2px)',
        transition: dragging ? 'none' : 'opacity 0.18s ease, transform 0.18s ease, width 0.18s ease',
        fontFamily: 'Georgia, serif',
        color: '#f0eeeb',
        touchAction: dragging ? 'none' : 'auto',
      }}
    >
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        title="Drag to move"
        style={{
          position: 'absolute',
          top: -9,
          right: -9,
          width: 22,
          height: 22,
          borderRadius: 8,
          background: 'rgba(20,16,12,0.94)',
          border: '1px solid rgba(226,207,145,0.42)',
          cursor: dragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          touchAction: 'none',
        }}
      >
        <svg viewBox="0 0 16 16" width={9} height={9} fill="none">
          <path d="M5 8h6M8 5v6" stroke="rgba(201,185,145,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{
        background: 'linear-gradient(145deg, rgba(33,28,22,0.93), rgba(18,16,13,0.9))',
        border: '1px solid rgba(214,184,91,0.34)',
        borderRadius: 7,
        boxShadow: '0 12px 30px rgba(0,0,0,0.26)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: expanded ? 10 : '9px 10px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', gap: expanded ? 10 : 8, alignItems: 'center' }}>
            {artwork && (
              <img
                src={artwork}
                alt=""
                style={{
                  width: expanded ? 88 : 40,
                  height: expanded ? 88 : 40,
                  borderRadius: 5,
                  objectFit: 'cover',
                  border: '1px solid rgba(226,207,145,0.34)',
                  boxShadow: expanded ? '0 8px 18px rgba(0,0,0,0.28)' : 'none',
                  background: 'rgba(240,238,235,0.08)',
                  flex: '0 0 auto',
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.16em', color: 'rgba(226,207,145,0.78)', textTransform: 'uppercase', marginBottom: 4 }}>
                Menu Music
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: expanded ? 10 : 9, letterSpacing: '0.06em', lineHeight: 1.25, whiteSpace: expanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </div>
              <div style={{ fontSize: expanded ? 10 : 9, color: 'rgba(240,238,235,0.62)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 4 }}>
                {artist}
              </div>
              {expanded && (
                <div style={{ fontSize: 8, color: 'rgba(226,207,145,0.68)', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>
                  {album}
                </div>
              )}
            </div>
          </div>
        </button>

        {expanded && (
          <div style={{ borderTop: '1px solid rgba(240,238,235,0.10)', padding: '8px 10px 10px', display: 'grid', gap: 8 }}>
            {(needsGesture || statusMessage || !playableTracks.length) && (
              <div style={{ fontSize: 9, color: 'rgba(226,207,145,0.88)', fontStyle: 'italic', lineHeight: 1.3 }}>
                {!playableTracks.length ? 'No playable tracks remain in this session.' : statusMessage || 'Tap play to start music in this browser.'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              {playing ? (
                <>
                  {!isRemoteListener && <button onClick={playBack} style={controlButtonStyle} aria-label="Previous track" title="Back">{ICONS.back}</button>}
                  <button onClick={togglePlay} style={primaryControlButtonStyle} aria-label="Pause music" title="Pause">{ICONS.pause}</button>
                  {!isRemoteListener && <button onClick={playNext} style={controlButtonStyle} aria-label="Next track" title="Next">{ICONS.next}</button>}
                </>
              ) : (
                <>
                  <button onClick={togglePlay} style={primaryControlButtonStyle} aria-label="Play music" title="Play">{ICONS.play}</button>
                  {!hasPlayedOnce && (
                    <button onClick={declineMusic} style={controlButtonStyle} aria-label="Decline menu music" title="Decline">{ICONS.decline}</button>
                  )}
                </>
              )}
              <div style={{ marginLeft: 'auto', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: 'rgba(226,207,145,0.58)', textTransform: 'uppercase' }}>
                Vol {volume}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.musicVolume}
              onChange={e => updateMusicVolume(e.target.value)}
              style={{ width: '100%', height: 3, accentColor: '#d7b75a' }}
              aria-label="Music volume"
            />
            {isDM && (
              <div style={{ display: 'grid', gap: 5, marginTop: 2 }}>
                <MixerSlider label="Environment" volume={audioSettings.environmentVolume} onChange={v => updateBusVolume('environmentVolume', 'environmentEnabled', environmentEngine, v)} />
                <MixerSlider label="Ambience" volume={audioSettings.ambienceVolume} onChange={v => updateBusVolume('ambienceVolume', 'ambienceEnabled', ambienceEngine, v)} />
                <MixerSlider label="SFX" volume={audioSettings.sfxVolume} onChange={v => updateBusVolume('sfxVolume', 'sfxEnabled', sfxEngine, v)} />
              </div>
            )}
            {isDM && (
              <button
                onClick={() => { setShowSoundboard(true); onSoundboardToggle?.(true); }}
                style={{
                  width: '100%',
                  background: 'rgba(226,207,145,0.10)',
                  border: '1px solid rgba(226,207,145,0.4)',
                  borderRadius: 5,
                  padding: '7px 10px',
                  cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 8,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(226,207,145,0.92)',
                  marginTop: 2,
                }}
              >
                Open Soundboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {isDM && showSoundboard && (
      <DraggablePanel
        defaultX={isMobile ? 12 : 260}
        defaultY={isMobile ? 90 : 60}
        onClose={() => { setShowSoundboard(false); onSoundboardToggle?.(false); }}
        title="DM SOUNDBOARD - Music, Environment, Ambience & SFX"
        width={Math.min(window.innerWidth - 24, 520)}
        accentColor="rgba(226,207,145,0.4)"
      >
        <DMSoundboard sessionId={sessionId} campaignId={campaignId} />
      </DraggablePanel>
    )}
    </>
  );
}

const controlButtonStyle = {
  width: 30,
  height: 30,
  background: 'rgba(240,238,235,0.055)',
  border: '1px solid rgba(226,207,145,0.30)',
  borderRadius: 5,
  color: '#f0eeeb',
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
  fontSize: 13,
  lineHeight: 1,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
};

const primaryControlButtonStyle = {
  ...controlButtonStyle,
  width: 34,
  background: 'rgba(226,207,145,0.14)',
  border: '1px solid rgba(226,207,145,0.48)',
};

function MixerSlider({ label, volume, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 62, fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: 'rgba(226,207,145,0.68)', textTransform: 'uppercase', flexShrink: 0 }}>{label}</div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, height: 3, accentColor: '#d7b75a' }}
        aria-label={`${label} volume`}
      />
      <div style={{ width: 22, textAlign: 'right', fontSize: 7, color: 'rgba(240,238,235,0.62)', fontFamily: 'monospace', flexShrink: 0 }}>{Math.round(volume * 100)}</div>
    </div>
  );
}
