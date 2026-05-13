import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS } from './constants';

// ─── FLOAT TOOLBAR ────────────────────────────────────────────────────────────
// Collapsible toolbar that snaps to left edge (desktop) or bottom edge (mobile).
// Each button inside can be dragged OUT of the toolbar to float freely.
// Dragged-out buttons can be dragged back to the toolbar to re-dock.

const TOOLBAR_STORAGE_KEY = 'syntarion_toolbar_pos';
const DOCKED_STORAGE_KEY  = 'syntarion_toolbar_docked';

function isMobileViewport() {
  return window.innerWidth <= 640;
}

function getDefaultPos(mobile) {
  if (mobile) return { x: 0, y: window.innerHeight - 80 };      // bottom edge
  return { x: 0, y: Math.floor(window.innerHeight / 2) - 120 }; // left edge center
}

// ─── Individual floating button (undocked from toolbar) ──────────────────────
export function FloatButton({ storageKey, defaultPos, children, onClick, title, hovered, onHover, badge }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const [pos, setPos]       = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset  = useRef({ x: 0, y: 0 });
  const moved   = useRef(false);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos, storageKey]);

  const clamp = (x, y) => ({
    x: Math.max(8, Math.min(window.innerWidth  - 80, x)),
    y: Math.max(8, Math.min(window.innerHeight - 80, y)),
  });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      moved.current = true;
      setPos(clamp(p.clientX - offset.current.x, p.clientY - offset.current.y));
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
  }, [dragging]);

  return (
    <button
      title={title}
      onMouseDown={e => { offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; moved.current = false; setDragging(true); }}
      onTouchStart={e => { const p = e.touches[0]; offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y }; moved.current = false; setDragging(true); }}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{
        position: 'fixed', left: pos.x, top: pos.y,
        width: 64, height: 64, borderRadius: '50%',
        border: hovered ? '1px solid rgba(230,210,160,0.92)' : '1px solid rgba(201,185,145,0.45)',
        background: hovered ? 'rgba(18,14,10,0.96)' : 'rgba(10,8,6,0.82)',
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 99998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, overflow: 'visible',
        transform: hovered ? 'translateY(-2px) scale(1.05)' : 'none',
        boxShadow: hovered ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)' : '0 10px 28px rgba(0,0,0,0.55)',
        transition: dragging ? 'none' : 'all 0.18s ease',
        backdropFilter: 'blur(8px)',
        touchAction: 'none',
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          background: COLORS.magic, color: '#120e0a',
          borderRadius: '50%', width: 16, height: 16,
          fontSize: 8, fontFamily: 'monospace', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          pointerEvents: 'none',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── Toolbar button (docked inside toolbar) ───────────────────────────────────
