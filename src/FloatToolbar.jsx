import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { COLORS } from './constants';

const TOOLBAR_STORAGE_KEY = 'syntarion_toolbar_pos';
const DOCKED_STORAGE_KEY = 'syntarion_toolbar_docked';

function isMobileViewport() {
  return window.innerWidth <= 640;
}

function getDefaultPos(mobile) {
  if (mobile) return { x: 10, y: Math.max(12, window.innerHeight - 96) };
  return { x: 8, y: Math.floor(window.innerHeight / 2) - 42 };
}

function pointFromEvent(e) {
  return e.touches ? e.touches[0] : e;
}

function wrapIndex(index, length) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function clampPos(x, y, width, height) {
  return {
    x: Math.max(0, Math.min(window.innerWidth - width - 8, x)),
    y: Math.max(0, Math.min(window.innerHeight - height - 8, y)),
  };
}

function ToolGlyph({ children, badge, active, focused, dimmed, size, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        border: focused ? '1px solid rgba(247,220,142,0.98)' : active ? '1px solid rgba(116,198,255,0.82)' : '1px solid rgba(205,178,105,0.42)',
        background: focused
          ? 'radial-gradient(circle at 45% 35%, rgba(247,220,142,0.22), rgba(18,13,7,0.96) 58%, rgba(4,3,2,0.98))'
          : 'radial-gradient(circle at 45% 35%, rgba(222,193,122,0.1), rgba(11,8,5,0.95) 62%, rgba(3,2,1,0.98))',
        color: '#ead9aa',
        padding: 0,
        cursor: 'pointer',
        overflow: open ? 'visible' : 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dimmed ? 0.46 : 1,
        transform: focused ? 'scale(1.14)' : active ? 'scale(1.05)' : 'scale(1)',
        boxShadow: focused
          ? '0 0 0 5px rgba(205,162,55,0.1), 0 0 34px rgba(218,171,58,0.34), inset 0 0 22px rgba(247,220,142,0.13)'
          : active
            ? '0 0 22px rgba(91,184,255,0.24), inset 0 0 16px rgba(116,198,255,0.11)'
            : '0 10px 24px rgba(0,0,0,0.55), inset 0 0 14px rgba(255,234,174,0.06)',
        transition: 'transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
        touchAction: 'manipulation',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: '50%',
          border: '1px solid rgba(210,178,96,0.3)',
          boxShadow: 'inset 0 0 0 1px rgba(255,245,198,0.05)',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: focused ? 'scale(1.03)' : 'none',
          transition: 'transform 0.2s ease',
        }}
      >
        {children}
      </span>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 4, background: COLORS.magic, color: '#120e0a', borderRadius: '50%', width: 16, height: 16, fontSize: 8, fontFamily: 'monospace', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export function FloatButton({ storageKey, defaultPos, children, onClick, title, hovered, onHover, badge, active = false, dimmed = false, size = 58 }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const [pos, setPos] = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos, storageKey]);

  const clamp = useCallback((x, y) => clampPos(x, y, size, size), [size]);

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
      type="button"
      title={title}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{
        position: 'fixed', left: pos.x, top: pos.y,
        width: size, height: size, borderRadius: '50%',
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

export default function FloatToolbar({ buttons, activeIds = [], storageKey = TOOLBAR_STORAGE_KEY, dockedStorageKey = DOCKED_STORAGE_KEY, defaultPos = null }) {
  const mobile = isMobileViewport();
  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const savedFocus = (() => { try { return Number(localStorage.getItem(`${storageKey}_focus`)); } catch { return 0; } })();

  const [pos, setPos] = useState(savedPos || defaultPos || getDefaultPos(mobile));
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focusIndex, setFocusIndex] = useState(Number.isFinite(savedFocus) ? savedFocus : 0);
  const [motionTick, setMotionTick] = useState(0);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const wheelAccumulator = useRef(0);
  const dragStart = useRef(null);
  const dragFocusStart = useRef(0);
  const activeSet = useMemo(() => new Set(activeIds), [activeIds]);
  const hasActive = activeIds.length > 0;
  const visibleCount = Math.min(buttons.length, mobile ? 4 : 5);
  const launcherSize = mobile ? 54 : 64;
  const panelWidth = mobile ? Math.min(330, window.innerWidth - 16) : 392;
  const panelHeight = mobile ? Math.min(420, window.innerHeight - 24) : Math.min(540, window.innerHeight - 32);
  const centerY = panelHeight / 2;

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos, storageKey]);
  useEffect(() => { localStorage.setItem(`${storageKey}_focus`, String(wrapIndex(focusIndex, buttons.length))); }, [focusIndex, buttons.length, storageKey]);
  useEffect(() => { localStorage.setItem(dockedStorageKey, JSON.stringify({ wheel: true })); }, [dockedStorageKey]);

  const clampedFocus = wrapIndex(focusIndex, buttons.length);
  const focusButton = buttons[clampedFocus] || buttons[0];

  const rotate = useCallback((delta) => {
    if (!buttons.length) return;
    setFocusIndex(prev => wrapIndex(prev + delta, buttons.length));
    setMotionTick(t => t + 1);
  }, [buttons.length]);

  const startLauncherDrag = (e) => {
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
      const w = open ? panelWidth : launcherSize;
      const h = open ? panelHeight : launcherSize;
      setPos(clampPos(p.clientX - offset.current.x, p.clientY - offset.current.y, w, h));
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
  }, [dragging, open, panelWidth, panelHeight, launcherSize]);

  const visibleTools = useMemo(() => {
    if (!buttons.length) return [];
    const half = Math.floor(visibleCount / 2);
    return Array.from({ length: visibleCount }, (_, slot) => {
      const offsetFromFocus = slot - half;
      const index = wrapIndex(clampedFocus + offsetFromFocus, buttons.length);
      return { button: buttons[index], index, offsetFromFocus, slot };
    });
  }, [buttons, clampedFocus, visibleCount]);

  const onWheel = (e) => {
    if (!open) return;
    e.preventDefault();
    wheelAccumulator.current += e.deltaY;
    if (Math.abs(wheelAccumulator.current) < 28) return;
    rotate(wheelAccumulator.current > 0 ? 1 : -1);
    wheelAccumulator.current = 0;
  };

  const startWheelDrag = (e) => {
    const p = pointFromEvent(e);
    dragStart.current = { x: p.clientX, y: p.clientY };
    dragFocusStart.current = clampedFocus;
  };

  const moveWheelDrag = (e) => {
    if (!dragStart.current) return;
    const p = pointFromEvent(e);
    const dy = p.clientY - dragStart.current.y;
    const steps = Math.trunc(dy / 42);
    if (steps !== 0) {
      setFocusIndex(wrapIndex(dragFocusStart.current + steps, buttons.length));
      setMotionTick(t => t + 1);
    }
    if (e.cancelable) e.preventDefault();
  };

  const endWheelDrag = () => {
    dragStart.current = null;
  };

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('mousemove', moveWheelDrag);
    window.addEventListener('mouseup', endWheelDrag);
    window.addEventListener('touchmove', moveWheelDrag, { passive: false });
    window.addEventListener('touchend', endWheelDrag);
    return () => {
      window.removeEventListener('mousemove', moveWheelDrag);
      window.removeEventListener('mouseup', endWheelDrag);
      window.removeEventListener('touchmove', moveWheelDrag);
      window.removeEventListener('touchend', endWheelDrag);
    };
  }, [open, buttons.length, clampedFocus]);

  if (!buttons.length) return null;

  const launcher = (
    <button
      type="button"
      title={open ? 'Close tools' : 'Open tools'}
      onMouseDown={startLauncherDrag}
      onTouchStart={startLauncherDrag}
      onClick={() => { if (!moved.current) setOpen(v => !v); }}
      style={{
        width: launcherSize,
        height: launcherSize,
        borderRadius: '50%',
        border: open ? '1px solid rgba(230,196,103,0.22)' : '1px solid rgba(205,178,105,0.44)',
        background: open ? 'radial-gradient(circle at 50% 50%, rgba(230,196,103,0.08), rgba(0,0,0,0) 68%)' : 'radial-gradient(circle at 48% 42%, rgba(229,197,116,0.2), rgba(15,11,7,0.96) 58%, rgba(4,3,2,0.98))',
        boxShadow: open ? '0 0 18px rgba(215,170,58,0.08)' : '0 18px 42px rgba(0,0,0,0.65), inset 0 0 18px rgba(245,211,126,0.08)',
        cursor: dragging ? 'grabbing' : 'grab',
        padding: 0,
        position: 'relative',
        overflow: open ? 'visible' : 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: open ? '1px solid rgba(220,184,92,0.16)' : '1px solid rgba(220,184,92,0.36)', opacity: open ? 0.45 : 1 }} />
      <span aria-hidden="true" style={{ position: 'absolute', inset: 13, borderRadius: '50%', border: open ? '1px dashed rgba(220,184,92,0.13)' : '1px dashed rgba(220,184,92,0.38)', opacity: open ? 0.4 : 1, transform: open ? `rotate(${motionTick * 13}deg)` : 'none', transition: 'transform 0.24s ease' }} />
      <span style={{ width: open ? '88%' : '78%', height: open ? '88%' : '78%', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: open ? 'drop-shadow(0 0 10px rgba(234,205,126,0.42))' : 'none' }}>
        {focusButton?.children}
      </span>
    </button>
  );

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 99999, touchAction: 'none', userSelect: 'none' }}>
      {!open && launcher}
      {open && (
        <section
          onWheel={onWheel}
          onMouseDown={startWheelDrag}
          onTouchStart={startWheelDrag}
          style={{
            width: panelWidth,
            height: panelHeight,
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100svh - 16px)',
            position: 'relative',
            borderRadius: 28,
            overflow: open ? 'visible' : 'hidden',
            background: 'radial-gradient(circle at 3% 50%, rgba(201,162,78,0.12), rgba(0,0,0,0) 34%), radial-gradient(circle at 80% 12%, rgba(123,84,28,0.12), rgba(0,0,0,0) 38%), linear-gradient(90deg, rgba(7,5,3,0.98), rgba(13,9,5,0.96) 54%, rgba(6,4,3,0.72))',
            border: '1px solid rgba(205,178,105,0.24)',
            boxShadow: '0 30px 90px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,244,203,0.06)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{ position: 'absolute', left: -panelHeight * 0.62, top: -panelHeight * 0.12, width: panelHeight * 1.22, height: panelHeight * 1.22, borderRadius: '50%', background: 'repeating-conic-gradient(from 8deg, rgba(201,162,78,0.15) 0deg 4deg, rgba(72,52,19,0.08) 4deg 6deg, rgba(7,5,3,0.95) 6deg 15deg), repeating-radial-gradient(circle, rgba(230,196,103,0.08) 0 1px, rgba(0,0,0,0) 1px 18px), radial-gradient(circle, rgba(229,198,126,0.13), rgba(9,7,4,0.92) 48%, rgba(3,2,1,0.98) 70%)', border: '1px solid rgba(205,178,105,0.22)', boxShadow: 'inset 0 0 55px rgba(0,0,0,0.8), 0 0 44px rgba(0,0,0,0.5)', transform: `rotate(${motionTick * -5}deg)`, transition: 'transform 0.24s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 3 }}>{launcher}</div>
          <div style={{ position: 'absolute', left: mobile ? 78 : 92, top: 18, right: 18, zIndex: 2, pointerEvents: 'none' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.22em', color: 'rgba(235,205,134,0.74)', textTransform: 'uppercase' }}>Tools</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: mobile ? 15 : 18, letterSpacing: '0.08em', color: '#f2dfaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>{focusButton?.title?.split(' - ')[0] || focusButton?.id}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, fontStyle: 'italic', color: 'rgba(220,198,150,0.5)', marginTop: 3 }}>{clampedFocus + 1} of {buttons.length}</div>
          </div>

          {visibleTools.map(({ button, index, offsetFromFocus }) => {
            const focused = index === clampedFocus;
            const active = activeSet.has(button.id);
            const dimmed = hasActive && !active;
            const y = centerY + offsetFromFocus * (mobile ? 70 : 78) - (focused ? 36 : 30);
            const arcInset = Math.abs(offsetFromFocus) * (mobile ? 16 : 20);
            const x = mobile ? 68 + arcInset : 78 + arcInset;
            const size = focused ? (mobile ? 72 : 84) : (mobile ? 58 : 66);
            return (
              <div
                key={`${button.id}-${index}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  zIndex: focused ? 5 : 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: mobile ? 10 : 14,
                  opacity: Math.max(0.28, 1 - Math.abs(offsetFromFocus) * 0.18),
                  transition: 'left 0.22s ease, top 0.22s ease, opacity 0.22s ease',
                }}
              >
                <ToolGlyph title={button.title} badge={button.badge} active={active} focused={focused} dimmed={dimmed} size={size} onClick={(e) => { e.stopPropagation(); button.onClick?.(); }}>
                  {button.children}
                </ToolGlyph>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); button.onClick?.(); }}
                  style={{
                    width: mobile ? 164 : 220,
                    height: focused ? 44 : 36,
                    border: focused ? '1px solid rgba(224,190,99,0.38)' : '1px solid rgba(205,178,105,0.18)',
                    borderLeft: 'none',
                    borderRadius: '0 18px 18px 0',
                    background: focused ? 'linear-gradient(90deg, rgba(78,56,20,0.45), rgba(11,8,5,0.76))' : 'linear-gradient(90deg, rgba(46,34,16,0.2), rgba(7,5,3,0.48))',
                    color: focused ? '#f0dfad' : 'rgba(226,201,142,0.65)',
                    fontFamily: "'Cinzel', serif",
                    fontSize: focused ? 13 : 10,
                    letterSpacing: '0.08em',
                    textAlign: 'left',
                    padding: '0 14px',
                    whiteSpace: 'nowrap',
                    overflow: open ? 'visible' : 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    boxShadow: focused ? '0 0 24px rgba(205,162,55,0.14)' : 'none',
                    transition: 'height 0.2s ease, font-size 0.2s ease, color 0.2s ease, background 0.2s ease',
                  }}
                >
                  {button.title?.split(' - ')[0]?.split(' - ')[0] || button.id}
                </button>
              </div>
            );
          })}

          <div style={{ position: 'absolute', right: 16, bottom: 14, zIndex: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" aria-label="Previous tool" onClick={(e) => { e.stopPropagation(); rotate(-1); }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(205,178,105,0.32)', background: 'rgba(12,9,5,0.58)', color: '#d7bd74', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 12H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
            <button type="button" aria-label="Next tool" onClick={(e) => { e.stopPropagation(); rotate(1); }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(205,178,105,0.32)', background: 'rgba(12,9,5,0.58)', color: '#d7bd74', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="m9.5 6.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12h8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
          </div>
        </section>
      )}
    </div>
  );
}