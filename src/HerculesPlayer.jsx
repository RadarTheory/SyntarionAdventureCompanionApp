import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS, ACTIONS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function getCharacterActions(char) {
  if (!ACTIONS) return [];
  const all = [];
  Object.entries(ACTIONS).forEach(([category, actions]) => {
    if (category === 'magic' && char?.cp !== 'magic') return;
    if (category === 'tech' && char?.cp !== 'tech') return;
    actions.forEach(action => all.push({ action, category }));
  });
  return all;
}

function AttackButton({ row, char, sessionId, onRolled }) {
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(null);
  const actions = getCharacterActions(char);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const rollAttack = async (actionName) => {
    if (!sessionId || rolling) return;
    setRolling(actionName);
    setOpen(false);
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = Number(char?.actionBonuses?.[actionName] || 0);
    const total = roll + modifier;
    const target = row.character_name || 'target';
    const actorName = char?.name || char?.character_name || 'Player';
    await supabase.from('hercules_events').insert({
      session_id: sessionId,
      type: 'action',
      actor_name: actorName,
      actor_id: char?.id ? String(char.id) : null,
      description: `${actorName} attacks ${target} with ${actionName}: d20 ${roll}${modifier ? ` + ${modifier}` : ''} = ${total}.`,
    });
    setRolling(null);
    onRolled?.();
  };

  if (actions.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!!rolling}
        style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.45)', color: '#e8c84a', borderRadius: 5, padding: '3px 8px', cursor: rolling ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
      >
        {rolling ? 'Rolling…' : '⚔ Attack'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10000, background: '#100d0a', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 8, minWidth: 180, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', marginTop: 4 }}>
          {actions.map(({ action, category }) => (
            <button key={action} onClick={() => rollAttack(action)}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '9px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,74,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text, letterSpacing: '0.06em' }}>{action}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {char?.actionBonuses?.[action] ? <div style={{ fontSize: 8, color: COLORS.magic }}>{char.actionBonuses[action] > 0 ? '+' : ''}{char.actionBonuses[action]}</div> : null}
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{category}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerVitalsPanel({ row, onClose }) {
  const VITALS_KEY = `syntarion_vitals_${row.character_id}`;
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '{}')[k] ?? def; } catch { return def; } };
  const vitals  = { current: load('vitals', 0),   max: load('vitalsMax', 0) };
  const stamina = { current: load('stamina', 0),  max: load('staminaMax', 0) };
  const resolve = { current: load('resolve', 0),  max: load('resolveMax', 0) };

  const Bar = ({ label, color, current, max }) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 8, color, letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, color }}>
            {current} <span style={{ fontSize: 9, color: COLORS.dim }}>/ {max}</span>
          </div>
        </div>
        <div style={{ height: 4, background: `${color}22`, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'rgba(20,14,10,0.95)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: COLORS.text }}>{row.character_name} — Health</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '1px 5px', cursor: 'pointer', fontSize: 9, color: COLORS.dim }}>✕</button>
      </div>
      <Bar label="Vitals"  color="#e05a5a" current={vitals.current}  max={vitals.max} />
      <Bar label="Stamina" color="#e08a5a" current={stamina.current} max={stamina.max} />
      <Bar label="Resolve" color="#79f5a7" current={resolve.current} max={resolve.max} />
      <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia,serif', fontStyle: 'italic', marginTop: 4 }}>
        The Architect manages your health pool.
      </div>
    </div>
  );
}

