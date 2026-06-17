import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_STATS, ALL_CLASSES, ACTIONS, getRaceDisplay } from './constants';
import { LOCATIONS } from './MapPanel';
import VTTViewer from './VTTViewer';
import Astragal from './Astragal';
import AbilitiesPanel from './AbilitiesPanel';
import CastorPanel from './CastorPanel';
import FloatToolbar from './FloatToolbar';
import ArgusPlayerPanel from './Argus';
import BestiaryPanel from './BestiaryPanel';
import { ScribePlayerPanel } from './ScribePanel';
import HerculesPlayer from './HerculesPlayer';
import GrimoirePanel from './GrimoirePanel';
import LarkPanel from './LarkPanel';
import { BazaarPlayerPanel } from './BazaarPanel';
import { QuestorPlayerPanel } from './QuestorPanel';
import { WorldMapPanel } from './WorldMapPanel';
import { SoteriaClockDisplay } from './SoteriaClockPanel';
import SessionCheckin from './SessionCheckin';
import IntentDeclare from './IntentDeclare';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const FULL_TITLES = {
  'I': 'The Investigation of the Corren Mountain Mines',
  'II': 'The Search of Cielo Dorado',
  'III': 'An Offering to Aeirhyd',
  'IV': 'Frigid Dirge in Galekgarde',
};
const CAMPAIGN_NUM = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };

// ─── EIGHT STATS ──────────────────────────────────────────────────────────────
const MAGIC_STATS = [
  { key: 'spirit', label: 'Spirit', equiv: 'Charisma', axis: 'magic' },
  { key: 'soul', label: 'Soul', equiv: 'Faith', axis: 'magic' },
  { key: 'body', label: 'Body', equiv: 'Constitution', axis: 'magic' },
  { key: 'essence', label: 'Essence', equiv: 'Wisdom', axis: 'magic' },
];
const TECH_STATS = [
  { key: 'will', label: 'Will', equiv: 'Strength', axis: 'tech' },
  { key: 'whim', label: 'Whim', equiv: 'Dexterity', axis: 'tech' },
  { key: 'mind', label: 'Mind', equiv: 'Intelligence', axis: 'tech' },
  { key: 'dream', label: 'Dream', equiv: 'Intent', axis: 'tech' },
];
const ALL_EIGHT = [...MAGIC_STATS, ...TECH_STATS];

// Equipment slot definitions
const APPAREL_SLOTS = ['Head', 'Torso', 'Waist', 'Hands', 'Greaves', 'Boots'];
const WEAPON_SLOTS = ['Main Hand', 'Off-Hand', 'Side-Weapon', 'Heavy'];
const ACCESSORY_SLOTS = ['Ring I', 'Ring II', 'Neck', 'Charm', 'Relic', 'Artifact'];

// All stat keys for item bonus selectors
const STAT_KEYS = ALL_EIGHT.map(s => s.key);
const DISCIPLINE_KEYS = [
  'sanctus', 'chiasma', 'mana', 'gnosis', 'wraill', 'shaeid',
  'gain', 'grit', 'focus', 'matter', 'ingenuity', 'fortitude', 'reason',
];

// ─── SLOT CONFIG ─────────────────────────────────────────────────────────────
const SLOT_CATEGORIES = {
  Head: ['Armor'], Torso: ['Armor'], Waist: ['Armor'],
  Hands: ['Armor'], Greaves: ['Armor'], Boots: ['Armor'],
  'Main Hand': ['Weapons'], 'Off-Hand': ['Weapons'],
  'Side-Weapon': ['Weapons'], Heavy: ['Weapons'],
  'Ring I': ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
  'Ring II': ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
  Neck: ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
  Charm: ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
  Relic: ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
  Artifact: ['Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables'],
};
const USE_CATEGORIES = new Set(['Weapons','Magic Items','Artifacts','Spellcasting Items','Consumables']);
const USE_KEYWORDS = ['action','cast','activate','once per','bonus action','trigger','expend','channel','invoke'];
function hasUse(item) {
  if (!item) return false;
  if (USE_CATEGORIES.has(item.category)) return true;
  const desc = (item.desc || item.description || '').toLowerCase();
  return USE_KEYWORDS.some(kw => desc.includes(kw));
}

// axis colors
const axisColor = axis => axis === 'magic' ? COLORS.magic : COLORS.tech;
const axisText = axis => axis === 'magic' ? COLORS.magicText : COLORS.techText;

