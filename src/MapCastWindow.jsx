import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VTTViewer from './VTTViewer';

// ─── Copy the opener's styles into the popup so fonts/CSS render correctly ─────
// Handles both dev (Vite injects <style> tags) and prod (<link rel=stylesheet>).
function cloneStyles(sourceDoc, targetDoc) {
  // Avoid duplicating on Strict Mode's double-mount.
  if (targetDoc.getElementById('mapcast-styles-done')) return;
  sourceDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    targetDoc.head.appendChild(node.cloneNode(true));
  });
  const marker = targetDoc.createElement('meta');
  marker.id = 'mapcast-styles-done';
  targetDoc.head.appendChild(marker);
}

/**
 * MapCastWindow — renders the PLAYER view of the live map into a separate
 * browser window that the DM opened (the `win` handle is created in the click
 * handler so the browser always honors it). The DM drags the window to a
 * second monitor and presses F11 to fullscreen it for the table.
 *
 * `userChar` is intentionally null so the cast is a neutral "projector" view:
 * fog is applied exactly as players see it, and every pending move request
 * shows on the map as a marker. This component never closes the window —
 * DMView owns its lifecycle.
 */
export default function MapCastWindow({ win, campaignId, onClose }) {
  const [container, setContainer] = useState(null);
  const [hintVisible, setHintVisible] = useState(true);
  const hintTimer = useRef(null);

  useEffect(() => {
    if (!win || win.closed) { onClose?.(); return; }
    const doc = win.document;
    doc.title = 'Syntarion — Mapcast · Player View';
    doc.body.style.margin = '0';
    doc.body.style.background = '#0a0806';
    doc.body.style.overflow = 'hidden';
    cloneStyles(document, doc);

    // Reuse the mount node across Strict Mode's double-mount instead of stacking.
    let mount = doc.getElementById('mapcast-root');
    if (!mount) {
      mount = doc.createElement('div');
      mount.id = 'mapcast-root';
      mount.style.width = '100vw';
      mount.style.height = '100vh';
      mount.style.display = 'flex';
      mount.style.flexDirection = 'column';
      doc.body.appendChild(mount);
    }
    setContainer(mount);

    // Fade the hint bar after a few seconds; bring it back on mouse activity.
    const showHint = () => {
      setHintVisible(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHintVisible(false), 4000);
    };
    showHint();
    doc.addEventListener('mousemove', showHint);

    // If the DM closes the OS window directly, unmount cleanly on our side.
    const poll = setInterval(() => { if (win.closed) { clearInterval(poll); onClose?.(); } }, 600);

    return () => {
      clearInterval(poll);
      clearTimeout(hintTimer.current);
      try { doc.removeEventListener('mousemove', showHint); } catch { /* window gone */ }
      // Intentionally does NOT close `win` — DMView owns it, so Strict Mode's
      // mount→cleanup→mount cycle won't kill the popup.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win]);

  if (!container) return null;

  return createPortal(
    <>
      {/* Slim hint bar — auto-hides so the players just see the map */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '8px 16px',
        background: 'rgba(10,8,6,0.85)', borderBottom: '1px solid rgba(200,168,74,0.25)',
        color: '#e8d9a7', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.1em',
        opacity: hintVisible ? 1 : 0,
        transform: hintVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        pointerEvents: hintVisible ? 'auto' : 'none',
      }}>
        <span>◈ MAPCAST · PLAYER VIEW</span>
        <span style={{ fontSize: 9, color: 'rgba(232,217,167,0.55)', fontStyle: 'italic', fontFamily: 'Georgia, serif', letterSpacing: 0 }}>
          Drag this window to your second screen · Press F11 to fullscreen
        </span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', color: 'rgba(240,238,235,0.7)', fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}
        >✕ Close Cast</button>
      </div>

      {/* The live player view — fog + all pending move markers */}
      <div style={{ flex: 1, minHeight: 0, padding: 12, boxSizing: 'border-box' }}>
        <VTTViewer campaignId={campaignId} userChar={null} castMode />
      </div>
    </>,
    container
  );
}
