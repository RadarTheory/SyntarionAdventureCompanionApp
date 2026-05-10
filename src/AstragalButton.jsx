import { useState } from 'react';
import Astragal from './Astragal';

function AstragalButton({
  character,
  onResult,
  darkMode = true,
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Astragal"
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          width: 82,
          height: 82,
          borderRadius: '50%',
          border: hovered
            ? '1px solid rgba(230,210,160,0.92)'
            : '1px solid rgba(201,185,145,0.45)',
          background: darkMode
            ? hovered
              ? 'rgba(18,14,10,0.96)'
              : 'rgba(10,8,6,0.82)'
            : hovered
              ? 'rgba(255,255,255,0.96)'
              : 'rgba(248,246,242,0.88)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'hidden',
          transform: hovered
            ? 'translateY(-2px) scale(1.04)'
            : 'translateY(0px) scale(1)',
          boxShadow: hovered
            ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)'
            : '0 10px 28px rgba(0,0,0,0.55)',
          transition: 'all 0.18s ease',
          backdropFilter: 'blur(8px)',
        }}
      >
        <img
          src="/AstragalButton.png"
          alt="Astragal"
          style={{
            width: '72%',
            height: '72%',
            objectFit: 'contain',
            display: 'block',
            filter: hovered
              ? 'brightness(1.18) drop-shadow(0 0 10px rgba(201,185,145,0.45))'
              : 'brightness(1)',
            transition: 'all 0.18s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 118,
            left: 24,
            width: 380,
            zIndex: 10000,
            animation: 'astragalFade 0.18s ease',
          }}
        >
          <Astragal
            character={character}
            actionName="Astragal"
            statKey="will"
            notation="1d20"
            onResult={onResult}
          />

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '10px 12px',
              background: darkMode
                ? 'rgba(10,8,6,0.92)'
                : 'rgba(255,255,255,0.94)',
              color: '#c9b991',
              border: '1px solid rgba(201,185,145,0.35)',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: 9,
              transition: 'all 0.18s ease',
            }}
          >
            Close Astragal
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes astragalFade {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0px);
            }
          }
        `}
      </style>
    </>
  );
}
export default AstragalButton;