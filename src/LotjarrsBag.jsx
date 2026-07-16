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
];

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
        background: active ? 'rgba(200,168,74,0.075)' : 'rgba(240,238,235,0.026)',
        border: `1px solid ${active ? 'rgba(232,200,116,0.58)' : 'rgba(200,168,74,0.2)'}`,
        borderRadius: 14,
        padding: '32px 28px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: 220,
        transition: 'all 0.18s ease',
        transform: active ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: active
          ? '0 12px 40px rgba(200,168,74,0.14), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{
        width: 92,
        height: 92,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: active
          ? 'radial-gradient(circle, rgba(232,200,116,0.16) 0%, rgba(200,168,74,0.08) 42%, rgba(8,6,4,0) 72%)'
          : 'radial-gradient(circle, rgba(200,168,74,0.055) 0%, rgba(8,6,4,0) 70%)',
        boxShadow: active
          ? '0 0 22px rgba(232,200,116,0.2), inset 0 0 16px rgba(232,200,116,0.08)'
          : 'inset 0 0 14px rgba(232,200,116,0.035)',
        transition: 'background 0.18s ease, box-shadow 0.18s ease',
      }}>
        <img
          src={active ? game.icon : game.dimIcon}
          alt={game.name}
          draggable={false}
          style={{
            width: 82,
            height: 82,
            objectFit: 'contain',
            transform: 'scale(' + (game.iconScale || 1) + ')' ,
            filter: active
              ? 'drop-shadow(0 0 10px rgba(232,200,116,0.34)) saturate(1.08)'
              : 'brightness(0.84) contrast(1.04) saturate(0.82)',
            mixBlendMode: 'screen',
            opacity: active ? 1 : 0.84,
            transition: 'opacity 0.18s ease, filter 0.18s ease, transform 0.18s ease',
          }}
        />
      </div>
      <div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 14,
          fontWeight: 700,
          color: active ? '#e8c84a' : '#c8b89a',
          letterSpacing: '0.12em',
          marginBottom: 6,
          transition: 'color 0.18s ease',
        }}>
          {game.name}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 10,
          fontStyle: 'italic',
          color: active ? 'rgba(200,168,74,0.65)' : 'rgba(240,238,235,0.35)',
          lineHeight: 1.5,
          transition: 'color 0.18s ease',
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
          background: 'rgba(10,8,6,0.82)',
          border: '1px solid rgba(232,200,116,0.35)',
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          color: '#c8b89a',
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          zIndex: 100,
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
