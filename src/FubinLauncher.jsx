import { useRef, useState, useCallback, useEffect } from 'react';

export default function FubinLauncher({ onClick, hasNotification = false }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, bx: 0, by: 0 });
  const moved = useRef(false);
  const longPressTimer = useRef(null);
  const [pos, setPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fubin_launcher_pos'));
      if (saved) return saved;
    } catch {}
    return { x: window.innerWidth - 100, y: window.innerHeight - 100 };
  });
  const [isDragging, setIsDragging] = useState(false);

  const savePos = useCallback((p) => {
    localStorage.setItem('fubin_launcher_pos', JSON.stringify(p));
  }, []);

  const clampPos = useCallback((x, y) => ({
    x: Math.max(0, Math.min(window.innerWidth - 72, x)),
    y: Math.max(0, Math.min(window.innerHeight - 72, y)),
  }), []);

  // ── Pointer (mouse + touch unified) ──
  const onPointerDown = useCallback((e) => {
    moved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY, bx: pos.x, by: pos.y };

    // Long press triggers drag on mobile
    longPressTimer.current = setTimeout(() => {
      dragging.current = true;
      setIsDragging(true);
    }, 300);

    // Desktop: start drag immediately on mousedown
    if (e.pointerType === 'mouse') {
      dragging.current = true;
      setIsDragging(true);
    }

    ref.current?.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
    const next = clampPos(startPos.current.bx + dx, startPos.current.by + dy);
    setPos(next);
  }, [clampPos]);

  const onPointerUp = useCallback((e) => {
    clearTimeout(longPressTimer.current);
    const wasDragging = dragging.current;
    dragging.current = false;
    setIsDragging(false);
    if (!moved.current && wasDragging === false) {
      onClick?.();
    } else if (!moved.current) {
      onClick?.();
    }
    savePos(pos);
  }, [onClick, savePos, pos]);

  // Save on window resize to keep in bounds
  useEffect(() => {
    const onResize = () => {
      setPos(p => {
        const next = clampPos(p.x, p.y);
        savePos(next);
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPos, savePos]);

  return (
    <div
      ref={ref}
      className={`fubin-launcher${isDragging ? ' dragging' : ''}${hasNotification ? ' fubin-glimmer' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="wood-base" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#8a5c2e"/>
            <stop offset="40%" stopColor="#5c3a1e"/>
            <stop offset="100%" stopColor="#2e1a0a"/>
          </radialGradient>
          <radialGradient id="wood-sheen" cx="35%" cy="28%" r="55%">
            <stop offset="0%" stopColor="rgba(255,210,140,0.18)"/>
            <stop offset="100%" stopColor="rgba(255,210,140,0)"/>
          </radialGradient>
          <filter id="wood-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d0806" floodOpacity="0.7"/>
          </filter>
          <filter id="inner-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Outer ring — dark carved edge */}
        <circle cx="36" cy="36" r="35" fill="#1e1008" filter="url(#wood-shadow)"/>

        {/* Main disc */}
        <circle cx="36" cy="36" r="33" fill="url(#wood-base)"/>

        {/* Wood grain rings */}
        <circle cx="36" cy="36" r="29" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2"/>
        <circle cx="36" cy="36" r="24" fill="none" stroke="rgba(0,0,0,0.13)" strokeWidth="0.9"/>
        <circle cx="36" cy="36" r="18" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.7"/>

        {/* Sheen highlight */}
        <circle cx="36" cy="36" r="33" fill="url(#wood-sheen)"/>

        {/* Burn mark edge ring */}
        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(20,10,4,0.6)" strokeWidth="2"/>

        {/* Carved "F" rune */}
        <text
          x="36" y="44"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontWeight="bold"
          fontSize="26"
          fill="#1a0c04"
          opacity="0.85"
          filter="url(#inner-glow)"
        >F</text>
        {/* Subtle golden highlight on rune */}
        <text
          x="35.5" y="43.5"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontWeight="bold"
          fontSize="26"
          fill="rgba(184,137,42,0.22)"
        >F</text>

        {/* Ember glow when notification */}
        {hasNotification && (
          <circle cx="56" cy="16" r="7" fill="#c4501a" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.4s" repeatCount="indefinite"/>
          </circle>
        )}
      </svg>
    </div>
  );
}
