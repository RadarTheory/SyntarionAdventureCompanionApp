import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useDevice } from './useDevice';
import { COLORS, CLASSES } from './constants';
import { startingCallingOf } from './constellationAbilities';

// ═════════════════════════════════════════════════════════════════════════════
// STEP CLASS
// The player chooses their calling on the real constellation (user, 2026-11-16): it runs in pick mode
// (/constellation/index.html?host=syntarion&pick=1), where nothing is bought and choosing any star on a line picks
// that line's calling. The calling becomes the character's first star when the Abilities tab first opens
// (ConstellationTab.jsx). cid stays one of the wizard's CLASSES ids, so boons, stats and the Magic | Tech lean are unchanged.
// ═════════════════════════════════════════════════════════════════════════════
const SRC = '/constellation/index.html?host=syntarion&pick=1';
// A calling's first star costs 2 AP. Pick mode buys nothing, but with 0 AP the sky reads "Needs 2 AP · 0 left" and
// looks blocked, so a new character comes to this step holding the 2 AP their calling costs (user, 2026-11-16).
const CALLING_AP = 2;

export default function StepClass({
  cp, setCp, cid, setCid,
  generateBoons, race,
  goNext, goBack,
}) {
  const { isMobile } = useDevice();
  const anchor = useRef(null);
  const [top, setTop] = useState(null);
  const frame = useRef(null);
  const cidRef = useRef(cid);

  useEffect(() => { cidRef.current = cid; }, [cid]);

  // The sky fills the page below the wizard's step bar (user, 2026-11-16): the step's own column is only 680px wide, so
  // measure where the scrolling content area starts and lay a fixed layer from there to the side panel.
  useLayoutEffect(() => {
    const measure = () => {
      const area = anchor.current?.parentElement?.parentElement;
      if (!area) return;
      // Start right under the step bar itself: on phones the wizard pads the bar's wrapper with room for the bottom panel.
      const bar = area.previousElementSibling?.firstElementChild;
      setTop(Math.round(bar ? bar.getBoundingClientRect().bottom : area.getBoundingClientRect().top));
    };
    // The header and step bar settle after fonts load and as they wrap, so measure again whenever the page reflows.
    measure();
    document.fonts?.ready?.then(measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(document.body);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // When class changes, regenerate boons with correct path
  useEffect(() => {
    if (cid && cp && race) generateBoons(race, cp, cid);
  }, [cid, cp]);

  const sendInit = useCallback(() => {
    frame.current?.contentWindow?.postMessage({
      type: 'init', learned: [], available: CALLING_AP, characterId: 'wizard',
      startingCalling: startingCallingOf({ cid: cidRef.current }),
    }, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = e => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const msg = e.data || {};
      if (msg.type === 'ready') { sendInit(); return; }
      if (msg.type !== 'pick' || typeof msg.classId !== 'string') return;
      const id = msg.classId;
      const path = CLASSES.magic.some(c => c.id === id) ? 'magic' : CLASSES.tech.some(c => c.id === id) ? 'tech' : null;
      if (!path) return;
      setCid(id);
      setCp(path);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendInit, setCid, setCp]);

  const canAdvance = !!cid;
  const SKY = '#0c100f';

  const navBtn = (enabled) => ({
    background: enabled ? 'rgba(200,168,74,0.12)' : 'transparent',
    border: `1px solid ${enabled ? 'rgba(200,168,74,0.45)' : COLORS.border}`,
    borderRadius: 3, padding: isMobile ? '8px 12px' : '9px 18px',
    color: enabled ? COLORS.text : COLORS.dim, cursor: enabled ? 'pointer' : 'default',
    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
    whiteSpace: 'nowrap', transition: 'all 0.15s',
  });

  return (
    <div ref={anchor}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>

      {/* The whole step is the map: a fixed layer from the step bar down, left of the Magic | Tech panel (above it on phones),
          with only the Belief / Stats buttons along its foot. */}
      <div style={{
        position: 'fixed', top: top ?? 0, left: 0, right: isMobile ? 0 : 200, bottom: isMobile ? 64 : 0,
        visibility: top == null ? 'hidden' : 'visible',
        display: 'flex', flexDirection: 'column', background: SKY, zIndex: 5,
      }}>
        <iframe
          ref={frame}
          src={SRC}
          title="Choose your calling"
          style={{ flex: 1, width: '100%', border: 0, display: 'block', background: SKY }}
        />
        {/* The way on, in a bar along the bottom: everything else is the map (user, 2026-11-16). */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: isMobile ? '8px 12px' : '10px 22px',
          background: `linear-gradient(0deg, #121614, ${SKY})`, borderTop: '1px solid rgba(200,168,74,0.14)',
        }}>
          <button onClick={goBack} style={navBtn(true)}>← Belief</button>
          <button onClick={goNext} disabled={!canAdvance} style={navBtn(canAdvance)}>Stats →</button>
        </div>
      </div>
    </div>
  );
}
