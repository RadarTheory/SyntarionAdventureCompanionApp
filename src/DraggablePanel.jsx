import { useState, useRef, useEffect } from 'react';
import { COLORS } from './constants';

export function DraggablePanel({ defaultX, defaultY, onClose, title, width, accentColor, children, zIndex = 200000, isTop = true, onFocus }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const panelWidth = Math.min(width, Math.max(280, window.innerWidth - 24));
  const focusPanel = () => onFocus?.();
  const onMouseDown = (e) => { focusPanel(); dragging.current = true; offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.preventDefault(); };
  const onTouchStart = (e) => { focusPanel(); dragging.current = true; const t = e.touches[0]; offset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }; };
  useEffect(() => { focusPanel(); }, []);
  useEffect(() => {
    const onMove = (e) => { if (!dragging.current) return; const p = e.touches ? e.touches[0] : e; setPos({ x: Math.max(8, Math.min(window.innerWidth - panelWidth - 8, p.clientX - offset.current.x)), y: Math.max(8, Math.min(window.innerHeight - 80, p.clientY - offset.current.y)) }); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [panelWidth]);
  return (
    <div onMouseDownCapture={focusPanel} onTouchStartCapture={focusPanel} style={{ position: 'fixed', left: Math.min(pos.x, window.innerWidth - panelWidth - 8), top: pos.y, width: panelWidth, maxWidth: 'calc(100vw - 16px)', height: 'min(78vh, calc(100svh - 24px))', zIndex, display: 'flex', flexDirection: 'column', background: isTop ? '#100d0a' : 'rgba(16,13,10,0.82)', border: `1px solid ${isTop ? accentColor : 'rgba(201,185,145,0.16)'}`, borderRadius: 14, boxShadow: isTop ? '0 28px 90px rgba(0,0,0,0.78)' : '0 10px 36px rgba(0,0,0,0.42)', overflow: 'hidden', opacity: isTop ? 1 : 0.46, filter: isTop ? 'none' : 'saturate(0.72) brightness(0.72)', transform: isTop ? 'scale(1)' : 'scale(0.985)', transformOrigin: 'top left', transition: dragging.current ? 'none' : 'opacity 0.16s ease, filter 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease' }}>
      <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{ padding: '10px 14px', borderBottom: `1px solid ${isTop ? accentColor : 'rgba(201,185,145,0.14)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', background: isTop ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', flexShrink: 0, userSelect: 'none' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: isTop ? '#e8d9a7' : 'rgba(232,217,167,0.52)', letterSpacing: '0.12em' }}>? {title}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>?</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export default DraggablePanel;
