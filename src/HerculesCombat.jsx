import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { SOTERIA_BESTIARY } from './soteria-bestiary';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function normalizeCampaigns() {
  if (Array.isArray(CAMPAIGNS)) return CAMPAIGNS;
  if (CAMPAIGNS && typeof CAMPAIGNS === 'object') {
    return Object.entries(CAMPAIGNS).map(([id, value]) => ({
      id,
      ...(typeof value === 'object' ? value : { name: String(value) }),
    }));
  }
  return [];
}

function getBestiaryText() {
  if (typeof SOTERIA_BESTIARY === 'string') return SOTERIA_BESTIARY;
  if (Array.isArray(SOTERIA_BESTIARY)) return SOTERIA_BESTIARY.join('\n');
  if (SOTERIA_BESTIARY && typeof SOTERIA_BESTIARY === 'object') {
    return Object.values(SOTERIA_BESTIARY).map(v => {
      if (typeof v === 'string') return v;
      if (v?.name) return `CREATURE NAME: ${v.name}`;
      if (v?.creatureName) return `CREATURE NAME: ${v.creatureName}`;
      return '';
    }).filter(Boolean).join('\n');
  }
  return '';
}

function parseCreatureNames() {
  const text = getBestiaryText();
  if (!text) return [];
  const names = new Set();
  const bulletRegex = /^[-•]\s+([A-Z][A-Z\s'\/\(\)]+?)(?:\s+[—–-]{1,2}|\s*$)/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    const name = match[1].trim().replace(/['"`,;]+$/g, '');
    if (name.length > 2 && name.length < 60 && !name.includes('  ')) names.add(name);
  }
  const colonRegex = /CREATURE NAME:\s*([^\n\r]+)/gi;
  while ((match = colonRegex.exec(text)) !== null) {
    const name = match[1].trim().replace(/['"`,;]+$/g, '');
    if (name && !name.includes(':')) names.add(name);
  }
  return Array.from(names).sort().slice(0, 300);
}

function createScribeSuggestion(event) {
  const total = Number(event.total ?? event.roll ?? 0);
  const actor = event.actor_name || 'The combatant';
  if (event.type === 'initiative') return `${actor} enters the fray with initiative ${total}. Place in descending turn order.`;
  if (event.type === 'action') return `${actor} attempts an action. Apply success, failure, partial success, or complication.`;
  if (event.type === 'enemy_added') return `${actor} has entered the fight. Decide placement, initiative timing, and immediate threat.`;
  if (event.type === 'cast_request') return `${actor} is requesting to cast. Review the spell and approve or deny from CASTOR.`;
  if (event.type === 'cast_resolved') return event.dm_approved ? `Cast was approved. Apply effect to scene.` : `Cast was denied. No effect.`;
  if (total >= 20) return `${actor}'s action is decisive — strong success, added damage, or tactical advantage.`;
  if (total >= 15) return `${actor}'s action appears successful unless target has strong defenses.`;
  if (total >= 10) return `${actor}'s action is uncertain — partial success, reduced effect, or complication.`;
  return `${actor}'s action likely fails or creates an opening for the enemy.`;
}

const ENEMY_COLORS = ['#e85d4a', '#fb923c', '#c084fc', '#f472b6', '#f87171', '#fbbf24'];
function creatureColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ENEMY_COLORS[h % ENEMY_COLORS.length];
}

function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────

function panelStyle() {
  return { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(200,168,74,0.18)', borderRadius: 12, padding: 12, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' };
}
function initiativeRowStyle(active) {
  return { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: active ? 'rgba(200,168,74,0.12)' : COLORS.card, border: `1px solid ${active ? 'rgba(200,168,74,0.35)' : COLORS.border}`, borderRadius: 8, padding: '9px 10px', marginBottom: 8 };
}
function goldButton() {
  return { background: 'rgba(200,168,74,0.16)', border: '1px solid rgba(200,168,74,0.55)', color: '#e8d9a7', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.08em' };
}
function redButton() {
  return { background: 'rgba(180,55,45,0.14)', border: '1px solid rgba(220,90,70,0.55)', color: '#e0a092', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.08em' };
}
function plainButton() {
  return { background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.dim, borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.08em' };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <div style={{ fontFamily: "'Cinzel', serif", color: '#e8d9a7', fontSize: 12, letterSpacing: '0.14em', marginBottom: 12 }}>{children}</div>;
}

function EmptyText({ children }) {
  return <div style={{ color: COLORS.dim, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{children}</div>;
}

function IconButton({ children, title, onClick, disabled = false, border, color }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{ width: 24, height: 24, minWidth: 24, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: disabled ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.045)', border: `1px solid ${border}`, color, borderRadius: 5, cursor: disabled ? 'default' : 'pointer', fontSize: 12, lineHeight: 1, opacity: disabled ? 0.45 : 1 }}>
      {children}
    </button>
  );
}

function HerculesLogo({ size = 56 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#e8d9a7' }} />;
  return (
    <img src="/HerculesCombat.png" alt="HERCULES" draggable={false} onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', filter: 'invert(1) brightness(0.95) contrast(1.0)', pointerEvents: 'none', userSelect: 'none' }} />
  );
}

function EventCard({ event, onApprove, onDeny, onCustom }) {
  const [custom, setCustom] = useState('');
  const pending = event.dm_approved === null || event.dm_approved === undefined;
  const suggestion = event.scribe_suggestion || createScribeSuggestion(event);
  return (
    <div style={{ background: pending ? 'rgba(200,168,74,0.08)' : COLORS.card, border: `1px solid ${pending ? 'rgba(200,168,74,0.35)' : COLORS.border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", color: COLORS.text, fontSize: 11, letterSpacing: '0.08em' }}>{event.actor_name || 'Unknown'}</div>
          <div style={{ color: COLORS.dim, fontSize: 10, marginTop: 2 }}>{event.type}{event.total ? ` • total ${event.total}` : ''}</div>
        </div>
        {event.roll != null && <div style={{ color: '#e8d9a7', fontSize: 20, fontFamily: 'Georgia, serif' }}>{event.total || event.roll}</div>}
      </div>
      <div style={{ marginTop: 8, color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.45 }}>{event.description}</div>
      <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(200,168,74,0.18)', color: '#d8c9a0', fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.45 }}>
        <strong>Scribe:</strong> {suggestion}
      </div>
      {event.outcome && (
        <div style={{ marginTop: 8, color: event.dm_approved ? '#9fe0aa' : '#e08b7d', fontSize: 12, fontFamily: 'Georgia, serif' }}>
          <strong>Outcome:</strong> {event.outcome}
        </div>
      )}
      {pending && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" onClick={() => onApprove(event)} style={goldButton()}>Approve</button>
          <button type="button" onClick={() => onDeny(event)} style={redButton()}>Deny</button>
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Write custom DM outcome…"
            style={{ gridColumn: '1 / -1', background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', outline: 'none' }} />
          <button type="button" onClick={() => onCustom(event.id, custom)} style={{ ...plainButton(), gridColumn: '1 / -1' }}>Commit Custom Outcome</button>
        </div>
      )}
    </div>
  );
}

// ─── RESIZE HANDLE ────────────────────────────────────────────────────────────

function ResizeHandle({ onResizeStart }) {
  return (
    <div
      onMouseDown={onResizeStart}
      style={{
        position: 'absolute', right: 0, bottom: 0, width: 18, height: 18,
        cursor: 'nwse-resize', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M9 1L1 9M5 1L1 5M9 5L5 9" stroke="rgba(200,168,74,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// open / onClose props allow FloatToolbar to control visibility
// Falls back to internal open state if no props provided
// ═════════════════════════════════════════════════════════════════════════════

export default function HerculesCombat({
  defaultCampaignId,
  onPlaceToken,
  onRegisterAddCreature,
  // FloatToolbar integration — if provided, open/close is controlled externally
  open: openProp,
  onClose: onCloseProp,
}) {
  const campaignList  = useMemo(normalizeCampaigns, []);
  const creatureNames = useMemo(parseCreatureNames, []);
  const firstCampaignId = campaignList?.[0]?.id || '';

  // ── Window position & size (persisted) ──
  const [windowPos,  setWindowPos]  = useState(loadLS('herculesWindowPos',  { x: 120, y: 76 }));
  const [windowSize, setWindowSize] = useState(loadLS('herculesWindowSize', { width: 1100, height: 760 }));

  useEffect(() => { localStorage.setItem('herculesWindowPos',  JSON.stringify(windowPos));  }, [windowPos]);
  useEffect(() => { localStorage.setItem('herculesWindowSize', JSON.stringify(windowSize)); }, [windowSize]);

  // ── Internal open state (fallback when no prop) ──
  const [openInternal, setOpenInternal] = useState(false);
  const isOpen   = openProp !== undefined ? openProp : openInternal;
  const closePanel = onCloseProp ?? (() => setOpenInternal(false));

  // ── Window drag ──
  const winDragOffset = useRef({ x: 0, y: 0 });
  const [winDragging, setWinDragging] = useState(false);

  const startWinDrag = (e) => {
    winDragOffset.current = { x: e.clientX - windowPos.x, y: e.clientY - windowPos.y };
    setWinDragging(true);
  };

  useEffect(() => {
    if (!winDragging) return;
    const onMove = (e) => {
      setWindowPos({
        x: Math.max(0, Math.min(window.innerWidth  - windowSize.width,  e.clientX - winDragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - windowSize.height, e.clientY - winDragOffset.current.y)),
      });
    };
    const onUp = () => setWinDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [winDragging, windowSize]);

  // ── Window resize ──
  const resizeStart = useRef({ x: 0, y: 0, w: 1100, h: 760 });
  const [resizing, setResizing] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    resizeStart.current = { x: e.clientX, y: e.clientY, w: windowSize.width, h: windowSize.height };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setWindowSize({
        width:  Math.max(640,  resizeStart.current.w + dx),
        height: Math.max(400,  resizeStart.current.h + dy),
      });
    };
    const onUp = () => setResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  // ── Combat state ──
  const [campaignId, setCampaignId] = useState(defaultCampaignId || firstCampaignId);
  const [session,    setSession]    = useState(null);
  const [events,     setEvents]     = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [manualLogText,      setManualLogText]      = useState('');
  const [manualCombatantName, setManualCombatantName] = useState('');
  const [creatureSearch,      setCreatureSearch]      = useState('');

  const eventsBottomRef    = useRef(null);
  const activeSessionIdRef = useRef(null);
  const campaignIdRef      = useRef(campaignId);

  useEffect(() => { activeSessionIdRef.current = session?.id || null; }, [session?.id]);
  useEffect(() => { campaignIdRef.current = campaignId; }, [campaignId]);
  useEffect(() => { eventsBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [events.length]);
  useEffect(() => { if (!campaignId && firstCampaignId) setCampaignId(firstCampaignId); }, [campaignId, firstCampaignId]);

  // ── Data loaders ──
  const loadEvents = useCallback(async (sid) => {
    const id = sid || activeSessionIdRef.current;
    if (!id) { setEvents([]); return; }
    const { data } = await supabase.from('hercules_events').select('*').eq('session_id', id).order('created_at', { ascending: true });
    setEvents(data || []);
  }, []);

  const loadInitiative = useCallback(async (sid) => {
    const id = sid || activeSessionIdRef.current;
    if (!id) { setInitiative([]); return; }
    const { data } = await supabase.from('hercules_initiative').select('*').eq('session_id', id)
      .order('turn_order', { ascending: false }).order('tie_breaker', { ascending: false }).order('created_at', { ascending: true });
    setInitiative((data || []).map(r => ({ ...r, total: Number(r.turn_order ?? r.roll ?? 0), roll: Number(r.roll ?? 0), modifier: Number(r.modifier ?? 0), character_name: r.character_name || 'Unknown' })));
  }, []);

  const loadSession = useCallback(async () => {
    if (!campaignId) return;
    const { data } = await supabase.from('hercules_sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    setSession(data || null);
    if (data?.id) { await loadEvents(data.id); await loadInitiative(data.id); }
    else { setEvents([]); setInitiative([]); }
  }, [campaignId, loadEvents, loadInitiative]);

  useEffect(() => { if (campaignId) loadSession(); }, [campaignId, loadSession]);

  useEffect(() => {
    const sid = session?.id;
    if (!sid) return;
    activeSessionIdRef.current = sid;
    const ch = supabase.channel(`hercules-dm-${sid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_events',    filter: `session_id=eq.${sid}` }, () => loadEvents(sid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_initiative', filter: `session_id=eq.${sid}` }, () => loadInitiative(sid))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.id, loadEvents, loadInitiative]);

  // ── Initiative tie detection ──
  const tiedGroups = useMemo(() => {
    const groups = initiative.reduce((acc, row) => {
      const score = Number(row.total ?? 0);
      if (!acc[score]) acc[score] = [];
      acc[score].push(row);
      return acc;
    }, {});
    return Object.values(groups).filter(g => g.length > 1);
  }, [initiative]);

  // ── Combat actions ──
  const startCombat = async () => {
    if (!campaignId) return;
    setSaving(true);
    await supabase.from('hercules_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('campaign_id', String(campaignId)).eq('status', 'active');
    const { data } = await supabase.from('hercules_sessions').insert({ campaign_id: String(campaignId), status: 'active', current_turn: 0 }).select().single();
    if (data) {
      setSession(data);
      activeSessionIdRef.current = data.id;
      await supabase.from('hercules_events').insert({ session_id: data.id, campaign_id: String(campaignId), type: 'combat_start', actor_name: 'Dungeon Master', description: 'Combat has begun. Initiative requested from all players.', dm_approved: true });
      await loadEvents(data.id);
      await loadInitiative(data.id);
    }
    setSaving(false);
  };

  const endCombat = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid) return;
    setSaving(true);
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'combat_end', actor_name: 'Dungeon Master', description: 'Combat has ended.' });
    await supabase.from('hercules_sessions').update({ status: 'ended' }).eq('id', sid);
    activeSessionIdRef.current = null;
    setSession(null); setEvents([]); setInitiative([]);
    setSaving(false);
  };

  const resolveArchitectsEdict = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || tiedGroups.length === 0) return;
    setSaving(true);
    for (const group of tiedGroups) {
      const results = group.map(row => ({ row, tieBreaker: Math.floor(Math.random() * 20) + 1 }));
      for (const r of results) await supabase.from('hercules_initiative').update({ tie_breaker: r.tieBreaker }).eq('id', r.row.id);
      const names = results.map(r => `${r.row.character_name} ${r.tieBreaker}`).join(', ');
      await supabase.from('hercules_events').insert({ session_id: sid, type: 'architect_edict', actor_name: 'The Architect', description: `Architect's Edict resolves tie at ${Number(group[0].total ?? 0)}: ${names}.` });
    }
    await loadInitiative(sid); await loadEvents(sid);
    setSaving(false);
  };

  const rollBoardTokens = useCallback(async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || !campaignId) return;
    setSaving(true);
    const { data: vttSession } = await supabase.from('vtt_sessions').select('tokens').eq('campaign_id', String(campaignId)).maybeSingle();
    const tokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];
    const { data: existing } = await supabase.from('hercules_initiative').select('*').eq('session_id', sid);
    const alreadyRolled = new Set((existing || []).map(r => String(r.character_id || r.character_name || '').toLowerCase()));
    const rows = tokens.filter(t => {
      const id = String(t.id || t.token_id || t.character_id || t.name || t.label || '').toLowerCase();
      return id && !alreadyRolled.has(id);
    }).map(t => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const modifier = Number(t.initiative_modifier ?? t.modifier ?? 0);
      return { session_id: sid, character_id: String(t.id || t.token_id || t.character_id || crypto.randomUUID()), character_name: t.name || t.character_name || t.label || 'Token', roll, modifier, turn_order: roll + modifier };
    });
    if (rows.length > 0) {
      await supabase.from('hercules_initiative').insert(rows);
      await supabase.from('hercules_events').insert(rows.map(r => ({ session_id: sid, type: 'initiative', actor_name: r.character_name, actor_id: r.character_id, description: `${r.character_name} rolled into initiative by the DM.` })));
    }
    await loadInitiative(sid); await loadEvents(sid);
    setSaving(false);
  }, [campaignId, loadEvents, loadInitiative, session]);

  const addCreature = useCallback(async (creatureName) => {
    if (!creatureName || !campaignId) return;
    let sid = session?.id || activeSessionIdRef.current;
    if (!sid) {
      const { data } = await supabase.from('hercules_sessions').insert({ campaign_id: String(campaignId), status: 'active', current_turn: 0 }).select().single();
      if (data) { setSession(data); activeSessionIdRef.current = data.id; sid = data.id; }
    }
    if (!sid) return;
    const tokenId = crypto.randomUUID();
    const roll = Math.floor(Math.random() * 20) + 1;
    const newToken = { id: tokenId, token_id: tokenId, name: creatureName, label: creatureName.slice(0, 4).toUpperCase(), creatureName, type: 'enemy', color: creatureColor(creatureName), x: 50, y: 50 };
    const { data: vttSession } = await supabase.from('vtt_sessions').select('*').eq('campaign_id', String(campaignId)).maybeSingle();
    const existingTokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];
    if (vttSession?.id) await supabase.from('vtt_sessions').update({ tokens: [...existingTokens, newToken], updated_at: new Date().toISOString() }).eq('id', vttSession.id);
    else await supabase.from('vtt_sessions').insert({ campaign_id: String(campaignId), tokens: [newToken], fog_zones: [], pending_moves: [] });
    onPlaceToken?.(newToken);
    await supabase.from('hercules_initiative').insert({ session_id: sid, character_id: tokenId, character_name: creatureName, roll, modifier: 0, turn_order: roll });
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'enemy_added', actor_name: creatureName, actor_id: tokenId, description: `${creatureName} entered the map and rolled initiative: d20 ${roll} = ${roll}.` });
    await Promise.all([loadEvents(sid), loadInitiative(sid)]);
  }, [session, campaignId, loadEvents, loadInitiative, onPlaceToken]);

  useEffect(() => { onRegisterAddCreature?.(addCreature); }, [addCreature, onRegisterAddCreature]);

  const approveEvent = async (event) => {
    await supabase.from('hercules_events').update({ dm_approved: true, outcome: event.scribe_suggestion || event.outcome || 'Approved by DM.' }).eq('id', event.id);
    await loadEvents();
  };
  const denyEvent = async (event) => {
    await supabase.from('hercules_events').update({ dm_approved: false, outcome: 'Denied by DM. No effect.' }).eq('id', event.id);
    await loadEvents();
  };
  const customOutcome = async (eventId, text) => {
    if (!eventId || !text?.trim()) return;
    await supabase.from('hercules_events').update({ dm_approved: true, outcome: text.trim(), dm_note: text.trim() }).eq('id', eventId);
    await loadEvents();
  };

  const rollCombatantAction = async (row) => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid) return;
    const actorName = row.character_name || 'Combatant';
    const actionName = window.prompt(`What is ${actorName} doing?`, 'Attack');
    if (!actionName?.trim()) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'action', actor_name: actorName, actor_id: row.character_id ? String(row.character_id) : null, description: `${actorName} used ${actionName.trim()}: d20 ${roll} = ${roll}.` });
    await loadEvents(sid);
  };

  const markCombatantDead = async (row) => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || !row?.id) return;
    await supabase.from('hercules_initiative').update({ status: 'dead' }).eq('id', row.id);
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'death', actor_name: row.character_name || 'Combatant', description: `${row.character_name || 'Combatant'} has been marked dead.` });
    await loadInitiative(sid); await loadEvents(sid);
  };

  const removeCombatant = async (row) => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || !row?.id) return;
    if (!window.confirm(`Remove ${row.character_name} from initiative?`)) return;
    setSaving(true);
    await supabase.from('hercules_initiative').delete().eq('id', row.id);
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'removed', actor_name: row.character_name, description: `${row.character_name} removed from initiative.` });
    await loadInitiative(sid); await loadEvents(sid);
    setSaving(false);
  };

  const addManualLogEntry = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || !manualLogText.trim()) return;
    setSaving(true);
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'dm_note', actor_name: 'The Architect', description: manualLogText.trim() });
    setManualLogText('');
    await loadEvents(sid);
    setSaving(false);
  };

  const addManualCombatant = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    const name = manualCombatantName.trim();
    if (!sid || !name) return;
    setSaving(true);
    const roll = Math.floor(Math.random() * 20) + 1;
    const tokenId = crypto.randomUUID();
    await supabase.from('hercules_initiative').insert({ session_id: sid, character_id: tokenId, character_name: name, roll, modifier: 0, turn_order: roll });
    await supabase.from('hercules_events').insert({ session_id: sid, type: 'enemy_added', actor_name: name, actor_id: tokenId, description: `${name} added manually with initiative d20 ${roll} = ${roll}.` });
    setManualCombatantName('');
    await Promise.all([loadInitiative(sid), loadEvents(sid)]);
    setSaving(false);
  };

  const filteredCreatures = creatureNames.filter(n => n.toLowerCase().includes(creatureSearch.toLowerCase()));

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: windowPos.x,
          top:  windowPos.y,
          width:  windowSize.width,
          height: windowSize.height,
          minWidth: 640,
          minHeight: 400,
          background: '#100d0a',
          border: '1px solid rgba(200,168,74,0.35)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          zIndex: 100000,
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden',
          userSelect: winDragging || resizing ? 'none' : 'auto',
        }}
      >
        {/* ── Header (drag handle) ── */}
        <div
          onMouseDown={startWinDrag}
          style={{ padding: '14px 18px', borderBottom: '1px solid rgba(200,168,74,0.25)', display: 'flex', alignItems: 'center', gap: 12, cursor: winDragging ? 'grabbing' : 'grab', background: 'rgba(200,168,74,0.04)' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(201,185,145,0.35)', background: 'rgba(10,8,6,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HerculesLogo size={42} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel', serif", color: '#e8d9a7', fontSize: 18, letterSpacing: '0.16em' }}>HERCULES</div>
            <div style={{ color: COLORS.dim, fontSize: 11, fontFamily: 'Georgia, serif' }}>Combat tracker · initiative · Scribe rulings · fight log</div>
          </div>

          <select value={campaignId} onChange={e => setCampaignId(e.target.value)} onMouseDown={e => e.stopPropagation()}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', cursor: 'default' }}>
            {campaignList.map(c => <option key={c.id} value={c.id}>{c.id} — {c.subtitle || c.name || 'Campaign'}</option>)}
          </select>

          {!session
            ? <button type="button" onClick={startCombat} disabled={saving || !campaignId} onMouseDown={e => e.stopPropagation()} style={goldButton()}>Start Combat</button>
            : <button type="button" onClick={endCombat} disabled={saving} onMouseDown={e => e.stopPropagation()} style={redButton()}>End Combat</button>
          }
          {session && <button type="button" onClick={rollBoardTokens} disabled={saving} onMouseDown={e => e.stopPropagation()} style={goldButton()}>Roll Board Tokens</button>}
          {session && (
            <button type="button" onClick={resolveArchitectsEdict} disabled={tiedGroups.length === 0 || saving} onMouseDown={e => e.stopPropagation()}
              style={{ ...goldButton(), opacity: tiedGroups.length === 0 || saving ? 0.45 : 1, cursor: tiedGroups.length === 0 || saving ? 'default' : 'pointer' }}>
              Architect's Edict
            </button>
          )}
          <button type="button" onClick={closePanel} onMouseDown={e => e.stopPropagation()} style={plainButton()}>Close</button>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 320px', gap: 12, padding: 12, minHeight: 0, overflow: 'hidden' }}>

          {/* Initiative */}
          <div style={panelStyle()}>
            <SectionTitle>Initiative</SectionTitle>
            {!session && <EmptyText>No active combat.</EmptyText>}
            {session && initiative.length === 0 && <EmptyText>Waiting for players to roll initiative.</EmptyText>}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {initiative.map((row, i) => {
                const isCreature = !row.character_id || row.character_id === row.character_name;
                const isDead = row.status === 'dead';
                return (
                  <div key={row.id} style={{ ...initiativeRowStyle(i === 0), opacity: isDead ? 0.45 : 1, textDecoration: isDead ? 'line-through' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ color: COLORS.text, fontFamily: "'Cinzel', serif", fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {row.character_name}</div>
                        <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", color: isCreature ? '#e08b7d' : '#9fe0aa', background: isCreature ? 'rgba(180,55,45,0.12)' : 'rgba(80,180,100,0.10)', border: `1px solid ${isCreature ? 'rgba(220,90,70,0.35)' : 'rgba(100,200,120,0.3)'}`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                          {isCreature ? 'ENEMY' : 'PC'}
                        </div>
                      </div>
                      <div style={{ color: COLORS.dim, fontSize: 10 }}>d20 {row.roll}{row.modifier ? ` + ${row.modifier}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <IconButton title="Roll action" onClick={() => rollCombatantAction(row)} border="rgba(200,168,74,0.45)" color="#e8c84a">🎲</IconButton>
                      <IconButton title="Mark dead" onClick={() => markCombatantDead(row)} disabled={isDead} border="rgba(220,90,70,0.45)" color="#e0a092">☠</IconButton>
                      <IconButton title="Remove" onClick={() => removeCombatant(row)} border="rgba(220,90,70,0.35)" color="#b98a7f">✕</IconButton>
                      {Number(row.tie_breaker || 0) > 0 && <span style={{ color: '#e8c84a', fontSize: 10 }}>Edict {row.tie_breaker}</span>}
                      <div style={{ color: '#e8d9a7', fontSize: 18, fontFamily: 'Georgia, serif', minWidth: 24, textAlign: 'right' }}>{row.total}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scribe rulings / event log */}
          <div style={panelStyle()}>
            <SectionTitle>Scribe Rulings</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingRight: 4 }}>
              {events.length === 0 && <EmptyText>No fight events logged yet.</EmptyText>}
              {events.map(ev => <EventCard key={ev.id} event={ev} onApprove={approveEvent} onDeny={denyEvent} onCustom={customOutcome} />)}
              <div ref={eventsBottomRef} />
            </div>
          </div>

          {/* Bestiary + controls */}
          <div style={panelStyle()}>
            <SectionTitle>Bestiary</SectionTitle>
            <input value={creatureSearch} onChange={e => setCreatureSearch(e.target.value)} placeholder="Search creatures…"
              style={{ width: '100%', boxSizing: 'border-box', background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: '9px 10px', marginBottom: 10, fontFamily: 'Georgia, serif', outline: 'none' }} />

            <SectionTitle>Add Combatant</SectionTitle>
            {session && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input value={manualCombatantName} onChange={e => setManualCombatantName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addManualCombatant(); }}
                  placeholder="Add combatant…" disabled={saving}
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: '7px 9px', fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none' }} />
                <button type="button" onClick={addManualCombatant} disabled={saving || !manualCombatantName.trim()} style={{ ...goldButton(), padding: '7px 9px', opacity: saving || !manualCombatantName.trim() ? 0.45 : 1 }}>Add</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexShrink: 0 }}>
              <input value={manualLogText} onChange={e => setManualLogText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addManualLogEntry(); } }}
                placeholder="Add DM note to combat log…" disabled={!session || saving}
                style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', fontSize: 12, outline: 'none' }} />
              <button type="button" onClick={addManualLogEntry} disabled={!session || saving || !manualLogText.trim()}
                style={{ ...goldButton(), opacity: !session || saving || !manualLogText.trim() ? 0.45 : 1, cursor: !session || saving || !manualLogText.trim() ? 'default' : 'pointer' }}>Add</button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredCreatures.length === 0 && <EmptyText>No creatures found.</EmptyText>}
              {filteredCreatures.map(name => (
                <button key={name} type="button" onClick={() => addCreature(name)}
                  style={{ textAlign: 'left', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, padding: '8px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.06em' }}>
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <ResizeHandle onResizeStart={startResize} />
      </div>

      <style>{`@keyframes herculesFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
