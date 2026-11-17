import { useEffect, useRef, useCallback } from 'react';
import { CLASSES } from './constants';
import StepStage from './wizard/StepStage';
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
  magicTech = 0, willWhim = 0,
}) {
  const frame = useRef(null);
  const cidRef = useRef(cid);

  useEffect(() => { cidRef.current = cid; }, [cid]);

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

  // The whole step is the map, in the wizard's shared stage: only the step bar above and the foot bar below (user, 2026-11-16/17).
  return (
    <StepStage
      background={false}
      back={{ label: 'Belief', onClick: goBack }}
      next={{ label: 'Stats', onClick: goNext, disabled: !canAdvance }}
      magicTech={magicTech} willWhim={willWhim}
    >
      <iframe
        ref={frame}
        src={SRC}
        title="Choose your calling"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block', background: '#0c100f' }}
      />
    </StepStage>
  );
}