export default function HerculesPlayer({ campaignId, char }) {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRoll, setSubmittedRoll] = useState(null);
  const [vitalsOpen, setVitalsOpen] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const [moveNote, setMoveNote] = useState('');
  const bottomRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();
    const sub = supabase.channel(`hercules-player-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_sessions' }, loadSession)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_events' }, () => { const sid = sessionRef.current?.id; if (sid) loadEvents(sid); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_initiative' }, () => { const sid = sessionRef.current?.id; if (sid) loadInitiative(sid); })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events.length]);

  const loadSession = async () => {
    const { data } = await supabase.from('hercules_sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    setSession(data || null);
    sessionRef.current = data || null;
    if (data?.id) { loadEvents(data.id); loadInitiative(data.id); }
    else { setEvents([]); setInitiative([]); setSubmitted(false); }
  };

  const loadEvents = async (sid) => {
    const { data } = await supabase.from('hercules_events').select('*').eq('session_id', sid).order('created_at', { ascending: true });
    if (data) setEvents(data);
  };

  const loadInitiative = async (sid) => {
    const { data } = await supabase.from('hercules_initiative').select('*').eq('session_id', sid).order('turn_order', { ascending: false });
    if (data) setInitiative(data);
  };

  const rollInitiative = async () => {
    if (!session?.id || rolling) return;
    setRolling(true);
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = Number(char?.initiative_modifier ?? char?.dex_mod ?? 0);
    const turnOrder = roll + modifier;
    const { error } = await supabase.from('hercules_initiative').insert({
      session_id: session.id,
      character_id: char?.id ? String(char.id) : null,
      character_name: char?.name || char?.character_name || 'Player',
      roll, modifier, turn_order: turnOrder,
    });
    if (!error) {
      await supabase.from('hercules_events').insert({
        session_id: session.id,
        type: 'initiative',
        actor_name: char?.name || char?.character_name || 'Player',
        actor_id: char?.id ? String(char.id) : null,
        description: `${char?.name || char?.character_name || 'Player'} rolled initiative.`,
      });
      setSubmitted(true);
      setSubmittedRoll({ roll, modifier, total: turnOrder });
      await loadInitiative(session.id);
    }
    setRolling(false);
  };

  const submitMoveRequest = async () => {
    if (!moveNote.trim() || !session?.id) return;
    await supabase.from('hercules_events').insert({
      session_id: session.id,
      type: 'move_request',
      actor_name: char?.name || 'Player',
      actor_id: char?.id ? String(char.id) : null,
      description: `${char?.name || 'Player'} requests to move: ${moveNote.trim()}`,
    });
    setMoveNote('');
    setMoveMode(false);
  };

  const alreadyRolled = submitted || initiative.some(r => String(r.character_id) === String(char?.id));
  const currentTurn = session?.current_turn ?? 0;

  if (!session) {
    return (
      <div style={{ padding: '20px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No active combat. The Architect will call for battle.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px' }}>

      {/* Initiative roll */}
      {!alreadyRolled ? (
        <div style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#e8c84a', marginBottom: 8 }}>⚔ Roll Initiative</div>
          <button onClick={rollInitiative} disabled={rolling} style={{ background: 'rgba(200,168,74,0.18)', border: '1px solid #c8a84a', borderRadius: 8, padding: '9px 24px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', fontWeight: 700 }}>
            {rolling ? 'Rolling…' : 'Roll d20'}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: COLORS.magic, fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
          ✓ Initiative submitted
          {submittedRoll && <span style={{ color: '#e8c84a' }}> — {submittedRoll.total} ({submittedRoll.roll}{submittedRoll.modifier ? ` + ${submittedRoll.modifier}` : ''})</span>}
        </div>
      )}

      {/* Move request — shown once initiative is submitted */}
      {session && alreadyRolled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => setMoveMode(m => !m)}
            style={{ background: moveMode ? 'rgba(121,245,167,0.15)' : 'rgba(240,238,235,0.05)', border: `1px solid ${moveMode ? 'rgba(121,245,167,0.5)' : COLORS.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', color: moveMode ? '#79f5a7' : COLORS.dim }}
          >
            {moveMode ? '✥ Move Mode — describe your destination below' : '✥ Request Move'}
          </button>
          {moveMode && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={moveNote}
                onChange={e => setMoveNote(e.target.value)}
                placeholder="e.g. behind the pillar…"
                style={{ flex: 1, background: COLORS.card, border: '1px solid rgba(121,245,167,0.3)', borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter') submitMoveRequest(); }}
              />
              <button onClick={submitMoveRequest} disabled={!moveNote.trim()} style={{ background: 'rgba(121,245,167,0.12)', border: '1px solid rgba(121,245,167,0.4)', borderRadius: 6, padding: '7px 12px', cursor: moveNote.trim() ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#79f5a7', opacity: moveNote.trim() ? 1 : 0.5 }}>Send</button>
              <button onClick={() => { setMoveMode(false); setMoveNote(''); }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Turn order */}
      {initiative.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ ...label8(), padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>Turn Order</div>
          {initiative.map((row, i) => {
            const isOwn = String(row.character_id) === String(char?.id);
            const isActive = i === currentTurn && row.status !== 'dead';
            const isDead = row.status === 'dead';
            const isCreature = !row.character_id || row.character_id === row.character_name;
            return (
              <div key={row.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: isActive ? 'rgba(200,168,74,0.10)' : isOwn ? 'rgba(100,200,120,0.06)' : 'transparent', borderBottom: `1px solid ${COLORS.border}`, opacity: isDead ? 0.4 : 1, textDecoration: isDead ? 'line-through' : 'none' }}>
                  <div style={{ width: 12, flexShrink: 0 }}>
                    {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8c84a' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isActive && <div style={{ fontSize: 7, color: '#e8c84a', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', marginBottom: 1 }}>▶ ACTIVE</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: isActive ? '#e8c84a' : isOwn ? '#9fe0aa' : COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i + 1}. {row.character_name}
                      </div>
                      <div style={{ fontSize: 7, color: isCreature ? '#e08b7d' : '#9fe0aa', background: isCreature ? 'rgba(180,55,45,0.12)' : 'rgba(80,180,100,0.10)', border: `1px solid ${isCreature ? 'rgba(220,90,70,0.35)' : 'rgba(100,200,120,0.3)'}`, borderRadius: 3, padding: '1px 4px', flexShrink: 0, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>
                        {isCreature ? 'ENEMY' : 'PC'}
                      </div>
                      {isOwn && <div style={{ fontSize: 7, color: '#9fe0aa', fontFamily: "'Cinzel', serif" }}>YOU</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {!isOwn && !isDead && (
                      <AttackButton row={row} char={char} sessionId={session?.id} onRolled={() => loadEvents(session?.id)} />
                    )}
                    {isOwn && (
                      <button onClick={() => setVitalsOpen(v => v === row.id ? null : row.id)} style={{ background: vitalsOpen === row.id ? 'rgba(224,90,90,0.2)' : 'rgba(224,90,90,0.08)', border: `1px solid rgba(224,90,90,${vitalsOpen === row.id ? 0.7 : 0.3})`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10, color: '#e05a5a' }}>♥</button>
                    )}
                    <div style={{ color: '#e8d9a7', fontSize: 16, fontFamily: 'Georgia, serif', minWidth: 20, textAlign: 'right' }}>{row.total ?? row.turn_order}</div>
                  </div>
                </div>
                {vitalsOpen === row.id && (
                  <div style={{ padding: '0 12px 8px' }}>
                    <PlayerVitalsPanel row={row} onClose={() => setVitalsOpen(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Combat log */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ ...label8(), padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>Combat Log</div>
        <div style={{ maxHeight: 220, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.length === 0
            ? <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Awaiting events…</div>
            : events.map(ev => (
              <div key={ev.id} style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ fontSize: 8, color: COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>{ev.actor_name}</div>
                  {ev.total != null && <div style={{ fontSize: 11, color: '#e8c84a', fontFamily: "'Cinzel', serif", flexShrink: 0 }}>{ev.total}</div>}
                </div>
                <div style={{ fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>{ev.description}</div>
                {ev.outcome && (
                  <div style={{ fontSize: 9, color: ev.dm_approved ? '#9fe0aa' : '#e08b7d', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
                    {ev.outcome}
                  </div>
                )}
              </div>
            ))
          }
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
