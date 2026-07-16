import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

const GAMES = [
  {
    id: 'driftstone',
    name: 'Driftstone',
    subtitle: 'A two-player strategy of stone and tide',
    icon: '/Driftstoneicon.png',
    dimIcon: '/Driftstoneicondim.png',
    iconScale: 1.18,
  },
  {
    id: 'fubin',
    name: 'Fubin',
    subtitle: 'A game of cunning and fate',
    icon: '/FubinIcon.png',
    dimIcon: '/Fubinicondim.png',
    iconScale: 1.95,
  },
 {
    id: 'elddimgates',
    name: 'Elddimgates',
    subtitle: 'A game of passage and authority',
    icon: '/elddimgates-logo-lit.png',
    dimIcon: '/elddimgates-logo.png',
    iconScale: 0.98,
  },
  {
    id: 'undercrypts',
    name: 'Undercrypts',
    subtitle: 'Descend, survive, return changed',
    icon: null,
    dimIcon: null,
    iconScale: 1,
  },
];

function UndercryptsGlyph({ active }) {
  return (
    <div style={{
      width: 54, height: 54, borderRadius: 14, display: 'grid', placeItems: 'center',
      border: active ? '1px solid rgba(239,211,122,0.72)' : '1px solid rgba(200,168,74,0.28)',
      background: active ? 'radial-gradient(circle, rgba(239,211,122,0.24), rgba(10,8,6,0.98) 68%)' : 'radial-gradient(circle, rgba(200,168,74,0.08), rgba(7,6,5,0.98) 70%)',
      boxShadow: active ? '0 0 22px rgba(239,211,122,0.28), inset 0 0 18px rgba(0,0,0,0.6)' : 'inset 0 0 18px rgba(0,0,0,0.6)',
      color: active ? '#f2d96f' : 'rgba(212,197,164,0.62)',
      fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, letterSpacing: '0.03em',
    }}>U</div>
  );
}