function ToolbarButton({ children, onClick, title, badge, onDragOut }) {
  const [pressing, setPressing] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const startPos = useRef(null);
  const moved    = useRef(false);
  const DRAG_THRESHOLD = 12;

  const onMouseDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setPressing(true);
  };

  const onMouseMove = useCallback((e) => {
    if (!pressing || !startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (!moved.current && Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) {
      moved.current = true;
      setPressing(false);
      onDragOut?.({ x: e.clientX - 32, y: e.clientY - 32 });
    }
  }, [pressing, onDragOut]);

  const onMouseUp = useCallback(() => {
    if (!moved.current) { /* click handled by onClick */ }
    setPressing(false);
    startPos.current = null;
  }, []);

  useEffect(() => {
    if (pressing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [pressing, onMouseMove, onMouseUp]);

  return (
    <button
      title={title}
      onMouseDown={onMouseDown}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      style={{
        position: 'relative',
        width: 56, height: 56, borderRadius: '50%',
        border: hovered ? '1px solid rgba(230,210,160,0.7)' : '1px solid rgba(201,185,145,0.25)',
        background: hovered ? 'rgba(24,18,12,0.95)' : 'rgba(14,10,7,0.7)',
        cursor: 'grab', padding: 0, overflow: 'hidden',
        transform: hovered ? 'scale(1.06)' : 'none',
        boxShadow: hovered ? '0 0 18px rgba(201,185,145,0.25), 0 8px 24px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          background: COLORS.magic, color: '#120e0a',
          borderRadius: '50%', width: 14, height: 14,
          fontSize: 7, fontFamily: 'monospace', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          pointerEvents: 'none',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── MAIN TOOLBAR ─────────────────────────────────────────────────────────────
export default function FloatToolbar({ buttons }) {
  // buttons: [{ id, title, children, onClick, badge, storageKey }]
  const mobile  = isMobileViewport();
  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(TOOLBAR_STORAGE_KEY)); } catch { return null; } })();
  const savedDocked = (() => { try { return JSON.parse(localStorage.getItem(DOCKED_STORAGE_KEY)); } catch { return null; } })();

  const [pos, setPos]         = useState(savedPos || getDefaultPos(mobile));
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [undocked, setUndocked]   = useState(savedDocked || {}); // { id: { x, y } }
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const offset  = useRef({ x: 0, y: 0 });
  const moved   = useRef(false);
  const toolbarRef = useRef(null);

  useEffect(() => { localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(pos)); }, [pos]);
  useEffect(() => { localStorage.setItem(DOCKED_STORAGE_KEY, JSON.stringify(undocked)); }, [undocked]);

  const clampToolbar = (x, y) => {
    const el = toolbarRef.current;
    const w = el?.offsetWidth  || 80;
    const h = el?.offsetHeight || 200;
    return {
      x: Math.max(0, Math.min(window.innerWidth  - w, x)),
      y: Math.max(0, Math.min(window.innerHeight - h, y)),
    };
  };

  // Toolbar drag
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      moved.current = true;
      setPos(clampToolbar(p.clientX - offset.current.x, p.clientY - offset.current.y));
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
  }, [dragging]);

  const handleUndock = (id, startPos) => {
    setUndocked(prev => ({ ...prev, [id]: startPos }));
  };

  const handleRedock = (id) => {
    setUndocked(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const dockedButtons  = buttons.filter(b => !undocked[b.id]);
  const undockedButtons = buttons.filter(b =>  undocked[b.id]);

  // Toolbar orientation: vertical on desktop, horizontal on mobile
  const isHorizontal = mobile;

  return (
    <>
      {/* ── TOOLBAR ── */}
      <div
        ref={toolbarRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 99999,
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: 'center',
          gap: 8,
          padding: collapsed ? 6 : 10,
          background: 'rgba(8,6,4,0.88)',
          border: '1px solid rgba(201,185,145,0.2)',
          borderRadius: isHorizontal ? 40 : 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          touchAction: 'none',
          transition: dragging ? 'none' : 'padding 0.2s ease',
          userSelect: 'none',
        }}
      >
        {/* Drag handle + collapse toggle */}
        <div
          onMouseDown={e => {
            offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
            moved.current = false;
            setDragging(true);
          }}
          onTouchStart={e => {
            const p = e.touches[0];
            offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y };
            moved.current = false;
            setDragging(true);
          }}
          onClick={() => {
              if (!moved.current) {
                if (Object.keys(undocked).length > 0) {
                  setUndocked({});
                } else {
                  setCollapsed(c => !c);
                }
              }
            }}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(201,185,145,0.08)',
            border: '1px solid rgba(201,185,145,0.18)',
            cursor: dragging ? 'grabbing' : 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          title={collapsed ? 'Expand toolbar' : 'Collapse toolbar (drag to move)'}
        >
          <svg viewBox="0 0 16 16" width={10} height={10} fill="none">
            {collapsed
              ? <path d="M4 6l4 4 4-4" stroke="rgba(201,185,145,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              : <path d="M4 10l4-4 4 4" stroke="rgba(201,185,145,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            }
          </svg>
        </div>

        {/* Docked buttons */}
        {!collapsed && dockedButtons.map(btn => (
          <ToolbarButton
            key={btn.id}
            title={btn.title}
            badge={btn.badge}
            onClick={btn.onClick}
            onDragOut={(startPos) => handleUndock(btn.id, startPos)}
          >
            {btn.children}
          </ToolbarButton>
        ))}

        {/* Collapsed indicator */}
        {collapsed && dockedButtons.length > 0 && (
          <div style={{
            fontSize: 8, color: 'rgba(201,185,145,0.5)',
            fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
            writingMode: isHorizontal ? 'horizontal-tb' : 'vertical-rl',
            padding: '2px 0',
          }}>
            {dockedButtons.length}
          </div>
        )}
      </div>

      {/* ── UNDOCKED (free-floating) BUTTONS ── */}
      {undockedButtons.map(btn => (
        <FloatButton
          key={btn.id}
          storageKey={`syntarion_floatbtn_${btn.id}`}
          defaultPos={undocked[btn.id]}
          title={`${btn.title} (drag back to toolbar to re-dock)`}
          badge={btn.badge}
          onClick={btn.onClick}
          hovered={hoveredBtn === btn.id}
          onHover={h => setHoveredBtn(h ? btn.id : null)}
        >
          {btn.children}
        </FloatButton>
      ))}
    </>
  );
}
