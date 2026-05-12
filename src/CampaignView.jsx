import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_STATS, ALL_CLASSES, ACTIONS, getRaceDisplay } from './constants';
import { LOCATIONS } from './MapPanel';
import VTTViewer from './VTTViewer';
import Astragal from './Astragal';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const FULL_TITLES = {
  'I':   'The Investigation of the Corren Mountain Mines',
  'II':  'The Search of Cielo Dorado',
  'III': 'An Offering to Aeirhyd',
  'IV':  'Frigid Dirge in Galekgarde',
};

// ─── EIGHT STATS ──────────────────────────────────────────────────────────────
const MAGIC_STATS = [
  { key: 'spirit',  label: 'Spirit',  equiv: 'Charisma',     axis: 'magic' },
  { key: 'soul',    label: 'Soul',    equiv: 'Faith',        axis: 'magic' },
  { key: 'body',    label: 'Body',    equiv: 'Constitution', axis: 'magic' },
  { key: 'essence', label: 'Essence', equiv: 'Wisdom',       axis: 'magic' },
];
const TECH_STATS = [
  { key: 'will',  label: 'Will',  equiv: 'Strength',     axis: 'tech' },
  { key: 'whim',  label: 'Whim',  equiv: 'Dexterity',    axis: 'tech' },
  { key: 'mind',  label: 'Mind',  equiv: 'Intelligence', axis: 'tech' },
  { key: 'dream', label: 'Dream', equiv: 'Intent',       axis: 'tech' },
];
const ALL_EIGHT = [...MAGIC_STATS, ...TECH_STATS];

// Equipment slot definitions
const APPAREL_SLOTS  = ['Head', 'Torso', 'Waist', 'Hands', 'Greaves', 'Boots'];
const WEAPON_SLOTS   = ['Main Hand', 'Off-Hand', 'Side-Weapon', 'Heavy'];
const ACCESSORY_SLOTS = ['Ring I', 'Ring II', 'Neck', 'Charm', 'Relic', 'Artifact'];

// All stat keys for item bonus selectors
const STAT_KEYS = ALL_EIGHT.map(s => s.key);
const DISCIPLINE_KEYS = [
  'sanctus','chiasma','mana','gnosis','wraill','shaeid',
  'gain','grit','focus','matter','ingenuity','fortitude','reason',
];

// axis colors
const axisColor = axis => axis === 'magic' ? COLORS.magic : COLORS.tech;
const axisText  = axis => axis === 'magic' ? COLORS.magicText : COLORS.techText;

