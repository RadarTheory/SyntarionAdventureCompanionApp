// ═══════════════════════════════════════════════════════════════════════════
//  Fubin.jsx — Syntarion | Arcane-Industrial Pong
//  Single-file component. Drop into src/ and render as <Fubin onHome={fn} />
//  Requires: supabase client at ./lib/supabase
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import supabase from './lib/supabase';

// ── Google Font injection ────────────────────────────────────────────────────
const injectFonts = () => {
  if (document.getElementById('fubin-fonts')) return;
  const link = document.createElement('link');
  link.id = 'fubin-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap';
  document.head.appendChild(link);
};

// ── Constants ────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const WIN_AHEAD        = 5;
const BALL_BASE_R      = 13;
const BALL_MIN_R       = 3;
const BALL_SHRINK      = 1.0;
const BALL_BASE_SPEED  = 420;
const BALL_MAX_SPEED   = 980;
const BALL_SERVE_SPEED = BALL_BASE_SPEED * 0.75;
const PADDLE_W         = 52;
const PADDLE_H         = 52;
const BORDER           = 36;
const GOAL_RATIO       = 0.52;
const MAX_WISPS        = 7;
const WISP_SPAWN_INTERVAL = 3.2;
const TRAP_TIMEOUT     = 1.0;

const DIFFICULTY = {
  apprentice: { label: 'Apprentice', reactionDelay: 0.22, errorMult: 1.2, speed: 0.55, color: '#60c860', jewel: '#40e840' },
  adept:      { label: 'Adept',      reactionDelay: 0.13, errorMult: 0.7, speed: 0.72, color: '#4090e0', jewel: '#40b0ff' },
  archmage:   { label: 'Archmage',   reactionDelay: 0.05, errorMult: 0.2, speed: 0.92, color: '#c040e0', jewel: '#d060ff' },
};

// ── Math utils ───────────────────────────────────────────────────────────────
const clamp   = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp    = (a, b, t)   => a + (b - a) * t;
const dist2   = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const randRange = (lo, hi) => lo + Math.random() * (hi - lo);