// ─── SESSION TIMER ────────────────────────────────────────────────────────────
function useSessionTimer(campaignId) {
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
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
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

// ─── DM SIGIL MODAL (inline) ─────────────────────────────────────────────────
function DMSigilModal({ onSuccess, onCancel }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const attempt = () => {
    if (input === import.meta.env.VITE_DM_PASSWORD) { onSuccess(); }
    else { setError(true); setShake(true); setTimeout(() => setShake(false), 500); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.72)', backdropFilter: 'blur(6px)', zIndex: 300100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: `1px solid ${error ? '#7f1d1d' : 'rgba(240,238,235,0.12)'}`, borderRadius: 14, padding: '32px 36px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', transform: shake ? 'translateX(-8px)' : 'none', transition: 'transform 0.08s, border-color 0.2s' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: '#f0eeeb', letterSpacing: '0.06em', marginBottom: 6 }}>Enter the Sigil</div>
        <div style={{ fontSize: 11, color: 'rgba(240,238,235,0.32)', marginBottom: 20, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The archives are sealed.</div>
        <input autoFocus type="password" value={input} onChange={e => { setInput(e.target.value); setError(false); }} onKeyDown={e => e.key === 'Enter' && attempt()} placeholder="···"
          style={{ width: '100%', background: 'rgba(240,238,235,0.06)', border: `1px solid ${error ? '#ef4444' : 'rgba(240,238,235,0.14)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 16, letterSpacing: '0.3em', color: '#f0eeeb', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'Georgia, serif', transition: 'border-color 0.2s' }} />
        {error && <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'Cinzel', serif" }}>The archives remain sealed.</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8, padding: '9px 0', color: 'rgba(240,238,235,0.32)', fontSize: 11, cursor: 'pointer', fontFamily: "'Cinzel', serif" }}>Retreat</button>
          <button onClick={attempt} style={{ flex: 2, background: 'rgba(240,238,235,0.06)', border: '1px solid rgba(240,238,235,0.18)', borderRadius: 8, padding: '9px 0', color: '#f0eeeb', fontSize: 11, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>Enter</button>
        </div>
      </div>
    </div>
  );
}

function DraggablePanel({ defaultX, defaultY, onClose, title, width, accentColor, children }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const onMouseDown = (e) => { dragging.current = true; offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.preventDefault(); };
  const onTouchStart = (e) => { dragging.current = true; const t = e.touches[0]; offset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }; };
  useEffect(() => {
    const onMove = (e) => { if (!dragging.current) return; const p = e.touches ? e.touches[0] : e; setPos({ x: Math.max(0, Math.min(window.innerWidth - width - 8, p.clientX - offset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 80, p.clientY - offset.current.y)) }); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [width]);
  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, width, maxHeight: '80vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: `1px solid ${accentColor}`, borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{ padding: '10px 14px', borderBottom: `1px solid ${accentColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', background: 'rgba(255,255,255,0.03)', flexShrink: 0, userSelect: 'none' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8d9a7', letterSpacing: '0.12em' }}>⠿ {title}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

function CampaignList({ onSelect, userChar, onHome }) {
  const { isMobile } = useDevice();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSigil, setShowSigil] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);   // ADD THIS
  const [draft, setDraft] = useState({               // ADD THIS
    name: '', subtitle: '', type: 'Campaign',
    description: '', setting: 'Soteria · 178 E.U.',
    max_players: 6, suggested_level: '',
  });
  const [editTarget, setEditTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [dmUnlocked, setDmUnlocked] = useState(false);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: true });
    // Merge DB campaigns with any legacy hardcoded ones not yet migrated
    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

     const handleCreate = async () => {
  if (!draft.name.trim() || !draft.subtitle.trim()) return;
  setCreating(true);
  const payload = {
    name: draft.name.trim(),
    subtitle: draft.subtitle.trim(),
    type: draft.type,
    description: draft.description.trim(),
    setting: draft.setting.trim() || 'Soteria · 178 E.U.',
    max_players: Number(draft.max_players) || 6,
    suggested_level: draft.suggested_level.trim(),
  };
  const { error } = editTarget
    ? await supabase.from('campaigns').update(payload).eq('id', editTarget.id)
    : await supabase.from('campaigns').insert(payload);
  setCreating(false);
  if (error) { console.error('Save failed:', error.message); return; }
  setShowCreate(false);
  setEditTarget(null);
  setDraft({ name: '', subtitle: '', type: 'Campaign', description: '', setting: 'Soteria · 178 E.U.', max_players: 6, suggested_level: '' });
  load();
};

  const inputStyle = {
    width: '100%', background: 'rgba(240,238,235,0.06)', border: '1px solid rgba(240,238,235,0.14)',
    borderRadius: 7, padding: '9px 12px', fontFamily: 'Georgia, serif', fontSize: 12,
    color: '#f0eeeb', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(240,238,235,0.4)', display: 'block', marginBottom: 5,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb', fontFamily: 'Georgia, serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {showSigil && (
  <DMSigilModal
    onSuccess={() => {
      setShowSigil(false);
      setDmUnlocked(true);
      if (showDelete) { /* delete confirm will show */ }
      else { setShowCreate(true); }
    }}
    onCancel={() => { setShowSigil(false); setEditTarget(null); setShowDelete(null); }}
  />
)}


{/* ── DELETE CONFIRM ── */}
{showDelete && dmUnlocked && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(8px)', zIndex: 300100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ background: '#13100d', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 14, padding: '32px 36px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#f0eeeb', marginBottom: 8 }}>Remove Module?</div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(240,238,235,0.45)', marginBottom: 24 }}>
        "{showDelete.subtitle}" will be permanently removed from the archives.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setShowDelete(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8, padding: '11px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: 'rgba(240,238,235,0.35)' }}>Cancel</button>
        <button onClick={async () => {
          await supabase.from('campaigns').delete().eq('id', showDelete.id);
          setShowDelete(null);
          load();
        }} style={{ flex: 2, background: 'rgba(224,90,90,0.12)', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 8, padding: '11px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: '0.1em' }}>
          ✕ Remove
        </button>
      </div>
    </div>
  </div>
)}

{/* ── CREATE / EDIT MODAL ── */}
{showCreate && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(8px)', zIndex: 300100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ background: '#13100d', border: '1px solid rgba(240,238,235,0.14)', borderRadius: 16, padding: '32px 36px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#f0eeeb', letterSpacing: '0.14em' }}>{editTarget ? 'EDIT MODULE' : 'NEW MODULE'}</div>
        <button onClick={() => { setShowCreate(false); setEditTarget(null); }} style={{ background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '4px 9px', cursor: 'pointer', color: 'rgba(240,238,235,0.4)', fontSize: 11, fontFamily: "'Cinzel', serif" }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <span style={labelStyle}>Type</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Campaign', 'One-Shot'].map(t => (
              <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))}
                style={{ flex: 1, background: draft.type === t ? 'rgba(200,168,74,0.16)' : 'transparent', border: `1px solid ${draft.type === t ? 'rgba(200,168,74,0.55)' : 'rgba(240,238,235,0.14)'}`, borderRadius: 7, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: draft.type === t ? '#e8c84a' : 'rgba(240,238,235,0.4)', letterSpacing: '0.1em', transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Title *</label>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. The Galekgarde Accord" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Subtitle / Short Name *</label>
          <input value={draft.subtitle} onChange={e => setDraft(d => ({ ...d, subtitle: e.target.value }))} placeholder="e.g. Frigid Dirge" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Premise / Description</label>
          <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="A brief summary of the module's premise…" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Setting / Era</label>
            <input value={draft.setting} onChange={e => setDraft(d => ({ ...d, setting: e.target.value }))} placeholder="Soteria · 178 E.U." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Suggested Level</label>
            <input value={draft.suggested_level} onChange={e => setDraft(d => ({ ...d, suggested_level: e.target.value }))} placeholder="e.g. 3–5" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Max Players</label>
          <input type="number" min={1} max={12} value={draft.max_players} onChange={e => setDraft(d => ({ ...d, max_players: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={() => { setShowCreate(false); setEditTarget(null); }} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8, padding: '11px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: 'rgba(240,238,235,0.35)' }}>Cancel</button>
        <button onClick={handleCreate} disabled={creating || !draft.name.trim() || !draft.subtitle.trim()}
          style={{ flex: 2, background: (!draft.name.trim() || creating) ? 'rgba(200,168,74,0.06)' : 'rgba(200,168,74,0.16)', border: `1px solid ${(!draft.name.trim() || creating) ? 'rgba(200,168,74,0.2)' : 'rgba(200,168,74,0.55)'}`, borderRadius: 8, padding: '11px', cursor: (creating || !draft.name.trim()) ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', fontWeight: 700, letterSpacing: '0.12em', transition: 'all 0.15s' }}>
          {creating ? 'Saving…' : editTarget ? '✦ Save Changes' : '✦ Create Module'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(8px)', zIndex: 300100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#13100d', border: '1px solid rgba(240,238,235,0.14)', borderRadius: 16, padding: '32px 36px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#f0eeeb', letterSpacing: '0.14em' }}>NEW MODULE</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '4px 9px', cursor: 'pointer', color: 'rgba(240,238,235,0.4)', fontSize: 11, fontFamily: "'Cinzel', serif" }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type toggle */}
              <div>
                <span style={labelStyle}>Type</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Campaign', 'One-Shot'].map(t => (
                    <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))}
                      style={{ flex: 1, background: draft.type === t ? 'rgba(200,168,74,0.16)' : 'transparent', border: `1px solid ${draft.type === t ? 'rgba(200,168,74,0.55)' : 'rgba(240,238,235,0.14)'}`, borderRadius: 7, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: draft.type === t ? '#e8c84a' : 'rgba(240,238,235,0.4)', letterSpacing: '0.1em', transition: 'all 0.15s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Title *</label>
                <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. The Galekgarde Accord" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Subtitle / Short Name *</label>
                <input value={draft.subtitle} onChange={e => setDraft(d => ({ ...d, subtitle: e.target.value }))} placeholder="e.g. Frigid Dirge" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Premise / Description</label>
                <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="A brief summary of the module's premise…" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Setting / Era</label>
                  <input value={draft.setting} onChange={e => setDraft(d => ({ ...d, setting: e.target.value }))} placeholder="Soteria · 178 E.U." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Suggested Level</label>
                  <input value={draft.suggested_level} onChange={e => setDraft(d => ({ ...d, suggested_level: e.target.value }))} placeholder="e.g. 3–5" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Max Players</label>
                <input type="number" min={1} max={12} value={draft.max_players} onChange={e => setDraft(d => ({ ...d, max_players: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8, padding: '11px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: 'rgba(240,238,235,0.35)', letterSpacing: '0.1em' }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !draft.name.trim() || !draft.subtitle.trim()}
                style={{ flex: 2, background: (!draft.name.trim() || creating) ? 'rgba(200,168,74,0.06)' : 'rgba(200,168,74,0.16)', border: `1px solid ${(!draft.name.trim() || creating) ? 'rgba(200,168,74,0.2)' : 'rgba(200,168,74,0.55)'}`, borderRadius: 8, padding: '11px', cursor: (creating || !draft.name.trim()) ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', fontWeight: 700, letterSpacing: '0.12em', transition: 'all 0.15s' }}>
                {creating ? 'Creating…' : '✦ Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.4)', padding: 0 }}>← Home</button>
      </div>
      <div style={{ padding: isMobile ? '28px 20px 20px' : '36px 40px 24px', borderBottom: '1px solid rgba(26,23,20,0.08)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 8 }}>Soteria · 178 E.U.</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1a1714' }}>CAMPAIGNS</div>
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.45)', marginTop: 8 }}>Select a campaign to enter the world.</div>
        </div>
       <button onClick={() => dmUnlocked ? setShowCreate(true) : setShowSigil(true)}
          style={{ background: '#1a1714', border: '1px solid rgba(26,23,20,0.3)', borderRadius: 8, padding: isMobile ? '10px 14px' : '11px 18px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#f0eeeb', letterSpacing: '0.12em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 16 }}>
          + Add Module
        </button>
      </div>

      {/* ── LIST ── */}
      <div style={{ padding: isMobile ? '20px' : '28px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.4)', textAlign: 'center', padding: '40px 0' }}>Consulting the archives…</div>
        )}
        {!loading && campaigns.length === 0 && (
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.4)', textAlign: 'center', padding: '40px 0' }}>No campaigns yet. The Architect will open the world.</div>
        )}
        {campaigns.map((c) => {
          const isAssigned = userChar?.campaign_id === String(c.id);
          return (
            <button key={c.id} onClick={() => onSelect(c)}
              style={{ background: isAssigned ? 'rgba(26,23,20,0.04)' : '#fff', border: `1px solid ${isAssigned ? 'rgba(26,23,20,0.25)' : 'rgba(26,23,20,0.1)'}`, borderRadius: 8, padding: isMobile ? '18px 20px' : '20px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', width: '100%', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,23,20,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)' }}>{c.type || 'Campaign'}</div>
                  {isAssigned && <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: COLORS.magic, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '1px 6px' }}>✓ Your Campaign</div>}
                  {c.suggested_level && <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: 'rgba(26,23,20,0.4)', background: 'rgba(26,23,20,0.05)', border: '1px solid rgba(26,23,20,0.12)', borderRadius: 4, padding: '1px 6px' }}>Lvl {c.suggested_level}</div>}
                  {c.max_players && <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: 'rgba(26,23,20,0.4)' }}>· {c.max_players} players</div>}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>{c.subtitle}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,23,20,0.4)', marginBottom: c.description ? 6 : 0 }}>{c.name}</div>
                {c.description && <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: 'rgba(26,23,20,0.55)', lineHeight: 1.55 }}>{c.description}</div>}
                {c.setting && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.14em', color: 'rgba(26,23,20,0.28)', marginTop: 8, textTransform: 'uppercase' }}>{c.setting}</div>}
              </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 16, flexShrink: 0 }}>
  {dmUnlocked ? (
    <>
      <button onClick={e => { e.stopPropagation(); setEditTarget(c); setDraft({ name: c.name, subtitle: c.subtitle, type: c.type || 'Campaign', description: c.description || '', setting: c.setting || 'Soteria · 178 E.U.', max_players: c.max_players || 6, suggested_level: c.suggested_level || '' }); setShowCreate(true); }}
        style={{ background: 'rgba(200,168,74,0.1)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e8c84a' }}>✎</button>
      <button onClick={e => { e.stopPropagation(); setShowDelete(c); }}
        style={{ background: 'rgba(224,90,90,0.08)', border: '1px solid rgba(224,90,90,0.25)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#ef4444' }}>✕</button>
    </>
  ) : (
    <div style={{ fontSize: 16, color: 'rgba(26,23,20,0.2)' }}>→</div>
  )}
</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar({ stat, baseVal, itemBonus, conditionBonus }) {
  const total = baseVal + itemBonus + conditionBonus;
  const pct = Math.round(((total - 8) / 8) * 100);
  const color = axisColor(stat.axis);
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
  const vitals = (effectiveStats.body || 8) + (effectiveStats.will || 8);
  const stamina = (effectiveStats.body || 8) + (effectiveStats.whim || 8);
  const resolve = (effectiveStats.soul || 8) + (effectiveStats.dream || 8);

  // alignment raw value stored as number -4 to +4; default 0
  const alignVal = Number(char?.alignment ?? 0);
  const apCurrent = char?.apCurrent ?? 0;
  const apTotal = char?.apTotal ?? 0;
  const morality = char?.morality ?? 0;

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
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => (
            <div key={v} style={{ fontSize: 7, color: v === alignVal ? alignColor : COLORS.dim, fontFamily: 'monospace', fontWeight: v === alignVal ? 700 : 400 }}>{v}</div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: COLORS.border, margin: '8px 0 16px' }} />
      <div style={{ ...label8(), marginBottom: 14 }}>Adventurer Gauge</div>

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

// ─── PACK DRAWER ─────────────────────────────────────────────────────────────
// Standalone catalog items for the pack — not tied to equipment slots.
// Stored under slot key 'pack__<uuid>' in character_items.

const PACK_ITEM_CATEGORIES = ['All', 'Armor', 'Weapons', 'Consumable', 'Tool', 'Artifact', 'Misc'];

// Small catalog of common Soterianized pack items players can quickly add
const QUICK_CATALOG = [
  { name: 'Healing Draught', category: 'Consumable', desc: 'Restores vitality. Common in field kits.' },
  { name: 'Torch', category: 'Tool', desc: 'Burns for one hour.' },
  { name: 'Rope (50ft)', category: 'Tool', desc: 'Sturdy Kra\'ark-braided rope.' },
  { name: 'Ration Pack', category: 'Consumable', desc: 'Three days of preserved travel rations.' },
  { name: 'Lockpick Set', category: 'Tool', desc: 'Six picks and a tension wrench.' },
  { name: 'Antitoxin Vial', category: 'Consumable', desc: 'Counters most natural poisons.' },
  { name: 'Spyglass', category: 'Tool', desc: 'Extends sight range in open terrain.' },
  { name: 'Grimoire Page', category: 'Artifact', desc: 'A loose page from an arcane text. Partially legible.' },
  { name: 'Iron Spike', category: 'Tool', desc: 'Useful for spiking doors or anchoring ropes.' },
  { name: 'Smoke Vial', category: 'Consumable', desc: 'Fills a 10ft area with dense smoke on impact.' },
  { name: 'Signal Mirror', category: 'Tool', desc: 'Can flash coded signals up to a mile in daylight.' },
  { name: 'Velstone Shard', category: 'Artifact', desc: 'A fragment of Lunar energy. Useful for certain mechanisms.' },
  { name: 'Bandages', category: 'Consumable', desc: 'Stops bleeding. Common issue.' },
  { name: 'Oil Flask', category: 'Tool', desc: 'Lubricant or accelerant. Two uses.' },
  { name: 'Chalk', category: 'Tool', desc: 'For marking paths, writing on stone.' },
];

function PackDrawer({ charId, loadedFromDB, packItems, setPackItems, persistPack, isDM = false }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list');   // 'list' | 'catalog' | 'add'
  const [catalogFilter, setCatalogFilter] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: 'Misc', desc: '', qty: 1, weight: 0 });
  const [coin, setCoin] = useState('');
  const [weight, setWeight] = useState('');
  const [misc, setMisc] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const PACK_META_KEY = `syntarion_pack_meta_${charId}`;

  // Load pack meta (coin/weight/misc) from localStorage
  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(PACK_META_KEY) || '{}');
      if (m.coin !== undefined) setCoin(m.coin);
      if (m.weight !== undefined) setWeight(m.weight);
      if (m.misc !== undefined) setMisc(m.misc);
    } catch (_) { }
  }, [charId]);

  const saveMeta = (field, val) => {
    const updates = { coin, weight, misc, [field]: val };
    localStorage.setItem(PACK_META_KEY, JSON.stringify(updates));
  };

  const addFromCatalog = (catalogItem) => {
    const item = { id: Date.now(), name: catalogItem.name, category: catalogItem.category, desc: catalogItem.desc, qty: 1, weight: 0 };
    const next = [...packItems, item];
    setPackItems(next);
    persistPack(next);
    setView('list');
  };

  const addCustomItem = () => {
    if (!newItem.name.trim()) return;
    const item = { id: Date.now(), ...newItem, qty: Number(newItem.qty) || 1, weight: Number(newItem.weight) || 0 };
    const next = editIdx !== null
      ? packItems.map((p, i) => i === editIdx ? item : p)
      : [...packItems, item];
    setPackItems(next);
    persistPack(next);
    setNewItem({ name: '', category: 'Misc', desc: '', qty: 1, weight: 0 });
    setEditIdx(null);
    setView('list');
  };

  const removeItem = (idx) => {
    const next = packItems.filter((_, i) => i !== idx);
    setPackItems(next);
    persistPack(next);
  };

  const updateQty = (idx, delta) => {
    const next = packItems.map((p, i) => i === idx ? { ...p, qty: Math.max(0, (p.qty || 1) + delta) } : p).filter(p => p.qty > 0);
    setPackItems(next);
    persistPack(next);
  };

  const openEdit = (idx) => {
    setNewItem({ ...packItems[idx] });
    setEditIdx(idx);
    setView('add');
  };

  const totalWeight = packItems.reduce((sum, p) => sum + (Number(p.weight) || 0) * (p.qty || 1), 0);

  const filteredCatalog = QUICK_CATALOG.filter(item => {
    const matchCat = catalogFilter === 'All' || item.category === catalogFilter;
    const matchSearch = !catalogSearch || item.name.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryColor = cat => ({
    Consumable: '#e08a5a', Tool: COLORS.tech, Artifact: COLORS.deity,
    Armor: COLORS.muted, Weapons: '#e05a5a', Misc: COLORS.dim
  }[cat] || COLORS.dim);

  return (
    <>
      {/* Pack section header — always visible */}
      <div style={{ marginTop: 4 }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderTop: `1px solid ${COLORS.border}`, borderBottom: open ? 'none' : `1px solid ${COLORS.border}`, padding: '14px 0', cursor: 'pointer' }}>
          <div style={{ ...label8() }}>Pack</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {packItems.length > 0 && (
              <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{packItems.length} item{packItems.length !== 1 ? 's' : ''}</div>
            )}
            <div style={{ fontSize: 10, color: COLORS.dim, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
          </div>
        </button>

        {open && (
          <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 20 }}>

            {/* Coin / Weight / Misc quick fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, marginTop: 4 }}>
              {[
                { label: 'Consumables', value: packItems.filter(p => p.category === 'Consumable').length + ' in pack', readOnly: true },
                { label: 'Coin', value: coin, onChange: v => { setCoin(v); saveMeta('coin', v); }, placeholder: 'GP, SP, CP…' },
                { label: 'Weight', value: totalWeight > 0 ? `${totalWeight} + manual` : weight, onChange: v => { setWeight(v); saveMeta('weight', v); }, placeholder: 'lbs / units…' },
                { label: 'Misc', value: misc, onChange: v => { setMisc(v); saveMeta('misc', v); }, placeholder: 'Other notes…' },
              ].map(({ label, value, onChange, placeholder, readOnly }) => (
                <div key={label} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ ...label8(), marginBottom: 4 }}>{label}</div>
                  {readOnly
                    ? <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{value}</div>
                    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, padding: 0 }} />
                  }
                </div>
              ))}
            </div>

            {/* View toggle */}
            {isDM && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[['list', 'Contents'], ['catalog', 'Browse Catalog']].map(([v, lbl]) => (
                  <button key={v} onClick={() => { setView(v); if (v !== 'add') { setEditIdx(null); setNewItem({ name: '', category: 'Misc', desc: '', qty: 1, weight: 0 }); } }}
                    style={{ background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: view === v ? '#e8c84a' : COLORS.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {/* ── CONTENTS ── */}
            {view === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {packItems.length === 0 && (
                  <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    Pack is empty. Browse the catalog to add approved items.
                  </div>
                )}
                {packItems.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: 7, color: categoryColor(item.category), fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', flexShrink: 0 }}>{item.category}</div>
                      </div>
                      {item.desc && <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{item.desc}</div>}
                    </div>
                    {/* Qty controls */}
                    {isDM && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => updateQty(idx, -1)}>−</button>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, minWidth: 18, textAlign: 'center' }}>
                            {item.qty || 1}
                          </div>
                          <button onClick={() => updateQty(idx, 1)}>+</button>
                        </div>

                        <button onClick={() => openEdit(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.dim, fontSize: 11, padding: '2px 4px' }}>
                          ✎
                        </button>

                        <button onClick={() => removeItem(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e05a5a', fontSize: 11, padding: '2px 4px' }}>
                          ✕
                        </button>
                      </>)}
                  </div>
                ))}
              </div>
            )}

            {/* ── CATALOG BROWSE ── */}
            {view === 'catalog' && (
              <div>
                <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Search items…"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                  {PACK_ITEM_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCatalogFilter(cat)}
                      style={{ background: catalogFilter === cat ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${catalogFilter === cat ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: catalogFilter === cat ? '#e8c84a' : COLORS.dim }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredCatalog.map(item => {
                    const alreadyIn = packItems.some(p => p.name === item.name);
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text }}>{item.name}</div>
                            <div style={{ fontSize: 7, color: categoryColor(item.category), fontFamily: "'Cinzel', serif" }}>{item.category}</div>
                          </div>
                          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <button onClick={() => addFromCatalog(item)}
                          style={{ background: alreadyIn ? 'transparent' : 'rgba(200,168,74,0.14)', border: `1px solid ${alreadyIn ? COLORS.border : 'rgba(200,168,74,0.45)'}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: alreadyIn ? COLORS.dim : '#e8c84a', flexShrink: 0 }}>
                          {alreadyIn ? 'Add Again' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No items match.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── ADD / EDIT CUSTOM ── */}
            {view === 'add' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ ...label8(), marginBottom: 5 }}>Item Name</div>
                  <input value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                    placeholder="e.g. Kra'ark Rope"
                    style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 12, color: COLORS.text, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ ...label8(), marginBottom: 5 }}>Category</div>
                    <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
                      {PACK_ITEM_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ ...label8(), marginBottom: 5 }}>Qty</div>
                    <input type="number" min={1} value={newItem.qty} onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                  </div>
                  <div>
                    <div style={{ ...label8(), marginBottom: 5 }}>Weight</div>
                    <input type="number" min={0} step={0.1} value={newItem.weight} onChange={e => setNewItem(n => ({ ...n, weight: e.target.value }))}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                  </div>
                </div>
                <div>
                  <div style={{ ...label8(), marginBottom: 5 }}>Notes</div>
                  <textarea value={newItem.desc} onChange={e => setNewItem(n => ({ ...n, desc: e.target.value }))}
                    rows={2} placeholder="Description, special properties…"
                    style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addCustomItem}
                    style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 7, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText, fontWeight: 700, letterSpacing: '0.1em' }}>
                    {editIdx !== null ? '✦ Save Changes' : '✦ Add to Pack'}
                  </button>
                  <button onClick={() => { setView('list'); setEditIdx(null); setNewItem({ name: '', category: 'Misc', desc: '', qty: 1, weight: 0 }); }}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── INVENTORY PANEL ──────────────────────────────────────────────────────────
function InventoryPanel({ char, onInventoryChange, isDM = false, campaignId }) {
  const [items, setItems] = useState({});
  const [packItems, setPackItems] = useState([]);
  const [editSlot, setEditSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [loadedFromDB, setLoadedFromDB] = useState(false);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // campaign being edited
  const [showDelete, setShowDelete] = useState(null); // campaign pending delete
  const [dmUnlocked, setDmUnlocked] = useState(false); // sigil passed this session

  const STORAGE_KEY = `syntarion_inv_${char?.id}`;
  const PACK_STORAGE_KEY = `syntarion_pack_${char?.id}`;

  // Load equipped items
  useEffect(() => {
    if (!char?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('character_items')
          .select('*')
          .eq('character_id', String(char.id));
        if (!error && data) {
          const equipped = {};
          const pack = [];
          data.forEach(row => {
            if (row.slot.startsWith('pack__')) {
              pack.push({ id: row.id, ...row.bonuses, name: row.name, category: row.description?.split('|')[0] || 'Misc', desc: row.description?.split('|')[1] || '', qty: Number(row.weight) || 1, weight: 0 });
            } else {
              equipped[row.slot] = { name: row.name, description: row.description || '', attuned: !!row.attuned, bonuses: row.bonuses || {} };
            }
          });
          setItems(equipped);
          setPackItems(pack);
          setLoadedFromDB(true);
          onInventoryChange(equipped);
          return;
        }
      } catch (_) { }
      // localStorage fallback
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        setItems(stored);
        onInventoryChange(stored);
      } catch (_) { }
      try {
        const storedPack = JSON.parse(localStorage.getItem(PACK_STORAGE_KEY) || '[]');
        setPackItems(storedPack);
      } catch (_) { }
    })();
  }, [char?.id]);

  const persistPack = (next) => {
    localStorage.setItem(PACK_STORAGE_KEY, JSON.stringify(next));
    // Could also upsert to Supabase if needed
  };

  const openEdit = (slot) => {
    const existing = items[slot] || { name: '', description: '', attuned: false, bonuses: {} };
    setDraft({ ...existing, bonuses: { ...existing.bonuses } });
    setEditSlot(slot);
  };

  const saveItem = async () => {
    if (!editSlot || !draft) return;
    setSaving(true);
    const newItems = { ...items, [editSlot]: { ...draft } };
    if (!draft.name.trim()) delete newItems[editSlot];
    setItems(newItems);
    onInventoryChange(newItems);
    try {
      if (loadedFromDB) {
        if (!draft.name.trim()) {
          await supabase.from('character_items').delete().eq('character_id', String(char.id)).eq('slot', editSlot);
        } else {
          await supabase.from('character_items').upsert({ character_id: String(char.id), slot: editSlot, name: draft.name.trim(), description: draft.description, attuned: draft.attuned, bonuses: draft.bonuses }, { onConflict: 'character_id,slot' });
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
            <button
              key={slot}
             onClick={() => {
                if (isDM) { openEdit(slot); return; }
                setPlayerSlot({ slot, item: items[slot] || null });
              }}
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
                {hasItem && item.bonuses && Object.entries(item.bonuses).some(([, v]) => v !== 0) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {Object.entries(item.bonuses).filter(([, v]) => v !== 0).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 7, color: v > 0 ? COLORS.magic : '#e05a5a', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
                        {v > 0 ? '+' : ''}{v} {k}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isDM && (
                <div style={{ fontSize: 10, color: COLORS.dim, marginLeft: 8, flexShrink: 0 }}>✎</div>
              )}
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

      {/* ── PACK DRAWER ── */}
      <PackDrawer
        charId={char?.id}
        loadedFromDB={loadedFromDB}
        packItems={packItems}
        setPackItems={setPackItems}
        persistPack={persistPack}
        isDM={isDM}
      />

{/* ── PLAYER EQUIP MODAL ── */}
      {!isDM && playerSlot && (() => {
        const { slot, item } = playerSlot;
        const occupied = item && item.name;
        const compatible = packItems.filter(p =>
          (SLOT_CATEGORIES[slot] || []).includes(p.category)
        );

        const equipItem = async (packItem) => {
          const newItems = { ...items, [slot]: { name: packItem.name, description: packItem.desc || '', attuned: true, bonuses: {} } };
          setItems(newItems);
          onInventoryChange(newItems);
          if (packItem.id) await supabase.from('character_items').delete().eq('id', packItem.id);
          await supabase.from('character_items').upsert({
            character_id: String(char.id), slot,
            name: packItem.name, description: packItem.desc || '',
            attuned: true, bonuses: {}, equipped: true,
          }, { onConflict: 'character_id,slot' });
          setPackItems(prev => prev.filter(p => p.id !== packItem.id));
          setPlayerSlot(null);
        };

        const unequipItem = async () => {
          const packRow = {
            character_id: String(char.id),
            slot: `pack__${Date.now()}`,
            name: item.name,
            description: `Misc|${item.description || ''}`,
            attuned: false, bonuses: {}, equipped: false, weight: 1,
          };
          const { data: newRow } = await supabase.from('character_items').insert(packRow).select().single();
          await supabase.from('character_items').delete().eq('character_id', String(char.id)).eq('slot', slot);
          const newItems = { ...items };
          delete newItems[slot];
          setItems(newItems);
          onInventoryChange(newItems);
          if (newRow) setPackItems(prev => [...prev, { id: newRow.id, name: item.name, category: 'Misc', desc: item.description || '', qty: 1 }]);
          setPlayerSlot(null);
        };

        const useItem = async () => {
          const { data: hsession } = await supabase.from('hercules_sessions').select('id')
            .eq('campaign_id', campaignId || String(char.campaign)).eq('status', 'active')
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (!hsession?.id) { setPlayerSlot(null); return; }
          await supabase.from('hercules_events').insert({
            session_id: hsession.id, type: 'item_use',
            actor_name: char.name || 'Player',
            actor_id: String(char.id),
            description: `${char.name || 'Player'} used ${item.name}. ${item.description || ''}`,
          });
          setPlayerSlot(null);
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 300000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, width: '100%', maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text, letterSpacing: '0.1em' }}>{slot}</div>
                  <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginTop: 2 }}>{occupied ? item.name : 'Empty'}</div>
                </div>
                <button onClick={() => setPlayerSlot(null)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
              </div>

              {occupied ? (
                <div>
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 6 }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>{item.description}</div>}
                    {item.bonuses && Object.entries(item.bonuses).some(([,v]) => v !== 0) && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {Object.entries(item.bonuses).filter(([,v]) => v !== 0).map(([k,v]) => (
                          <div key={k} style={{ fontSize: 8, color: v > 0 ? COLORS.magic : '#e05a5a', fontFamily: "'Cinzel', serif" }}>{v > 0 ? '+' : ''}{v} {k}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {hasUse({
                        category: item.description?.split('|')[0] || '',
                        desc: item.description?.split('|')[1] || item.description || '',
                      }) && (
                      <button onClick={useItem}
                        style={{ flex: 1, background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', fontWeight: 700 }}>
                        ⚡ Use
                      </button>
                    )}
                    <button onClick={unequipItem}
                      style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.dim }}>
                      ↩ Unequip
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ ...label8(), marginBottom: 10 }}>Pack — {SLOT_CATEGORIES[slot]?.join(', ')}</div>
                  {compatible.length === 0 ? (
                    <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                      No compatible items in pack.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {compatible.map((p, i) => (
                        <button key={p.id || i} onClick={() => equipItem(p)}
                          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,168,74,0.4)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 4 }}>{p.name}</div>
                          {p.desc && <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.4 }}>{p.desc}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── EQUIP SLOT EDIT MODAL ── */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setDraft(d => ({ ...d, attuned: !d.attuned }))}
                  style={{ background: draft.attuned ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${draft.attuned ? 'rgba(200,168,74,0.6)' : COLORS.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: draft.attuned ? '#e8c84a' : COLORS.dim, letterSpacing: '0.1em' }}>
                  {draft.attuned ? '⬡ Attuned' : '⬢ Not Attuned'}
                </button>
                <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{draft.attuned ? 'Bonuses active' : 'Bonuses inactive'}</div>
              </div>
              <div>
                <div style={{ ...label8(), marginBottom: 10 }}>Stat Bonuses (applies when attuned)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ALL_EIGHT.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: axisText(s.axis), width: 50 }}>{s.label}</div>
                      <input type="number" value={draft.bonuses?.[s.key] || 0} onChange={e => setBonusStat(s.key, e.target.value)}
                        style={{ width: 48, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ ...label8(), marginBottom: 10 }}>Discipline Pool Bonuses</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {DISCIPLINE_KEYS.map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.deity, width: 60, letterSpacing: '0.08em' }}>{k}</div>
                      <input type="number" value={draft.bonuses?.[k] || 0} onChange={e => setBonusStat(k, e.target.value)}
                        style={{ width: 48, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
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
              {items[editSlot]?.name && (
                <button onClick={async () => { setDraft(d => ({ ...d, name: '' })); setTimeout(saveItem, 0); }}
                  style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e05a5a' }}>
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

// ─── LOOTBOX PANEL ────────────────────────────────────────────────────────────
function LootboxPanel({ campaignId, userChar, onClaimed }) {
  const [boxes, setBoxes] = useState([]);
  const [expanded, setExpanded] = useState(null);  // box id
  const [boxItems, setBoxItems] = useState({});     // { boxId: [...] }
  const [claiming, setClaiming] = useState(null);   // box id being claimed
  const [claimDone, setClaimDone] = useState([]);   // claimed box ids this session

  const load = async () => {
    const { data } = await supabase
      .from('lootboxes')
      .select('*')
      .eq('claimed', false)
      .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      .order('created_at', { ascending: false });
    if (data) setBoxes(data);
  };

  useEffect(() => {
    load();
    const sub = supabase.channel(`lootboxes-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, load)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const loadItems = async (boxId) => {
    if (boxItems[boxId]) return; // already loaded
    const { data } = await supabase
      .from('lootboxes')
      .select('*')
      .eq('claimed', false)
      .eq('revealed', true)
      .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      .order('created_at', { ascending: false });
    if (data) setBoxItems(prev => ({ ...prev, [boxId]: data }));
  };

  const toggleExpand = (boxId) => {
    if (expanded === boxId) { setExpanded(null); return; }
    setExpanded(boxId);
    loadItems(boxId);
  };

  const claimBox = async (box) => {
    if (!userChar?.id || claiming) return;
    setClaiming(box.id);

    const items = boxItems[box.id] || [];

    // Write all items to character's pack
    const rows = items.map(item => ({
      character_id: String(userChar.id),
      slot: `pack__${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: item.item_name,
      description: `${item.item_category}|${item.item_desc}${item.note ? ' — ' + item.note : ''}`,
      attuned: false,
      bonuses: {},
      weight: item.qty || 1,
    }));

    if (rows.length > 0) {
      await supabase.from('character_items').insert(rows);
    }

    // Mark box claimed
    await supabase.from('lootboxes').update({
      claimed: true,
      claimed_by: String(userChar.id),
      claimed_at: new Date().toISOString(),
    }).eq('id', box.id);

    // Send receipt message
    const itemList = items.map(i => `• ${i.item_name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('\n');
    await supabase.from('messages').insert({
      type: 'dm',
      is_dm: true,
      sender_name: 'The Architect',
      character_id: String(userChar.id),
      campaign_id: campaignId,
      content: `You claimed **${box.name}**:\n\n${itemList}\n\nItems added to your pack.`,
      session_id: null,
    });

    setClaimDone(prev => [...prev, box.id]);
    setBoxes(prev => prev.filter(b => b.id !== box.id));
    setClaiming(null);
    onClaimed?.();
  };

  if (boxes.length === 0 && claimDone.length === 0) {
    return (
      <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, marginBottom: 10 }}>⬡</div>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          No lootboxes waiting. The Architect will place rewards here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {claimDone.length > 0 && (
        <div style={{ background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 10, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          ✦ {claimDone.length} box{claimDone.length > 1 ? 'es' : ''} claimed this session — items added to your pack.
        </div>
      )}

      {boxes.map(box => {
        const isOpen = expanded === box.id;
        const items = boxItems[box.id] || [];
        const isClaiming = claiming === box.id;

        return (
          <div key={box.id} style={{ background: COLORS.card, border: '1px solid rgba(180,122,58,0.35)', borderRadius: 10, overflow: 'hidden' }}>
            {/* Box header */}
            <button onClick={() => toggleExpand(box.id)}
              style={{ width: '100%', background: 'rgba(180,122,58,0.06)', border: 'none', borderBottom: isOpen ? '1px solid rgba(180,122,58,0.2)' : 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 18, lineHeight: 1 }}>⬡</div>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8a84a', letterSpacing: '0.08em' }}>{box.name}</div>
                  {box.campaign_id && (
                    <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginTop: 2, letterSpacing: '0.1em' }}>
                      Campaign {box.campaign_id}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {isOpen && items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'Tap to inspect'}
                </div>
                <div style={{ color: '#e8a84a', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
              </div>
            </button>

            {/* Box contents */}
             {isOpen && box.revealed && (
              <div style={{ padding: '14px 16px' }}>
                {items.length === 0 ? (
                  <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Loading contents…</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {items.map((item, i) => (
                      <div key={item.id || i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: COLORS.surface, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{item.item_name}</div>
                            {item.item_category && <div style={{ fontSize: 7, color: COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>{item.item_category}</div>}
                            {item.qty > 1 && <div style={{ fontSize: 8, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>×{item.qty}</div>}
                          </div>
                          {item.item_desc && <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 3 }}>{item.item_desc}</div>}
                          {item.note && <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 3 }}>"{item.note}"</div>}
                          {item.item_meta && <div style={{ fontSize: 8, color: COLORS.deity, marginTop: 3 }}>{item.item_meta}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => claimBox(box)} disabled={isClaiming || !userChar || !box.revealed}
                  style={{ width: '100%', background: isClaiming ? 'transparent' : 'rgba(180,122,58,0.18)', border: `1px solid ${isClaiming ? COLORS.border : 'rgba(180,122,58,0.6)'}`, borderRadius: 8, padding: '11px', cursor: (isClaiming || !userChar) ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: isClaiming ? COLORS.dim : '#e8a84a', fontWeight: 700, letterSpacing: '0.12em', transition: 'all 0.15s' }}>
                  {isClaiming ? 'Claiming…' : !userChar ? 'No character loaded' : `⬡ Claim ${box.name}`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Sheet', 'Scales', 'Actions', 'Abilities', 'Inventory', 'Loot', 'Log'];
function SessionLogTab({ campaignId }) {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    if (!entries && campaignId) {
      Promise.all([
        supabase.from('session_logs').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }),
        supabase.from('dm_memory').select('*').eq('campaign_id', campaignId).eq('category', 'lore').order('created_at', { ascending: false }),
      ]).then(([{ data: logs }, { data: lore }]) => {
        const combined = [
          ...(logs || []).map(l => ({ ...l, _kind: 'session' })),
          ...(lore || []).map(l => ({
            ...l,
            _kind: 'lore',
            title: l.content.startsWith('[LORE ANNOUNCEMENT]')
              ? l.content.replace('[LORE ANNOUNCEMENT] ', '').split(':')[0]
              : 'Lore Event',
            body: l.content.startsWith('[LORE ANNOUNCEMENT]')
              ? l.content.split(':').slice(1).join(':').trim()
              : l.content,
          })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setEntries(combined);
      });
    }
  });

  if (entries === null) return (
    <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>Consulting the archives…</div>
  );

  if (entries.length === 0) return (
    <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No logs yet. The Scribe will write here.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {entries.map(entry => (
        <div key={entry.id} style={{
          background: entry._kind === 'lore' ? 'rgba(200,168,74,0.04)' : COLORS.card,
          border: `1px solid ${entry._kind === 'lore' ? 'rgba(200,168,74,0.25)' : COLORS.border}`,
          borderRadius: 10, padding: '16px 18px',
        }}>
          {entry._kind === 'lore' && (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e8c84a', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
              ⟦ LORE ⟧ {entry.title}
            </div>
          )}
          {entry._kind === 'session' && (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
              {entry.title || 'Session Record'}
            </div>
          )}
          <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', marginBottom: 10 }}>
            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <p style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75, margin: 0 }}>
            {entry.body || entry.summary}
          </p>
        </div>
      ))}
    </div>
  );
}

function CampaignDashboard({ campaign, userChar, onBack, onAssign, onUpdateChar }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Map');
  const [assigning, setAssigning] = useState(false);
  const [astHovered, setAstHovered] = useState(false);
  const [hercHovered, setHercHovered] = useState(false);
  const [rollingAction, setRollingAction] = useState(null);
  const [inventory, setInventory] = useState({});
  const [lootboxCount, setLootboxCount] = useState(0);
  const [showCastor, setShowCastor] = useState(false);
  const [castorHovered, setCastorHovered] = useState(false);
  const [castorBadge, setCastorBadge] = useState(0);
  const timer = useSessionTimer(campaign.id);
  const isAssigned = userChar?.campaign_id === String(campaign.id);
  const [showAstragal, setShowAstragal] = useState(false);
  const [showHercules, setShowHercules] = useState(false);
  const [showScribeCV, setShowScribeCV] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showScribe, setShowScribe] = useState(false);
  const [showArgus, setShowArgus] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [showGrimoire, setShowGrimoire] = useState(false);
  const [showLark, setShowLark] = useState(false);
  const [showBazaar, setShowBazaar] = useState(false);
  const [showQuestor, setShowQuestor] = useState(false);
  const [clockState, setClockState] = useState(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [showIntent, setShowIntent] = useState(false);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setAuthUser(data?.user || null));
}, []);

useEffect(() => {
  if (!campaign?.id) return;
  supabase.from('world_clock').select('*').eq('campaign_id', campaign.id).maybeSingle()
    .then(({ data }) => { if (data) setClockState(data); });
  const ch = supabase.channel(`world_clock_cv_${campaign.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'world_clock', filter: `campaign_id=eq.${campaign.id}` },
      ({ new: u }) => { if (u) setClockState(u); })
    .subscribe();
  return () => supabase.removeChannel(ch);
}, [campaign.id]);

useEffect(() => {
  if (!campaign?.id) return;
  const check = async () => {
    const { data } = await supabase.from('sessions').select('id')
      .eq('campaign_id', campaign.id).eq('status', 'lobby').limit(1);
    setLobbyOpen((data?.length || 0) > 0);
  };
  check();
  const ch = supabase.channel(`lobby-banner-${campaign.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions',
      filter: `campaign_id=eq.${campaign.id}` }, check)
    .subscribe();
  return () => supabase.removeChannel(ch);
}, [campaign.id]);

  // Poll lootbox count for badge
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('lootboxes')
        .select('*', { count: 'exact', head: true })
        .eq('claimed', false)
        .eq('revealed', true)
        .or(`campaign_id.eq.${campaign.id},campaign_id.is.null`);
      setLootboxCount(count || 0);
    };
    fetchCount();
    const sub = supabase.channel(`loot-badge-${campaign.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, fetchCount)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaign.id]);

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
    effective._itemBonuses = itemBonuses;
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

  const rollAbility = async (entry, modifier) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + modifier;
    const { data: hsession } = await supabase
      .from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaign.id)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!hsession?.id) return;
    await supabase.from('hercules_events').insert({
      session_id: hsession.id,
      type: 'ability',
      actor_name: userChar?.name || 'Player',
      actor_id: userChar?.id ? String(userChar.id) : null,
      description: `${userChar?.name || 'Player'} used ${entry.name} [${entry.disciplineLabel}]: d20 ${roll} ${modifier >= 0 ? '+' : ''}${modifier} = ${total}.`,
    });
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
    ? <>
        <SessionCheckin char={userChar} user={authUser} campaignId={String(campaign.id)} />
        <CharacterSheetInline char={userChar} effectiveStats={effectiveStats} />
      </>
    : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;
      case 'Scales':
        return userChar
          ? <ScalesPanel char={userChar} effectiveStats={effectiveStats} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Actions':
        return userChar ? (
          <div>
            <div style={{ ...label8(), marginBottom: 8 }}>Declare Intent</div>
            <div style={{ marginBottom: 16 }}>
              <IntentDeclare campaignId={String(campaign.id)} char={userChar} />
            </div>
            <div style={{ ...label8(), marginBottom: 12 }}>Your Actions</div>
            {Object.entries(ACTIONS).map(([category, actions]) => {
              if (category === 'magic' && userChar.cp !== 'magic') return null;
              if (category === 'tech' && userChar.cp !== 'tech') return null;
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

      case 'Abilities':
        return userChar
          ? <AbilitiesPanel char={userChar} campaignId={String(campaign.id)} onRoll={rollAbility} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Inventory':
        return userChar
          ? <InventoryPanel char={userChar} onInventoryChange={setInventory} campaignId={String(campaign.id)} />
          : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Loot':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 14 }}>Lootboxes</div>
            <LootboxPanel
              campaignId={String(campaign.id)}
              userChar={userChar}
              onClaimed={() => setLootboxCount(c => Math.max(0, c - 1))}
            />
          </div>
        );

      case 'Log':
        return <SessionLogTab campaignId={String(campaign.id)} userChar={userChar} />;

      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <FloatToolbar buttons={[
        {
          id: 'astragal',
          title: 'Astragal — Roll the dice',
          onClick: () => setShowAstragal(o => !o),
          children: (
            <img
              src="/AstragalButton.png"
              alt="Astragal"
              draggable={false}
              style={{
                width: '118%',
                height: '118%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          ),
        },
        {
          id: 'hercules',
          title: 'HERCULES — Combat Tracker',
          onClick: () => setShowHercules(o => !o),
          children: (
            <img
              src="/HerculesCombat.png"
              alt="HERCULES"
              draggable={false}
              style={{
                width: '150%',
                height: '150%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          ),
        },
        {
          id: 'argus',
          title: 'ARGUS — My Gear, Pack & Equipment',
          onClick: () => setShowArgus(o => !o),
          children: (
            <img
              src="/Backpackicon.png"
              alt="ARGUS"
              draggable={false}
              style={{
                width: '105%',
                height: '105%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          ),
        },
        {
          id: 'castor',
          title: 'CASTOR — Cast Request',
          onClick: () => setShowCastor(o => !o),
          badge: castorBadge,
          children: (
            <img
              src="/castoricon.png"
              alt="CASTOR"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          ),
        },
        {
          id: 'scribe',
          title: 'The Scribe — Archives',
          onClick: () => setShowScribeCV(o => !o),
          children: <img src="/scribeicon.png" alt="Scribe" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'worldmap',
          title: 'World Map — Soteria',
          onClick: () => setShowWorldMap(o => !o),
          children: (
            <img
              src="/WorldMapIcon.png"
              alt="World Map"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          ),
        },
        // After the last existing button before the closing ]} add:
        {
          id: 'intent',
          title: 'Declare Intent',
          onClick: () => setShowIntent(o => !o),
          children: <span style={{ fontSize: 16, lineHeight: 1 }}>◎</span>,
        },
                   { id: 'bazaar', title: 'Bazaar — Trade & Loot', onClick: () => setShowBazaar(o => !o),
        children: <img src="/Bazaaricon.png" alt="Bazaar" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> },
      { id: 'questor', title: 'Questor — Quest Board', onClick: () => setShowQuestor(o => !o),
        children: <img src="/Questoricon.png" alt="Questor" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> },

                { id: 'grimoire', title: 'Grimoire — Adventure Journal', onClick: () => setShowGrimoire(o => !o),
          children: <img src="/Grimoireicon.png" alt="Grimoire" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> },
        { id: 'lark', title: 'Lark — Send a Letter', onClick: () => setShowLark(o => !o),
          children: <img src="/Larkicon.png" alt="Lark" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> },
      ]} />
            {showGrimoire && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowGrimoire(false)} title="GRIMOIRE · Adventure Journal" width={400} accentColor="rgba(121,245,167,0.35)">
          <GrimoirePanel char={userChar} campaignId={String(campaign.id)} isDM={false} embedded />
        </DraggablePanel>
      )}
      {showLark && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowLark(false)} title="LARK · Letters & Correspondence" width={400} accentColor="rgba(200,168,74,0.35)">
          <LarkPanel char={userChar} campaignId={String(campaign.id)} isDM={false} embedded />
        </DraggablePanel>
      )}

      {/* Astragal panel */}
      {showAstragal && (
        <DraggablePanel defaultX={108} defaultY={300} onClose={() => setShowAstragal(false)} title="Astragal — Fate Cast in Bone" width={320} accentColor="rgba(240,238,235,0.12)">
          <div style={{ padding: 14 }}>
            <Astragal character={userChar} actionName="Astragal Roll" statKey="will" onResult={logRoll} />
          </div>
        </DraggablePanel>
      )}

      {/* HERCULES lite panel */}
      {showHercules && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowHercules(false)} title="HERCULES" width={340} accentColor="rgba(200,168,74,0.35)">
          <HerculesPlayer campaignId={String(campaign.id)} char={userChar} />
        </DraggablePanel>
      )}

      {showCastor && (
        <DraggablePanel defaultX={108} defaultY={160} onClose={() => setShowCastor(false)} title="CASTOR · Spell-Casting & Schematics" width={360} accentColor="rgba(56,189,248,0.35)">
          <CastorPanel char={userChar} campaignId={String(campaign.id)} onClose={() => setShowCastor(false)} onBadgeChange={setCastorBadge} embedded />
        </DraggablePanel>
      )}

      {showArgus && (
        <ArgusPlayerPanel char={userChar} onClose={() => setShowArgus(false)} />
      )}

      {showBestiary && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowBestiary(false)} title="BESTIARY · Creatures of Soteria" width={380} accentColor="rgba(168,230,163,0.3)">
          <BestiaryPanel isDM={false} campaignId={String(campaign.id)} embedded />
        </DraggablePanel>
      )}

      {showScribeCV && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowScribeCV(false)} title="THE SCRIBE · Soteria Archives" width={360} accentColor={`${COLORS.deity}55`}>
          <ScribePlayerPanel char={userChar} campaignId={String(campaign.id)} onUpdateChar={onUpdateChar} embedded />
        </DraggablePanel>
      )}

      {showBazaar && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowBazaar(false)} title="BAZAAR · Trade & Loot" width={420} accentColor="rgba(180,122,58,0.5)">
          <div style={{ padding: 14, height: '100%', overflowY: 'auto' }}>
            <BazaarPlayerPanel char={userChar} campaignId={String(campaign.id)} embedded />
          </div>
        </DraggablePanel>
      )}
      {showQuestor && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowQuestor(false)} title="QUESTOR · Quest Board" width={420} accentColor="rgba(200,168,74,0.4)">
          <div style={{ padding: 14, height: '100%', overflowY: 'auto' }}>
            <QuestorPlayerPanel char={userChar} campaignId={String(campaign.id)} embedded />
          </div>
        </DraggablePanel>
      )}

      {showWorldMap && (
  <DraggablePanel defaultX={120} defaultY={40} onClose={() => setShowWorldMap(false)} title="WORLD MAP · Soteria" width={Math.min(window.innerWidth - 140, 900)} accentColor="rgba(200,168,74,0.4)">
    <div style={{ height: '70vh' }}>
      <WorldMapPanel campaignId={String(campaign.id)} isDM={false} characters={[userChar].filter(Boolean)} />
    </div>
  </DraggablePanel>
)}

      {showIntent && (
        <div style={{ position: 'fixed', bottom: 90, left: 16, zIndex: 300000, background: '#100d0a', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 10, padding: '10px 12px', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: '0.14em', color: COLORS.muted, marginBottom: 8 }}>DECLARE INTENT</div>
          <IntentDeclare campaignId={campaign.id} char={userChar} compact />
        </div>
      )}

      {/* Header */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Campaigns</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>{campaign.subtitle}</div>
          <div style={{ fontSize: 8, color: timer ? COLORS.magic : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: timer ? 700 : 400 }}>
            {timer ? `⏱ ${timer}` : (FULL_TITLES[campaign.id] || campaign.name)}
          </div>
        </div>
        <div style={{ minWidth: 60, display: 'flex', justifyContent: 'flex-end' }}>
          {clockState && <SoteriaClockDisplay clock={clockState} compact />}
        </div>
      </div>

      {/* Lobby banner */}
{lobbyOpen && (
  <div style={{
    background: 'rgba(121,245,167,0.06)',
    borderBottom: '1px solid rgba(121,245,167,0.2)',
    padding: '8px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  }}>
    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: '#79f5a7', letterSpacing: '0.12em' }}>
      ● SESSION LOBBY OPEN
    </div>
    <button onClick={() => setActiveTab('Sheet')} style={{
      background: 'rgba(121,245,167,0.12)', border: '1px solid rgba(121,245,167,0.4)',
      borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
      fontFamily: "'Cinzel', serif", fontSize: 9, color: '#79f5a7', letterSpacing: '0.1em',
    }}>
      Check In →
    </button>
  </div>
)}



      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = tab === activeTab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 10px' : '12px 16px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 7 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative' }}>
              {tab}
              {tab === 'Loot' && lootboxCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 4, background: '#e8a84a', color: '#120e0a', borderRadius: '50%', width: 14, height: 14, fontSize: 7, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {lootboxCount > 9 ? '9+' : lootboxCount}
                </span>
              )}
            </button>
          );
        })}
        
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
          {false && !isAssigned && userChar && (
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

export default function CampaignView({ userChar, onHome, onAssign, onUpdateChar }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  if (selectedCampaign) {
    return <CampaignDashboard campaign={selectedCampaign} userChar={userChar} onBack={() => setSelectedCampaign(null)} onAssign={onAssign} onUpdateChar={onUpdateChar} />;
  }
  return <CampaignList onSelect={setSelectedCampaign} userChar={userChar} onHome={onHome} />;
}