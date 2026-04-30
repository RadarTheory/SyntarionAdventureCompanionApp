import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// ─── SVG ICON ─────────────────────────────────────────────────────────────────
function HeartstoneSVG({ size = 64, glow = false, color = '#e8c84a' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: glow
          ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color}88)`
          : 'none',
        transition: 'filter 0.4s ease',
      }}
    >
      <polygon
        points="50,8 78,30 90,62 68,88 32,88 10,62 22,30"
        stroke={glow ? color : '#e8c84a'}
        strokeWidth="3"
        fill="none"
        opacity="0.9"
      />
      <polygon
        points="50,18 72,36 82,62 64,82 36,82 18,62 28,36"
        stroke={glow ? color : '#e8c84a'}
        strokeWidth="1.5"
        fill={glow ? `${color}18` : 'rgba(232,200,74,0.07)'}
        opacity="0.7"
      />
      <circle
        cx="50" cy="50" r="12"
        stroke={glow ? color : '#e8c84a'}
        strokeWidth="2"
        fill={glow ? `${color}22` : 'rgba(232,200,74,0.12)'}
      />
      <circle cx="50" cy="50" r="4" fill={glow ? color : '#e8c84a'} opacity="0.8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 50 + Math.cos(rad) * 16;
        const y1 = 50 + Math.sin(rad) * 16;
        const x2 = 50 + Math.cos(rad) * 24;
        const y2 = 50 + Math.sin(rad) * 24;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={glow ? color : '#e8c84a'} strokeWidth="1.5" opacity="0.5" />
        );
      })}
    </svg>
  );
}

// ─── PLAYER SLOT ──────────────────────────────────────────────────────────────
function PlayerSlot({ sideNum, presence, isMySide, disabled, onClaim, onReady, onUnready }) {
  const isBlue     = sideNum === 1;
  const accentColor = isBlue ? '#4a9edd' : '#c0524a';
  const bgColor     = isBlue ? '#0d2a4a' : '#2a0d0a';
  const textColor   = isBlue ? '#7fc3f5' : '#e88880';
  const glowColor   = '#79f5a7';

  const occupied = !!presence;
  const ready    = presence?.ready ?? false;
  const name     = presence?.name  ?? null;

  return (
    <div
      style={{
        background:   occupied ? bgColor : 'rgba(255,255,255,0.03)',
        border:       `1.5px solid ${occupied ? accentColor : 'rgba(240,238,235,0.12)'}`,
        borderRadius: 10,
        padding:      '22px 26px',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:          12,
        minWidth:     165,
        cursor:       !occupied && !disabled ? 'pointer' : 'default',
        transition:   'all 0.2s',
        position:     'relative',
        boxShadow:    ready
          ? `0 0 0 2px ${glowColor}, 0 0 22px ${glowColor}44`
          : occupied ? `0 0 0 1px ${accentColor}44` : 'none',
      }}
      onClick={!occupied && !disabled ? onClaim : undefined}
    >
      {/* Ready dot */}
      {ready && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: glowColor, boxShadow: `0 0 8px ${glowColor}`,
        }} />
      )}

      {/* Character icon with optional green glow */}
      <HeartstoneSVG
        size={52}
        glow={ready}
        color={ready ? glowColor : accentColor}
      />

      {/* Side label */}
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: occupied ? textColor : 'rgba(240,238,235,0.28)',
      }}>
        Player {sideNum}
      </div>

      {/* Blue/Red descriptor */}
      <div style={{
        fontSize: 11, fontFamily: 'Georgia, serif', fontStyle: 'italic',
        color: occupied ? `${textColor}99` : 'rgba(240,238,235,0.15)',
        letterSpacing: '0.05em',
      }}>
        {isBlue ? 'Blue · Goes First' : 'Red · Goes Second'}
      </div>

      {/* Player name / join hint */}
      <div style={{
        fontSize: 12, minHeight: 18, fontWeight: occupied ? 600 : 400,
        color: occupied ? textColor : 'rgba(240,238,235,0.2)',
        fontFamily: 'system-ui',
      }}>
        {occupied ? (name || 'Player') : 'Click to join'}
      </div>

      {/* Ready button — only shown to the player who owns this slot */}
      {isMySide && occupied && (
        <button
          onClick={(e) => { e.stopPropagation(); ready ? onUnready() : onReady(); }}
          style={{
            marginTop: 4, padding: '7px 20px', borderRadius: 6,
            border:  `1px solid ${ready ? glowColor : accentColor}`,
            background: ready ? `${glowColor}18` : `${accentColor}22`,
            color:   ready ? glowColor : textColor,
            fontFamily: "'Cinzel', serif", fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {ready ? '✓ Ready' : '◎ Ready Up'}
        </button>
      )}

      {/* Status label for the other player's slot */}
      {!isMySide && occupied && (
        <div style={{
          fontSize: 10, fontFamily: "'Cinzel', serif",
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: ready ? glowColor : 'rgba(240,238,235,0.25)',
        }}>
          {ready ? 'Ready ✓' : 'Waiting…'}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PlayDriftstone({ user, onHome }) {
  const [phase,     setPhase]     = useState('lobby');    // 'lobby' | 'playing'
  const [slots,     setSlots]     = useState({ 1: null, 2: null });
  const [mySide,    setMySide]    = useState(null);       // 1 | 2 | null
  const [countdown, setCountdown] = useState(null);       // 3 → 0

  const channelRef   = useRef(null);
  const countdownRef = useRef(null);
  const launchedRef  = useRef(false);

  const myId   = user?.id ?? null;
  const myName =
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'Player';

  // ── Presence channel ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'lobby') return;

    const channel = supabase.channel('driftstone-lobby', {
      config: { presence: { key: myId ?? 'anon' } },
    });
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const next  = { 1: null, 2: null };

      Object.values(state).forEach((entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.side === 1 || entry.side === 2) {
          next[entry.side] = {
            userId: entry.userId,
            name:   entry.name,
            ready:  !!entry.ready,
          };
        }
      });

      setSlots(next);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Register without claiming a side yet
        await channel.track({ userId: myId, name: myName, side: null, ready: false });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [phase, myId]);

  // ── Countdown trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    const bothReady = slots[1]?.ready && slots[2]?.ready;

    if (bothReady && countdown === null && !launchedRef.current) {
      setCountdown(3);
    }
    if (!bothReady && countdown !== null) {
      clearTimeout(countdownRef.current);
      setCountdown(null);
    }
  }, [slots]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (!launchedRef.current) {
        launchedRef.current = true;
        setPhase('playing');
      }
      return;
    }
    countdownRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const claimSide = async (side) => {
    if (slots[side] && slots[side].userId !== myId) return;
    setMySide(side);
    await channelRef.current?.track({ userId: myId, name: myName, side, ready: false });
  };

  const setReady = async (val) => {
    if (!mySide) return;
    await channelRef.current?.track({ userId: myId, name: myName, side: mySide, ready: val });
  };

  const exit = () => {
    clearTimeout(countdownRef.current);
    launchedRef.current = false;
    setPhase('lobby');
    setMySide(null);
    setCountdown(null);
    if (onHome) onHome();
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const slot1IsMe = slots[1]?.userId === myId;
  const slot2IsMe = slots[2]?.userId === myId;

  let statusText = '';
  const statusGreen = countdown !== null;

  if (countdown !== null) {
    statusText = `Starting in ${countdown}…`;
  } else if (!slots[1] && !slots[2]) {
    statusText = 'Waiting for players…';
  } else if (slots[1] && !slots[2]) {
    statusText = 'Waiting for Player 2…';
  } else if (!slots[1] && slots[2]) {
    statusText = 'Waiting for Player 1…';
  } else if (slots[1]?.ready && !slots[2]?.ready) {
    statusText = 'Player 1 ready — waiting for Player 2';
  } else if (!slots[1]?.ready && slots[2]?.ready) {
    statusText = 'Player 2 ready — waiting for Player 1';
  } else {
    statusText = 'Both joined — ready up to begin!';
  }

  // ── Playing ───────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', background: '#111' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', background: '#0d0d0b', borderBottom: '0.5px solid #222', flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 13, color: '#555' }}>
            You are{' '}
            <span style={{ color: mySide === 1 ? '#4a9edd' : '#c0524a', fontWeight: 600 }}>
              {myName} — Player {mySide} ({mySide === 1 ? 'Blue · Goes First' : 'Red · Goes Second'})
            </span>
          </span>
          <button onClick={exit} style={{
            background: 'transparent', border: '0.5px solid #333', borderRadius: 6,
            padding: '5px 14px', cursor: 'pointer', color: '#555', fontSize: 12, fontFamily: 'system-ui',
          }}>
            ← Exit
          </button>
        </div>

        {/* Game iframe — ?mode=pvp bypasses the in-game menu */}
        <iframe
          src={`/driftstone_1.html?mode=pvp${mySide ? `&side=${mySide}` : ''}`}
          style={{ flex: 1, width: '100%', border: 'none', background: '#111', minHeight: 'calc(100vh - 44px)' }}
          title="Driftstone PVP"
        />
      </div>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0b09',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');*{box-sizing:border-box;}`}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        padding: '44px 40px', background: '#14110c', borderRadius: 14,
        border: '1px solid rgba(232,200,74,0.18)', maxWidth: 540, width: '100%',
      }}>
        <HeartstoneSVG size={52} />

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700,
          letterSpacing: '0.16em', color: '#e8c84a',
        }}>
          DRIFTSTONE
        </div>

        <div style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 13, color: 'rgba(232,200,74,0.45)', marginTop: -8,
        }}>
          Set the pattern. Turn the current.
        </div>

        {/* Slots */}
        <div style={{
          display: 'flex', gap: 20, alignItems: 'stretch',
          marginTop: 4, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <PlayerSlot
            sideNum={1}
            presence={slots[1]}
            isMySide={slot1IsMe}
            disabled={!!slots[1] && !slot1IsMe}
            onClaim={() => claimSide(1)}
            onReady={() => setReady(true)}
            onUnready={() => setReady(false)}
          />

          <div style={{
            display: 'flex', alignItems: 'center',
            color: 'rgba(240,238,235,0.14)',
            fontFamily: "'Cinzel', serif", fontSize: 18, padding: '0 4px',
          }}>
            vs
          </div>

          <PlayerSlot
            sideNum={2}
            presence={slots[2]}
            isMySide={slot2IsMe}
            disabled={!!slots[2] && !slot2IsMe}
            onClaim={() => claimSide(2)}
            onReady={() => setReady(true)}
            onUnready={() => setReady(false)}
          />
        </div>

        {/* Status */}
        <div style={{
          fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: "'Cinzel', serif", minHeight: 22, textAlign: 'center',
          color: statusGreen ? '#79f5a7' : 'rgba(240,238,235,0.28)',
          transition: 'color 0.3s',
        }}>
          {statusText}
        </div>

        {/* Hint for un-claimed users */}
        {!mySide && (
          <div style={{
            fontSize: 11, color: 'rgba(240,238,235,0.18)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            textAlign: 'center', maxWidth: 300, lineHeight: 1.7,
          }}>
            Both players must be signed in, claim a side, and press Ready Up. The game launches automatically.
          </div>
        )}

        {/* Cancel */}
        <button onClick={exit} style={{
          background: 'transparent', border: '0.5px solid #333', borderRadius: 6,
          padding: '8px 22px', cursor: 'pointer', color: '#555',
          fontFamily: 'system-ui', fontSize: 12, marginTop: -4,
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