function BagIcon({ size = 48 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div style={{ width: size, height: size }} />;
  return (
    <img
      src="/Lotjarrsbagofgames.png"
      alt="Lótjarr's Bag"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

function GameTile({ game, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = hovered || pressed;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => { setHovered(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        '--tile-gold': active ? 'rgba(239,211,122,0.86)' : 'rgba(200,168,74,0.32)',
        appearance: 'none',
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        width: 226,
        minHeight: 232,
        padding: '30px 28px 28px',
        border: '1px solid var(--tile-gold)',
        borderRadius: 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 17,
        color: '#d7c8a8',
        background: active
          ? 'linear-gradient(155deg, rgba(239,211,122,0.12) 0%, rgba(38,31,16,0.68) 42%, rgba(8,6,4,0.95) 100%)'
          : 'linear-gradient(155deg, rgba(240,238,235,0.045) 0%, rgba(16,13,9,0.82) 48%, rgba(6,5,3,0.96) 100%)',
        boxShadow: active
          ? '0 26px 70px rgba(0,0,0,0.62), 0 0 42px rgba(200,168,74,0.16), inset 0 1px 0 rgba(255,244,204,0.2), inset 0 0 42px rgba(232,200,116,0.055)'
          : '0 18px 42px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,244,204,0.065), inset 0 0 30px rgba(232,200,116,0.018)',
        transform: active ? 'translateY(-5px) scale(1.012)' : 'translateY(0) scale(1)',
        transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 1,
        borderRadius: 9,
        border: active ? '1px solid rgba(255,236,176,0.16)' : '1px solid rgba(255,236,176,0.045)',
        pointerEvents: 'none',
        zIndex: -1,
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 22,
        right: 22,
        height: 1,
        background: active
          ? 'linear-gradient(90deg, transparent, rgba(255,235,172,0.62), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255,235,172,0.14), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 98,
        height: 98,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: active ? '1px solid rgba(239,211,122,0.13)' : '1px solid rgba(200,168,74,0.045)',
        background: active
          ? 'radial-gradient(circle, rgba(12,10,7,0.99) 0%, rgba(12,10,7,0.99) 42%, rgba(30,25,15,0.96) 55%, rgba(196,154,48,0.16) 66%, transparent 78%)'
          : 'radial-gradient(circle, rgba(10,8,6,0.99) 0%, rgba(10,8,6,0.99) 45%, rgba(18,15,10,0.92) 59%, rgba(200,168,74,0.055) 70%, transparent 80%)',
        boxShadow: active
          ? '0 0 34px rgba(232,200,116,0.19), inset 0 0 0 1px rgba(255,236,176,0.035), inset 0 0 28px rgba(0,0,0,0.48)'
          : 'inset 0 0 0 1px rgba(255,236,176,0.018), inset 0 0 24px rgba(0,0,0,0.62)',
        transition: 'background 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}>
        <div style={{
          position: 'absolute',
          width: 74,
          height: 74,
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle, rgba(18,15,10,0.98) 0%, rgba(8,7,5,0.98) 74%, rgba(0,0,0,0.82) 100%)'
            : 'radial-gradient(circle, rgba(14,12,9,0.98) 0%, rgba(7,6,5,0.98) 78%, rgba(0,0,0,0.82) 100%)',
          boxShadow: active ? '0 0 18px rgba(0,0,0,0.55)' : '0 0 14px rgba(0,0,0,0.48)',
          pointerEvents: 'none',
        }} />
        {game.id === 'undercrypts' ? <UndercryptsGlyph active={active} /> : (
          <img
            src={active ? game.icon : game.dimIcon}
            alt={game.name}
            draggable={false}
            style={{
              width: 84,
              height: 84,
              objectFit: 'contain',
              transform: 'scale(' + (game.iconScale || 1) + ')',
              filter: active
                ? 'drop-shadow(0 0 12px rgba(255,205,76,0.46)) saturate(1.16) contrast(1.05)'
                : 'brightness(0.76) contrast(1.06) saturate(0.78)',
              mixBlendMode: 'screen',
              position: 'relative',
              zIndex: 1,
              opacity: active ? 1 : 0.78,
              transition: 'opacity 180ms ease, filter 180ms ease, transform 180ms ease',
            }}
          />
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 14,
          fontWeight: 700,
          color: active ? '#f2d96f' : '#d4c5a4',
          letterSpacing: '0.13em',
          marginBottom: 8,
          textShadow: active ? '0 0 18px rgba(232,200,116,0.28)' : 'none',
          transition: 'color 180ms ease, text-shadow 180ms ease',
        }}>
          {game.name}
        </div>
        <div style={{
          width: 42,
          height: 1,
          margin: '0 auto 9px',
          background: active ? 'rgba(232,200,116,0.48)' : 'rgba(200,168,74,0.18)',
          transition: 'background 180ms ease',
        }} />
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 10,
          fontStyle: 'italic',
          color: active ? 'rgba(232,210,142,0.72)' : 'rgba(240,238,235,0.42)',
          lineHeight: 1.5,
          transition: 'color 180ms ease',
        }}>
          {game.subtitle}
        </div>
      </div>
    </button>
  );
}

// Loading stinger — shows briefly then calls onDone
function Stinger({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return <LoadingScreen />;
}

export default function LotjarrsBag({ onHome, onLaunchGame }) {
  const [stinger, setStinger] = useState(false);
  const [pendingGame, setPendingGame] = useState(null);

  const handleSelectGame = (gameId) => {
    setPendingGame(gameId);
    setStinger(true);
  };

  const handleStingerDone = () => {
    setStinger(false);
    onLaunchGame?.(pendingGame);
  };

  if (stinger) {
    return <Stinger onDone={handleStingerDone} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080604',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        position: 'relative',
        padding: '40px 24px',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>

      {/* Back button */}
      <button
        type="button"
        onClick={onHome}
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          background: 'linear-gradient(180deg, rgba(26,20,10,0.92), rgba(8,6,4,0.88))',
          border: '1px solid rgba(232,200,116,0.44)',
          borderRadius: 7,
          padding: '10px 17px',
          cursor: 'pointer',
          color: '#d8c797',
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          zIndex: 100,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,176,0.12)',
        }}
      >← Back</button>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 56 }}>
        <BagIcon size={72} />
        <div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#e8d9a7',
            letterSpacing: '0.18em',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            LÓTJARR'S BAG OF GAMES
          </div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            fontStyle: 'italic',
            color: 'rgba(200,168,74,0.45)',
            textAlign: 'center',
            letterSpacing: '0.06em',
          }}>
            Choose your game, traveller
          </div>
        </div>
      </div>

      {/* Game tiles */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {GAMES.map(game => (
          <GameTile
            key={game.id}
            game={game}
            onClick={() => handleSelectGame(game.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        fontFamily: "'Cinzel', serif",
        fontSize: 7,
        letterSpacing: '0.16em',
        color: 'rgba(200,168,74,0.2)',
        textTransform: 'uppercase',
      }}>
        Syntarion · Games of Soteria
      </div>
    </div>
  );
}
