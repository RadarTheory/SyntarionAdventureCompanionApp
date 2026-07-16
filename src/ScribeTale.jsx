// ─── THE SCRIBE'S TALE ────────────────────────────────────────────────────────
// Player-facing AI DM panel. The Scribe narrates, players act, dice are real.
// Usage: <ScribeTale char={char} campaignId={campaignId} />
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS } from './constants';
import { useActiveGameSession } from './lib/session';
import {
  loadOrCreateTale, loadTurns, saveTurn,
  runDMTurn, statModifier, concludeTaleRecord,
} from './lib/scribeDM';

const STAT_AXIS = { spirit: 'magic', soul: 'magic', body: 'magic', essence: 'magic', will: 'tech', whim: 'tech', mind: 'tech', dream: 'tech' };

const TENSION_LABELS = ['', 'Calm', 'Stirring', 'Rising', 'Perilous', 'Climax'];

const STAT_HELP = {
  will: 'resolve, discipline, courage, and pressure under command',
  whim: 'finesse, timing, improvisation, stealth, and opportunistic motion',
  body: 'strength, endurance, force, and physical control',
  mind: 'logic, memory, tactics, and technical reasoning',
  essence: 'presence, vitality, identity, and raw selfhood',
  soul: 'empathy, desire, temptation, faith, and emotional truth',
  spirit: 'magic, communion, supernatural perception, and sacred force',
  dream: 'intuition, vision, imagination, omens, and unreal possibility',
};

const formatMod = (mod) => mod > 0 ? '+' + mod : String(mod);

