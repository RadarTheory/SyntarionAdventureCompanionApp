import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

const GAMES = [
  {
    id: 'driftstone',
    name: 'Driftstone',
    subtitle: 'A two-player strategy of stone and tide',
    icon: '/Driftstoneicon.png',
    dimIcon: '/Driftstoneicondim.png',
  },
  {
    id: 'fubin',
    name: 'Fubin',
    subtitle: 'A game of cunning and fate',
    icon: '/FubinIcon.png',
    dimIcon: '/Fubinicondim.png',
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

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(200,168,74,0.08)' : 'rgba(240,238,235,0.03)',
        border: `1px solid ${hovered ? 'rgba(200,168,74,0.55)' : 'rgba(200,168,74,0.18)'}`,
        borderRadius: 14,
        padding: '32px 28px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: 220,
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 40px rgba(200,168,74,0.15), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      <img
        src={hovered ? game.icon : game.dimIcon}
        alt={game.name}
        draggable={false}
        style={{
          width: 80,
          height: 80,
          objectFit: 'contain',
          transition: 'opacity 0.18s ease',
        }}
      />
      <div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 14,
          fontWeight: 700,
          color: hovered ? '#e8c84a' : '#c8b89a',
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
          color: hovered ? 'rgba(200,168,74,0.65)' : 'rgba(240,238,235,0.35)',
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
      >
        ← Back
      </button>

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
