import { useState, useEffect, useMemo } from 'react';
import { COLORS } from './constants';
import musicEngine from './musicEngine';
import { environmentEngine, ambienceEngine } from './audioEngines';
import sfxEngine from './sfxEngine';
import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from './audioSettings';
import { loadSoundLibrary, getCategories, getTracksByCategory, playTrack, getTrackKey, getBusKey, getTrackUrl } from './soundLibrary';
import { MusicPanel } from './MusicPanel';
import { upsertBroadcast, useListeningModes, setListeningMode } from './lib/audioBroadcast';
import { getCheckedInCharacterIds } from './lib/sessionEvents';

const CATEGORY_ORDER = ['Soundtrack', 'Environment', 'Ambience', 'Combat', 'Magic', 'Steampunk', 'Horror', 'UI', 'DMSoundboard', 'Creatures', 'Misc', 'Players'];

const BUSES = {
  music: { volumeKey: 'musicVolume', enabledKey: 'musicEnabled', engine: musicEngine, label: 'Soundtrack' },
  environment: { volumeKey: 'environmentVolume', enabledKey: 'environmentEnabled', engine: environmentEngine, label: 'Environment' },
  ambience: { volumeKey: 'ambienceVolume', enabledKey: 'ambienceEnabled', engine: ambienceEngine, label: 'Ambience' },
  sfx: { volumeKey: 'sfxVolume', enabledKey: 'sfxEnabled', engine: sfxEngine, label: 'SFX' },
};

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function GoldButton({ onClick, title, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(226,207,145,0.14)' : 'rgba(226,207,145,0.06)',
        border: `1px solid rgba(226,207,145,${hovered ? 0.5 : 0.28})`,
        borderRadius: 6,
        padding: '4px 9px',
        cursor: 'pointer',
        fontSize: 8,
        color: hovered ? '#f0e2b0' : 'rgba(226,207,145,0.82)',
        fontFamily: "'Cinzel', serif",
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function MixerRow({ label, volume, enabled, onVolumeChange, onToggle, extra }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 8,
        background: hovered ? 'rgba(240,238,235,0.035)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <button
        onClick={onToggle}
        title={enabled ? 'Mute' : 'Unmute'}
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: 8,
          background: enabled ? 'linear-gradient(145deg, rgba(240,238,235,0.22), rgba(240,238,235,0.06))' : 'rgba(205,92,92,0.14)',
          border: `1px solid ${enabled ? 'rgba(240,238,235,0.7)' : COLORS.warn}`,
          color: enabled ? '#f0eeeb' : COLORS.warn,
          cursor: 'pointer',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: enabled ? '0 0 10px rgba(240,238,235,0.18)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        {enabled ? '♪' : '✕'}
      </button>
      <div style={{ width: 76, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.08em', color: COLORS.textSub, textTransform: 'uppercase', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '0 9px', height: 22 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => onVolumeChange(Number(e.target.value))}
          style={{ width: '100%', height: 3, accentColor: '#d7b75a' }}
        />
      </div>
      <div style={{ width: 26, textAlign: 'right', fontSize: 9, color: COLORS.dim, fontFamily: 'monospace', flexShrink: 0 }}>{Math.round(volume * 100)}</div>
      {extra}
    </div>
  );
}

function CategoryTab({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active
          ? 'linear-gradient(145deg, rgba(200,168,74,0.26), rgba(200,168,74,0.09))'
          : hovered ? 'rgba(240,238,235,0.05)' : 'transparent',
        border: `1px solid ${active ? 'rgba(226,207,145,0.55)' : hovered ? 'rgba(226,207,145,0.3)' : COLORS.border}`,
        borderRadius: 20,
        padding: '6px 13px',
        cursor: 'pointer',
        fontFamily: "'Cinzel', serif",
        fontSize: 8,
        letterSpacing: '0.08em',
        color: active ? '#f0e2b0' : hovered ? COLORS.textSub : COLORS.dim,
        textTransform: 'uppercase',
        boxShadow: active ? '0 0 12px rgba(200,168,74,0.24)' : 'none',
        transform: hovered && !active ? 'translateY(-1px)' : 'none',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

const STATE_PALETTE = {
  playing: { bg: 'linear-gradient(145deg, rgba(111,158,120,0.24), rgba(111,158,120,0.08))', border: COLORS.magic, color: COLORS.magicText },
  loading: { bg: 'linear-gradient(145deg, rgba(40,34,24,0.7), rgba(24,20,15,0.6))', border: COLORS.border, color: COLORS.dim },
  error: { bg: 'linear-gradient(145deg, rgba(139,26,26,0.24), rgba(139,26,26,0.08))', border: COLORS.warn, color: COLORS.warn },
  idle: { bg: 'linear-gradient(145deg, rgba(44,37,26,0.92), rgba(28,23,17,0.88))', border: 'rgba(214,184,91,0.18)', color: COLORS.text },
};

function SoundTile({ track, state, isBed, onClick }) {
  const [hovered, setHovered] = useState(false);
  const palette = STATE_PALETTE[state];
  const stateLabel = { playing: isBed ? '♪ Looping' : '♪ Playing', loading: 'Loading…', error: 'Failed — click to retry' }[state];
  const lit = hovered && state !== 'loading';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={track.filename}
      style={{
        textAlign: 'left',
        borderRadius: 8,
        padding: '10px 11px',
        cursor: state === 'loading' ? 'wait' : 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        lineHeight: 1.3,
        background: palette.bg,
        border: `1px solid ${lit && state === 'idle' ? 'rgba(226,207,145,0.55)' : palette.border}`,
        color: palette.color,
        boxShadow: lit ? '0 8px 18px rgba(0,0,0,0.38)' : '0 2px 6px rgba(0,0,0,0.22)',
        transform: lit ? 'translateY(-2px)' : 'translateY(0)',
        opacity: state === 'loading' ? 0.62 : 1,
        animation: state === 'playing' ? 'soundboardPulse 1.8s ease-in-out infinite' : state === 'loading' ? 'soundboardShimmer 1.2s ease-in-out infinite' : 'none',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.2s ease, opacity 0.16s ease',
      }}
    >
      <div style={{ fontWeight: state === 'playing' ? 700 : 400 }}>{track.title}</div>
      {stateLabel && (
        <div style={{ fontSize: 8, marginTop: 3, letterSpacing: '0.05em', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', opacity: 0.85 }}>
          {stateLabel}
        </div>
      )}
    </button>
  );
}

export default function DMSoundboard() {
  const [settings, setSettings] = useState(getAudioSettings);
  const [library, setLibrary] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Soundtrack');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [status, setStatus] = useState({}); // trackKey -> 'loading' | 'error'
  const [activeBeds, setActiveBeds] = useState({ environment: null, ambience: null }); // busKey -> trackKey

  useEffect(() => subscribeAudioSettings(setSettings), []);

  useEffect(() => {
    let cancelled = false;
    loadSoundLibrary().then(rows => { if (!cancelled) setLibrary(rows); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const found = getCategories(library);
    const ordered = CATEGORY_ORDER.filter(cat => cat === 'Soundtrack' || found.includes(cat));
    const extra = found.filter(cat => !CATEGORY_ORDER.includes(cat));
    return [...ordered, ...extra];
  }, [library]);

  const categoryTracks = useMemo(() => {
    if (activeCategory === 'Soundtrack') return [];
    const rows = getTracksByCategory(library, activeCategory);
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter(track => (track.title || '').toLowerCase().includes(needle));
  }, [library, activeCategory, search]);

  const update = (patch) => setSettings(saveAudioSettings({ ...settings, ...patch }));

  const applyBusVolume = (bus, volume) => {
    const { volumeKey, enabledKey, engine } = BUSES[bus];
    update({ [volumeKey]: volume, [enabledKey]: true });
    engine.setVolume(volume);
    engine.setMuted(false);
  };

  const toggleBus = (bus) => {
    const { enabledKey, engine } = BUSES[bus];
    const enabled = !settings[enabledKey];
    update({ [enabledKey]: enabled });
    engine.setMuted(!enabled);
  };

  const clearStatus = (key) => setStatus(prev => {
    if (!(key in prev)) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });

  const handlePlay = async (track) => {
    const key = getTrackKey(track);
    const busKey = getBusKey(track.category);
    const isBed = busKey === 'environment' || busKey === 'ambience';

    setStatus(prev => ({ ...prev, [key]: 'loading' }));
    const result = await playTrack(track);

    if (!result.ok) {
      setStatus(prev => ({ ...prev, [key]: 'error' }));
      return;
    }

    clearStatus(key);

    if (isBed) {
      setActiveBeds(prev => ({ ...prev, [busKey]: key }));
    } else {
      setStatus(prev => ({ ...prev, [key]: 'playing' }));
      result.audio?.addEventListener('ended', () => {
        setStatus(prev => {
          if (prev[key] !== 'playing') return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, { once: true });
    }
  };

  const FADE_ALL_SECONDS = 3;

  const fadeAllOut = () => {
    Object.values(BUSES).forEach(({ engine }) => engine.fadeTo(0, FADE_ALL_SECONDS));
  };

  const fadeAllIn = () => {
    Object.values(BUSES).forEach(({ engine, volumeKey }) => engine.fadeTo(settings[volumeKey], FADE_ALL_SECONDS));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.015), transparent 140px)' }}>
      <style>{`
        @keyframes soundboardPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,168,74,0), 0 2px 6px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 0 16px 3px rgba(200,168,74,0.32), 0 2px 6px rgba(0,0,0,0.2); }
        }
        @keyframes soundboardShimmer {
          0%, 100% { opacity: 0.48; }
          50% { opacity: 0.85; }
        }
      `}</style>

      <div style={{ padding: '13px 15px 11px', borderBottom: '1px solid rgba(226,207,145,0.14)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <div style={label8()}>Mixer</div>
          <div style={{ display: 'flex', gap: 5 }}>
            <GoldButton onClick={fadeAllOut} title={`Fade every bus out over ${FADE_ALL_SECONDS}s`}>Fade All Out</GoldButton>
            <GoldButton onClick={fadeAllIn} title={`Fade every bus back in over ${FADE_ALL_SECONDS}s`}>Fade All In</GoldButton>
          </div>
        </div>
        <MixerRow
          label={BUSES.music.label}
          volume={settings.musicVolume}
          enabled={settings.musicEnabled}
          onVolumeChange={v => applyBusVolume('music', v)}
          onToggle={() => toggleBus('music')}
          extra={(
            <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
              <GoldButton onClick={() => musicEngine.fadeTo(0, 3)} title="Fade out over 3s">Fade Out</GoldButton>
              <GoldButton onClick={() => musicEngine.fadeTo(settings.musicVolume, 3)} title="Fade in over 3s">Fade In</GoldButton>
            </div>
          )}
        />
        <MixerRow label={BUSES.environment.label} volume={settings.environmentVolume} enabled={settings.environmentEnabled} onVolumeChange={v => applyBusVolume('environment', v)} onToggle={() => toggleBus('environment')} />
        <MixerRow label={BUSES.ambience.label} volume={settings.ambienceVolume} enabled={settings.ambienceEnabled} onVolumeChange={v => applyBusVolume('ambience', v)} onToggle={() => toggleBus('ambience')} />
        <MixerRow label={BUSES.sfx.label} volume={settings.sfxVolume} enabled={settings.sfxEnabled} onVolumeChange={v => applyBusVolume('sfx', v)} onToggle={() => toggleBus('sfx')} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '11px 15px', borderBottom: '1px solid rgba(226,207,145,0.1)', flexShrink: 0 }}>
        {categories.map(cat => (
          <CategoryTab key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
        {activeCategory === 'Soundtrack' ? (
          <MusicPanel />
        ) : (
          <>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={`Search ${activeCategory}...`}
              style={{
                width: '100%',
                marginBottom: 12,
                background: 'rgba(0,0,0,0.22)',
                border: `1px solid ${searchFocused ? 'rgba(226,207,145,0.5)' : COLORS.border}`,
                boxShadow: searchFocused ? '0 0 0 3px rgba(226,207,145,0.08)' : 'none',
                borderRadius: 7,
                padding: '9px 12px',
                color: COLORS.text,
                fontFamily: 'Georgia, serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            />
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 10 }}>
              {categoryTracks.length} sound{categoryTracks.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
              {categoryTracks.map(track => {
                const key = getTrackKey(track);
                const busKey = getBusKey(track.category);
                const isBed = busKey === 'environment' || busKey === 'ambience';
                const state = isBed
                  ? (activeBeds[busKey] === key ? 'playing' : (status[key] || 'idle'))
                  : (status[key] || 'idle');

                return (
                  <SoundTile key={key} track={track} state={state} isBed={isBed} onClick={() => handlePlay(track)} />
                );
              })}
              {categoryTracks.length === 0 && (
                <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                  No sounds in this category yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
