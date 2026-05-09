import { useState } from 'react';
import Astragal from './Astragal';

export default function AstragalButton({
  character,
  onResult,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Astragal"
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '1px solid rgba(201,185,145,0.45)',
          background: 'rgba(10,8,6,0.88)',
          padding: 8,
          cursor: 'pointer',
          zIndex: 250,
          boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
        }}
      >
        <img
          src="/astragal-button.png"
          alt="Astragal"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 110,
            left: 24,
            width: 360,
            zIndex: 300,
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
              marginTop: 8,
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(10,8,6,0.9)',
              color: '#c9b991',
              border: '1px solid rgba(201,185,145,0.35)',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: 9,
            }}
          >
            Close Astragal
          </button>
        </div>
      )}
    </>
  );
}