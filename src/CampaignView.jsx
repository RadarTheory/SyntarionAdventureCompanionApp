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

// ─── SESSION TIMER ────────────────────────────────────────────────────────────
function useSessionTimer(campaignId) {
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      const { data } = await supabase.from('sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
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
  const [pos, setPos] = useState(saved || defaultPos);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

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
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRoll, setSubmittedRoll] = useState(null);
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);

  const loadSession = async () => {
    const { data } = await supabase.from('hercules_sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    setSession(data || null);
    sessionRef.current = data || null;
    if (data?.id) { loadEvents(data.id); loadInitiative(data.id); }
    else { setEvents([]); setInitiative([]); setSubmitted(false); }
  };

  const loadEvents = async (sid) => {
  const { data, error } = await supabase
    .from('hercules_events')
    .select('*')
    .eq('session_id', sid);

  if (error) {
    console.error('Failed to load Hercules events:', error);
    return;
  }

  if (data) setEvents(data);
};

  const loadInitiative = async (sid) => {
  const { data, error } = await supabase
    .from('hercules_initiative')
    .select('*')
    .eq('session_id', sid)
    .order('turn_order', { ascending: false });

    if (error) {
    console.error('Failed to load Hercules initiative:', error);
    return;
  }

  if (data) setInitiative(data);
};

  const rollInitiative = async () => {
  if (!session?.id || rolling) return;

  setRolling(true);

  const roll = Math.floor(Math.random() * 20) + 1;
  const modifier = Number(char?.initiative_modifier ?? char?.dex_mod ?? 0);
  const turnOrder = roll + modifier;

  const { data: initiativeRow, error: initiativeError } = await supabase
    .from('hercules_initiative')
    .insert({
      session_id: session.id,
      character_id: char?.id ? String(char.id) : null,
      character_name: char?.name || char?.character_name || 'Player',
      roll,
      modifier,
      turn_order: turnOrder,
    })
    .select()
    .single();

  if (initiativeError) {
    console.error('Failed to submit Hercules initiative:', initiativeError);
    setRolling(false);
    return;
  }

  const { error: eventError } = await supabase
    .from('hercules_events')
    .insert({
      session_id: session.id,
      type: 'initiative',
      actor_name: char?.name || char?.character_name || 'Player',
      actor_id: char?.id ? String(char.id) : null,
      description: `${char?.name || char?.character_name || 'Player'} rolled initiative.`,
    });

  if (eventError) {
    console.error('Failed to log Hercules initiative event:', eventError);
  }

  console.log('Hercules initiative submitted:', initiativeRow);

  setSubmitted(true);
  setSubmittedRoll({
    roll,
    modifier,
    total: turnOrder,
  });

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
              {submittedRoll && (
                <span style={{ color: '#e8c84a' }}>
                  {' '}— {submittedRoll.total}
                  {' '}({submittedRoll.roll}{submittedRoll.modifier ? ` + ${submittedRoll.modifier}` : ''})
                </span>
              )}
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
                [...events].reverse().map(ev => (
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

// ─── INLINE CHARACTER SHEET ───────────────────────────────────────────────────
function CharacterSheetInline({ char }) {
  const magicStats = ALL_STATS.filter(s => s.axis === 'magic');
  const techStats  = ALL_STATS.filter(s => s.axis === 'tech');
  const cls = ALL_CLASSES.find(c => c.id === char.cid);
  const axisColor = axis => axis === 'magic' ? COLORS.magic : COLORS.tech;
  const axisText  = axis => axis === 'magic' ? COLORS.magicText : COLORS.techText;
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{char.name || 'Unnamed'}</div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[...magicStats, ...techStats].map(s => {
          const val = char.stats?.[s.key] || 8;
          const pct = Math.round(((val - 8) / 8) * 100);
          return (
            <div key={s.key} style={{ background: COLORS.card, border: `1px solid ${axisColor(s.axis)}22`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div><div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: axisText(s.axis) }}>{s.label}</div><div style={{ fontSize: 8, color: COLORS.dim }}>{s.equiv}</div></div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: axisText(s.axis) }}>{val}</div>
              </div>
              <div style={{ height: 3, background: COLORS.dim, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: axisColor(s.axis), borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Sheet', 'Actions', 'Log'];

function CampaignDashboard({ campaign, userChar, onBack, onAssign }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Map');
  const [assigning, setAssigning] = useState(false);
  const [showAstragal, setShowAstragal] = useState(false);
  const [showHercules, setShowHercules] = useState(false);
  const [astHovered, setAstHovered] = useState(false);
  const [hercHovered, setHercHovered] = useState(false);
  const [rollingAction, setRollingAction] = useState(null);
  const timer = useSessionTimer(campaign.id);
  const isAssigned = userChar?.campaign === String(campaign.id);

  const rollAction = async (action) => {
  if (!userChar?.id || !campaign?.id || rollingAction) return;

  setRollingAction(action);

  const roll = Math.floor(Math.random() * 20) + 1;
  const modifier = Number(userChar.actionBonuses?.[action] || 0);
  const total = roll + modifier;

  const { data: hsession, error: sessionError } = await supabase
    .from('hercules_sessions')
    .select('id')
    .eq('campaign_id', String(campaign.id))
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError || !hsession?.id) {
    console.error('No active Hercules session found for action roll:', sessionError);
    setRollingAction(null);
    return;
  }

  const actorName = userChar.name || 'Player';

  const { error } = await supabase.from('hercules_events').insert({
    session_id: hsession.id,
    type: 'action',
    actor_name: actorName,
    actor_id: String(userChar.id),
    description: `${actorName} used ${action}: d20 ${roll}${modifier ? ` + ${modifier}` : ''} = ${total}.`,
  });

  if (error) {
    console.error('Failed to log Hercules action roll:', error);
  }

  setRollingAction(null);
};

  const handleAssign = async () => {
    if (!userChar?.id) return;
    setAssigning(true);
    await supabase.from('characters').update({ campaign_id: String(campaign.id) }).eq('id', userChar.id);
    setAssigning(false); onAssign(String(campaign.id));
  };

  const logRoll = async (payload) => {
    const { data: hsession } = await supabase.from('hercules_sessions').select('id').eq('campaign_id', String(campaign.id)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!hsession?.id) return;
    await supabase.from('hercules_events').insert({ session_id: hsession.id, campaign_id: String(campaign.id), type: 'roll', actor_name: userChar?.name || 'Player', actor_id: userChar?.id || null, description: `${userChar?.name || 'Player'} rolled ${payload.notation}.`, roll: payload.diceResults[0], total: payload.total, dm_approved: null });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Map': return <VTTViewer campaignId={String(campaign.id)} userChar={userChar} />;
      case 'Sheet': return userChar ? <CharacterSheetInline char={userChar} /> : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;
      case 'Actions': return userChar ? (
        <div>
          <div style={{ ...label8(), marginBottom: 12 }}>Your Actions</div>
          {Object.entries(ACTIONS).map(([category, actions]) => {
            if (category === 'magic' && userChar.cp !== 'magic') return null;
            if (category === 'tech' && userChar.cp !== 'tech') return null;
            return (
              <div key={category} style={{ marginBottom: 16 }}>
                <div style={{ ...label8(), marginBottom: 8, color: COLORS.dim }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {actions.map(action => (
                    <div
  key={action}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
  }}
>
  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>
    {action}
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div
      style={{
        fontSize: 10,
        color: userChar.actionBonuses?.[action] ? COLORS.magicText : COLORS.dim,
        minWidth: 24,
        textAlign: 'right',
      }}
    >
      {userChar.actionBonuses?.[action] ? `+${userChar.actionBonuses[action]}` : '+0'}
    </div>

    <button
      type="button"
      onClick={() => rollAction(action)}
      disabled={rollingAction === action}
      style={{
        background: 'rgba(200,168,74,0.14)',
        border: '1px solid rgba(200,168,74,0.45)',
        color: '#e8c84a',
        borderRadius: 5,
        padding: '4px 8px',
        cursor: rollingAction === action ? 'default' : 'pointer',
        fontFamily: "'Cinzel', serif",
        fontSize: 8,
        letterSpacing: '0.08em',
      }}
    >
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
      case 'Log': return (
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

      {/* Floating d20 Astragal button */}
      <FloatButton storageKey="playerAstragalPos" defaultPos={{ x: 24, y: 180 }} onClick={() => setShowAstragal(o => !o)} title="Astragal — Roll the dice" hovered={astHovered} onHover={setAstHovered}>
        <svg viewBox="0 0 40 40" style={{ width: '60%', height: '60%' }}>
          <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={astHovered ? '#e8d9a7' : '#c9b991'} strokeWidth="1.5"/>
          <text x="20" y="25" textAnchor="middle" fill={astHovered ? '#e8d9a7' : '#c9b991'} fontSize="12" fontFamily="serif" fontWeight="bold">20</text>
        </svg>
      </FloatButton>

      {/* Floating HERCULES button */}
      <FloatButton storageKey="playerHerculesPos" defaultPos={{ x: 24, y: 270 }} onClick={() => setShowHercules(o => !o)} title="HERCULES — Combat Tracker" hovered={hercHovered} onHover={setHercHovered}>
        <img src="/HerculesCombat.png" alt="HERCULES" draggable={false}
          style={{ width: '80%', height: '80%', objectFit: 'contain', filter: hercHovered ? 'invert(1) brightness(1.45) drop-shadow(0 0 12px rgba(232,217,167,0.65))' : 'invert(1) brightness(1.28) drop-shadow(0 0 9px rgba(232,217,167,0.45))', pointerEvents: 'none' }} />
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
          return <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 12px' : '12px 18px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</button>;
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
          {!isAssigned && userChar && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Assign your character to this campaign</div>
              <button onClick={handleAssign} disabled={assigning} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 18px', cursor: assigning ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700 }}>
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