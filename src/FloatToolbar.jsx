import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS } from './constants';

const TOOLBAR_STORAGE_KEY = 'syntarion_toolbar_pos';
const DOCKED_STORAGE_KEY = 'syntarion_toolbar_docked';

function isMobileViewport() {
  return window.innerWidth <= 640;
}

function getDefaultPos(mobile) {
  if (mobile) return { x: 8, y: Math.max(8, window.innerHeight - 360) };
  return { x: 8, y: Math.floor(window.innerHeight / 2) - 120 };
}

function pointFromEvent(e) {
  return e.touches ? e.touches[0] : e;
}

export function FloatButton({ storageKey, defaultPos, children, onClick, title, hovered, onHover, badge, active = false, dimmed = false, size = 58 }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const [pos, setPos] = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos, storageKey]);

  const clamp = useCallback((x, y) => ({
    x: Math.max(8, Math.min(window.innerWidth - size - 8, x)),
    y: Math.max(8, Math.min(window.innerHeight - size - 8, y)),
  }), [size]);

  const startDrag = (e) => {
    const p = pointFromEvent(e);
    offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y };
    moved.current = false;
    setDragging(true);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = pointFromEvent(e);
      moved.current = true;
      setPos(clamp(p.clientX - offset.current.x, p.clientY - offset.current.y));
      if (e.cancelable) e.preventDefault();
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, clamp]);

  const isLit = active || hovered;

  return (
    <button
      title={title}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{
        position: 'fixed', left: pos.x, top: pos.y,
        width: size, height: size, borderRadius: 14,
        border: isLit ? '1px solid rgba(230,210,160,0.92)' : '1px solid rgba(201,185,145,0.32)',
        background: isLit ? 'rgba(22,17,12,0.96)' : 'rgba(10,8,6,0.78)',
        cursor: dragging ? 'grabbing' : 'grab', zIndex: 99998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, overflow: 'hidden',
        opacity: dimmed ? 0.42 : 1,
        transform: dimmed ? 'scale(0.82)' : isLit ? 'translateY(-2px) scale(1.04)' : 'none',
        boxShadow: isLit ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)' : '0 10px 28px rgba(0,0,0,0.55)',
        transition: dragging ? 'none' : 'opacity 0.16s ease, transform 0.16s ease, border-color 0.16s ease, background 0.16s ease',
        backdropFilter: 'blur(8px)', touchAction: 'none',
      }}
    >
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, background: COLORS.magic, color: '#120e0a', borderRadius: '50%', width: 16, height: 16, fontSize: 8, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function ToolbarButton({ children, onClick, title, badge, onDragOut, size = 56, active = false, dimmed = false }) {
  const [pressing, setPressing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const startPos = useRef(null);
  const moved = useRef(false);
  const DRAG_THRESHOLD = 12;

  const startPress = (e) => {
    const p = pointFromEvent(e);
    startPos.current = { x: p.clientX, y: p.clientY };
    moved.current = false;
    setPressing(true);
  };

  const onMove = useCallback((e) => {
    if (!pressing || !startPos.current) return;
    const p = pointFromEvent(e);
    const dx = p.clientX - startPos.current.x;
    const dy = p.clientY - startPos.current.y;
    if (!moved.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      moved.current = true;
      setPressing(false);
      onDragOut?.({ x: Math.max(8, p.clientX - size / 2), y: Math.max(8, p.clientY - size / 2) });
    }
  }, [pressing, onDragOut, size]);

  const onUp = useCallback(() => {
    setPressing(false);
    startPos.current = null;
  }, []);

  useEffect(() => {
    if (!pressing) return;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [pressing, onMove, onUp]);

  const isLit = active || hovered;

  return (
    <button
      title={title}
      onMouseDown={startPress}
      onTouchStart={startPress}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: size, height: size, borderRadius: 14,
        border: isLit ? '1px solid rgba(230,210,160,0.78)' : '1px solid rgba(201,185,145,0.25)',
        background: isLit ? 'rgba(24,18,12,0.96)' : 'rgba(14,10,7,0.7)',
        cursor: pressing ? 'grabbing' : 'grab', padding: 0, overflow: 'hidden',
        opacity: dimmed ? 0.42 : 1,
        transform: dimmed ? 'scale(0.82)' : isLit ? 'scale(1.06)' : 'none',
        boxShadow: isLit ? '0 0 18px rgba(201,185,145,0.25), 0 8px 24px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'opacity 0.15s ease, transform 0.15s ease, border-color 0.15s ease, background 0.15s ease', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', touchAction: 'none',
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, background: COLORS.magic, color: '#120e0a', borderRadius: '50%', width: 14, height: 14, fontSize: 7, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export default function FloatToolbar({ buttons, activeIds = [], storageKey = TOOLBAR_STORAGE_KEY, dockedStorageKey = DOCKED_STORAGE_KEY, defaultPos = null }) {
  const mobile = isMobileViewport();
  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const savedDocked = (() => { try { return JSON.parse(localStorage.getItem(dockedStorageKey)); } catch { return null; } })();

  const [pos, setPos] = useState(savedPos || defaultPos || getDefaultPos(mobile));
  const [dragging, setDragging] = useState(false);
  const [undocked, setUndocked] = useState(savedDocked || {});
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const activeSet = new Set(activeIds);
  const hasActive = activeIds.length > 0;
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const toolbarRef = useRef(null);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos, storageKey]);
  useEffect(() => { localStorage.setItem(dockedStorageKey, JSON.stringify(undocked)); }, [undocked, dockedStorageKey]);

  const clampToolbar = useCallback((x, y) => {
    const el = toolbarRef.current;
    const w = el?.offsetWidth || 80;
    const h = el?.offsetHeight || 200;
    return {
      x: Math.max(0, Math.min(window.innerWidth - w, x)),
      y: Math.max(0, Math.min(window.innerHeight - h, y)),
    };
  }, []);

  const startToolbarDrag = (e) => {
    const p = pointFromEvent(e);
    offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y };
    moved.current = false;
    setDragging(true);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = pointFromEvent(e);
      moved.current = true;
      setPos(clampToolbar(p.clientX - offset.current.x, p.clientY - offset.current.y));
      if (e.cancelable) e.preventDefault();
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, clampToolbar]);

  const handleUndock = (id, startPos) => setUndocked(prev => ({ ...prev, [id]: startPos }));
  const dockedButtons = buttons.filter(b => !undocked[b.id]);
  const undockedButtons = buttons.filter(b => undocked[b.id]);
  const btnSize = mobile ? 42 : 56;

  return (
    <>
      <div
        ref={toolbarRef}
        onMouseEnter={() => !mobile && setExpanded(true)}
        onMouseLeave={() => !mobile && setExpanded(false)}
        style={{
          position: 'fixed', left: pos.x, top: pos.y, zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
          padding: minimized ? '6px' : '10px 8px',
          width: minimized ? btnSize + 16 : expanded ? 220 : btnSize + 16,
          background: 'rgba(8,6,4,0.92)',
          border: '1px solid rgba(201,185,145,0.2)', borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)', touchAction: dragging ? 'none' : 'pan-y',
          transition: dragging ? 'none' : 'width 0.22s ease, padding 0.22s ease',
          userSelect: 'none', overflow: 'hidden', maxHeight: `calc(100svh - ${pos.y + 16}px)`,
          overflowY: 'auto', scrollbarWidth: 'none',
        }}
      >
        {!minimized && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
            <div
              onMouseDown={startToolbarDrag}
              onTouchStart={startToolbarDrag}
              onMouseUp={() => { if (!moved.current && Object.keys(undocked).length > 0) setUndocked({}); }}
              onTouchEnd={() => { if (!moved.current && Object.keys(undocked).length > 0) setUndocked({}); }}
              style={{ width: 28, height: 28, borderRadius: 9, background: Object.keys(undocked).length > 0 ? 'rgba(200,168,74,0.25)' : 'rgba(201,185,145,0.08)', border: `1px solid ${Object.keys(undocked).length > 0 ? 'rgba(200,168,74,0.6)' : 'rgba(201,185,145,0.18)'}`, cursor: dragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title={Object.keys(undocked).length > 0 ? 'Tap to snap tools back' : 'Drag to move'}
            >
              <svg viewBox="0 0 16 16" width={10} height={10} fill="none">
                <path d="M5 8h6M8 5v6" stroke="rgba(201,185,145,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {expanded && (
              <div onClick={() => setMinimized(true)} style={{ fontSize: 16, color: 'rgba(201,185,145,0.35)', cursor: 'pointer', lineHeight: 1, padding: '0 4px', userSelect: 'none', fontWeight: 300 }} title="Minimize">-</div>
            )}
          </div>
        )}

        {minimized && (() => {
          const first = dockedButtons[0];
          return first ? (
            <ToolbarButton title="Expand toolbar" badge={first.badge} onClick={() => setMinimized(false)} onDragOut={p => handleUndock(first.id, p)} size={btnSize} active={activeSet.has(first.id)} dimmed={hasActive && !activeSet.has(first.id)}>
              {first.children}
            </ToolbarButton>
          ) : null;
        })()}

        {!minimized && dockedButtons.map(btn => {
          const active = activeSet.has(btn.id);
          const dimmed = hasActive && !active;
          return (
            <div key={btn.id} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexShrink: 0 }} onClick={() => { if (mobile) setExpanded(e => !e); }}>
              <ToolbarButton title={btn.title} badge={btn.badge} onClick={btn.onClick} onDragOut={(startPos) => handleUndock(btn.id, startPos)} size={btnSize} active={active} dimmed={dimmed}>
                {btn.children}
              </ToolbarButton>
              {expanded && (
                <div style={{ minWidth: 0, overflow: 'hidden', opacity: dimmed ? 0.48 : 1, transform: dimmed ? 'translateX(-4px)' : 'none', transition: 'opacity 0.15s ease, transform 0.15s ease' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: active ? 'rgba(230,210,160,0.96)' : 'rgba(230,210,160,0.82)', letterSpacing: '0.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {btn.title?.split(' - ')[0]?.split(' - ')[0] || btn.id}
                  </div>
                  {btn.description && (
                    <div style={{ fontSize: 8, color: 'rgba(201,185,145,0.45)', fontFamily: 'Georgia, serif', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {btn.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {undockedButtons.map(btn => {
        const active = activeSet.has(btn.id);
        const dimmed = hasActive && !active;
        return (
          <FloatButton key={btn.id} storageKey={`syntarion_floatbtn_${btn.id}`} defaultPos={undocked[btn.id]} title={`${btn.title} (drag to move)`} badge={btn.badge} onClick={btn.onClick} hovered={hoveredBtn === btn.id} onHover={h => setHoveredBtn(h ? btn.id : null)} active={active} dimmed={dimmed} size={mobile ? 48 : 58}>
            {btn.children}
          </FloatButton>
        );
      })}
    </>
  );
}