import { useState, useLayoutEffect, useRef } from 'react';
import { COLORS } from '../constants';
import './stage.css';

// ═════════════════════════════════════════════════════════════════════════════
// STEP STAGE (user, 2026-11-17)
// The shell every creation step is moving to: the whole page below the step bar is the step, like the constellation,
// with one bar along the foot holding the way back, the live Magic | Tech and Will | Whim leans, and the way on.
// Steps rendered in it replace the wizard's side panel (Wizard.jsx lists them in STAGED_STEPS).
// ═════════════════════════════════════════════════════════════════════════════

/** Where the step bar ends, so the stage can start right under it whatever the header does as it wraps. */
function useTopUnderStepBar(anchor) {
  const [top, setTop] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      // anchor → the step's 680px column → the wizard's scrolling content area, whose previous sibling holds the step bar.
      const area = anchor.current?.parentElement?.parentElement;
      if (!area) return;
      const bar = area.previousElementSibling?.firstElementChild;
      setTop(Math.round(bar ? bar.getBoundingClientRect().bottom : area.getBoundingClientRect().top));
    };
    measure();
    document.fonts?.ready?.then(measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(document.body);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [anchor]);
  return top;
}

function Lean({ left, right, value, leftColor, rightColor }) {
  const pct = ((Math.max(-4, Math.min(4, value || 0)) + 4) / 8) * 100;
  return (
    <div className="wz-lean" title={`${left} | ${right}`}>
      <small><b>{left}</b><span>|</span><b>{right}</b></small>
      <div className="wz-track">
        <i style={{
          left: value < 0 ? `${pct}%` : '50%',
          right: value > 0 ? `${100 - pct}%` : '50%',
          background: value < 0 ? leftColor : rightColor,
        }} />
      </div>
    </div>
  );
}

/**
 * @param back / next  { label, onClick, disabled? }
 * @param magicTech, willWhim  the live leans (-4..+4)
 * @param background  optional: the step draws its own sky (the Class step's constellation does)
 */
export default function StepStage({ back, next, magicTech = 0, willWhim = 0, background = true, children }) {
  const anchor = useRef(null);
  const top = useTopUnderStepBar(anchor);
  return (
    <div ref={anchor}>
      <div className="wz-stage" style={{ top: top ?? 0, visibility: top == null ? 'hidden' : 'visible' }}>
        <div className="wz-stage-body">
          {background && <div className="wz-sky" />}
          {children}
        </div>
        <div className="wz-bar">
          {back
            ? <button type="button" className="wz-nav on" onClick={back.onClick}>← {back.label}</button>
            : <span />}
          <div className="wz-leans">
            <Lean left="Magic" right="Tech" value={magicTech} leftColor={COLORS.magic} rightColor={COLORS.tech} />
            <Lean left="Whim" right="Will" value={willWhim} leftColor={COLORS.spiritText} rightColor={COLORS.techText} />
          </div>
          {next
            ? <button type="button" className={`wz-nav${next.disabled ? '' : ' on'}`} disabled={next.disabled} onClick={next.onClick}>{next.label} →</button>
            : <span />}
        </div>
      </div>
    </div>
  );
}