// ── Room code generator ───────────────────────────────────────────────────────
const genRoomCode = () => Math.random().toString(36).slice(2, 😎.toUpperCase();

// ── Audio ────────────────────────────────────────────────────────────────────
let _audioCtx = null;
const getAC = () => {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    const AC = window.AudioContext || window.webkitAudioContext;
    _audioCtx = AC ? new AC() : null;
  }
  return _audioCtx;
};
const tone = (freq, dur, type = 'sine', vol = 0.1) => {
  const ac = getAC(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
};
const sfxPaddle  = () => { tone(220, 0.07, 'sine', 0.09); tone(340, 0.05, 'triangle', 0.06); };
const sfxGoal    = () => { tone(440, 0.2, 'sine', 0.13); setTimeout(() => tone(660, 0.3, 'sine', 0.09), 130); };
const sfxWisp    = () => tone(520, 0.1, 'triangle', 0.06);
const sfxWispBmp = () => tone(280, 0.08, 'sine', 0.05);
const sfxPhase   = () => { tone(180, 0.18, 'sawtooth', 0.08); tone(90, 0.25, 'sine', 0.06); };

// ── Wisp factory ─────────────────────────────────────────────────────────────
const WISP_PALETTE = [
  { body: '#b0e8ff', eye: '#003860', glow: 'rgba(80,180,255,0.5)' },
  { body: '#b8ffb0', eye: '#003808', glow: 'rgba(80,255,100,0.5)' },
  { body: '#e8b0ff', eye: '#380060', glow: 'rgba(180,80,255,0.5)' },
  { body: '#fff0a0', eye: '#382000', glow: 'rgba(255,200,60,0.5)'  },
  { body: '#ffb0b0', eye: '#380000', glow: 'rgba(255,80,80,0.5)'   },
];

const makeWisp = (id, W, H, ballX, ballY, paddles) => {
  const r = randRange(16, 34);
  let x, y, attempts = 0;
  do {
    x = randRange(BORDER + r + 10, W - BORDER - r - 10);
    y = randRange(BORDER + r + 10, H - BORDER - r - 10);
    attempts++;
  } while (
    attempts < 30 &&
    (dist2(x, y, ballX, ballY) < r + BALL_BASE_R + 20 ||
     paddles.some(p => Math.abs(x - p.x) < PADDLE_W + r + 10 && Math.abs(y - p.y) < PADDLE_H + r + 10))
  );
  const pal = WISP_PALETTE[id % WISP_PALETTE.length];
  return {
    id, x, y, r,
    vx: randRange(-40, 40),
    vy: randRange(-40, 40),
    phase: Math.random() * Math.PI * 2,
    pal,
    opacity: 0,
    phasing: true,
    alive: true,
    distressTimer: 0,
    angryTimer: 0,
    frozen: true,
    bobOffset: Math.random() * Math.PI * 2,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════

const LS_KEY = uid => fubin_stats_${uid};

const defaultStats = () => ({
  vs_grey_apprentice_wins: 0, vs_grey_apprentice_losses: 0,
  vs_grey_adept_wins: 0,      vs_grey_adept_losses: 0,
  vs_grey_archmage_wins: 0,   vs_grey_archmage_losses: 0,
  vs_human_wins: 0,           vs_human_losses: 0,
  current_streak: 0,          best_streak: 0,
});

const loadLocalStats = uid => {
  try { return { ...defaultStats(), ...JSON.parse(localStorage.getItem(LS_KEY(uid))) }; }
  catch { return defaultStats(); }
};

const saveLocalStats = (uid, stats) => {
  try { localStorage.setItem(LS_KEY(uid), JSON.stringify(stats)); } catch {}
};

const syncStatsToSupabase = async (uid, stats) => {
  try {
    await supabase.from('fubin_stats').upsert({ user_id: uid, ...stats, updated_at: new Date().toISOString() });
  } catch {}
};

const loadStatsFromSupabase = async (uid) => {
  try {
    const { data } = await supabase.from('fubin_stats').select('*').eq('user_id', uid).single();
    if (data) { saveLocalStats(uid, data); return data; }
  } catch {}
  return null;
};

const recordGameResult = async (uid, { isAI, difficulty, won, networkInterrupted, abandoned }) => {
  if (networkInterrupted) return;
  const local = loadLocalStats(uid);
  const next = { ...local };
  if (isAI) {
    const base = vs_grey_${difficulty};
    if (won) { next[`${base}_wins`]++; next.current_streak++; }
    else     { next[`${base}_losses`]++; next.current_streak = 0; }
  } else {
    if (won) { next.vs_human_wins++;   next.current_streak++; }
    else     { next.vs_human_losses++; next.current_streak = 0; }
  }
  next.best_streak = Math.max(next.best_streak, next.current_streak);
  saveLocalStats(uid, next);
  await syncStatsToSupabase(uid, next);
  return next;
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Fubin({ onHome }) {
  injectFonts();

  const [user,       setUser]       = useState(null);
  const [screen,     setScreen]     = useState('menu');   // menu|difficulty|lobby|game|stats|win
  const [gameMode,   setGameMode]   = useState(null);     // 'ai'|'human'
  const [difficulty, setDifficulty] = useState('adept');
  const [stats,      setStats]      = useState(null);
  const [leaderboard,setLeaderboard]= useState([]);
  const [winData,    setWinData]    = useState(null);
  const [lobbyState, setLobbyState] = useState(null);     // {roomCode, isHost, guestId, ...}
  const [lobbyError, setLobbyError] = useState('');
  const [roomInput,  setRoomInput]  = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        initStats(session.user.id);
      }
    });
  }, []);

  const initStats = async (uid) => {
    const remote = await loadStatsFromSupabase(uid);
    setStats(remote || loadLocalStats(uid));
  };

  const loadLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('fubin_stats')
        .select('user_id, vs_human_wins, vs_human_losses, best_streak')
        .order('vs_human_wins', { ascending: false })
        .limit(10);
      if (data) {
        // fetch usernames
        const ids = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('fubin_profiles')
          .select('id, username')
          .in('id', ids);
        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.id] = p.username; });
        setLeaderboard(data.map((d, i) => ({
          rank: i + 1,
          username: nameMap[d.user_id] || 'Unknown',
          wins: d.vs_human_wins,
          losses: d.vs_human_losses,
          streak: d.best_streak,
        })));
      }
    } catch {}
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToStats = () => { loadLeaderboard(); setScreen('stats'); };

  const handleWin = useCallback(async (data) => {
    setWinData(data);
    setScreen('win');
    if (user) {
      const next = await recordGameResult(user.id, data);
      if (next) setStats(next);
    }
  }, [user]);

  const handleAbandon = useCallback(async () => {
    if (user && gameMode === 'ai') {
      await recordGameResult(user.id, { isAI: true, difficulty, won: false, networkInterrupted: false, abandoned: true });
    }
    setScreen('menu');
  }, [user, gameMode, difficulty]);

  // ── Lobby (multiplayer) ────────────────────────────────────────────────────
  const createLobby = async () => {
    if (!user) return;
    const code = genRoomCode();
    const { data, error } = await supabase.from('fubin_lobbies').insert({
      host_id: user.id, room_code: code, status: 'waiting',
    }).select().single();
    if (!error && data) {
      setLobbyState({ roomCode: code, isHost: true, lobbyId: data.id, guestReady: false });
      setScreen('lobby');
    }
  };

  const joinLobby = async (code) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('fubin_lobbies')
      .select('*')
      .eq('room_code', code.toUpperCase())
      .eq('status', 'waiting')
      .single();
    if (error || !data) { setLobbyError('Room not found or already started.'); return; }
    await supabase.from('fubin_lobbies').update({ guest_id: user.id, status: 'ready' }).eq('id', data.id);
    setLobbyState({ roomCode: code.toUpperCase(), isHost: false, lobbyId: data.id, hostId: data.host_id });
    setScreen('lobby');
  };

  const challengeByUsername = async (username) => {
    if (!user) return;
    const { data: profile } = await supabase.from('fubin_profiles').select('id').eq('username', username).single();
    if (!profile) { setLobbyError('Player not found.'); return; }
    // For now, create a lobby and show code to share
    await createLobby();
  };

  // ── Render screens ────────────────────────────────────────────────────────
  if (screen === 'game') {
    return (
      <GameCanvas
        user={user}
        mode={gameMode}
        difficulty={difficulty}
        lobbyState={lobbyState}
        onWin={handleWin}
        onAbandon={handleAbandon}
      />
    );
  }

  return (
    <ShellUI
      screen={screen}
      setScreen={setScreen}
      stats={stats}
      leaderboard={leaderboard}
      winData={winData}
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      lobbyState={lobbyState}
      lobbyError={lobbyError}
      roomInput={roomInput}
      setRoomInput={setRoomInput}
      usernameInput={usernameInput}
      setUsernameInput={setUsernameInput}
      user={user}
      onHome={onHome}
      goToStats={goToStats}
      createLobby={createLobby}
      joinLobby={joinLobby}
      challengeByUsername={challengeByUsername}
      startAiGame={() => { setGameMode('ai'); setScreen('game'); }}
      startHumanGame={() => { setGameMode('human'); setScreen('game'); }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHELL UI (Menu / Difficulty / Lobby / Stats / Win)
// ═══════════════════════════════════════════════════════════════════════════

function ShellUI(props) {
  const {
    screen, setScreen, stats, leaderboard, winData, difficulty, setDifficulty,
    lobbyState, lobbyError, roomInput, setRoomInput, usernameInput, setUsernameInput,
    user, onHome, goToStats, createLobby, joinLobby, challengeByUsername,
    startAiGame, startHumanGame,
  } = props;

  const S = {
    shell: {
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'radial-gradient(ellipse at 40% 30%, #1a1208 0%, #0d0b08 55%, #060504 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Crimson Pro', serif",
      overflow: 'hidden',
    },
    backBtn: {
      position: 'absolute', top: 24, left: 24,
      background: 'none', border: '1px solid rgba(184,137,42,0.25)',
      borderRadius: 6, padding: '8px 16px',
      color: 'rgba(200,190,170,0.6)', fontFamily: "'Cinzel', serif",
      fontSize: 10, letterSpacing: '0.14em', cursor: 'pointer',
      textTransform: 'uppercase', transition: 'all 0.2s',
    },
    panel: {
      background: 'rgba(18,14,9,0.97)',
      border: '1px solid rgba(184,137,42,0.2)',
      borderRadius: 8, padding: '36px 40px',
      boxShadow: '0 0 60px rgba(184,137,42,0.07), 0 24px 80px rgba(0,0,0,0.😎',
      width: '100%', maxWidth: 460, position: 'relative',
    },
    title: {
      fontFamily: "'Cinzel', serif", fontSize: 48, fontWeight: 900,
      letterSpacing: '0.18em', color: '#e8c040',
      textShadow: '0 0 40px rgba(232,192,64,0.45), 0 0 80px rgba(232,192,64,0.15)',
      margin: 0, lineHeight: 1, textAlign: 'center',
    },
    subtitle: {
      fontFamily: "'Crimson Pro', serif", fontStyle: 'italic',
      color: 'rgba(200,190,170,0.5)', fontSize: 13, textAlign: 'center',
      marginTop: 8, letterSpacing: '0.05em',
    },
    btnPrimary: {
      width: '100%', padding: '16px 24px',
      background: 'linear-gradient(135deg, #8b6520, #c49028, #8b6520)',
      border: '1px solid rgba(255,210,80,0.3)',
      borderRadius: 4, cursor: 'pointer',
      fontFamily: "'Cinzel', serif", fontSize: 11,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: '#1a0e04', fontWeight: 700,
      boxShadow: '0 4px 20px rgba(184,137,42,0.3)',
      transition: 'all 0.2s', marginBottom: 12,
    },
    btnSecondary: {
      width: '100%', padding: '14px 24px',
      background: 'rgba(30,24,14,0.9)',
      border: '1px solid rgba(184,137,42,0.18)',
      borderRadius: 4, cursor: 'pointer',
      fontFamily: "'Cinzel', serif", fontSize: 11,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'rgba(200,190,170,0.😎', fontWeight: 600,
      transition: 'all 0.2s', marginBottom: 12,
    },
    btnGhost: {
      width: '100%', padding: '12px 24px',
      background: 'transparent',
      border: '1px solid rgba(138,154,160,0.2)',
      borderRadius: 4, cursor: 'pointer',
      fontFamily: "'Cinzel', serif", fontSize: 10,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      color: 'rgba(138,154,160,0.7)',
      transition: 'all 0.2s', marginBottom: 10,
    },
    input: {
      width: '100%', padding: '12px 16px',
      background: 'rgba(13,11,8,0.9)',
      border: '1px solid rgba(184,137,42,0.2)',
      borderRadius: 4, color: 'rgba(220,210,190,0.9)',
      fontFamily: "'Crimson Pro', serif", fontSize: 15,
      outline: 'none', marginBottom: 12, boxSizing: 'border-box',
    },
    divider: {
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '16px 0',
      color: 'rgba(138,154,160,0.4)',
      fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em',
    },
    divLine: { flex: 1, height: 1, background: 'rgba(138,154,160,0.15)' },
    sectionLabel: {
      fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em',
      color: 'rgba(184,137,42,0.6)', textTransform: 'uppercase',
      marginBottom: 16, textAlign: 'center',
    },
  };

  // ambient particles
  const particles = Array.from({ length: 18 }, (_, i) => ({
    left: ${5 + (i * 5.3) % 90}%,
    top: ${10 + (i * 7.1) % 80}%,
    size: 2 + (i % 3),
    opacity: 0.06 + (i % 4) * 0.04,
    color: i % 3 === 0 ? '#e8c040' : i % 3 === 1 ? '#4090ff' : '#60e080',
    animDelay: ${i * 0.4}s,
  }));

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={S.shell}>
      <style>{`
        @keyframes fubinFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fubinGlow  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes fubinSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fubin-particle { position:absolute; border-radius:50%; animation:fubinFloat 4s ease-in-out infinite; }
      `}</style>

      {particles.map((p, i) => (
        <div key={i} className="fubin-particle" style={{
          left: p.left, top: p.top, width: p.size, height: p.size,
          background: p.color, opacity: p.opacity, animationDelay: p.animDelay,
        }}/>
      ))}

      <div style={S.panel}>
        {/* Top divider line */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,192,64,0.4),transparent)' }}/>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={S.title}>FUBIN</h1>
          <p style={S.subtitle}>Arcane–Industrial Edition · The board remembers</p>
        </div>

        <button style={S.btnPrimary} onClick={() => setScreen('difficulty')}>
          ⚔ Solo — Face The Grey One
        </button>
        <button style={S.btnSecondary} onClick={() => setScreen('lobby_entry')}>
          ⚜ Challenge a Rival
        </button>

        <div style={S.divider}>
          <div style={S.divLine}/><span>Records</span><div style={S.divLine}/>
        </div>

        <button style={S.btnGhost} onClick={goToStats}>
          ◈ Chronicles &amp; Leaderboard
        </button>
        <button style={{...S.btnGhost, marginBottom: 0}} onClick={onHome}>
          ← Return to the World
        </button>
      </div>
    </div>
  );

  // ── DIFFICULTY ───────────────────────────────────────────────────────────
  if (screen === 'difficulty') return (
    <div style={S.shell}>
      <button style={S.backBtn} onClick={() => setScreen('menu')}>← Back</button>
      <div style={S.panel}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,192,64,0.4),transparent)' }}/>
        <p style={S.sectionLabel}>Choose Your Trial</p>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", color: '#c8d4d8', fontSize: 22, margin: 0, letterSpacing: '0.08em' }}>The Grey One Awaits</h2>
          <p style={{ ...S.subtitle, marginTop: 6 }}>Select the weight of the rite</p>
        </div>

        {Object.entries(DIFFICULTY).map(([key, d]) => (
          <button key={key}
            onClick={() => { setDifficulty(key); startAiGame(); }}
            style={{
              ...S.btnSecondary,
              border: 1px solid ${d.color}44,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 4, textAlign: 'left',
            }}
          >
            <span style={{ color: d.color, fontSize: 13, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em' }}>
              {d.label}
            </span>
            <span style={{ color: 'rgba(180,170,150,0.55)', fontSize: 11, fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
              {key === 'apprentice' ? 'The Grey One stirs from slumber' :
               key === 'adept'     ? 'The Grey One is practiced and precise' :
                                     'The Grey One is merciless — few have won'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── LOBBY ENTRY ──────────────────────────────────────────────────────────
  if (screen === 'lobby_entry') return (
    <div style={S.shell}>
      <button style={S.backBtn} onClick={() => setScreen('menu')}>← Back</button>
      <div style={S.panel}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,192,64,0.4),transparent)' }}/>
        <p style={S.sectionLabel}>Challenge a Rival</p>

        <button style={S.btnPrimary} onClick={createLobby}>
          ✦ Create Room — Get a Code
        </button>

        <div style={S.divider}>
          <div style={S.divLine}/><span>Join</span><div style={S.divLine}/>
        </div>

        <input style={S.input} placeholder="Enter room code (6 letters)"
          value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button style={S.btnSecondary} onClick={() => joinLobby(roomInput)}>
          Enter Room
        </button>

        <div style={S.divider}>
          <div style={S.divLine}/><span>Or</span><div style={S.divLine}/>
        </div>

        <input style={S.input} placeholder="Challenge by username"
          value={usernameInput} onChange={e => setUsernameInput(e.target.value)}
        />
        <button style={S.btnGhost} onClick={() => challengeByUsername(usernameInput)}>
          Send Challenge
        </button>

        {lobbyError && <p style={{ color: '#c04030', fontFamily: "'Crimson Pro', serif", fontSize: 13, textAlign: 'center', marginTop: 8 }}>{lobbyError}</p>}
      </div>
    </div>
  );

  // ── LOBBY WAITING ────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
    <div style={S.shell}>
      <button style={S.backBtn} onClick={() => setScreen('menu')}>← Abandon</button>
      <div style={S.panel}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,192,64,0.4),transparent)' }}/>
        <p style={S.sectionLabel}>{lobbyState?.isHost ? 'Awaiting Challenger' : 'Joining Room'}</p>

        {lobbyState?.isHost && (
          <>
            <p style={{ textAlign: 'center', color: 'rgba(200,190,170,0.6)', fontFamily: "'Crimson Pro', serif", fontSize: 14, marginBottom: 8 }}>
              Share this room code
            </p>
            <div style={{
              textAlign: 'center', fontSize: 38, fontFamily: "'Cinzel', serif",
              fontWeight: 900, color: '#e8c040', letterSpacing: '0.25em',
              padding: '20px 0', textShadow: '0 0 30px rgba(232,192,64,0.4)',
            }}>
              {lobbyState?.roomCode}
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(138,154,160,0.5)', fontSize: 12, fontFamily: "'Crimson Pro', serif", fontStyle: 'italic' }}>
              Waiting for a rival to enter this code...
            </p>
          </>
        )}
        {!lobbyState?.isHost && (
          <p style={{ textAlign: 'center', color: '#60e080', fontFamily: "'Crimson Pro', serif", fontSize: 15, marginTop: 16 }}>
            Joined — waiting for host to begin...
          </p>
        )}

        <button style={{ ...S.btnPrimary, marginTop: 24 }} onClick={() => { setGameMode('human'); setScreen('game'); }}>
          Begin the Rite
        </button>
      </div>
    </div>
  );

  // ── STATS / CHRONICLES ───────────────────────────────────────────────────
  if (screen === 'stats') {
    const st = stats || defaultStats();
    const jewels = [
      { label: 'Apprentice Wins',   value: st.vs_grey_apprentice_wins,   color: '#40e840' },
      { label: 'Apprentice Losses', value: st.vs_grey_apprentice_losses, color: '#206020' },
      { label: 'Adept Wins',        value: st.vs_grey_adept_wins,        color: '#40b0ff' },
      { label: 'Adept Losses',      value: st.vs_grey_adept_losses,      color: '#204080' },
      { label: 'Archmage Wins',     value: st.vs_grey_archmage_wins,     color: '#d060ff' },
      { label: 'Archmage Losses',   value: st.vs_grey_archmage_losses,   color: '#602080' },
      { label: 'Human Wins',        value: st.vs_human_wins,             color: '#e8c040' },
      { label: 'Human Losses',      value: st.vs_human_losses,           color: '#806020' },
    ];
    return (
      <div style={S.shell}>
        <button style={S.backBtn} onClick={() => setScreen('menu')}>← Back</button>
        <div style={{ ...S.panel, maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,192,64,0.4),transparent)' }}/>
          <p style={S.sectionLabel}>Chronicles</p>

          {/* Stat tablets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {jewels.map((j, i) => (
              <div key={i} style={{
                background: 'rgba(13,11,8,0.9)', border: 1px solid ${j.color}33,
                borderRadius: 4, padding: '14px 16px', position: 'relative', overflow: 'hidden',
              }}>
                {/* chisel texture lines */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.5) 6px, rgba(255,255,255,0.5) 7px)' }}/>
                {/* jewel */}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: j.color, boxShadow: 0 0 8px ${j.color}, marginBottom: 8 }}/>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color: j.color, lineHeight: 1, textShadow: 0 0 12px ${j.color}66 }}>
                  {j.value}
                </div>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', fontSize: 10, color: 'rgba(180,170,150,0.55)', marginTop: 4, letterSpacing: '0.04em' }}>
                  {j.label}
                </div>
              </div>
            ))}
          </div>

          {/* Streak */}
          <div style={{ background: 'rgba(13,11,8,0.9)', border: '1px solid rgba(232,192,64,0.2)', borderRadius: 4, padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 30, color: '#e8c040', textShadow: '0 0 20px rgba(232,192,64,0.4)' }}>{st.best_streak}</div>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(180,170,150,0.55)', marginTop: 4 }}>Personal Best Streak</div>
          </div>

          {/* Leaderboard */}
          <p style={S.sectionLabel}>Leaderboard — Human Rivals</p>
          {leaderboard.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(138,154,160,0.4)', fontStyle: 'italic', fontSize: 13 }}>No records yet</p>}
          {leaderboard.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', marginBottom: 8,
              background: 'rgba(13,11,8,0.😎', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 4,
            }}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, width: 24, textAlign: 'center',
                color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(180,170,150,0.5)',
                textShadow: entry.rank <= 3 ? 0 0 10px currentColor : 'none',
              }}>{entry.rank}</span>
              <span style={{ flex: 1, fontFamily: "'Cinzel', serif", fontSize: 11, color: 'rgba(220,210,190,0.😎', letterSpacing: '0.08em' }}>{entry.username}</span>
              <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: '#e8c040' }}>{entry.wins}W</span>
              <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 12, color: 'rgba(180,170,150,0.4)' }}>{entry.losses}L</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── WIN SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'win') {
    const w = winData || {};
    return (
      <div style={S.shell}>
        <style>{`
          @keyframes fubinPulseRing { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.08);opacity:0.6} }
          @keyframes fubinWinTitle  { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
          @keyframes fubinGearSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Rings */}
          {[80, 110, 145].map((r, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: r * 2, height: r * 2,
              marginLeft: -r, marginTop: -r,
              borderRadius: '50%',
              border: 1px solid ${i === 0 ? '#e8c040' : i === 1 ? '#4080ff' : '#60e080'},
              animation: fubinPulseRing ${2 + i * 0.4}s ease-in-out infinite,
              animationDelay: ${i * 0.2}s,
            }}/>
          ))}

          {/* Gear decorations */}
          {[-160, 160].map((offset, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              marginLeft: offset - 22, marginTop: -22,
              width: 44, height: 44,
              border: '2px solid rgba(58,40,16,0.7)', borderRadius: '50%',
              animation: fubinGearSpin ${4 + i}s linear infinite,
              animationDirection: i === 1 ? 'reverse' : 'normal',
            }}/>
          ))}

          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 42, fontWeight: 900, letterSpacing: '0.08em',
            color: w.won ? '#e8c040' : '#c0b090',
            textShadow: 0 0 40px ${w.won ? 'rgba(232,192,64,0.6)' : 'rgba(192,176,144,0.4)'},
            animation: 'fubinWinTitle 0.6s ease both',
            position: 'relative', zIndex: 1,
          }}>
            {w.won ? 'Victory' : 'Defeat'}
          </h1>

          <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: 'rgba(200,190,170,0.7)', margin: '8px 0 4px' }}>
            {w.scoreLeft} – {w.scoreRight}
          </p>
          <p style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(138,154,160,0.5)' }}>
            {w.won ? 'The board has spoken in your favour' : 'The Grey One endures'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
            <button style={{ ...S.btnPrimary, width: 'auto', padding: '14px 28px' }} onClick={() => setScreen('difficulty')}>
              Play Again
            </button>
            <button style={{ ...S.btnGhost, width: 'auto', padding: '14px 28px', marginBottom: 0 }} onClick={() => setScreen('menu')}>
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GAME CANVAS
// ═══════════════════════════════════════════════════════════════════════════

function GameCanvas({ user, mode, difficulty, lobbyState, onWin, onAbandon }) {
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);

  // Game phase: 'intro'|'cointoss'|'waiting_serve'|'playing'|'goal_pause'|'ended'
  const [phase,      setPhase]      = useState('intro');
  const [scoreL,     setScoreL]     = useState(0);
  const [scoreR,     setScoreR]     = useState(0);
  const [shakeActive,setShakeActive]= useState(false);
  const [coinFlip,   setCoinFlip]   = useState(null);  // null|{result,chosen}
  const [coinResult, setCoinResult] = useState(null);
  const [introStep,  setIntroStep]  = useState(0); // 0=planks, 1=circuits, 2=done

  const phaseRef     = useRef('intro');
  const scoreRef     = useRef({ L: 0, R: 0 });
  const shakeRef     = useRef({ active: false, timer: 0, dx: 0, dy: 0 });
  const ballRef      = useRef(null);
  const prevBallRef  = useRef(null);
  const paddleLRef   = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const paddleRRef   = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const wispsRef     = useRef([]);
  const wispIdRef    = useRef(0);
  const wispTimerRef = useRef(WISP_SPAWN_INTERVAL);
  const trailRef     = useRef([]);
  const smokeRef     = useRef([]);  // [{x,y,t,life}]
  const scoreSmoke   = useRef({ active: false, timer: 0, side: null });
  const trapTimerRef = useRef({ L: 0, R: 0 });
  const ballRadiusRef= useRef(BALL_BASE_R);
  const ballSpeedRef = useRef(BALL_BASE_SPEED);
  const goalCountRef = useRef(0);
  const ballStartedRef = useRef(false);
  const networkOkRef  = useRef(true);
  const bgCacheRef    = useRef(null);
  const plankAnim     = useRef({ progress: 0, done: false });
  const circuitAnim   = useRef({ progress: 0, done: false });
  const dimRef        = useRef({ W: window.innerWidth, H: window.innerHeight });
  const keysRef       = useRef({});
  const aiRef         = useRef({ timer: 0, targetX: 0, targetY: 0, delay: 0.1, err: 0 });
  const stateRef      = useRef('ok'); // 'ok'|'abandoned'
  const realtimeRef   = useRef(null);

  // ── Dimensions ──────────────────────────────────────────────────────────
  const getW  = () => dimRef.current.W;
  const getH  = () => dimRef.current.H;
  const getBW = () => BORDER;
  const getGoalTop = () => getH() / 2 - (getH() * GOAL_RATIO) / 2;
  const getGoalBot = () => getH() / 2 + (getH() * GOAL_RATIO) / 2;

  // half-boundary: paddle must not cross scoreboard area (center ±60px) nor walls
  const paddleLBounds = () => ({
    xMin: getBW() + 2,
    xMax: getW() / 2 - 80,
    yMin: getBW() + 2,
    yMax: getH() - getBW() - PADDLE_H - 2,
  });
  const paddleRBounds = () => ({
    xMin: getW() / 2 + 80 - PADDLE_W,
    xMax: getW() - getBW() - PADDLE_W - 2,
    yMin: getBW() + 2,
    yMax: getH() - getBW() - PADDLE_H - 2,
  });

  // ── Reset ball ──────────────────────────────────────────────────────────
  const resetBall = useCallback((speed = BALL_SERVE_SPEED) => {
    const W = getW(), H = getH();
    const cx = W / 2 + randRange(-30, 30);
    const cy = H / 2 + randRange(-30, 30);
    const angle = Math.random() * Math.PI * 2;
    ballRef.current = {
      x: cx, y: cy,
      vx: Math.cos(angle), vy: Math.sin(angle),
      speed,
      spin: 0,  // radians/sec
      angle: 0, // visual rotation
    };
    prevBallRef.current = { x: cx, y: cy };
    trailRef.current = [];
    ballRadiusRef.current = Math.max(ballRadiusRef.current - BALL_SHRINK, BALL_MIN_R);
    if (ballRadiusRef.current <= BALL_MIN_R) {
      ballRadiusRef.current = BALL_BASE_R;
      ballSpeedRef.current  = BALL_BASE_SPEED;
    } else {
      ballSpeedRef.current = Math.min(ballSpeedRef.current + 28, BALL_MAX_SPEED);
    }
    ballRef.current.speed = speed;
    trapTimerRef.current = { L: 0, R: 0 };
  }, []);

  // ── Goal handling ────────────────────────────────────────────────────────
  const handleGoal = useCallback((side) => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'goal_pause';
    setPhase('goal_pause');
    sfxGoal();

    // screen shake
    shakeRef.current = { active: true, timer: 0.25, dx: 0, dy: 0 };
    setShakeActive(true);

    // smoke puff on scoreboard
    scoreSmoke.current = { active: true, timer: 0, side };

    const newL = scoreRef.current.L + (side === 'R' ? 1 : 0);
    const newR = scoreRef.current.R + (side === 'L' ? 1 : 0);
    scoreRef.current = { L: newL, R: newR };
    setScoreL(newL); setScoreR(newR);

    // Check win: 5 ahead
    const ahead = Math.abs(newL - newR);
    const winner = newL > newR ? 'L' : 'R';
    if (ahead >= WIN_AHEAD) {
      phaseRef.current = 'ended';
      setPhase('ended');
      const humanWon = (mode === 'ai' && winner === 'R') || (mode === 'human' && winner === 'R');
      setTimeout(() => {
        onWin({
          won: humanWon, isAI: mode === 'ai', difficulty,
          networkInterrupted: !networkOkRef.current,
          scoreLeft: newL, scoreRight: newR,
        });
      }, 1200);
      return;
    }

    // Resume after shake
    setTimeout(() => {
      goalCountRef.current++;
      setShakeActive(false);
      shakeRef.current.active = false;
      resetBall(BALL_SERVE_SPEED);
      phaseRef.current = 'playing';
      setPhase('playing');
    }, 350);
  }, [mode, difficulty, onWin, resetBall]);

  // ── Serve from tap/click ──────────────────────────────────────────────────
  const handleServe = useCallback((clientX, clientY) => {
    if (phaseRef.current !== 'waiting_serve') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tx = (clientX - rect.left) * (getW() / rect.width);
    const ty = (clientY - rect.top)  * (getH() / rect.height);
    const ball = ballRef.current;
    if (!ball) return;
    const dx = tx - ball.x, dy = ty - ball.y;
    const len = Math.hypot(dx, dy) || 1;
    ball.vx = dx / len;
    ball.vy = dy / len;
    ball.speed = BALL_SERVE_SPEED;
    ballStartedRef.current = true;
    phaseRef.current = 'playing';
    setPhase('playing');
    // unfreeze wisps
    wispsRef.current.forEach(w => { if (w.opacity >= 1) w.frozen = false; });
  }, []);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = e => { keysRef.current[e.key] = true; };
    const up   = e => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Abandon on unmount if game started ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (ballStartedRef.current && phaseRef.current !== 'ended' && stateRef.current !== 'abandoned') {
        stateRef.current = 'abandoned';
        if (user && mode === 'ai') {
          recordGameResult(user.id, { isAI: true, difficulty, won: false, networkInterrupted: false, abandoned: true });
        }
      }
    };
  }, [user, mode, difficulty]);

  // ── Mobile landscape CSS ─────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'fubin-landscape';
    style.textContent = `
      @media (max-width: 768px) and (orientation: portrait) {
        #fubin-root {
          transform: rotate(90deg);
          transform-origin: center center;
          width: 100vh !important;
          height: 100vw !important;
          position: fixed;
          top: 50%;
          left: 50%;
          margin-left: -50vh;
          margin-top: -50vw;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { const s = document.getElementById('fubin-landscape'); if (s) s.remove(); };
  }, []);

  // ── Main game loop ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let af = 0, active = true, lastTime = performance.now(), globalT = 0;

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const W   = window.innerWidth, H = window.innerHeight;
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimRef.current = { W, H };
      bgCacheRef.current = null; // invalidate bg cache
      if (!ballRef.current) {
        // Initialize paddles
        paddleLRef.current = { x: W * 0.08,  y: H / 2 - PADDLE_H / 2, vx: 0, vy: 0 };
        paddleRRef.current = { x: W * 0.88,  y: H / 2 - PADDLE_H / 2, vx: 0, vy: 0 };
        // Initialize ball (frozen until serve)
        const cx = W / 2 + randRange(-30, 30);
        const cy = H / 2 + randRange(-30, 30);
        ballRef.current = { x: cx, y: cy, vx: 1, vy: 0, speed: 0, spin: 0, angle: 0 };
        prevBallRef.current = { x: cx, y: cy };
      }
    };

    // ── Build BG cache ────────────────────────────────────────────────────
    const buildBG = () => {
      const W = getW(), H = getH();
      const off = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      off.width  = Math.round(W * dpr);
      off.height = Math.round(H * dpr);
      const bx = off.getContext('2d');
      bx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deep mahogany base
      bx.fillStyle = '#0e0a06';
      bx.fillRect(0, 0, W, H);

      // Radial depth
      const rad = bx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
      rad.addColorStop(0,   'rgba(30,20,8,0)');
      rad.addColorStop(0.6, 'rgba(10,6,2,0.4)');
      rad.addColorStop(1,   'rgba(4,2,1,0.😎');
      bx.fillStyle = rad;
      bx.fillRect(0, 0, W, H);

      // Plank lines (horizontal wood)
      bx.strokeStyle = 'rgba(40,25,8,0.4)';
      const plankH = 48;
      for (let y = BORDER; y < H - BORDER; y += plankH) {
        bx.lineWidth = 0.7;
        bx.beginPath();
        bx.moveTo(BORDER, y + Math.sin(y * 0.07) * 2);
        bx.bezierCurveTo(W*0.33, y + Math.sin(y*0.09)*3, W*0.66, y + Math.sin(y*0.08)*2, W-BORDER, y + Math.sin(y*0.06)*2);
        bx.stroke();
      }

      // Knot circles
      const knots = [[W*0.18, H*0.28], [W*0.75, H*0.62], [W*0.42, H*0.78], [W*0.82, H*0.22]];
      knots.forEach(([kx, ky]) => {
        bx.strokeStyle = 'rgba(30,18,6,0.35)';
        [10,18,26].forEach(r => {
          bx.lineWidth = 0.6;
          bx.beginPath(); bx.arc(kx, ky, r, 0, Math.PI*2); bx.stroke();
        });
      });

      // Arcane circuit traces
      bx.strokeStyle = 'rgba(48,72,160,0.22)';
      bx.lineWidth = 0.8;
      const circuits = [
        M${W*0.25} ${H*0.5} L${W*0.35} ${H*0.5} L${W*0.38} ${H*0.44} L${W*0.62} ${H*0.44} L${W*0.65} ${H*0.5} L${W*0.75} ${H*0.5},
        M${W*0.38} ${H*0.56} L${W*0.62} ${H*0.56},
        M${W*0.5} ${H*0.44} L${W*0.5} ${H*0.36},
        M${W*0.5} ${H*0.56} L${W*0.5} ${H*0.64},
      ];
      circuits.forEach(d => { const p = new Path2D(d); bx.stroke(p); });

      // Circuit nodes
      [[W*0.35,H*0.44],[W*0.65,H*0.44],[W*0.38,H*0.56],[W*0.62,H*0.56],[W*0.5,H*0.36],[W*0.5,H*0.64]].forEach(([nx,ny]) => {
        bx.fillStyle = 'rgba(60,90,200,0.3)';
        bx.beginPath(); bx.arc(nx, ny, 3, 0, Math.PI*2); bx.fill();
      });

      // Borders — brass-capped mahogany
      const drawBorder = (x, y, w, h) => {
        // Wood fill
        const wg = bx.createLinearGradient(x, y, x+w, y+h);
        wg.addColorStop(0, '#2a1808'); wg.addColorStop(0.5, '#3a2410'); wg.addColorStop(1, '#2a1808');
        bx.fillStyle = wg; bx.fillRect(x, y, w, h);
        // Brass edge
        bx.strokeStyle = '#6a4820'; bx.lineWidth = 1.5;
        bx.strokeRect(x+0.5, y+0.5, w-1, h-1);
        // Rivets
        const isH = w > h;
        const count = Math.floor((isH ? w : h) / 60);
        for (let i = 0; i < count; i++) {
          const t = (i + 0.5) / count;
          const rx = isH ? x + w * t : x + w/2;
          const ry = isH ? y + h/2   : y + h * t;
          bx.fillStyle = '#8a5c20';
          bx.beginPath(); bx.arc(rx, ry, 3.5, 0, Math.PI*2); bx.fill();
          bx.fillStyle = 'rgba(255,200,80,0.3)';
          bx.beginPath(); bx.arc(rx-1, ry-1, 1.5, 0, Math.PI*2); bx.fill();
        }
      };
      drawBorder(0, 0, W, BORDER);
      drawBorder(0, H-BORDER, W, BORDER);
      drawBorder(0, BORDER, BORDER, H-BORDER*2);
      drawBorder(W-BORDER, BORDER, BORDER, H-BORDER*2);

      // Goal openings
      const gTop = H/2 - (H*GOAL_RATIO)/2, gBot = H/2 + (H*GOAL_RATIO)/2;
      bx.clearRect(0, gTop, BORDER+1, gBot-gTop);
      bx.clearRect(W-BORDER-1, gTop, BORDER+1, gBot-gTop);

      // Goal arch glow
      const drawGoalGlow = (gx, dir) => {
        const gg = bx.createLinearGradient(gx, 0, gx+dir*BORDER*2, 0);
        gg.addColorStop(0, 'rgba(60,130,255,0.25)');
        gg.addColorStop(1, 'rgba(60,130,255,0)');
        bx.fillStyle = gg;
        bx.fillRect(gx, gTop, dir*BORDER*2, gBot-gTop);
      };
      drawGoalGlow(0, 1);
      drawGoalGlow(W-BORDER, -1);

      // Stone arch stones
      [[0, gTop-6, BORDER, 8], [0, gBot-2, BORDER, 8], [W-BORDER, gTop-6, BORDER, 8], [W-BORDER, gBot-2, BORDER, 8]].forEach(([x,y,w,h]) => {
        bx.fillStyle = '#3a2810'; bx.fillRect(x,y,w,h);
        bx.strokeStyle = '#6a4820'; bx.lineWidth=0.7; bx.strokeRect(x,y,w,h);
      });

      // Center dashed line
      bx.strokeStyle = 'rgba(50,40,20,0.3)'; bx.lineWidth = 1;
      bx.setLineDash([6, 16]);
      bx.beginPath(); bx.moveTo(W/2, BORDER+4); bx.lineTo(W/2, H-BORDER-4); bx.stroke();
      bx.setLineDash([]);

      bgCacheRef.current = off;
    };

    // ── Draw background ───────────────────────────────────────────────────
    const drawBG = () => {
      const W = getW(), H = getH();
      if (!bgCacheRef.current) buildBG();
      ctx.drawImage(bgCacheRef.current, 0, 0, W, H);
    };

    // ── Plank intro animation ─────────────────────────────────────────────
    const drawPlankIntro = (t) => {
      const W = getW(), H = getH();
      const p = plankAnim.current.progress;

      // Draw full BG underneath
      drawBG();

      if (p >= 1) {
        plankAnim.current.done = true;
        return;
      }

      // Cover with dark overlay that reveals from corners
      ctx.save();
      const ease = 1 - Math.pow(1 - p, 3); // ease out cubic

      // Four planks slide from corners
      const offsets = [
        { x: -W/2 * (1-ease), y: -H/2 * (1-ease) }, // top-left
        { x:  W/2 * (1-ease), y: -H/2 * (1-ease) }, // top-right
        { x: -W/2 * (1-ease), y:  H/2 * (1-ease) }, // bottom-left
        { x:  W/2 * (1-ease), y:  H/2 * (1-ease) }, // bottom-right
      ];

      const plankGrad = ctx.createLinearGradient(0,0,W,H);
      plankGrad.addColorStop(0, '#3a2410');
      plankGrad.addColorStop(0.4, '#2a1808');
      plankGrad.addColorStop(1, '#1a1006');

      offsets.forEach(({ x, y }, i) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = plankGrad;
        const qx = i % 2 === 0 ? 0 : W/2;
        const qy = i < 2 ? 0 : H/2;
        ctx.fillRect(qx, qy, W/2, H/2);

        // Plank grain lines
        ctx.strokeStyle = 'rgba(20,10,4,0.3)';
        ctx.lineWidth = 1;
        const lines = i < 2 ? 8 : 8;
        for (let l = 0; l < lines; l++) {
          const ly = qy + (l / lines) * H/2;
          ctx.beginPath(); ctx.moveTo(qx, ly); ctx.lineTo(qx+W/2, ly); ctx.stroke();
        }

        // Brass edge effect as planks lock in
        if (ease > 0.7) {
          ctx.strokeStyle = rgba(106,72,32,${(ease-0.7)/0.3});
          ctx.lineWidth = 2;
          ctx.strokeRect(qx, qy, W/2, H/2);
        }
        ctx.restore();
      });

      ctx.restore();
    };

    // ── Circuit draw-in animation ─────────────────────────────────────────
    const drawCircuitIntro = () => {
      const W = getW(), H = getH();
      const p = circuitAnim.current.progress;
      if (p >= 1) { circuitAnim.current.done = true; return; }

      const ease = p < 0.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
      ctx.save();
      ctx.strokeStyle = rgba(60,120,255,${ease * 0.6});
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(60,120,255,0.😎';
      ctx.shadowBlur = 8;

      // Draw circuits progressively
      const totalLen = 1;
      const paths = [
        [[W*0.25,H*0.5],[W*0.35,H*0.5],[W*0.38,H*0.44],[W*0.62,H*0.44],[W*0.65,H*0.5],[W*0.75,H*0.5]],
        [[W*0.38,H*0.56],[W*0.62,H*0.56]],
        [[W*0.5,H*0.44],[W*0.5,H*0.36]],
        [[W*0.5,H*0.56],[W*0.5,H*0.64]],
      ];

      paths.forEach((pts, pi) => {
        const pathStart = pi / paths.length;
        const pathEnd   = (pi+1) / paths.length;
        const localP    = clamp((ease - pathStart) / (pathEnd - pathStart), 0, 1);
        if (localP <= 0) return;

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const segStart = (i-1) / (pts.length-1);
          const segEnd   = i / (pts.length-1);
          const segP     = clamp((localP - segStart) / (segEnd - segStart), 0, 1);
          const tx = lerp(pts[i-1][0], pts[i][0], segP);
          const ty = lerp(pts[i-1][1], pts[i][1], segP);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
      });

      // Glowing nodes
      [[W*0.35,H*0.44],[W*0.65,H*0.44],[W*0.38,H*0.56],[W*0.62,H*0.56],[W*0.5,H*0.36],[W*0.5,H*0.64]].forEach(([nx,ny]) => {
        ctx.fillStyle = rgba(60,120,255,${ease * 0.8});
        ctx.beginPath(); ctx.arc(nx, ny, 4, 0, Math.PI*2); ctx.fill();
      });

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    // ── Draw diamond paddle ───────────────────────────────────────────────
    const drawDiamondPaddle = (x, y, jewelColor, time) => {
      ctx.save();
      const cx = x + PADDLE_W/2, cy = y + PADDLE_H/2;
      const hw = PADDLE_W/2, hh = PADDLE_H/2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(cx+4, cy-hh+4); ctx.lineTo(cx+hw+4, cy+4);
      ctx.lineTo(cx+4, cy+hh+4); ctx.lineTo(cx-hw+4, cy+4);
      ctx.closePath(); ctx.fill();

      // Wood body
      const wg = ctx.createRadialGradient(cx-hw*0.3, cy-hh*0.3, 0, cx, cy, hw*1.4);
      wg.addColorStop(0, '#7a5028'); wg.addColorStop(0.5, '#5a3418'); wg.addColorStop(1, '#3a2010');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(cx, cy-hh); ctx.lineTo(cx+hw, cy);
      ctx.lineTo(cx, cy+hh); ctx.lineTo(cx-hw, cy);
      ctx.closePath(); ctx.fill();

      // Wood grain lines
      ctx.strokeStyle = 'rgba(20,10,4,0.5)'; ctx.lineWidth = 0.6;
      for (let i = -2; i <= 2; i++) {
        const fy = cy + i * (hh/3);
        const fw = hw * (1 - Math.abs(i) / 3.5);
        ctx.beginPath(); ctx.moveTo(cx-fw*0.8, fy); ctx.lineTo(cx+fw*0.8, fy); ctx.stroke();
      }

      // Brass cap edges
      ctx.strokeStyle = '#9a7030'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy-hh); ctx.lineTo(cx+hw, cy);
      ctx.lineTo(cx, cy+hh); ctx.lineTo(cx-hw, cy);
      ctx.closePath(); ctx.stroke();

      // Inlaid jewel (diamond shape, smaller)
      const jr = 8;
      const pulse = 0.85 + Math.sin(time * 4) * 0.15;
      const jGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, jr * 2.5 * pulse);
      jGlow.addColorStop(0, jewelColor); jGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = jGlow;
      ctx.beginPath(); ctx.arc(cx, cy, jr * 2.5 * pulse, 0, Math.PI*2); ctx.fill();

      // Jewel body
      ctx.shadowColor = jewelColor; ctx.shadowBlur = 14;
      ctx.fillStyle = jewelColor;
      ctx.beginPath();
      ctx.moveTo(cx, cy-jr); ctx.lineTo(cx+jr*0.65, cy);
      ctx.lineTo(cx, cy+jr); ctx.lineTo(cx-jr*0.65, cy);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Jewel highlight
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(cx-jr*0.25, cy-jr*0.35, jr*0.2, jr*0.12, -0.5, 0, Math.PI*2); ctx.fill();

      // Top-lit surface highlight
      const hg = ctx.createLinearGradient(cx, cy-hh, cx, cy);
      hg.addColorStop(0, 'rgba(200,150,80,0.25)'); hg.addColorStop(1, 'rgba(200,150,80,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(cx, cy-hh); ctx.lineTo(cx+hw, cy); ctx.lineTo(cx-hw, cy); ctx.closePath(); ctx.fill();

      ctx.restore();
    };

    // ── Draw ball ─────────────────────────────────────────────────────────
    const drawBall = (time) => {
      const ball = ballRef.current; if (!ball) return;
      const r    = ballRadiusRef.current;
      const trail = trailRef.current;

      // Trail
      for (let i = 0; i < trail.length; i++) {
        const t  = i / trail.length;
        const pt = trail[i];
        const a  = t * t * 0.6;
        const tr = r * (0.25 + t * 0.6);
        ctx.save(); ctx.globalAlpha = a;
        const tg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, tr * 2.5);
        tg.addColorStop(0, rgba(180,220,255,${a}));
        tg.addColorStop(0.5, rgba(60,130,255,${a*0.6}));
        tg.addColorStop(1, 'rgba(20,60,200,0)');
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, tr*2.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(ball.x+3, ball.y+4, r*0.9, r*0.5, 0, 0, Math.PI*2); ctx.fill();

      // Outer glow aura
      const pulse = 0.85 + Math.sin(time*5)*0.15;
      const og = ctx.createRadialGradient(ball.x, ball.y, r*0.4, ball.x, ball.y, r*3.5*pulse);
      og.addColorStop(0, 'rgba(100,180,255,0.25)');
      og.addColorStop(0.5, 'rgba(60,120,255,0.10)');
      og.addColorStop(1, 'rgba(20,60,200,0)');
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ball.x, ball.y, r*3.5*pulse, 0, Math.PI*2); ctx.fill();

      // Ball body with rotation (spin visual)
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.angle || 0);

      const bg2 = ctx.createRadialGradient(-r*0.28, -r*0.28, 0, 0, 0, r);
      bg2.addColorStop(0, '#e8f4ff');
      bg2.addColorStop(0.3, '#80c0ff');
      bg2.addColorStop(0.7, '#2060d8');
      bg2.addColorStop(1, '#0a2060');
      ctx.shadowColor = 'rgba(80,160,255,0.9)'; ctx.shadowBlur = 16;
      ctx.fillStyle = bg2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();

      // Spin texture band (shows rotation)
      if (r > 5) {
        const spinA = Math.sin(time*6) * 0.3;
        ctx.strokeStyle = 'rgba(160,210,255,0.4)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(0, 0, r*0.7, r*0.2, spinA, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r*0.4, r*0.18, spinA+1, 0, Math.PI*2); ctx.stroke();
      }

      // Arcane ring outer
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(60,120,255,0.55)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(0, 0, r+1.5, 0, Math.PI*2); ctx.stroke();

      // Specular
      const sg = ctx.createRadialGradient(-r*0.35, -r*0.35, 0, -r*0.35, -r*0.35, r*0.55);
      sg.addColorStop(0, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(-r*0.35, -r*0.35, r*0.55, 0, Math.PI*2); ctx.fill();

      ctx.restore();
    };

    // ── Draw wisp (anime ghost) ───────────────────────────────────────────
    const drawWisp = (w, time) => {
      if (w.opacity <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = w.opacity;

      const { x, y, r, pal, phase } = w;
      const bob = Math.sin(time * 1.8 + w.bobOffset) * 3;
      const wy  = y + bob;

      // Glow aura
      const ga = ctx.createRadialGradient(x, wy, 0, x, wy, r*3);
      ga.addColorStop(0, pal.glow); ga.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ga;
      ctx.beginPath(); ctx.arc(x, wy, r*3, 0, Math.PI*2); ctx.fill();

      // Ghost body — rounded top, wispy tail
      ctx.fillStyle = pal.body;
      ctx.shadowColor = pal.glow.replace('0.5', '0.8');
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(x, wy - r*0.3, r, Math.PI, 0);           // top dome
      // wavy tail
      const tailSegs = 4, tailLen = r * 1.4;
      ctx.lineTo(x + r, wy - r*0.3 + tailLen*0.1);
      for (let i = 0; i < tailSegs; i++) {
        const tx1 = x + r - (i+0.5) * (r*2/tailSegs);
        const tx2 = x + r - (i+1)   * (r*2/tailSegs);
        const waveY = wy - r*0.3 + tailLen * ((i+1)/tailSegs);
        const waveOff = Math.sin(time*2.5 + i*1.2 + phase) * r*0.4;
        ctx.quadraticCurveTo(tx1, waveY - waveOff, tx2, waveY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner body highlight
      const ih = ctx.createRadialGradient(x - r*0.25, wy - r*0.55, 0, x, wy - r*0.3, r*0.9);
      ih.addColorStop(0, 'rgba(255,255,255,0.45)'); ih.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = ih;
      ctx.beginPath(); ctx.arc(x, wy - r*0.3, r, Math.PI, 0); ctx.fill();

      // Anime eyes
      const eyeY  = wy - r*0.25;
      const eyeOff = r * 0.32;
      const eyeR  = r * 0.18;
      const blinkT = (Math.sin(time * 0.7 + phase) > 0.85) ? 0.1 : 1; // blink

      if (w.distressTimer > 0) {
        // anguish eyes — squiggly X
        const dt2 = w.distressTimer;
        ctx.strokeStyle = pal.eye; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        [-1,1].forEach(side => {
          const ex = x + side * eyeOff, ey = eyeY;
          ctx.beginPath(); ctx.moveTo(ex-eyeR, ey-eyeR); ctx.lineTo(ex+eyeR, ey+eyeR); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ex+eyeR, ey-eyeR); ctx.lineTo(ex-eyeR, ey+eyeR); ctx.stroke();
        });
        // distress lines radiating out
        ctx.strokeStyle = rgba(255,200,80,${dt2});
        ctx.lineWidth = 1;
        for (let li = 0; li < 6; li++) {
          const la = (li/6)*Math.PI*2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(la)*r*0.9, wy + Math.sin(la)*r*0.6);
          ctx.lineTo(x + Math.cos(la)*r*1.5, wy + Math.sin(la)*r);
          ctx.stroke();
        }
      } else {
        // Normal cute eyes
        ctx.fillStyle = pal.eye;
        [-1,1].forEach(side => {
          ctx.save();
          ctx.translate(x + side * eyeOff, eyeY);
          ctx.scale(1, blinkT);
          ctx.beginPath(); ctx.arc(0, 0, eyeR, 0, Math.PI*2); ctx.fill();
          // eye shine
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath(); ctx.arc(-eyeR*0.3, -eyeR*0.3, eyeR*0.35, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        });
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    // ── Draw scoreboard ───────────────────────────────────────────────────
    const drawScoreboard = (time) => {
      const W = getW(), H = getH();
      const sbW = 110, sbH = 52;
      const sbX = W/2 - sbW/2, sbY = H/2 + 10; // just below center

      ctx.save();
      // Always behind gameplay — drawn first in render loop

      // Wood plaque
      const pg = ctx.createLinearGradient(sbX, sbY, sbX, sbY+sbH);
      pg.addColorStop(0, '#5a3c18'); pg.addColorStop(0.5, '#3a2410'); pg.addColorStop(1, '#2a1808');
      ctx.fillStyle = pg;
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(sbX, sbY, sbW, sbH, 6); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#7a5220'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(sbX, sbY, sbW, sbH, 6); ctx.stroke();

      // Inset line
      ctx.strokeStyle = 'rgba(184,137,42,0.25)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.roundRect(sbX+3, sbY+3, sbW-6, sbH-6, 4); ctx.stroke();

      // Jewels (decorative — 3 on top edge)
      const jewelCols = ['#e84040', '#40e840', '#4080ff'];
      jewelCols.forEach((jc, i) => {
        const jx = sbX + sbW * (0.25 + i*0.25);
        const jy = sbY + 6;
        ctx.fillStyle = jc; ctx.shadowColor = jc; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(jx, jy, 3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Corner rivets
      [[sbX+6,sbY+6],[sbX+sbW-6,sbY+6],[sbX+6,sbY+sbH-6],[sbX+sbW-6,sbY+sbH-6]].forEach(([rx,ry])=>{
        ctx.fillStyle = '#8a5c20';
        ctx.beginPath(); ctx.arc(rx,ry,2.5,0,Math.PI*2); ctx.fill();
      });

      // Score text
      const L = scoreRef.current.L, R = scoreRef.current.R;
      ctx.fillStyle = '#e8c040';
      ctx.font = bold 26px 'Cinzel', 'Georgia', serif;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(232,192,64,0.5)'; ctx.shadowBlur = 8;
      ctx.fillText(${L}  –  ${R}, W/2, sbY + sbH/2 + 2);
      ctx.shadowBlur = 0;

      // Smoke puff on score change
      if (scoreSmoke.current.active) {
        const st2 = scoreSmoke.current.timer;
        const sa = Math.max(0, 1 - st2 * 2.5);
        ctx.fillStyle = rgba(180,180,200,${sa * 0.6});
        const sr = 18 + st2 * 40;
        ctx.beginPath(); ctx.arc(W/2, sbY+sbH/2, sr, 0, Math.PI*2); ctx.fill();
      }

      ctx.restore();
    };

    // ── Draw smoke particles ──────────────────────────────────────────────
    const drawSmoke = () => {
      smokeRef.current.forEach(s => {
        const a = Math.max(0, 1 - s.t / s.life);
        ctx.save();
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = rgba(200,200,220,${a});
        ctx.beginPath(); ctx.arc(s.x, s.y, 4 + s.t * 12, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });
    };

    // ── Sweep ball ↔ paddle collision ─────────────────────────────────────
    const sweepBallPaddle = (paddle, side) => {
      const ball = ballRef.current; if (!ball) return false;
      const prev = prevBallRef.current;
      const r    = ballRadiusRef.current;
      const px   = paddle.x, py = paddle.y;
      // Diamond bounding box
      const cx = px + PADDLE_W/2, cy = py + PADDLE_H/2;
      const hw = PADDLE_W/2, hh = PADDLE_H/2;

      // Check diamond containment (Manhattan / rotated square)
      const checkInDiamond = (bx, by) => {
        const dx = Math.abs(bx - cx) / hw;
        const dy = Math.abs(by - cy) / hh;
        return dx + dy <= 1 + r/Math.max(hw,hh);
      };

      if (!checkInDiamond(ball.x, ball.y)) return false;

      // Deflect based on which face of diamond was hit
      const dx = ball.x - cx, dy = ball.y - cy;
      const nx = dx / hw, ny = dy / hh;
      const len = Math.hypot(nx, ny) || 1;
      const nnx = nx/len, nny = ny/len;

      // Spin based on where on paddle and paddle velocity
      const hitFrac = clamp((ball.y - cy) / hh, -1, 1);
      const spin    = hitFrac * (paddle.vy || 0) * 0.012;
      ball.spin = clamp((ball.spin || 0) + spin, -8, 8);

      const dot = ball.vx*nnx + ball.vy*nny;
      ball.vx -= 2*dot*nnx;
      ball.vy -= 2*dot*nny;

      // Magnus effect applied per-frame in update
      ball.speed = clamp(ball.speed + 24, 0, BALL_MAX_SPEED);

      // Push out
      const overlap = r + 2;
      ball.x = cx + nnx * (Math.max(hw,hh) + overlap);
      ball.y = cy + nny * (Math.max(hw,hh) + overlap);

      sfxPaddle();

      // Smoke
      smokeRef.current.push({ x: ball.x, y: ball.y, t: 0, life: 0.4 });

      // Reset trap timer
      trapTimerRef.current[side] = 0;
      return true;
    };

    // ── Update ────────────────────────────────────────────────────────────
    const update = (time, dt) => {
      const W = getW(), H = getH();
      const phase = phaseRef.current;

      // Plank intro
      if (phase === 'intro') {
        if (!plankAnim.current.done) {
          plankAnim.current.progress = Math.min(1, plankAnim.current.progress + dt * 1.2);
        } else if (!circuitAnim.current.done) {
          circuitAnim.current.progress = Math.min(1, circuitAnim.current.progress + dt * 1.5);
        } else {
          phaseRef.current = 'waiting_serve';
          setPhase('waiting_serve');
          setIntroStep(2);
        }
        return;
      }

      if (phase === 'goal_pause') {
        // Shake
        if (shakeRef.current.active) {
          shakeRef.current.timer = Math.max(0, shakeRef.current.timer - dt);
          const intensity = 8 * (shakeRef.current.timer / 0.25);
          shakeRef.current.dx = (Math.random()-0.5)*intensity;
          shakeRef.current.dy = (Math.random()-0.5)*intensity;
          if (shakeRef.current.timer <= 0) { shakeRef.current.active = false; setShakeActive(false); }
        }
        // Smoke
        if (scoreSmoke.current.active) {
          scoreSmoke.current.timer += dt;
          if (scoreSmoke.current.timer > 0.😎 scoreSmoke.current.active = false;
        }
        return;
      }

      if (phase !== 'playing' && phase !== 'waiting_serve') return;

      const pL = paddleLRef.current, pR = paddleRRef.current;
      const bL = paddleLBounds(), bR = paddleRBounds();

      // ── Keyboard input (right paddle = human in AI mode) ──────────────
      const keys = keysRef.current;
      const spd  = 320;
      if (mode === 'ai') {
        if (keys['ArrowUp'])    { pR.vy = -spd; } else
        if (keys['ArrowDown'])  { pR.vy =  spd; } else { pR.vy *= 0.8; }
        if (keys['ArrowLeft'])  { pR.vx = -spd; } else
        if (keys['ArrowRight']) { pR.vx =  spd; } else { pR.vx *= 0.8; }
        if (keys['w']) { pL.vy = -spd; } else
        if (keys['s']) { pL.vy =  spd; } else { pL.vy *= 0.8; }
      } else {
        // 2P local key fallback
        if (keys['ArrowUp'])   pR.vy = -spd; else if (keys['ArrowDown'])  pR.vy =  spd; else pR.vy *= 0.8;
        if (keys['ArrowLeft']) pR.vx = -spd; else if (keys['ArrowRight']) pR.vx =  spd; else pR.vx *= 0.8;
        if (keys['w']) pL.vy = -spd; else if (keys['s']) pL.vy =  spd; else pL.vy *= 0.8;
        if (keys['a']) pL.vx = -spd; else if (keys['d']) pL.vx =  spd; else pL.vx *= 0.8;
      }

      // Move paddles
      pL.x = clamp(pL.x + pL.vx*dt, bL.xMin, bL.xMax);
      pL.y = clamp(pL.y + pL.vy*dt, bL.yMin, bL.yMax);
      pR.x = clamp(pR.x + pR.vx*dt, bR.xMin, bR.xMax);
      pR.y = clamp(pR.y + pR.vy*dt, bR.yMin, bR.yMax);

      // ── AI (Grey One) ─────────────────────────────────────────────────
      if (mode === 'ai') {
        const d    = DIFFICULTY[difficulty] || DIFFICULTY.adept;
        const ai   = aiRef.current;
        const ball = ballRef.current;
        ai.timer += dt;
        if (ai.timer >= d.reactionDelay) {
          ai.timer  = 0;
          ai.err    = (Math.random()-0.5) * H * d.errorMult * 0.18;
          ai.targetX = ball ? clamp(ball.x - PADDLE_W/2, bL.xMin, bL.xMax) : pL.x;
          ai.targetY = ball ? clamp(ball.y - PADDLE_H/2 + ai.err, bL.yMin, bL.yMax) : pL.y;
        }
        const maxSpd = spd * d.speed;
        const dxAI = ai.targetX - pL.x, dyAI = ai.targetY - pL.y;
        pL.vx = clamp(dxAI * 6, -maxSpd, maxSpd);
        pL.vy = clamp(dyAI * 6, -maxSpd, maxSpd);
        pL.x  = clamp(pL.x + pL.vx*dt, bL.xMin, bL.xMax);
        pL.y  = clamp(pL.y + pL.vy*dt, bL.yMin, bL.yMax);
      }

      if (phase !== 'playing') return;

      // ── Ball ──────────────────────────────────────────────────────────
      const ball = ballRef.current; if (!ball) return;
      prevBallRef.current = { x: ball.x, y: ball.y };

      // Magnus effect: spin curves trajectory
      const magnusStrength = 0.4;
      ball.vx += ball.spin * magnusStrength * dt * ball.vy;
      ball.vy -= ball.spin * magnusStrength * dt * ball.vx;
      // Normalize velocity
      const vLen = Math.hypot(ball.vx, ball.vy) || 1;
      ball.vx /= vLen; ball.vy /= vLen;

      // Spin decay
      ball.spin *= (1 - dt * 1.5);

      // Visual rotation
      ball.angle = (ball.angle || 0) + ball.spin * dt * 3;

      ball.x += ball.vx * ball.speed * dt;
      ball.y += ball.vy * ball.speed * dt;

      // Trail
      trailRef.current.push({ x: ball.x, y: ball.y });
      const maxTrail = Math.max(4, Math.floor(28 * ball.speed / BALL_MAX_SPEED));
      while (trailRef.current.length > maxTrail) trailRef.current.shift();

      // Wall bounces
      const r = ballRadiusRef.current;
      const top = BORDER + r, bot = H - BORDER - r;
      if (ball.y <= top) { ball.vy =  Math.abs(ball.vy); ball.y = top; ball.spin += 1.5; }
      if (ball.y >= bot) { ball.vy = -Math.abs(ball.vy); ball.y = bot; ball.spin -= 1.5; }
      ball.spin = clamp(ball.spin, -8, 8);

      const goalT = getGoalTop(), goalB = getGoalBot();
      const inGoal = ball.y >= goalT && ball.y <= goalB;

      // Side walls
      if (ball.x <= BORDER + r && !inGoal) { ball.vx = Math.abs(ball.vx); ball.x = BORDER+r; }
      if (ball.x >= W-BORDER-r && !inGoal) { ball.vx = -Math.abs(ball.vx); ball.x = W-BORDER-r; }

      // Goal detection
      if (ball.x < BORDER - 20 && inGoal) { handleGoal('L'); return; }
      if (ball.x > W - BORDER + 20 && inGoal) { handleGoal('R'); return; }

      // Paddle collisions
      sweepBallPaddle(pL, 'L');
      sweepBallPaddle(pR, 'R');

      // Trap detection
      const checkTrap = (paddle, side) => {
        const cx2 = paddle.x + PADDLE_W/2, cy2 = paddle.y + PADDLE_H/2;
        const d2 = dist2(ball.x, ball.y, cx2, cy2);
        const relSpeed = Math.hypot((ball.vx*ball.speed) - (paddle.vx||0), (ball.vy*ball.speed) - (paddle.vy||0));
        if (d2 < PADDLE_W * 0.9 && relSpeed < 60) {
          trapTimerRef.current[side] += dt;
          if (trapTimerRef.current[side] >= TRAP_TIMEOUT) {
            // Phase through to opponent center
            const opp = side === 'L' ? pR : pL;
            const tx  = opp.x + PADDLE_W/2, ty = opp.y + PADDLE_H/2;
            const tdx = tx - ball.x, tdy = ty - ball.y;
            const tl  = Math.hypot(tdx, tdy) || 1;
            ball.vx = tdx/tl; ball.vy = tdy/tl;
            ball.speed = BALL_MAX_SPEED * 0.85;
            ball.x = side === 'L' ? BORDER + PADDLE_W + r + 5 : W - BORDER - PADDLE_W - r - 5;
            trapTimerRef.current[side] = 0;
            sfxPhase();
          }
        } else {
          trapTimerRef.current[side] = Math.max(0, trapTimerRef.current[side] - dt*2);
        }
      };
      checkTrap(pL, 'L');
      checkTrap(pR, 'R');

      // Wisp collision
      wispsRef.current.forEach(w => {
        if (!w.alive || w.opacity < 0.95 || w.frozen) return;
        const d2 = dist2(ball.x, ball.y, w.x, w.y);
        if (d2 < r + w.r) {
          // Pop wisp
          w.alive = false;
          sfxWisp();
          smokeRef.current.push({ x: w.x, y: w.y, t: 0, life: 0.5 });
          // Respawn wisp
          const newW = makeWisp(wispIdRef.current++, W, H, ball.x, ball.y, [pL, pR]);
          newW.frozen = !ballStartedRef.current;
          setTimeout(() => {
            wispsRef.current = wispsRef.current.filter(wi => wi.alive);
            wispsRef.current.push(newW);
          }, 50);
          // Ball deflects
          const nx2 = (ball.x - w.x) / (d2 || 1), ny2 = (ball.y - w.y) / (d2 || 1);
          const dot2 = ball.vx*nx2 + ball.vy*ny2;
          ball.vx -= 2*dot2*nx2; ball.vy -= 2*dot2*ny2;
          ball.speed = clamp(ball.speed + 15, 0, BALL_MAX_SPEED);
        }
      });

      // Wisp–wisp collision & chase ball
      const aliveWisps = wispsRef.current.filter(w => w.alive && !w.frozen);
      aliveWisps.forEach(w => {
        if (!w.alive || w.frozen) return;
        // Chase ball gently
        if (ball) {
          const dxW = ball.x - w.x, dyW = ball.y - w.y;
          const dW  = Math.hypot(dxW, dyW) || 1;
          w.vx += (dxW/dW) * 18 * dt;
          w.vy += (dyW/dW) * 18 * dt;
        }
        // Cap wisp speed
        const ws = Math.hypot(w.vx, w.vy) || 1;
        const maxWS = 90;
        if (ws > maxWS) { w.vx = w.vx/ws*maxWS; w.vy = w.vy/ws*maxWS; }

        // Move
        w.x += w.vx * dt;
        w.y += w.vy * dt;

        // Bounce off walls
        const margin = BORDER + w.r;
        if (w.x < margin) { w.vx = Math.abs(w.vx); w.x = margin; }
        if (w.x > W-margin) { w.vx = -Math.abs(w.vx); w.x = W-margin; }
        if (w.y < margin) { w.vy = Math.abs(w.vy); w.y = margin; }
        if (w.y > H-margin) { w.vy = -Math.abs(w.vy); w.y = H-margin; }

        // Wisp-wisp bounce
        aliveWisps.forEach(w2 => {
          if (w2 === w) return;
          const dw2 = dist2(w.x, w.y, w2.x, w2.y);
          if (dw2 < w.r + w2.r + 2) {
            // Bounce apart
            const nx3 = (w.x-w2.x)/(dw2||1), ny3 = (w.y-w2.y)/(dw2||1);
            w.vx  =  nx3 * 120; w.vy  =  ny3 * 120;
            w2.vx = -nx3 * 120; w2.vy = -ny3 * 120;
            // Distress
            w.distressTimer  = 0.5;
            w2.distressTimer = 0.5;
            sfxWispBmp();
          }
        });

        // Phase animation
        w.phase += dt;
        w.distressTimer = Math.max(0, w.distressTimer - dt);
      });

      // Wisp fade-in
      wispsRef.current.forEach(w => {
        if (w.opacity < 1) {
          w.opacity = Math.min(1, w.opacity + dt / 2.5);
          if (w.opacity >= 1 && !w.frozen) w.phasing = false;
        }
      });

      // Wisp spawn timer
      if (wispsRef.current.filter(w=>w.alive).length < MAX_WISPS) {
        wispTimerRef.current -= dt;
        if (wispTimerRef.current <= 0) {
          wispTimerRef.current = WISP_SPAWN_INTERVAL * (0.7 + Math.random()*0.6);
          const newW = makeWisp(wispIdRef.current++, W, H, ball?.x||W/2, ball?.y||H/2, [pL, pR]);
          newW.frozen = !ballStartedRef.current;
          wispsRef.current.push(newW);
        }
      }

      // Smoke particles
      smokeRef.current = smokeRef.current.filter(s => s.t < s.life);
      smokeRef.current.forEach(s => { s.t += dt; s.y -= dt * 20; });

      // Score smoke
      if (scoreSmoke.current.active) scoreSmoke.current.timer += dt;
      if (scoreSmoke.current.timer > 0.😎 scoreSmoke.current.active = false;

      // Speed floor
      ball.speed = Math.max(ball.speed, BALL_BASE_SPEED * 0.6);
    };

    // ── Draw ─────────────────────────────────────────────────────────────
    const draw = (time) => {
      const W = getW(), H = getH();
      const shake = shakeRef.current;

      ctx.save();
      if (shake.active) ctx.translate(shake.dx, shake.dy);

      ctx.clearRect(-20, -20, W+40, H+40);

      // Intro animation
      if (phaseRef.current === 'intro') {
        if (!plankAnim.current.done) {
          drawPlankIntro(time);
        } else {
          drawBG();
          drawCircuitIntro();
        }
        ctx.restore();
        return;
      }

      drawBG();

      // Scoreboard (behind everything)
      drawScoreboard(time);

      // Smoke particles
      drawSmoke();

      // Wisps
      wispsRef.current.forEach(w => { if (w.alive) drawWisp(w, time); });

      // Paddles
      const pL = paddleLRef.current, pR = paddleRRef.current;
      const lJewel = mode === 'ai' ? '#a0a8b8' : '#4090ff';  // grey pearl for Grey One, blue for human L
      const rJewel = '#f0f0e8'; // off-white for human right
      drawDiamondPaddle(pL.x, pL.y, lJewel, time);
      drawDiamondPaddle(pR.x, pR.y, rJewel, time);

      // Ball
      drawBall(time);

      // Serve hint
      if (phaseRef.current === 'waiting_serve') {
        ctx.save();
        ctx.fillStyle = 'rgba(232,192,64,0.75)';
        ctx.font = italic 16px 'Crimson Pro', Georgia, serif;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Tap or click to serve', W/2, H * 0.18);
        ctx.restore();
      }

      ctx.restore();
    };

    // ── Loop ─────────────────────────────────────────────────────────────
    const loop = (ts) => {
      const dt = Math.min(0.033, (ts - lastTime) / 1000);
      lastTime = ts; globalT += dt;
      update(globalT, dt);
      draw(globalT);
      if (active) af = requestAnimationFrame(loop);
    };

    // ── Touch / Click ──────────────────────────────────────────────────
    const handleClick = (e) => {
      handleServe(e.clientX, e.clientY);
    };
    const handleTouch = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handleServe(t.clientX, t.clientY);

      // Touch paddle control — right half = right paddle
      Array.from(e.touches).forEach(touch => {
        const rect = canvas.getBoundingClientRect();
        const tx   = (touch.clientX - rect.left) * (getW() / rect.width);
        const ty   = (touch.clientY - rect.top)  * (getH() / rect.height);
        const pR2  = paddleRRef.current;
        const bR2  = paddleRBounds();
        if (tx > getW() / 2) {
          pR2.x = clamp(tx - PADDLE_W/2, bR2.xMin, bR2.xMax);
          pR2.y = clamp(ty - PADDLE_H/2, bR2.yMin, bR2.yMax);
        }
      });
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click',     handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove',  handleTouch, { passive: false });

    // Start wisp spawner after short delay (will be called once phase transitions out of intro)
    wispTimerRef.current = WISP_SPAWN_INTERVAL;

    af = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(af);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
    };
  }, [mode, difficulty, handleGoal, handleServe, resetBall]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div id="fubin-root" ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 9900,
      background: '#0e0a06', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fubinShake { 0%,100%{transform:none} 25%{transform:translate(-4px,-2px)} 50%{transform:translate(4px,2px)} 75%{transform:translate(-2px,4px)} }
      `}</style>

      <canvas ref={canvasRef} style={{
        width: '100%', height: '100%', display: 'block', touchAction: 'none',
        animation: shakeActive ? 'fubinShake 0.25s ease' : 'none',
      }}/>

      {/* Abandon button */}
      <button onClick={onAbandon} style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        background: 'rgba(13,8,4,0.9)', border: '1px solid rgba(184,137,42,0.25)',
        borderRadius: 4, padding: '8px 14px',
        color: 'rgba(180,160,130,0.7)', fontFamily: "'Cinzel', serif",
        fontSize: 10, letterSpacing: '0.14em', cursor: 'pointer',
        textTransform: 'uppercase',
      }}>
        ← Forfeit
      </button>

      {/* Phase / score overlay */}
      {phase === 'waiting_serve' && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(13,8,4,0.85)', border: '1px solid rgba(184,137,42,0.2)',
          borderRadius: 4, padding: '10px 20px',
          fontFamily: "'Crimson Pro', serif", fontStyle: 'italic',
          color: 'rgba(232,192,64,0.😎', fontSize: 14, whiteSpace: 'nowrap',
        }}>
          {mode === 'ai' ? 'Click or tap to serve — aim with your cursor' : 'Right player: tap to serve'}
        </div>
      )}
    </div>
  );
}