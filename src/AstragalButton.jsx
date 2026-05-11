import { useState, useEffect, useRef } from 'react';
import Astragal from './Astragal';

function AstragalButton({ character, onResult, darkMode = true }) {
  const savedPos = (() => {
    try {
      return JSON.parse(localStorage.getItem('astragalButtonPos'));
    } catch {
      return null;
    }
  })();

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState(savedPos || { x: 24, y: window.innerHeight - 106 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => {
    localStorage.setItem('astragalButtonPos', JSON.stringify(pos));
  }, [pos]);

  const clamp = (x, y) => ({
    x: Math.max(8, Math.min(window.innerWidth - 90, x)),
    y: Math.max(8, Math.min(window.innerHeight - 90, y)),
  });

  const startDrag = (e) => {
    const point = e.touches ? e.touches[0] : e;
    dragOffset.current = {
      x: point.clientX - pos.x,
      y: point.clientY - pos.y,
    };
    moved.current = false;
    setDragging(true);
  };

  const onMove = (e) => {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    const next = clamp(
      point.clientX - dragOffset.current.x,
      point.clientY - dragOffset.current.y
    );
    moved.current = true;
    setPos(next);
  };

  const stopDrag = () => setDragging(false);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging]);

  return (
    <>
      <button
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onClick={() => {
          if (!moved.current) setOpen(true);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Astragal"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
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
          cursor: dragging ? 'grabbing' : 'grab',
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
          transition: dragging ? 'none' : 'all 0.18s ease',
          backdropFilter: 'blur(8px)',
          touchAction: 'none',
        }}
      >
        <img
          src="/AstragalButton.png"
          alt="Astragal"
          draggable={false}
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
            left: Math.min(pos.x, window.innerWidth - 400),
            top: Math.max(8, pos.y - 420),
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
              background: darkMode ? 'rgba(10,8,6,0.92)' : 'rgba(255,255,255,0.94)',
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

      <style>{`
        @keyframes astragalFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </>
  );
}

export default AstragalButton;