// ─── SESSION TIMER ────────────────────────────────────────────────────────────
function useSessionTimer(campaignId) {
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed]     = useState(0);
  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      const { data } = await supabase.from('sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: true }).limit(1).maybeSingle();
      setStartedAt(data?.started_at || data?.created_at || null);
    };
    load();
    const sub = supabase.channel(`timer-${campaignId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, load).subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return null;
  const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── DRAGGABLE FLOAT BUTTON ───────────────────────────────────────────────────
function FloatButton({ storageKey, defaultPos, children, onClick, title, hovered, onHover }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
  const [pos, setPos]       = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved  = useRef(false);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(pos)); }, [pos]);

  const clamp = (x, y) => ({ x: Math.max(8, Math.min(window.innerWidth - 90, x)), y: Math.max(8, Math.min(window.innerHeight - 90, y)) });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      moved.current = true;
      setPos(clamp(p.clientX - offset.current.x, p.clientY - offset.current.y));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [dragging]);

  return (
    <button title={title}
      onMouseDown={e => { offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; moved.current = false; setDragging(true); }}
      onTouchStart={e => { const p = e.touches[0]; offset.current = { x: p.clientX - pos.x, y: p.clientY - pos.y }; moved.current = false; setDragging(true); }}
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: 72, height: 72, borderRadius: '50%', border: hovered ? '1px solid rgba(230,210,160,0.92)' : '1px solid rgba(201,185,145,0.45)', background: hovered ? 'rgba(18,14,10,0.96)' : 'rgba(10,8,6,0.82)', cursor: dragging ? 'grabbing' : 'grab', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden', transform: hovered ? 'translateY(-2px) scale(1.04)' : 'none', boxShadow: hovered ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)' : '0 10px 28px rgba(0,0,0,0.55)', transition: dragging ? 'none' : 'all 0.18s ease', backdropFilter: 'blur(8px)', touchAction: 'none' }}>
      {children}
    </button>
  );
}

// ─── HERCULES LITE ────────────────────────────────────────────────────────────
function HerculesLite({ campaignId, char, onClose }) {
  const [session, setSession]         = useState(null);
  const [events, setEvents]           = useState([]);
  const [initiative, setInitiative]   = useState([]);
  const [rolling, setRolling]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submittedRoll, setSubmittedRoll] = useState(null);
  const bottomRef  = useRef(null);
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);

  const loadSession = async () => {
    const { data } = await supabase.from('hercules_sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    setSession(data || null);
    sessionRef.current = data || null;
    if (data?.id) { loadEvents(data.id); loadInitiative(data.id); }
    else { setEvents([]); setInitiative([]); setSubmitted(false); }
  };

  const loadEvents = async (sid) => {
    const { data, error } = await supabase.from('hercules_events').select('*').eq('session_id', sid);
    if (error) { console.error('Failed to load Hercules events:', error); return; }
    if (data) setEvents(data);
  };

  const loadInitiative = async (sid) => {
    const { data, error } = await supabase.from('hercules_initiative').select('*').eq('session_id', sid).order('turn_order', { ascending: false });
    if (error) { console.error('Failed to load Hercules initiative:', error); return; }
    if (data) setInitiative(data);
  };

  const rollInitiative = async () => {
    if (!session?.id || rolling) return;
    setRolling(true);
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = Number(char?.initiative_modifier ?? char?.dex_mod ?? 0);
    const turnOrder = roll + modifier;
    const { data: initiativeRow, error: initiativeError } = await supabase.from('hercules_initiative').insert({ session_id: session.id, character_id: char?.id ? String(char.id) : null, character_name: char?.name || char?.character_name || 'Player', roll, modifier, turn_order: turnOrder }).select().single();
    if (initiativeError) { console.error('Failed to submit Hercules initiative:', initiativeError); setRolling(false); return; }
    await supabase.from('hercules_events').insert({ session_id: session.id, type: 'initiative', actor_name: char?.name || char?.character_name || 'Player', actor_id: char?.id ? String(char.id) : null, description: `${char?.name || char?.character_name || 'Player'} rolled initiative.` });
    setSubmitted(true);
    setSubmittedRoll({ roll, modifier, total: turnOrder });
    setRolling(false);
    await loadInitiative(session.id);
  };

  const alreadyRolled = submitted || initiative.some(r => r.character_id === char?.id);

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 340, maxHeight: 560, zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(200,168,74,0.35)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(200,168,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(200,168,74,0.06)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8d9a7', letterSpacing: '0.14em' }}>HERCULES</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{session ? 'Combat Active' : 'Awaiting Combat'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!session ? (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No active combat. The Architect will call for battle.</div>
        ) : (
          <>
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
            {initiative.length > 0 && (
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ ...label8(), marginBottom: 8 }}>Turn Order</div>
                {initiative.map((row, i) => (
                  <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 6px', background: row.character_id === char?.id ? 'rgba(200,168,74,0.1)' : 'transparent', borderRadius: 4, marginBottom: 2 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: row.character_id === char?.id ? '#e8c84a' : COLORS.text }}>{i + 1}. {row.character_name}</div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#e8c84a' }}>{row.turn_order || row.roll}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ ...label8(), marginBottom: 8 }}>Combat Log</div>
              {events.length === 0 ? <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Awaiting events…</div> :
                events.map(ev => (
                  <div key={ev.id} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 8, color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>{ev.actor_name}</div>
                      {ev.total != null && <div style={{ fontSize: 11, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>{ev.total}</div>}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif' }}>{ev.description}</div>
                    {ev.outcome && <div style={{ fontSize: 9, color: ev.dm_approved ? COLORS.magic : COLORS.warn, fontStyle: 'italic' }}>{ev.outcome}</div>}
                  </div>
                ))
              }
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CAMPAIGN LIST ────────────────────────────────────────────────────────────
function CampaignList({ onSelect, userChar, onHome }) {
  const { isMobile } = useDevice();
  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb', fontFamily: 'Georgia, serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>
      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.4)', padding: 0 }}>← Home</button>
      </div>
      <div style={{ padding: isMobile ? '28px 20px 20px' : '36px 40px 24px', borderBottom: '1px solid rgba(26,23,20,0.08)' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 8 }}>Soteria · 178 E.U.</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1a1714' }}>CAMPAIGNS</div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.45)', marginTop: 8 }}>Select a campaign to enter the world.</div>
      </div>
      <div style={{ padding: isMobile ? '20px' : '28px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CAMPAIGNS.map((c, i) => {
          const isAssigned = userChar?.campaign === String(c.id);
          return (
            <button key={c.id} onClick={() => onSelect(c)} style={{ background: isAssigned ? 'rgba(26,23,20,0.04)' : '#fff', border: `1px solid ${isAssigned ? 'rgba(26,23,20,0.25)' : 'rgba(26,23,20,0.1)'}`, borderRadius: 8, padding: isMobile ? '18px 20px' : '20px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', width: '100%', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,23,20,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'none'; }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)' }}>Campaign {['I','II','III','IV'][i]}</div>
                  {isAssigned && <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: COLORS.magic, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '1px 6px' }}>✓ Your Campaign</div>}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>{c.subtitle}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,23,20,0.4)' }}>{FULL_TITLES[c.id] || c.name}</div>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(26,23,20,0.2)', marginLeft: 16 }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar({ stat, baseVal, itemBonus, conditionBonus }) {
  const total   = baseVal + itemBonus + conditionBonus;
  const pct     = Math.round(((total - 8) / 8) * 100);
  const color   = axisColor(stat.axis);
  const textCol = axisText(stat.axis);
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${color}22`, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: textCol }}>{stat.label}</div>
          <div style={{ fontSize: 8, color: COLORS.dim }}>{stat.equiv}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: textCol }}>{total}</div>
          {(itemBonus !== 0 || conditionBonus !== 0) && (
            <div style={{ fontSize: 8, color: COLORS.dim }}>
              {baseVal}{itemBonus !== 0 ? ` +${itemBonus}` : ''}{conditionBonus !== 0 ? ` +${conditionBonus}` : ''}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 3, background: `${color}33`, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: color, borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

// ─── SCALES PANEL ─────────────────────────────────────────────────────────────
function ScalesPanel({ char, effectiveStats }) {
  const vitals  = (effectiveStats.body  || 8) + (effectiveStats.will  || 8);
  const stamina = (effectiveStats.body  || 8) + (effectiveStats.whim  || 8);
  const resolve = (effectiveStats.soul  || 8) + (effectiveStats.dream || 8);

  // alignment raw value stored as number -4 to +4; default 0
  const alignVal = Number(char?.alignment ?? 0);
  const apCurrent = char?.apCurrent ?? 0;
  const apTotal   = char?.apTotal   ?? 0;
  const morality  = char?.morality ?? 0;

  const scaleRow = (label, val, maxVal, leftLabel, rightLabel, color) => {
    const pct = Math.max(0, Math.min(100, ((val - 0) / maxVal) * 100));
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: COLORS.text }}>{label}</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 800, color }}>{val}</div>
        </div>
        <div style={{ height: 6, background: `${color}22`, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
        </div>
        {(leftLabel || rightLabel) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{leftLabel}</div>
            <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{rightLabel}</div>
          </div>
        )}
      </div>
    );
  };

  // Alignment axis slider — -4 (Magic) to +4 (Tech)
  const alignPct = ((alignVal + 4) / 8) * 100;
  const alignColor = alignVal < 0 ? COLORS.magic : alignVal > 0 ? COLORS.tech : COLORS.muted;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ ...label8(), marginBottom: 14 }}>Derived Scales</div>

      {scaleRow('Vitals', vitals, 32, 'Body + Will', '', '#e05a5a')}
      {scaleRow('Stamina', stamina, 32, 'Body + Whim', '', '#e08a5a')}
      {scaleRow('Resolve', resolve, 32, 'Soul + Dream', '', COLORS.magic)}

      <div style={{ height: 1, background: COLORS.border, margin: '8px 0 16px' }} />
      <div style={{ ...label8(), marginBottom: 14 }}>Alignment Axis</div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText }}>Magic</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: alignColor, fontWeight: 700 }}>
            {alignVal === 0 ? 'Neutral' : alignVal < 0 ? `Magic ${alignVal}` : `Tech +${alignVal}`}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.techText }}>Tech</div>
        </div>
        <div style={{ position: 'relative', height: 8, background: `linear-gradient(to right, ${COLORS.magic}44, ${COLORS.border}, ${COLORS.tech}44)`, borderRadius: 4 }}>
          <div style={{ position: 'absolute', left: `${alignPct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: alignColor, border: `2px solid ${COLORS.surface}`, boxShadow: `0 0 8px ${alignColor}88` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          {[-4,-3,-2,-1,0,1,2,3,4].map(v => (
            <div key={v} style={{ fontSize: 7, color: v === alignVal ? alignColor : COLORS.dim, fontFamily: 'monospace', fontWeight: v === alignVal ? 700 : 400 }}>{v}</div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: COLORS.border, margin: '8px 0 16px' }} />
      <div style={{ ...label8(), marginBottom: 14 }}>Secondary Axes</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.techText }}>Will</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.techText }}>Whim</div>
        </div>
        <div style={{ position: 'relative', height: 5, background: COLORS.border, borderRadius: 3 }}>
          {(() => {
            const w = effectiveStats.will || 8, wh = effectiveStats.whim || 8, total = w + wh;
            const pct = total > 0 ? (w / total) * 100 : 50;
            return <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: COLORS.tech, borderRadius: 3 }} />;
          })()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <div style={{ fontSize: 8, color: COLORS.techText }}>{effectiveStats.will || 8}</div>
          <div style={{ fontSize: 8, color: COLORS.techText }}>{effectiveStats.whim || 8}</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText }}>Soul</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText }}>Spirit</div>
        </div>
        <div style={{ position: 'relative', height: 5, background: COLORS.border, borderRadius: 3 }}>
          {(() => {
            const s = effectiveStats.soul || 8, sp = effectiveStats.spirit || 8, total = s + sp;
            const pct = total > 0 ? (s / total) * 100 : 50;
            return <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: COLORS.magic, borderRadius: 3 }} />;
          })()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <div style={{ fontSize: 8, color: COLORS.magicText }}>{effectiveStats.soul || 8}</div>
          <div style={{ fontSize: 8, color: COLORS.magicText }}>{effectiveStats.spirit || 8}</div>
        </div>
      </div>

      <div style={{ height: 1, background: COLORS.border, margin: '8px 0 16px' }} />

      {/* AP & Morality */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Ability Points</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 800, color: COLORS.magic }}>{apCurrent}</div>
          <div style={{ fontSize: 8, color: COLORS.dim }}>of {apTotal} total</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Morality</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 800, color: morality >= 0 ? COLORS.magic : '#e05a5a' }}>{morality >= 0 ? `+${morality}` : morality}</div>
          <div style={{ fontSize: 8, color: COLORS.dim }}>alignment rep</div>
        </div>
      </div>

      {/* Discipline pools if char has them */}
      {char?.disciplines && Object.keys(char.disciplines).length > 0 && (
        <>
          <div style={{ height: 1, background: COLORS.border, margin: '16px 0' }} />
          <div style={{ ...label8(), marginBottom: 12 }}>Discipline Pools</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(char.disciplines).map(([key, val]) => val > 0 ? (
              <div key={key} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{key}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: COLORS.deity }}>{val}</div>
              </div>
            ) : null)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FULL CHARACTER SHEET (inline, dark) ──────────────────────────────────────
function CharacterSheetInline({ char, effectiveStats }) {
  const cls = ALL_CLASSES?.find(c => c.id === char.cid);

  return (
    <div>
      {/* Identity header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
          {char.name || 'Unnamed'}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 8 }}>
          {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}
          {char.belief ? ` · ${char.belief}` : ''}
        </div>
        {char.background && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>
            {char.background}
          </div>
        )}
      </div>

      {/* Magic axis stats */}
      <div style={{ ...label8(), marginBottom: 10, color: COLORS.magicText }}>Magic Axis</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {MAGIC_STATS.map(s => {
          const base = char.stats?.[s.key] || 8;
          const item = effectiveStats._itemBonuses?.[s.key] || 0;
          const cond = effectiveStats._conditionBonuses?.[s.key] || 0;
          return <StatBar key={s.key} stat={s} baseVal={base} itemBonus={item} conditionBonus={cond} />;
        })}
      </div>

      {/* Tech axis stats */}
      <div style={{ ...label8(), marginBottom: 10, color: COLORS.techText }}>Tech Axis</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TECH_STATS.map(s => {
          const base = char.stats?.[s.key] || 8;
          const item = effectiveStats._itemBonuses?.[s.key] || 0;
          const cond = effectiveStats._conditionBonuses?.[s.key] || 0;
          return <StatBar key={s.key} stat={s} baseVal={base} itemBonus={item} conditionBonus={cond} />;
        })}
      </div>
    </div>
  );
}

// ─── INVENTORY PANEL ──────────────────────────────────────────────────────────
// Items stored per-character in Supabase `character_items` table.
// Schema: { id, character_id, slot, name, description, attuned, bonuses: {stat: number, ...}, weight }
// If no table yet, we fall back to localStorage keyed by char.id for offline use.

function InventoryPanel({ char, onInventoryChange }) {
  // items: { [slot]: { name, description, attuned, bonuses } }
  const [items, setItems]         = useState({});
  const [editSlot, setEditSlot]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [draft, setDraft]         = useState(null);
  const [loadedFromDB, setLoadedFromDB] = useState(false);

  const STORAGE_KEY = `syntarion_inv_${char?.id}`;

  // Load items on mount
  useEffect(() => {
    if (!char?.id) return;
    (async () => {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('character_items')
          .select('*')
          .eq('character_id', String(char.id));
        if (!error && data) {
          const mapped = {};
          data.forEach(row => { mapped[row.slot] = { name: row.name, description: row.description || '', attuned: !!row.attuned, bonuses: row.bonuses || {} }; });
          setItems(mapped);
          setLoadedFromDB(true);
          onInventoryChange(mapped);
          return;
        }
      } catch (_) {}
      // Fallback: localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        setItems(stored);
        onInventoryChange(stored);
      } catch (_) {}
    })();
  }, [char?.id]);

  const openEdit = (slot) => {
    const existing = items[slot] || { name: '', description: '', attuned: false, bonuses: {} };
    setDraft({ ...existing, bonuses: { ...existing.bonuses } });
    setEditSlot(slot);
  };

  const saveItem = async () => {
    if (!editSlot) return;
    setSaving(true);
    const newItems = { ...items, [editSlot]: { ...draft } };
    // Remove empty slots
    if (!draft.name.trim()) delete newItems[editSlot];
    setItems(newItems);
    onInventoryChange(newItems);

    // Persist
    try {
      if (loadedFromDB) {
        // Upsert into Supabase
        const row = {
          character_id: String(char.id),
          slot: editSlot,
          name: draft.name.trim(),
          description: draft.description,
          attuned: draft.attuned,
          bonuses: draft.bonuses,
        };
        if (!draft.name.trim()) {
          await supabase.from('character_items').delete().eq('character_id', String(char.id)).eq('slot', editSlot);
        } else {
          await supabase.from('character_items').upsert(row, { onConflict: 'character_id,slot' });
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      }
    } catch (_) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    }
    setSaving(false);
    setEditSlot(null);
    setDraft(null);
  };

  const setBonusStat = (statKey, val) => {
    setDraft(d => ({ ...d, bonuses: { ...d.bonuses, [statKey]: Number(val) } }));
  };

  const renderSlotGroup = (title, slots) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ ...label8(), marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {slots.map(slot => {
          const item = items[slot];
          const hasItem = item && item.name;
          const isAttuned = hasItem && item.attuned;
          return (
            <button key={slot} onClick={() => openEdit(slot)}
              style={{ background: hasItem ? (isAttuned ? 'rgba(200,168,74,0.08)' : COLORS.card) : 'transparent', border: `1px solid ${hasItem ? (isAttuned ? 'rgba(200,168,74,0.4)' : COLORS.border) : `${COLORS.border}66`}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, minWidth: 80, letterSpacing: '0.1em' }}>{slot}</div>
                  {hasItem && (
                    <>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      {isAttuned && <div style={{ fontSize: 7, color: '#e8c84a', fontFamily: "'Cinzel', serif", background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>ATTUNED</div>}
                    </>
                  )}
                  {!hasItem && <div style={{ fontSize: 10, color: `${COLORS.dim}66`, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Empty</div>}
                </div>
                {/* Bonus preview */}
                {hasItem && item.bonuses && Object.entries(item.bonuses).some(([,v]) => v !== 0) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {Object.entries(item.bonuses).filter(([,v]) => v !== 0).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 7, color: v > 0 ? COLORS.magic : '#e05a5a', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
                        {v > 0 ? '+' : ''}{v} {k}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: COLORS.dim, marginLeft: 8, flexShrink: 0 }}>✎</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {renderSlotGroup('Apparel', APPAREL_SLOTS)}
      {renderSlotGroup('Weapons', WEAPON_SLOTS)}
      {renderSlotGroup('Accessories', ACCESSORY_SLOTS)}

      {/* Edit modal */}
      {editSlot !== null && draft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 300000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text, letterSpacing: '0.1em' }}>EQUIP ITEM</div>
                <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>{editSlot}</div>
              </div>
              <button onClick={() => { setEditSlot(null); setDraft(null); }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Item Name</div>
                <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Silverweave Cowl"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', fontSize: 12, color: COLORS.text, outline: 'none' }} />
              </div>

              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Description / Notes</div>
                <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  rows={3} placeholder="Item lore, special properties…"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'vertical' }} />
              </div>

              {/* Attuned toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setDraft(d => ({ ...d, attuned: !d.attuned }))}
                  style={{ background: draft.attuned ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${draft.attuned ? 'rgba(200,168,74,0.6)' : COLORS.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: draft.attuned ? '#e8c84a' : COLORS.dim, letterSpacing: '0.1em' }}>
                  {draft.attuned ? '⬡ Attuned' : '⬢ Not Attuned'}
                </button>
                <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {draft.attuned ? 'Bonuses active' : 'Bonuses inactive'}
                </div>
              </div>

              {/* Stat bonuses */}
              <div>
                <div style={{ ...label8(), marginBottom: 10 }}>Stat Bonuses (applies when attuned)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ALL_EIGHT.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: axisText(s.axis), width: 50 }}>{s.label}</div>
                      <input
                        type="number"
                        value={draft.bonuses?.[s.key] || 0}
                        onChange={e => setBonusStat(s.key, e.target.value)}
                        style={{ width: 48, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Discipline bonuses */}
              <div>
                <div style={{ ...label8(), marginBottom: 10 }}>Discipline Pool Bonuses</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {DISCIPLINE_KEYS.map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.deity, width: 60, letterSpacing: '0.08em' }}>{k}</div>
                      <input
                        type="number"
                        value={draft.bonuses?.[k] || 0}
                        onChange={e => setBonusStat(k, e.target.value)}
                        style={{ width: 48, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveItem} disabled={saving}
                style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 8, padding: '10px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.magicText, fontWeight: 700, letterSpacing: '0.1em' }}>
                {saving ? 'Saving…' : '✦ Save Item'}
              </button>
              {(items[editSlot]?.name) && (
                <button onClick={async () => {
                  setDraft(d => ({ ...d, name: '' }));
                  await saveItem();
                }} style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e05a5a' }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Sheet', 'Scales', 'Actions', 'Inventory', 'Log'];

function CampaignDashboard({ campaign, userChar, onBack, onAssign }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab]     = useState('Map');
  const [assigning, setAssigning]     = useState(false);
  const [showAstragal, setShowAstragal] = useState(false);
  const [showHercules, setShowHercules] = useState(false);
  const [astHovered, setAstHovered]   = useState(false);
  const [hercHovered, setHercHovered] = useState(false);
  const [rollingAction, setRollingAction] = useState(null);
  const [inventory, setInventory]     = useState({});
  const timer = useSessionTimer(campaign.id);
  const isAssigned = userChar?.campaign === String(campaign.id);

  // Compute effective stats = base stats + attuned item bonuses
  const effectiveStats = (() => {
    const base = userChar?.stats || {};
    const itemBonuses = {};
    const conditionBonuses = {};
    Object.values(inventory).forEach(item => {
      if (item?.attuned && item?.bonuses) {
        Object.entries(item.bonuses).forEach(([k, v]) => {
          itemBonuses[k] = (itemBonuses[k] || 0) + Number(v);
        });
      }
    });
    const effective = {};
    ALL_EIGHT.forEach(s => {
      effective[s.key] = (base[s.key] || 8) + (itemBonuses[s.key] || 0);
    });
    effective._itemBonuses      = itemBonuses;
    effective._conditionBonuses = conditionBonuses;
    return effective;
  })();

  const rollAction = async (action) => {
    if (!userChar?.id || !campaign?.id || rollingAction) return;
    setRollingAction(action);
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = Number(userChar.actionBonuses?.[action] || 0);
    const total = roll + modifier;
    const { data: hsession, error: sessionError } = await supabase.from('hercules_sessions').select('id').eq('campaign_id', String(campaign.id)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (sessionError || !hsession?.id) { console.error('No active Hercules session found for action roll:', sessionError); setRollingAction(null); return; }
    await supabase.from('hercules_events').insert({ session_id: hsession.id, type: 'action', actor_name: userChar.name || 'Player', actor_id: String(userChar.id), description: `${userChar.name || 'Player'} used ${action}: d20 ${roll}${modifier ? ` + ${modifier}` : ''} = ${total}.` });
    setRollingAction(null);
  };

  const handleAssign = async () => {
    if (!userChar?.id) return;
    setAssigning(true);
    await supabase.from('characters').update({ campaign_id: String(campaign.id) }).eq('id', userChar.id);
    setAssigning(false); onAssign(String(campaign.id));
  };

  const logRoll = async payload => {
    const { data: hsession, error: sessionError } = await supabase.from('hercules_sessions').select('id').eq('campaign_id', String(campaign.id)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (sessionError || !hsession?.id) { console.error('No active Hercules session found for Astragal roll:', sessionError); return; }
    const dice = payload?.diceResults || payload?.results || payload?.rolls || payload?.dice || [];
    const diceList = Array.isArray(dice) ? dice.map(d => Number(d?.value ?? d?.roll ?? d)).filter(n => !Number.isNaN(n)) : [];
    const notation = payload?.notation || `${payload?.count || diceList.length || 1}d${payload?.sides || payload?.die || 20}`;
    const diceTotal = payload?.diceTotal ?? diceList.reduce((sum, v) => sum + v, 0);
    const statModifier = Number(payload?.statModifier ?? payload?.statMod ?? 0);
    const flatModifier = Number(payload?.flatModifier ?? payload?.modifier ?? 0);
    const total = Number(payload?.total ?? payload?.result ?? diceTotal + statModifier + flatModifier);
    const diceText = diceList.length ? diceList.join(', ') : String(total);
    await supabase.from('hercules_events').insert({ session_id: hsession.id, type: 'roll', actor_name: userChar?.name || 'Player', actor_id: userChar?.id ? String(userChar.id) : null, description: `${userChar?.name || 'Player'} rolled a ${diceText} in Astragal for a TOTAL of ${total}.` });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Map':
        return <VTTViewer campaignId={String(campaign.id)} userChar={userChar} />;

      case 'Sheet':
        return userChar
          ? <CharacterSheetInline char={userChar} effectiveStats={effectiveStats} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Scales':
        return userChar
          ? <ScalesPanel char={userChar} effectiveStats={effectiveStats} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Actions':
        return userChar ? (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Your Actions</div>
            {Object.entries(ACTIONS).map(([category, actions]) => {
              if (category === 'magic' && userChar.cp !== 'magic') return null;
              if (category === 'tech'  && userChar.cp !== 'tech')  return null;
              return (
                <div key={category} style={{ marginBottom: 16 }}>
                  <div style={{ ...label8(), marginBottom: 8, color: COLORS.dim }}>{category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {actions.map(action => (
                      <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '7px 10px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{action}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 10, color: userChar.actionBonuses?.[action] ? COLORS.magicText : COLORS.dim, minWidth: 24, textAlign: 'right' }}>
                            {userChar.actionBonuses?.[action] ? `+${userChar.actionBonuses[action]}` : '+0'}
                          </div>
                          <button type="button" onClick={() => rollAction(action)} disabled={rollingAction === action}
                            style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.45)', color: '#e8c84a', borderRadius: 5, padding: '4px 8px', cursor: rollingAction === action ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.08em' }}>
                            {rollingAction === action ? 'Rolling…' : 'Roll'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Inventory':
        return userChar
          ? <InventoryPanel char={userChar} onInventoryChange={setInventory} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Log':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Session Log</div>
            <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No session logs yet. The Scribe will write here.</div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* Floating Astragal button */}
      <FloatButton storageKey="playerAstragalPos" defaultPos={{ x: 24, y: 180 }} onClick={() => setShowAstragal(o => !o)} title="Astragal — Roll the dice" hovered={astHovered} onHover={setAstHovered}>
        <svg viewBox="0 0 40 40" style={{ width: '60%', height: '60%' }}>
          <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={astHovered ? '#e8d9a7' : '#c9b991'} strokeWidth="1.5"/>
          <text x="20" y="25" textAnchor="middle" fill={astHovered ? '#e8d9a7' : '#c9b991'} fontSize="12" fontFamily="serif" fontWeight="bold">20</text>
        </svg>
      </FloatButton>

      {/* Floating HERCULES button */}
      <FloatButton storageKey="playerHerculesPos" defaultPos={{ x: 24, y: 270 }} onClick={() => setShowHercules(o => !o)} title="HERCULES — Combat Tracker" hovered={hercHovered} onHover={setHercHovered}>
        <img src="/HerculesCombat.png" alt="HERCULES" draggable={false}
          style={{ width: '150%', height: '150%', objectFit: 'contain', filter: hercHovered ? 'invert(1) brightness(1.45) drop-shadow(0 0 12px rgba(232,217,167,0.65))' : 'invert(1) brightness(1.28) drop-shadow(0 0 9px rgba(232,217,167,0.45))', pointerEvents: 'none' }} />
      </FloatButton>

      {/* Astragal panel */}
      {showAstragal && (
        <div style={{ position: 'fixed', bottom: 24, left: 108, width: 320, zIndex: 200000, background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.deity, letterSpacing: '0.1em' }}>Astragal — Fate Cast in Bone</div>
            <button onClick={() => setShowAstragal(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
          </div>
          <div style={{ padding: 14 }}>
            <Astragal character={userChar} actionName="Astragal Roll" statKey="will" onResult={logRoll} />
          </div>
        </div>
      )}

      {/* HERCULES lite panel */}
      {showHercules && <HerculesLite campaignId={String(campaign.id)} char={userChar} onClose={() => setShowHercules(false)} />}

      {/* Header */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Campaigns</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>{campaign.subtitle}</div>
          <div style={{ fontSize: 8, color: timer ? COLORS.magic : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: timer ? 700 : 400 }}>
            {timer ? `⏱ ${timer}` : (FULL_TITLES[campaign.id] || campaign.name)}
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = tab === activeTab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 10px' : '12px 16px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 7 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
          {!isAssigned && userChar && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Assign your character to this campaign</div>
              <button onClick={handleAssign} disabled={assigning}
                style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 18px', cursor: assigning ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700 }}>
                {assigning ? 'Joining…' : `✦ Join ${campaign.name}`}
              </button>
            </div>
          )}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CampaignView({ userChar, onHome, onAssign }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  if (selectedCampaign) {
    return <CampaignDashboard campaign={selectedCampaign} userChar={userChar} onBack={() => setSelectedCampaign(null)} onAssign={onAssign} />;
  }
  return <CampaignList onSelect={setSelectedCampaign} userChar={userChar} onHome={onHome} />;
}
