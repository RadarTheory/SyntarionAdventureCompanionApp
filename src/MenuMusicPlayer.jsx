import { useEffect, useMemo, useState } from 'react';
import musicEngine from './musicEngine';
import { getMenuMusicTracks, getTrackKey, loadMenuMusicTracks } from './musicLibrary';
import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from './audioSettings';

function rotateFromRandom(tracks) {
  if (!tracks.length) return [];
  const start = Math.floor(Math.random() * tracks.length);
  return [...tracks.slice(start), ...tracks.slice(0, start)];
}

const ICONS = {
  back: '\u23EE',
  pause: '\u23F8',
  next: '\u23ED',
  play: '\u25B6',
  decline: '\u00D7',
};

export default function MenuMusicPlayer({ isMobile = false }) {
  const [tracks, setTracks] = useState(() => getMenuMusicTracks());
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);
  const [currentTrack, setCurrentTrack] = useState(musicEngine.currentTrack || tracks[0] || null);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(!!musicEngine.currentTrack);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [missingTracks, setMissingTracks] = useState(() => new Set());
  const [statusMessage, setStatusMessage] = useState('');

  const playableTracks = useMemo(
    () => tracks.filter(track => !missingTracks.has(getTrackKey(track))),
    [tracks, missingTracks]
  );

  useEffect(() => {
    let cancelled = false;
    loadMenuMusicTracks()
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
  }, []);

  useEffect(() => subscribeAudioSettings(settings => {
    setAudioSettings(settings);
    musicEngine.setVolume(settings.musicVolume);
    musicEngine.setMuted(!settings.musicEnabled);
  }), []);

  useEffect(() => {
    musicEngine.setQueue(rotateFromRandom(playableTracks));
    musicEngine.setVolume(audioSettings.musicVolume);
    musicEngine.setMuted(!audioSettings.musicEnabled);

    const previous = musicEngine.onTrackChange;
    musicEngine.onTrackChange = (track) => {
      previous?.(track);
      setCurrentTrack(track || playableTracks[0] || tracks[0] || null);
      setPlaying(!!track);
      if (track) setNeedsGesture(false);
    };

    return () => {
      musicEngine.onTrackChange = previous;
    };
  }, [audioSettings.musicEnabled, audioSettings.musicVolume, playableTracks, tracks]);

  const handlePlayResult = async (result, attemptedTrack) => {
    if (result?.ok) {
      const track = result.track || attemptedTrack;
      setPlaying(true);
      setNeedsGesture(false);
      setStatusMessage('');
      setCurrentTrack(track || null);

      if (track?.artwork && 'mediaSession' in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: track.title || 'Menu Music',
          artist: track.artist || 'Syntarion',
          album: track.album || 'Syntarion',
          artwork: [{ src: track.artwork, sizes: '512x512', type: 'image/png' }],
        });
      }
      return true;
    }

    const failedTrack = attemptedTrack || result?.track;
    const key = getTrackKey(failedTrack);
    if (key) setMissingTracks(prev => new Set(prev).add(key));
    setPlaying(false);
    setNeedsGesture(false);
    setStatusMessage('Track source not found. Skipping.');
    return false;
  };

  const playSpecific = async (track) => {
    if (!track || !audioSettings.musicEnabled) return false;
    const result = await musicEngine.play(track);
    return handlePlayResult(result, track);
  };

  const playRelative = async (direction) => {
    if (!playableTracks.length) return false;
    const currentKey = getTrackKey(currentTrack);
    const currentIndex = playableTracks.findIndex(track => getTrackKey(track) === currentKey);
    const fallbackIndex = direction > 0 ? -1 : 0;
    const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
    const nextIndex = (baseIndex + direction + playableTracks.length) % playableTracks.length;
    return playSpecific(playableTracks[nextIndex]);
  };

  const playNext = () => playRelative(1);
  const playBack = () => playRelative(-1);

  const startMusic = async () => {
    if (!playableTracks.length || !audioSettings.musicEnabled) return;
    const next = musicEngine.currentTrack && !missingTracks.has(getTrackKey(musicEngine.currentTrack))
      ? musicEngine.currentTrack
      : playableTracks[0];
    const ok = await playSpecific(next);
    if (!ok && playableTracks.length > 1) await playNext();
  };

  useEffect(() => {
    if (!audioSettings.musicEnabled || musicEngine.currentTrack || !playableTracks.length) return;

    startMusic();
    const unlock = () => startMusic();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioSettings.musicEnabled, playableTracks]);

  const updateMusicVolume = (value) => {
    const next = saveAudioSettings({ ...audioSettings, musicVolume: Number(value), musicEnabled: true });
    setAudioSettings(next);
    musicEngine.setVolume(next.musicVolume);
    musicEngine.setMuted(false);
  };

  const togglePlay = async () => {
    if (playing) {
      musicEngine.stop();
      setPlaying(false);
      return;
    }

    const next = saveAudioSettings({ ...audioSettings, musicEnabled: true });
    setAudioSettings(next);
    await startMusic();
  };

  const declineMusic = () => {
    musicEngine.stop();
    const next = saveAudioSettings({ ...audioSettings, musicEnabled: false });
    setAudioSettings(next);
    setPlaying(false);
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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        left: isMobile ? 12 : 18,
        bottom: isMobile ? 84 : 78,
        zIndex: 48,
        width: expanded ? (isMobile ? 'min(calc(100vw - 24px), 304px)' : 292) : (isMobile ? 206 : 218),
        maxWidth: 'calc(100vw - 24px)',
        opacity: active ? 1 : 0.7,
        transform: active ? 'translateY(0)' : 'translateY(2px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease, width 0.18s ease',
        fontFamily: 'Georgia, serif',
        color: '#f0eeeb',
      }}
    >
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
                {!playableTracks.length ? 'No reachable music sources yet.' : statusMessage || 'Tap play to start music in this browser.'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              {playing ? (
                <>
                  <button onClick={playBack} style={controlButtonStyle} aria-label="Previous track" title="Back">{ICONS.back}</button>
                  <button onClick={togglePlay} style={primaryControlButtonStyle} aria-label="Pause music" title="Pause">{ICONS.pause}</button>
                  <button onClick={playNext} style={controlButtonStyle} aria-label="Next track" title="Next">{ICONS.next}</button>
                </>
              ) : (
                <>
                  <button onClick={togglePlay} style={primaryControlButtonStyle} aria-label="Play music" title="Play">{ICONS.play}</button>
                  <button onClick={declineMusic} style={controlButtonStyle} aria-label="Decline menu music" title="Decline">{ICONS.decline}</button>
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
          </div>
        )}
      </div>
    </div>
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
