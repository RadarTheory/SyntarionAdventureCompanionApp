import { useState } from 'react';

function HeartstoneSVG({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,8 78,30 90,62 68,88 32,88 10,62 22,30" stroke="#e8c84a" strokeWidth="3" fill="none" opacity="0.9" />
      <polygon points="50,18 72,36 82,62 64,82 36,82 18,62 28,36" stroke="#e8c84a" strokeWidth="1.5" fill="rgba(232,200,74,0.07)" opacity="0.7" />
      <circle cx="50" cy="50" r="12" stroke="#e8c84a" strokeWidth="2" fill="rgba(232,200,74,0.12)" />
      <circle cx="50" cy="50" r="4" fill="#e8c84a" opacity="0.8" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 50 + Math.cos(rad) * 16;
        const y1 = 50 + Math.sin(rad) * 16;
        const x2 = 50 + Math.cos(rad) * 24;
        const y2 = 50 + Math.sin(rad) * 24;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e8c84a" strokeWidth="1.5" opacity="0.5" />;
      })}
    </svg>
  );
}

export default function PlayDriftstone({ user, onHome }) {
  const [phase, setPhase] = useState('lobby');
  const [playerSide, setPlayerSide] = useState(null);

  const exit = () => {
    setPhase('lobby');
    if (onHome) onHome();
  };

  if (phase === 'playing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', background: '#111' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', background: '#0d0d0b', borderBottom: '0.5px solid #222',
        }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 13, color: '#666' }}>
            You are{' '}
            <span style={{ color: playerSide === 1 ? '#4a9edd' : '#c0524a' }}>
              Player {playerSide} ({playerSide === 1 ? 'Blue' : 'Red'})
            </span>
          </span>
          <button
            onClick={exit}
            style={{
              background: 'transparent', border: '0.5px solid #333', borderRadius: 6,
              padding: '5px 14px', cursor: 'pointer', color: '#555', fontSize: 12,
              fontFamily: 'system-ui',
            }}
          >
            ← Exit
          </button>
        </div>
        <iframe
          src="/driftstone_1.html"
          style={{ flex: 1, width: '100%', border: 'none', background: '#111', minHeight: 'calc(100vh - 44px)' }}
          title="Driftstone"
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0b09',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        padding: '48px 32px', background: '#14110c', borderRadius: 12,
        border: '1px solid rgba(232,200,74,0.25)', maxWidth: 400, width: '90%',
      }}>
        <HeartstoneSVG size={56} />
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700,
          letterSpacing: '0.15em', color: '#e8c84a',
        }}>
          DRIFTSTONE
        </div>
        <div style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 13, color: 'rgba(232,200,74,0.5)',
        }}>
          Choose your side
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={() => { setPlayerSide(1); setPhase('playing'); }}
            style={{
              background: '#0d2a4a', border: '1.5px solid #4a9edd', borderRadius: 8,
              padding: '18px 28px', cursor: 'pointer', color: '#7fc3f5',
              fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.1em',
              textAlign: 'center', lineHeight: 1.7,
            }}
          >
            Player 1<br />
            <span style={{ fontSize: 11, opacity: 0.6 }}>Blue · Goes First</span>
          </button>
          <button
            onClick={() => { setPlayerSide(2); setPhase('playing'); }}
            style={{
              background: '#2a0d0a', border: '1.5px solid #c0524a', borderRadius: 8,
              padding: '18px 28px', cursor: 'pointer', color: '#e88880',
              fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.1em',
              textAlign: 'center', lineHeight: 1.7,
            }}
          >
            Player 2<br />
            <span style={{ fontSize: 11, opacity: 0.6 }}>Red · Goes Second</span>
          </button>
        </div>
        <button
          onClick={exit}
          style={{
            background: 'transparent', border: '0.5px solid #444', borderRadius: 6,
            padding: '8px 20px', cursor: 'pointer', color: '#666',
            fontFamily: 'system-ui', fontSize: 12, marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
