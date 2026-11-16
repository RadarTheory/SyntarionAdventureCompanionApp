import { useState, useEffect, useRef, useCallback } from 'react';
import { useDevice } from './useDevice';
import { COLORS, CLASSES } from './constants';
import { loadConstellation, startingCallingOf } from './constellationAbilities';

// ═════════════════════════════════════════════════════════════════════════════
// STEP CLASS
// The player chooses their calling on the real constellation (user, 2026-11-16): it runs in pick mode
// (/constellation/index.html?host=syntarion&pick=1), where nothing is bought and choosing any star on a line picks
// that line's calling. The calling becomes the character's first star when the Abilities tab first opens
// (ConstellationTab.jsx). cid stays one of the wizard's CLASSES ids, so boons, stats and the Magic | Tech lean are unchanged.
// ═════════════════════════════════════════════════════════════════════════════
const SRC = '/constellation/index.html?host=syntarion&pick=1';
const CLASS_OF_CALLING = { oneir: 'magister' };

export default function StepClass({
  cp, setCp, cid, setCid,
  generateBoons, race,
  goNext, goBack,
}) {
  const { isMobile } = useDevice();
  const frame = useRef(null);
  const cidRef = useRef(cid);
  const [data, setData] = useState(null);

  useEffect(() => { cidRef.current = cid; }, [cid]);
  useEffect(() => { loadConstellation().then(setData).catch(() => {}); }, []);

  // When class changes, regenerate boons with correct path
  useEffect(() => {
    if (cid && cp && race) generateBoons(race, cp, cid);
  }, [cid, cp]);

  const sendInit = useCallback(() => {
    frame.current?.contentWindow?.postMessage({
      type: 'init', learned: [], available: 0, characterId: 'wizard',
      startingCalling: startingCallingOf({ cid: cidRef.current }),
    }, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = e => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const msg = e.data || {};
      if (msg.type === 'ready') { sendInit(); return; }
      if (msg.type !== 'pick' || typeof msg.classId !== 'string') return;
      const id = CLASS_OF_CALLING[msg.classId] || msg.classId;
      const path = CLASSES.magic.some(c => c.id === id) ? 'magic' : CLASSES.tech.some(c => c.id === id) ? 'tech' : null;
      if (!path) return;
      setCid(id);
      setCp(path);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendInit, setCid, setCp]);

  const canAdvance = !!cid;
  const calling = data && cid ? data.classById(startingCallingOf({ cid })) : null;
  const practice = calling ? data.disciplines.find(p => p.id === calling.discipline) : null;
  const trait = calling ? data.traitFor(calling) : null;
  const lore = calling ? data.CALLING_LORE?.[calling.id] : null;
  const abilities = calling ? data.abilityEntries(calling, 'abilities') : [];
  const color = practice?.color || (cp === 'magic' ? COLORS.magic : COLORS.tech);

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>

      {/* Title */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: isMobile ? 18 : 22,
        fontWeight: 700,
        color: COLORS.text,
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>Choose your Calling</div>
      <div style={{
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        marginBottom: 16,
        lineHeight: 1.6,
      }}>
        Every character begins at The Self. Select the star of the calling your story starts from to see what it can do.
        It becomes your first star in the Constellation, and you can awaken others later.
      </div>

      {/* Current selection */}
      <div style={{
        marginBottom: 14,
        padding: '10px 14px',
        background: calling ? `${color}14` : COLORS.card,
        border: `1px solid ${calling ? color + '88' : COLORS.border}`,
        borderRadius: 3,
        minHeight: 38,
      }}>
        {calling ? (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color, letterSpacing: '0.08em' }}>
              {calling.name}
              <span style={{ fontSize: 9, color: COLORS.muted, letterSpacing: '0.12em', marginLeft: 10 }}>
                {[practice?.name, calling.attribute, trait && `${trait.discipline} / ${trait.trait}`].filter(Boolean).join(' · ').toUpperCase()}
              </span>
            </div>
            {lore && <div style={{ fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.55, marginTop: 4 }}>{lore}</div>}
            {abilities.length > 0 && (
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4px 16px' }}>
                {abilities.map(a => (
                  <div key={a.key} style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', lineHeight: 1.45 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", color, letterSpacing: '0.04em' }}>{a.name}</span> — {a.description}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No calling chosen yet.</div>
        )}
      </div>

      {/* The constellation, wider than the wizard's column where the screen allows */}
      <div style={{
        position: 'relative', left: '50%', transform: 'translateX(-50%)',
        width: 'min(1180px, calc(100vw - 32px))',
        height: isMobile ? '62vh' : 'min(70vh, 720px)', minHeight: 380,
        marginBottom: 20, borderRadius: 6, overflow: 'hidden',
        border: `1px solid ${COLORS.border}`, background: '#0c100f',
      }}>
        <iframe
          ref={frame}
          src={SRC}
          title="Choose your calling"
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.border}`,
      }}>
        <button
          onClick={goBack}
          style={{
            background: 'transparent',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2,
            padding: '10px 20px',
            color: COLORS.muted,
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          ← Belief
        </button>

        <button
          onClick={goNext}
          disabled={!canAdvance}
          style={{
            background: canAdvance ? COLORS.surface : 'transparent',
            border: `1px solid ${canAdvance ? COLORS.borderMid : COLORS.border}`,
            borderRadius: 2,
            padding: '10px 24px',
            color: canAdvance ? COLORS.text : COLORS.dim,
            cursor: canAdvance ? 'pointer' : 'default',
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          Stats →
        </button>
      </div>
    </div>
  );
}
