import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS } from './constants';

const TOOLBAR_STORAGE_KEY = 'syntarion_toolbar_pos';
const DOCKED_STORAGE_KEY  = 'syntarion_toolbar_docked';

function isMobileViewport() {
  return window.innerWidth <= 640;
}

function getDefaultPos(mobile) {
  if (mobile) return { x: 0, y: window.innerHeight - 88 };
  return { x: 0, y: Math.floor(window.innerHeight / 2) - 120 };
}

// ─── Free-floating button (undocked) ─────────────────────────────────────────
export function FloatButton({ storageKey, defaultPos, children, onClick, title, hovered, onHover, badge }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const [pos, setPos]       = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved  = useRef(false);

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
        cursor: dragging ? 'grabbing' : 'grab', zIndex: 99998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, overflow: 'visible',
        transform: hovered ? 'translateY(-2px) scale(1.05)' : 'none',
        boxShadow: hovered ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)' : '0 10px 28px rgba(0,0,0,0.55)',
        transition: dragging ? 'none' : 'all 0.18s ease',
        backdropFilter: 'blur(8px)', touchAction: 'none',
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ─── Docked toolbar button ────────────────────────────────────────────────────
function ToolbarButton({ children, onClick, title, badge, onDragOut, size }) {
  const [pressing, setPressing] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const startPos = useRef(null);
  const moved    = useRef(false);
  const DRAG_THRESHOLD = 10;

  const startDrag = (cx, cy) => { startPos.current = { x: cx, y: cy }; moved.current = false; setPressing(true); };

  const checkDrag = useCallback((cx, cy) => {
    if (!pressing || !startPos.current) return;
    const dx = cx - startPos.current.x, dy = cy - startPos.current.y;
    if (!moved.current && Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) {
      moved.current = true;
      setPressing(false);
      onDragOut?.({ x: cx - size / 2, y: cy - size / 2 });
    }
  }, [pressing, onDragOut, size]);

  const endDrag = useCallback(() => { setPressing(false); startPos.current = null; }, []);

  useEffect(() => {
    if (!pressing) return;
    const onMM = (e) => checkDrag(e.clientX, e.clientY);
    const onTM = (e) => { const t = e.touches[0]; checkDrag(t.clientX, t.clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', endDrag);
    };
  }, [pressing, checkDrag, endDrag]);

  return (
    <button
      title={title}
      onMouseDown={e => startDrag(e.clientX, e.clientY)}
      onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        border: hovered ? '1px solid rgba(230,210,160,0.7)' : '1px solid rgba(201,185,145,0.25)',
        background: hovered ? 'rgba(24,18,12,0.95)' : 'rgba(14,10,7,0.7)',
        cursor: 'grab', padding: 0, overflow: 'hidden',
        transform: hovered ? 'scale(1.06)' : 'none',
        boxShadow: hovered ? '0 0 18px rgba(201,185,145,0.25), 0 8px 24px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', touchAction: 'none',
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, background: COLORS.magic, color: '#120e0a', borderRadius: '50%', width: Math.max(12, size * 0.25), height: Math.max(12, size * 0.25), fontSize: 7, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── MAIN TOOLBAR ─────────────────────────────────────────────────────────────
export default function FloatToolbar({ buttons }) {
  const [mobile, setMobile] = useState(isMobileViewport());
  useEffect(() => {
    const onResize = () => setMobile(isMobileViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const savedPos    = (() => { try { return JSON.parse(localStorage.getItem(TOOLBAR_STORAGE_KEY)); } catch { return null; } })();
  const savedDocked = (() => { try { return JSON.parse(localStorage.getItem(DOCKED_STORAGE_KEY));  } catch { return null; } })();

  const [pos, setPos]             = useState(savedPos || getDefaultPos(mobile));
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [undocked, setUndocked]   = useState(savedDocked || {});
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const offset     = useRef({ x: 0, y: 0 });
  const moved      = useRef(false);
  const toolbarRef = useRef(null);

  useEffect(() => { localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(pos)); }, [pos]);
  useEffect(() => { localStorage.setItem(DOCKED_STORAGE_KEY,  JSON.stringify(undocked)); }, [undocked]);

  const dockedButtons   = buttons.filter(b => !undocked[b.id]);
  const undockedButtons = buttons.filter(b =>  undocked[b.id]);

  // ── Responsive button size ──
  const btnSize = (() => {
    if (!mobile) return 56;
    const count = dockedButtons.length || 1;
    const handleW   = 24 + 5; // handle + gap
    const padding   = 16;     // 8px each side
    const gapTotal  = (count - 1) * 4;
    const available = window.innerWidth - handleW - padding - gapTotal;
    return Math.max(36, Math.min(50, Math.floor(available / count)));
  })();

  // Split into two rows if still too tight at minimum size
  const MAX_PER_ROW = mobile ? Math.floor((window.innerWidth - 40) / (36 + 4)) : 99;
  const needsTwoRows = mobile && !collapsed && dockedButtons.length > MAX_PER_ROW;
  const midpoint = Math.ceil(dockedButtons.length / 2);
  const row1 = needsTwoRows ? dockedButtons.slice(0, midpoint) : dockedButtons;
  const row2 = needsTwoRows ? dockedButtons.slice(midpoint) : [];

  const gap = mobile ? 4 : 8;
  const padding = mobile ? 8 : 10;

  const clampToolbar = (x, y) => {
    const el = toolbarRef.current;
    const w = el?.offsetWidth  || 80;
    const h = el?.offsetHeight || 200;
    return { x: Math.max(0, Math.min(window.innerWidth - w, x)), y: Math.max(0, Math.min(window.innerHeight - h, y)) };
  };

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

  const handleUndock = (id, startPos) => setUndocked(prev => ({ ...prev, [id]: startPos }));

  const renderBtns = (btns) => btns.map(btn => (
    <ToolbarButton key={btn.id} title={btn.title} badge={btn.badge} onClick={btn.onClick} onDragOut={(sp) => handleUndock(btn.id, sp)} size={btnSize}>
      {btn.children}
    </ToolbarButton>
  ));

  return (
    <>
      <div
        ref={toolbarRef}
        style={{
          position: 'fixed', left: pos.x, top: pos.y, zIndex: 99999,
          display: 'flex',
          flexDirection: mobile ? 'row' : 'column',
          alignItems: 'center',
          gap,
          padding: collapsed ? 6 : padding,
          background: 'rgba(8,6,4,0.88)',
          border: '1px solid rgba(201,185,145,0.2)',
          borderRadius: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          touchAction: 'none',
          transition: dragging ? 'none' : 'padding 0.2s ease',
          userSelect: 'none',
        }}
      >
        {/* Handle / collapse toggle */}
        <div
          onMouseDown={e => { offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; moved.current = false; setDragging(true); }}
          onTouchStart={e => { const p = e.touches[0]; offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y }; moved.current = false; setDragging(true); }}
          onClick={() => { if (!moved.current) setCollapsed(c => !c); }}
          style={{ width: mobile ? 22 : 28, height: mobile ? 22 : 28, borderRadius: '50%', background: 'rgba(201,185,145,0.08)', border: '1px solid rgba(201,185,145,0.18)', cursor: dragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title={collapsed ? 'Expand' : 'Collapse / drag to move'}
        >
          <svg viewBox="0 0 16 16" width={mobile ? 8 : 10} height={mobile ? 8 : 10} fill="none">
            {collapsed
              ? <path d="M4 6l4 4 4-4" stroke="rgba(201,185,145,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              : <path d="M4 10l4-4 4 4" stroke="rgba(201,185,145,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            }
          </svg>
        </div>

        {/* Buttons */}
        {!collapsed && (needsTwoRows ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>{renderBtns(row1)}</div>
            <div style={{ display: 'flex', gap: 4 }}>{renderBtns(row2)}</div>
          </div>
        ) : renderBtns(row1))}

        {collapsed && dockedButtons.length > 0 && (
          <div style={{ fontSize: 8, color: 'rgba(201,185,145,0.5)', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', writingMode: mobile ? 'horizontal-tb' : 'vertical-rl', padding: '2px 0' }}>
            {dockedButtons.length}
          </div>
        )}
      </div>

      {/* Free-floating undocked buttons */}
      {undockedButtons.map(btn => (
        <FloatButton key={btn.id} storageKey={`syntarion_floatbtn_${btn.id}`} defaultPos={undocked[btn.id]} title={`${btn.title} (drag back to re-dock)`} badge={btn.badge} onClick={btn.onClick} hovered={hoveredBtn === btn.id} onHover={h => setHoveredBtn(h ? btn.id : null)}>
          {btn.children}
        </FloatButton>
      ))}
    </>
  );
}
