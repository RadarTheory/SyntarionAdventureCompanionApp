import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Load WebGL and physics only when Astragal opens.
const AstragalTray = forwardRef(function AstragalTray({ onStatus }, ref) {
  const container = useRef(null), engine = useRef(null);
  const mounted = useRef(true), fadeTimer = useRef(null);
  const [visible, setVisible] = useState(false);
  useImperativeHandle(ref, () => ({ roll: async options => {
    if (!engine.current) throw new Error('The dice tray is still preparing.');
    clearTimeout(fadeTimer.current); setVisible(true);
    try { return await engine.current.roll(options); }
    finally { if (mounted.current) fadeTimer.current = setTimeout(() => setVisible(false), 6000); }
  } }), []);
  useEffect(() => {
    let cancelled = false; mounted.current = true;
    import('./lib/astragalTray.js').then(({ createAstragalTray }) => {
      if (cancelled) return;
      try { engine.current = createAstragalTray(container.current); onStatus({ ready: true, error: null }); }
      catch { onStatus({ ready: false, error: 'Physical 3D dice need WebGL. Enable hardware acceleration and reopen Astragal.' }); }
    }).catch(() => { if (!cancelled) onStatus({ ready: false, error: 'The dice tray could not load. Reopen Astragal to try again.' }); });
    return () => { cancelled = true; mounted.current = false; clearTimeout(fadeTimer.current); engine.current?.dispose(); engine.current = null; };
  }, [onStatus]);
  return <>
    <div style={{ border: '1px solid rgba(201,185,145,.2)', borderRadius: 8, padding: '12px', marginBottom: 10, color: '#a4b39a', fontSize: 11, lineHeight: 1.7 }}>
      ✧ Dice cast across your screen. Controls stay here.
      {visible && <button type="button" onClick={() => setVisible(false)} style={{ marginLeft: 8, border: '1px solid #a98e5040', borderRadius: 4, background: 'transparent', color: '#cfbd8e', padding: '3px 7px', cursor: 'pointer', fontSize: 10 }}>Hide dice</button>}
    </div>
    {createPortal(<div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 2147483000, pointerEvents: 'none', opacity: visible ? 1 : 0, transition: 'opacity .6s ease', overflow: 'hidden' }}><div ref={container} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} /></div>, document.body)}
  </>;
});

export default AstragalTray;
