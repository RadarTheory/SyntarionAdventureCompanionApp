import { useState, useEffect } from 'react';
import { COLORS } from './constants';
import musicEngine from './musicEngine';
import { MENU_MUSIC_TRACKS, buildMenuMusicQueue, getTrackFamilyKey, getTrackKey, loadMusicTracks } from './musicLibrary';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

export function MusicPanel() {
  const [tracks, setTracks] = useState(MENU_MUSIC_TRACKS);
  const [search, setSearch] = useState('');
  const [currentTrack, setCurrentTrack] = useState(MENU_MUSIC_TRACKS[0] || null);
  const [libraryStatus, setLibraryStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadMusicTracks({ menuOnly: false })
      .then(rows => {
        if (cancelled) return;
        setTracks(rows);
        setCurrentTrack(current => current || rows[0] || null);
        setLibraryStatus('');
      })
      .catch(err => {
        console.warn('Could not load R2 music manifest; no music tracks are available yet.', err);
        setLibraryStatus('Using the confirmed R2 proof track.');
      });
    return () => { cancelled = true; };
  }, []);

  const filteredTracks = tracks.filter(t => {
    const haystack = `${t.title || ''} ${t.artist || ''} ${t.filename || t.path || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const playInMenuPlayer = async (track) => {
    if (!track) return;
    setCurrentTrack(track);
    musicEngine.setQueue(buildMenuMusicQueue(tracks, {
      avoidFirstFamily: getTrackFamilyKey(track),
    }));
    const result = await musicEngine.play(track);
    if (!result?.ok && result?.error?.name !== 'AbortError') {
      console.warn('DM music play failed:', result?.error);
    }
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Music Library</div>
      <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.45, marginBottom: 14 }}>
        R2-backed music library loaded from music-manifest.json in the public bucket.
      </div>
      {libraryStatus && (
        <div style={{ fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{libraryStatus}</div>
      )}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search music..."
        style={{ width: '100%', marginBottom: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }}
      />
      {currentTrack && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            {currentTrack.artwork && (
              <img src={currentTrack.artwork} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', border: `1px solid ${COLORS.border}`, background: COLORS.surface }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 4, letterSpacing: '0.04em' }}>{currentTrack.title}</div>
              <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>
                {currentTrack.artist || 'Unknown artist'}
              </div>
              <div style={{ fontSize: 8, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {currentTrack.album || 'Syntarion'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => playInMenuPlayer(currentTrack)}
            style={{
              width: '100%',
              background: COLORS.magicBg,
              border: `1px solid ${COLORS.magic}`,
              borderRadius: 6,
              padding: '10px 12px',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.magicText,
              fontWeight: 700,
            }}
          >
            Play In Menu Player
          </button>
        </div>
      )}
      <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 10 }}>
        {filteredTracks.length} of {tracks.length} track{tracks.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredTracks.map(track => {
          const trackKey = getTrackKey(track);
          const activeKey = currentTrack ? getTrackKey(currentTrack) : '';
          return (
            <button
              key={trackKey}
              onClick={() => playInMenuPlayer(track)}
              style={{
                textAlign: 'left',
                background: activeKey === trackKey ? COLORS.magicBg : COLORS.card,
                border: `1px solid ${activeKey === trackKey ? COLORS.magic : COLORS.border}`,
                borderRadius: 6,
                padding: '10px 12px',
                color: COLORS.text,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {track.artwork && <img src={track.artwork} alt="" style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', border: `1px solid ${COLORS.border}` }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11 }}>{track.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic', marginTop: 3 }}>{track.artist || 'Unknown artist'} - {track.album || 'Syntarion'}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MusicPanel;
