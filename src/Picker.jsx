// Syntarion's own dropdown, in place of the browser's: a themed button that opens a themed list.
// - The list opens in a layer above the page (a portal), so panels that clip their contents never cut it off, and it
//   flips upward when there is no room below.
// - Keyboard: Enter, Space or the down arrow opens it; arrows move; Enter picks; Escape closes; typing jumps to a match.
// - Options can carry a colour swatch and a hint; options can be grouped; long lists get a search box.
// options: [{ value, label, hint?, swatch?, group? }]
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLORS } from './constants';

const GOLD = '#c8a84a';

export default function Picker({ value, options, onChange, label, placeholder = 'Choose…', searchable, width, compact = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState(null);
  const button = useRef(null);
  const list = useRef(null);
  const search = useRef(null);
  const listId = useId();
  const showSearch = searchable ?? options.length > 12;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => `${o.label} ${o.hint || ''} ${o.group || ''}`.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const current = options.find(o => o.value === value);

  // Place the list under the button (or above it, if the page has no room below), and follow scrolling.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const placeIt = () => {
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      const room = window.innerHeight - r.bottom, wanted = Math.min(340, 44 + options.length * 34);
      const up = room < Math.min(wanted, 220) && r.top > room;
      setPlace({ left: Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8), top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined, width: Math.max(r.width, width || 200), maxHeight: Math.max(160, (up ? r.top : room) - 16) });
    };
    placeIt();
    window.addEventListener('resize', placeIt);
    window.addEventListener('scroll', placeIt, true);
    return () => { window.removeEventListener('resize', placeIt); window.removeEventListener('scroll', placeIt, true); };
  }, [open, options.length, width]);

  // Close on a click elsewhere.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (!button.current?.contains(e.target) && !list.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  // Focus the list (or its search box) once it is on the page, and bring the chosen option into view.
  const placed = !!place;
  useEffect(() => {
    if (!open || !placed) return;
    (showSearch ? search.current : list.current)?.focus({ preventScroll: true });
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, placed, showSearch]);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    setOpen(true);
  };
  const choose = o => { if (!o) return; onChange(o.value); setOpen(false); button.current?.focus(); };
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); button.current?.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(shown.length - 1, a + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); return; }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); return; }
    if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); choose(shown[active]); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    if (!showSearch && e.key.length === 1) {
      const i = shown.findIndex(o => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  };
  useEffect(() => { list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active]);

  // A group's heading shows above the first of its options in the current (filtered) list.
  const headings = shown.map((o, i) => (o.group && (i === 0 || shown[i - 1].group !== o.group) ? o.group : null));
  return (
    <>
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label ? `${label}: ${current?.label || placeholder}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={e => { if (!open && ['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList(); } }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: width || (compact ? 0 : 120), maxWidth: '100%',
          background: open ? 'rgba(200,168,74,0.10)' : '#1a1714', border: `1px solid ${open ? GOLD : COLORS.border}`, borderRadius: 6,
          padding: compact ? '5px 8px' : '6px 10px', cursor: disabled ? 'default' : 'pointer', color: COLORS.text, textAlign: 'left',
          fontFamily: "'Cinzel', serif", fontSize: compact ? 9 : 10, letterSpacing: '0.06em', opacity: disabled ? 0.5 : 1,
        }}>
        {current?.swatch && <Swatch color={current.swatch} />}
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: current ? COLORS.text : COLORS.dim }}>{current?.label || placeholder}</span>
        <span aria-hidden="true" style={{ color: GOLD, fontSize: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>
      {open && place && createPortal(
        <div
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
          onKeyDown={onKey}
          style={{
            position: 'fixed', left: place.left, top: place.top, bottom: place.bottom, width: place.width, maxHeight: Math.min(340, place.maxHeight),
            zIndex: 100000, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#1d1914,#141110)',
            border: `1px solid rgba(200,168,74,0.45)`, borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4)', overflow: 'hidden', outline: 'none',
          }}>
          {showSearch && (
            <input ref={search} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder="Search…" aria-label={`Search ${label || 'options'}`}
              style={{ margin: 6, padding: '6px 9px', background: 'rgba(240,238,235,0.05)', border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
          )}
          <div style={{ overflowY: 'auto', padding: 4, scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,168,74,0.45) transparent' }}>
            {shown.length === 0 && <div style={{ padding: '8px 10px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Nothing matches.</div>}
            {shown.map((o, i) => {
              const heading = headings[i];
              const isActive = i === active, isChosen = o.value === value;
              return (
                <div key={`${o.group || ''}:${o.value}`}>
                  {heading && <div style={{ padding: '8px 10px 4px', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>{heading}</div>}
                  <div
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isChosen}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 5, cursor: 'pointer',
                      background: isActive ? 'rgba(200,168,74,0.13)' : 'transparent', color: isChosen ? '#ecd99a' : COLORS.textSub,
                    }}>
                    {o.swatch && <Swatch color={o.swatch} />}
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.05em' }}>{o.label}</span>
                    {o.hint && <span style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', whiteSpace: 'nowrap' }}>{o.hint}</span>}
                    {isChosen && <span aria-hidden="true" style={{ color: GOLD, fontSize: 10 }}>✦</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function Swatch({ color }) {
  return <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 8px ${color}` }} />;
}