export default function ScribeTale({ char, campaignId, taleScope = 'this module' }) {
  const [tale, setTale] = useState(null);
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRoll, setPendingRoll] = useState(null);   // { stat, dc, reason }
  const [rollState, setRollState] = useState(null);        // { spinning, die, total, success }
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const lockRef = useRef(false);
  const sessionId = useActiveGameSession(campaignId);

  const cid = campaignId ? String(campaignId) : null;

  // ── Load or open the tale ──
  useEffect(() => {
    if (!cid || !char?.id) return;
    let alive = true;
    (async () => {
      try {
        const t = await loadOrCreateTale(cid, char.id);
        if (!alive) return;
        setTale(t);
        const tt = await loadTurns(t.id);
        if (!alive) return;
        setTurns(tt);
        // Restore an unanswered roll request from the last scribe turn
        const last = [...tt].reverse().find(x => x.role === 'scribe');
        const lastIdx = tt.lastIndexOf(last);
        const answered = tt.slice(lastIdx + 1).some(x => x.role === 'roll');
        if (last?.actions?.roll_request && !answered) setPendingRoll(last.actions.roll_request);
      } catch (e) { setError(e.message); }
    })();
    return () => { alive = false; };
  }, [cid, char?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, loading, pendingRoll, rollState]);

  // ── Core: send a turn to the Scribe ──
  const sendTurn = useCallback(async (content, role = 'player') => {
    if (lockRef.current || !tale) return;
    lockRef.current = true;
    setLoading(true);
    setError(null);
    const optimistic = { id: `tmp_${Date.now()}`, role, content, created_at: new Date().toISOString() };
    setTurns(prev => [...prev, optimistic]);

    try {
      const { turn, tale: updated } = await runDMTurn({
        tale, char, campaignId: cid, sessionId,
        recentTurns: turns, playerInput: { role, content },
      });
      setTale(updated);
      setTurns(prev => [...prev, {
        id: `s_${Date.now()}`, role: 'scribe', content: turn.narration,
        actions: { roll_request: turn.rollRequest, executed: turn.actions }, created_at: new Date().toISOString(),
      }]);
      setPendingRoll(turn.rollRequest || null);
      setRollState(null);
    } catch (e) {
      setError(e?.message || 'The archives resisted.');
      setTurns(prev => prev.filter(t => t.id !== optimistic.id));
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  }, [tale, char, cid, sessionId, turns]);

  const taleEnded = tale?.status === 'concluded';

  // ── Castor bridge: casts dispatched from the Tales toolkit land here ──
  useEffect(() => {
    const onCast = (e) => {
      const d = e.detail || {};
      if (String(d.campaignId || '') !== cid) return;
      if (!tale || taleEnded) { setError('Begin the Tale before casting.'); return; }
      if (loading || pendingRoll) { setError('The Scribe awaits your roll before you cast.'); return; }
      const note = d.note ? ` Player note: "${d.note}".` : '';
      sendTurn(
        `[CAST] ${char?.name || 'The player'} casts ${d.abilityName} — ${d.tierLabel} tier [${d.disciplineLabel}].\nEffect: ${d.effect}${note}\nAdjudicate this cast within the scene: apply its effect narratively, spend its cost, and call for a roll only if the outcome is uncertain.`,
        'player',
      );
    };
    window.addEventListener('syntarion-tales-cast', onCast);
    return () => window.removeEventListener('syntarion-tales-cast', onCast);
  }, [cid, tale, taleEnded, loading, pendingRoll, sendTurn, char?.name]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading || pendingRoll || taleEnded) return;
    setInput('');
    sendTurn(text, 'player');
  };

  // ── Dice: the player rolls; the Scribe obeys the result ──
  const handleRoll = () => {
    if (!pendingRoll || rollState?.spinning || loading) return;
    const rr = pendingRoll;
    setRollState({ spinning: true });
    const die = 1 + Math.floor(Math.random() * 20);
    const mod = statModifier(char?.stats?.[rr.stat] ?? 8);
    const total = die + mod;
    const success = die === 20 ? true : die === 1 ? false : total >= rr.dc;
    const margin = total - rr.dc;
    const statHelp = STAT_HELP[rr.stat] || 'the relevant stat for this risk';

    setTimeout(async () => {
      setRollState({ spinning: false, die, mod, total, success, margin, stat: rr.stat, dc: rr.dc, reason: rr.reason, statHelp });
      const outcome = die === 20
        ? 'CRITICAL SUCCESS: natural 20 overrides the target.'
        : die === 1
          ? 'CRITICAL FAILURE: natural 1 fails regardless of the total.'
          : success
            ? 'SUCCESS: total meets or beats the DC.'
            : 'FAILURE: total is below the DC.';
      const marginText = die === 20 || die === 1 ? '' : ` Margin: ${Math.abs(margin)} ${success ? 'over' : 'short'}.`;
      const label = `${rr.stat.toUpperCase()} check - ${statHelp}\nTarget DC ${rr.dc}; d20 ${die} ${formatMod(mod)} = ${total}. ${outcome}${marginText}\nStakes: ${rr.reason}`;
      setPendingRoll(null);
      // Give the player a beat to see the result, then feed it to the Scribe
      setTimeout(() => sendTurn(label, 'roll'), 900);
    }, 1100);
  };
  const beginTale = () => sendTurn(
    `[The tale begins. ${char?.name} steps forward into ${taleScope}. Open a standalone story from my backstory and the module lore. Remember the player has World Map, Battle Map, Astragal dice, Declare/Speak, Hercules combat, Argus inventory, Castor abilities, Bazaar trade, Questor quests, Lark messages, Scribe, Grimoire, Bestiary, Party proximity, and Sheet tools available; the DM/backend handles hidden state. Give me a hook.]`,
    'player',
  );

  const concludeTale = async () => {
    if (!tale || !window.confirm('End this Tales session? The Scribe will commit the record to the timeline even if the story is unfinished.')) return;
    setLoading(true);
    setError(null);
    try {
      const epilogue = "The session ended at the player's request before every thread was resolved. The Scribe sealed the lore, choices, and unfinished paths into the archive for the timeline.";
      const endedTurn = await saveTurn(tale.id, 'system', 'The Tales session was ended by the player and committed to the timeline.');
      const { tale: sealed } = await concludeTaleRecord({ tale, char, campaignId: cid, epilogue });
      setTale(sealed);
      setTurns(prev => [...prev, endedTurn].filter(Boolean));
      setPendingRoll(null);
      setRollState(null);
    } catch (e) {
      setError(e?.message || 'The archives resisted the conclusion.');
    } finally {
      setLoading(false);
    }
  };

  if (!char?.id || !cid) return null;

  const activeRollStat = pendingRoll?.stat || null;
  const activeRollMod = activeRollStat ? statModifier(char?.stats?.[activeRollStat] ?? 8) : 0;
  const activeRollHelp = activeRollStat ? (STAT_HELP[activeRollStat] || 'the relevant stat for this risk') : '';
  const axis = pendingRoll ? STAT_AXIS[pendingRoll.stat] : 'magic';
  const axisColor = axis === 'magic' ? COLORS.magic : COLORS.tech;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>

      {/* ── Scene header ── */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.borderMid}`, background: COLORS.card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.magicText, opacity: 0.7 }}>The Scribe's Tale</div>
          <div style={{ fontSize: 15, color: COLORS.landing, fontWeight: 600 }}>{tale?.title || '…'}</div>
          <div style={{ fontSize: 12, color: COLORS.magicText, opacity: 0.85, fontStyle: 'italic' }}>{tale?.scene}</div>
        </div>
        {/* Tension meter */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.landing, opacity: 0.5, marginBottom: 3 }}>
            {TENSION_LABELS[tale?.tension || 1]}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                width: 16, height: 5, borderRadius: 2,
                background: i <= (tale?.tension || 1)
                  ? (i >= 4 ? '#b8574a' : COLORS.magic)
                  : 'rgba(240,238,235,0.1)',
                transition: 'background 0.4s',
              }} />
            ))}
          </div>
        </div>
        {turns.length > 0 && !taleEnded && (
          <button onClick={concludeTale} title="End session and commit to timeline"
            style={{ background: 'none', border: `1px solid ${COLORS.borderMid}`, color: COLORS.landing, opacity: 0.72, borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
            End Session
          </button>
        )}
        {taleEnded && (
          <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.magicText, opacity: 0.75 }}>
            Session sealed
          </div>
        )}
      </div>

      {/* ── Transcript ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, WebkitOverflowScrolling: 'touch' }}>
        {turns.length === 0 && !loading && (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 380 }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 12px', borderRadius: '50%', border: `1px solid ${COLORS.magicDim}`, background: COLORS.wizard, display: 'grid', placeItems: 'center', boxShadow: '0 0 24px rgba(111,158,120,0.12)' }}>
              <img src="/scribe-emblem.png" alt="The Scribe" draggable={false} style={{ width: '68%', height: '68%', objectFit: 'contain', pointerEvents: 'none' }} />
            </div>
            <div style={{ color: COLORS.magicText, fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              "You wish me to <b>weave</b> a fate rather than record one? …Very well, {char?.name}. Sit. The ink is patient. You will not be."
            </div>
            <button onClick={beginTale} disabled={loading}
              style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, color: COLORS.magicText, borderRadius: 10, padding: '10px 22px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
              Begin the Tale
            </button>
          </div>
        )}

        {turns.filter(t => t.role !== 'system').map(t => (
          <div key={t.id} style={{
            alignSelf: t.role === 'scribe' ? 'flex-start' : 'flex-end',
            maxWidth: '86%',
            background: t.role === 'scribe' ? COLORS.card : t.role === 'roll' ? COLORS.techBg : COLORS.magicBg,
            border: `1px solid ${t.role === 'scribe' ? COLORS.borderMid : t.role === 'roll' ? COLORS.techDim : COLORS.magicDim}`,
            borderRadius: t.role === 'scribe' ? '12px 12px 12px 3px' : '12px 12px 3px 12px',
            padding: '9px 13px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.55, marginBottom: 3, color: t.role === 'scribe' ? COLORS.magicText : t.role === 'roll' ? COLORS.techText : COLORS.landing }}>
              {t.role === 'scribe' ? 'The Scribe' : t.role === 'roll' ? 'The Dice' : char?.name || 'You'}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: COLORS.landing, whiteSpace: 'pre-wrap' }}>{t.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', color: COLORS.magicText, fontStyle: 'italic', fontSize: 13, opacity: 0.8, padding: '4px 8px' }}>
            The quill moves<span className="tale-dots">…</span>
          </div>
        )}

        {/* ── Roll card ── */}
        {pendingRoll && !loading && (
          <div style={{ alignSelf: 'center', width: '100%', maxWidth: 380, background: COLORS.card, border: `1px solid ${axisColor}`, borderRadius: 12, padding: 14, textAlign: 'center', boxShadow: `0 0 24px ${axis === 'magic' ? 'rgba(111,158,120,0.15)' : 'rgba(74,136,184,0.15)'}` }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: axisColor, marginBottom: 4 }}>The Scribe demands proof</div>
            <div style={{ fontSize: 15, color: COLORS.landing, fontWeight: 700, marginBottom: 2 }}>
              {pendingRoll.stat.toUpperCase()} · DC {pendingRoll.dc}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.landing, opacity: 0.76, fontStyle: 'italic', marginBottom: 8 }}>{pendingRoll.reason}</div>
            <div style={{ fontSize: 11.5, color: COLORS.landing, opacity: 0.58, lineHeight: 1.45, marginBottom: 10 }}>
              {pendingRoll.stat.toUpperCase()} measures {activeRollHelp}. Roll d20 {formatMod(activeRollMod)} against DC {pendingRoll.dc}; meet or beat the DC to succeed.
            </div>
            {!rollState && (
              <button onClick={handleRoll}
                style={{ background: axis === 'magic' ? COLORS.magicBg : COLORS.techBg, border: `1px solid ${axisColor}`, color: axis === 'magic' ? COLORS.magicText : COLORS.techText, borderRadius: 10, padding: '9px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Roll d20 ({formatMod(activeRollMod)})
              </button>
            )}
            {rollState?.spinning && <div style={{ fontSize: 30, animation: 'tale-spin 0.5s linear infinite', display: 'inline-block' }}>⬡</div>}
            {rollState && !rollState.spinning && (
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: rollState.success ? COLORS.magic : '#b8574a' }}>{rollState.total}</div>
                <div style={{ fontSize: 12, color: COLORS.landing, opacity: 0.76, lineHeight: 1.45 }}>
                  d20 {rollState.die} {formatMod(rollState.mod)} = {rollState.total}; DC {rollState.dc}. {rollState.die === 20 ? 'Natural 20: critical success.' : rollState.die === 1 ? 'Natural 1: critical failure.' : rollState.success ? `Success by ${rollState.margin}.` : `Short by ${Math.abs(rollState.margin)}.`}
                </div>
                <div style={{ fontSize: 11, color: COLORS.landing, opacity: 0.55, lineHeight: 1.45, marginTop: 4 }}>
                  {rollState.stat.toUpperCase()} measured {rollState.statHelp}. Stakes: {rollState.reason}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ alignSelf: 'center', color: '#b8574a', fontSize: 12.5, background: 'rgba(184,87,74,0.1)', border: '1px solid rgba(184,87,74,0.3)', borderRadius: 8, padding: '6px 12px' }}>
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: `1px solid ${COLORS.borderMid}`, background: COLORS.card, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder={taleEnded ? 'Session ended and committed to the timeline.' : pendingRoll ? 'The Scribe awaits your roll...' : turns.length === 0 ? 'Or begin with your own words...' : 'What do you do?'}
          disabled={loading || !!pendingRoll || taleEnded}
          style={{ flex: 1, background: COLORS.wizard, border: `1px solid ${COLORS.borderMid}`, borderRadius: 10, padding: '10px 13px', color: COLORS.landing, fontSize: 14, outline: 'none', opacity: pendingRoll || taleEnded ? 0.5 : 1 }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim() || !!pendingRoll || taleEnded}
          style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, color: COLORS.magicText, borderRadius: 10, padding: '0 18px', fontSize: 14, fontWeight: 600, cursor: loading || pendingRoll || taleEnded ? 'default' : 'pointer', opacity: loading || !input.trim() || pendingRoll || taleEnded ? 0.5 : 1 }}>
          Act
        </button>
      </div>

      <style>{`
        @keyframes tale-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
