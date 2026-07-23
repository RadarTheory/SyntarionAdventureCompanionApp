import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_CLASSES, ALL_STATS, getRaceDisplay } from './constants';
import ItemCatalog from './ItemCatalog';
import { RACES } from './constants';
import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_MECHANICS } from './soteria-mechanics';
import { SOTERIA_BESTIARY } from './soteria-bestiary';
import PlayersPanel from './PlayersPanel';
import Astragal from './Astragal';
import SessionManager from './SessionManager';
import { WorldMapPanel } from './WorldMapPanel';
import VTTCanvas from './VTTCanvas';
import HerculesCombat from './HerculesCombat';
import FloatToolbar from './FloatToolbar';
import CastorDMPanel from './CastorDMPanel';
import { ArgusDMPanel } from './Argus';
import BestiaryPanel from './BestiaryPanel';
import { ScribeDMPanel } from './ScribePanel';
import Solomon from './Solomon';
import NPCPanel from './NPCPanel';
import LarkPanel from './LarkPanel';
import { BazaarDMPanel } from './BazaarPanel';
import { QuestorDMPanel } from './QuestorPanel';
import SoteriaClockPanel, { SoteriaClockDisplay } from './SoteriaClockPanel';
import LoreAnnouncePanel from './LoreAnnouncePanel';
import PartyProximityPanel from './PartyProximityPanel';
import MapPanel from './MapPanel';
import DMSpeakPanel from './DMSpeakPanel';
import PortraitUpload from './PortraitUpload';
import CharacterTokenForge from './CharacterTokenForge';
import AssetsPanel from './AssetsPanel';
import ChroniclePanel from './ChroniclePanel';
import HandbookBookmark from './HandbookBookmark';
import MenuMusicPlayer from './MenuMusicPlayer';
import musicEngine from './musicEngine';
import { LEVEL_CAP, apForLevel, getLevelProgress, grantAp } from './leveling';
import { MENU_MUSIC_TRACKS, buildMenuMusicQueue, getTrackFamilyKey, getTrackKey, loadMenuMusicTracks } from './musicLibrary';

const SOTERIA_DM_CONTEXT = `
You are The Scribe - an ancient archival intelligence in the world of Soteria, 178 Era of Unity.
You are assisting the Dungeon Master (Architect) of this world.
You may speak plainly and directly - no cryptic player-facing persona needed here.
Be thorough, creative, and specific to the Soteria setting.

${SOTERIA_LORE}

${SOTERIA_MECHANICS}

${SOTERIA_BESTIARY}
`;

async function callGemini(system, messages, maxTokens = 1024) {
  const { data, error } = await supabase.functions.invoke('scribe', {
    body: { system, messages, max_tokens: maxTokens },
  });
  if (error) throw new Error(error.message || 'The relay to the archives failed.');
  if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function StatusBadge({ status }) {
  const map = {
    draft: { label: 'Draft', color: COLORS.dim, bg: 'rgba(131,115,100,0.12)' },
    awaiting_adventure: { label: 'Awaiting', color: COLORS.deity, bg: COLORS.deityBg },
    approved: { label: 'Approved', color: COLORS.magic, bg: COLORS.magicBg },
    rejected: { label: 'Rejected', color: COLORS.warn, bg: COLORS.warnBg },
  };
  const s = map[status] || map.draft;
  return (
    <div style={{ display: 'inline-block', fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 4, padding: '2px 7px' }}>
      {s.label}
    </div>
  );
}

function DraggablePanel({ defaultX, defaultY, onClose, title, width, accentColor, children, zIndex = 200000, isTop = true, onFocus }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const panelWidth = Math.min(width, Math.max(280, window.innerWidth - 24));
  const focusPanel = () => onFocus?.();
  const onMouseDown = (e) => { focusPanel(); dragging.current = true; offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.preventDefault(); };
  const onTouchStart = (e) => { focusPanel(); dragging.current = true; const t = e.touches[0]; offset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }; };
  useEffect(() => { focusPanel(); }, []);
  useEffect(() => {
    const onMove = (e) => { if (!dragging.current) return; const p = e.touches ? e.touches[0] : e; setPos({ x: Math.max(8, Math.min(window.innerWidth - panelWidth - 8, p.clientX - offset.current.x)), y: Math.max(8, Math.min(window.innerHeight - 80, p.clientY - offset.current.y)) }); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [panelWidth]);
  return (
    <div onMouseDownCapture={focusPanel} onTouchStartCapture={focusPanel} style={{ position: 'fixed', left: Math.min(pos.x, window.innerWidth - panelWidth - 8), top: pos.y, width: panelWidth, maxWidth: 'calc(100vw - 16px)', height: 'min(78vh, calc(100svh - 24px))', zIndex, display: 'flex', flexDirection: 'column', background: isTop ? '#100d0a' : 'rgba(16,13,10,0.82)', border: `1px solid ${isTop ? accentColor : 'rgba(201,185,145,0.16)'}`, borderRadius: 14, boxShadow: isTop ? '0 28px 90px rgba(0,0,0,0.78)' : '0 10px 36px rgba(0,0,0,0.42)', overflow: 'hidden', opacity: isTop ? 1 : 0.46, filter: isTop ? 'none' : 'saturate(0.72) brightness(0.72)', transform: isTop ? 'scale(1)' : 'scale(0.985)', transformOrigin: 'top left', transition: dragging.current ? 'none' : 'opacity 0.16s ease, filter 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease' }}>
      <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{ padding: '10px 14px', borderBottom: `1px solid ${isTop ? accentColor : 'rgba(201,185,145,0.14)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', background: isTop ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', flexShrink: 0, userSelect: 'none' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: isTop ? '#e8d9a7' : 'rgba(232,217,167,0.52)', letterSpacing: '0.12em' }}>? {title}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>?</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}
// CHAT PANEL (Player DM)
function ChatPanel({ session, onClose, isDM }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const bottomRef = useRef(null);


  useEffect(() => {
    if (!session) return;
    fetchMessages();
    const channel = supabase.channel(`dm-session-${session.session_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.session_id}` }, () => fetchMessages())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('session_id', session.session_id).order('created_at', { ascending: true });
    if (data) { setMessages(data); setSessionEnded(data.some(m => m.session_ended)); }
  };



  const handleSend = async () => {
    if (!input.trim() || sending || sessionEnded) return;
    setSending(true);
    await supabase.from('messages').insert({
      session_id: session.session_id,
     sender_id: null,
      character_id: session.character_id,
      campaign_id: session.campaign_id,
      type: 'dm_reply',
      content: input.trim(),
      sender_name: 'The Architect',
      is_dm: true,
      session_ended: false,
    });
    setInput(''); setSending(false);
  };

  const handleEndConsult = async () => {
    await supabase.from('messages').insert({
      session_id: session.session_id,
     sender_id: null,
      character_id: session.character_id,
      campaign_id: session.campaign_id,
      type: 'dm_system',
      content: '- Consult ended by the Architect -',
      sender_name: 'The Architect',
      is_dm: true,
      session_ended: true,
      session_ended_by: 'dm',
      session_ended_at: new Date().toISOString(),
    });
    setSessionEnded(true); onClose();
  };

  const headerName = session.character_name || 'Player';
  const headerSub = session.player_username
  ? `Campaign ${session.campaign_id} - @${session.player_username}`
  : session.campaign_id ? `Campaign ${session.campaign_id}` : 'Private';

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 360, maxHeight: 520, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>{headerName}</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{headerSub} - {sessionEnded ? 'Ended' : 'Active'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!sessionEnded && <button onClick={handleEndConsult} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>End Consult</button>}
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>x</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200, maxHeight: 320 }}>
        {messages.map(msg => {
          if (msg.type === 'dm_system') return (
            <div key={msg.id} style={{ textAlign: 'center', fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 0' }}>{msg.content}</div>
          );
          const isMe = isDM ? msg.is_dm : !msg.is_dm;
          const displayName = msg.is_dm ? 'The Architect' : (msg.sender_name || msg.character_name || 'Player');
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>{displayName}</div>
              <div style={{ maxWidth: '80%', background: isMe ? 'rgba(121,245,167,0.10)' : 'rgba(240,238,235,0.06)', border: `1px solid ${isMe ? COLORS.magic + '33' : COLORS.border}`, borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{msg.content}</div>
              <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!sessionEnded ? (
        <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
          <button onClick={handleSend} disabled={sending || !input.trim()} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 12px', cursor: sending || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", opacity: sending ? 0.6 : 1 }}>Send</button>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>This consult has ended.</div>
      )}
    </div>
  );
}

// SCRIBE PANEL
function ScribePanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || ended) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    const newMessages = [...messages, { role: 'dm', content: userMsg, time: new Date() }];
    setMessages(newMessages);
    try {
      const geminiHistory = newMessages.map(m => ({ role: m.role === 'dm' ? 'user' : 'assistant', content: m.content }));
      const text = await callGemini(SOTERIA_DM_CONTEXT, geminiHistory, 800);
      setMessages(prev => [...prev, { role: 'scribe', content: text, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'scribe', content: 'The archives are silent. Try again.', time: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleEnd = () => {
    setMessages(prev => [...prev, { role: 'system', content: '- Consult ended by the Architect -', time: new Date() }]);
    setEnded(true);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 400, maxHeight: 560, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid ${COLORS.deity}44`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em' }}>The Scribe</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{ended ? 'Consult ended' : 'Active - Soteria Archives'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!ended
            ? <button onClick={handleEnd} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>End Consult</button>
            : <button onClick={() => { setMessages([]); setEnded(false); }} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.deityText, fontFamily: "'Cinzel', serif" }}>New Consult</button>
          }
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>x</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 260, maxHeight: 380 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 32 }}>
            The archives await your question, Architect.
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.role === 'system') return (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 0' }}>{msg.content}</div>
          );
          const isMe = msg.role === 'dm';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>{isMe ? 'The Architect' : 'The Scribe'}</div>
              <div style={{ maxWidth: '85%', background: isMe ? 'rgba(121,245,167,0.08)' : COLORS.deityBg, border: `1px solid ${isMe ? COLORS.magic + '33' : COLORS.deity + '44'}`, borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: isMe ? COLORS.text : COLORS.deityText, fontFamily: 'Georgia, serif', lineHeight: 1.65, fontStyle: isMe ? 'normal' : 'italic' }}>{msg.content}</div>
              <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>The Scribe</div>
            <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Scribe deliberates...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!ended ? (
        <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask the Scribe..." style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading ? 0.6 : 1 }}>Send</button>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>This consult has ended.</div>
      )}
    </div>
  );
}

// ASSIGN OWNER PANEL
function AssignOwnerPanel({ char }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [owner, setOwner] = useState(null);
  const [ownerId, setOwnerId] = useState(char.user_id || null);
  const [allUsers, setAllUsers] = useState(null);

  const loadUsers = async () => {
    if (allUsers) return allUsers;
    const { data } = await supabase.rpc('get_user_profiles');
    const mapped = (data || []).map(u => ({ ...u, username: u.email ? u.email.split('@')[0] : '-' }));
    setAllUsers(mapped);
    return mapped;
  };

  useEffect(() => {
    if (!ownerId) { setOwner(null); return; }
    loadUsers().then(list => setOwner(list.find(u => u.id === ownerId) || null));
  }, [ownerId]);

  const runSearch = async () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    const list = await loadUsers();
    setResults(list.filter(u =>
      (u.email || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
    ).slice(0, 10));
    setSearching(false);
  };

  const assign = async (profile) => {
    const { data, error } = await supabase.from('characters')
      .update({ user_id: profile.id }).eq('id', char.id).select('id, user_id');
    if (error) { alert(`Assign failed: ${error.message}`); return; }
    if (!data?.length) { alert('Assign failed: 0 rows written (a database policy filtered it).'); return; }
    setOwnerId(profile.id);
    setResults([]); setQuery('');
  };

  const unassign = async () => {
    const { data, error } = await supabase.from('characters')
      .update({ user_id: null }).eq('id', char.id).select('id');
    if (error) { alert(`Unassign failed: ${error.message}`); return; }
    if (!data?.length) { alert('Unassign failed: 0 rows written (a database policy filtered it).'); return; }
    setOwnerId(null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...label8(), marginBottom: 8 }}>Assigned Player</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: 11, color: owner ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: owner ? 'normal' : 'italic' }}>
          {owner ? `${owner.username} - ${owner.email}` : 'Unclaimed - no player assigned'}
        </div>
        {ownerId && (
          <button onClick={unassign} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>Unassign</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder="Search by email or username..." style={{ flex: 1, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={runSearch} disabled={searching || !query.trim()} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '7px 14px', cursor: searching || !query.trim() ? 'default' : 'pointer', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", opacity: searching ? 0.6 : 1 }}>{searching ? '...' : 'Search'}</button>
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 6 }}>
          {results.map(p => (
            <div key={p.id} onClick={() => assign(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(240,238,235,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: COLORS.text, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>{p.username || '-'}</div>
                <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
              </div>
              <div style={{ fontSize: 7, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Assign</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// CHARACTER EDITOR
function CharacterEditor({ char, onSave, onClose, campaigns = [] }) {
  const [data, setData] = useState({ portrait_url: char.portrait_url || char.data?.portrait_url || null, sprite_url: char.sprite_url || char.data?.sprite_url || char.data?.token?.sprite_url || null, ...char });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [spriteDrafts, setSpriteDrafts] = useState([]);
  const [selectedSpriteUrl, setSelectedSpriteUrl] = useState(data.sprite_url || '');
  const [spriteGenerationCount, setSpriteGenerationCount] = useState(data.token?.generation_count || 0);
  const [apGrant, setApGrant] = useState('');
  const [apReason, setApReason] = useState('');
  const [levelDraft, setLevelDraft] = useState(String(data.charLevel || data.level || 1));
  const [grantingAp, setGrantingAp] = useState(false);
  const apTotal = data.apTotal ?? data.ap_total ?? 0;
  const atCurrent = data.atCurrent ?? data.at_current ?? data.apCurrent ?? 0;
  const atTotal = data.atTotal ?? data.at_total ?? data.apTotal ?? 0;
  const progress = getLevelProgress(apTotal);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('characters').delete().eq('id', char.id);
    setDeleting(false);
    onSave();
    onClose();
  };

  const handleSave = async (newStatus) => {
    setSaving(true);
    const { id, status, campaign_id, user_id, ...blob } = data;
    await supabase.from('characters').update({ data: { ...blob, portrait_url: data.portrait_url || null, sprite_url: selectedSpriteUrl || data.sprite_url || null, token: { ...(data.token || {}), sprite_url: selectedSpriteUrl || data.sprite_url || null, generation_count: spriteGenerationCount, status: (selectedSpriteUrl || data.sprite_url) ? 'selected' : 'not_selected' } }, status: newStatus || data.status, campaign_id: data.campaign || null }).eq('id', char.id);
    if (note && (newStatus === 'rejected' || newStatus === 'approved')) {
      await supabase.from('messages').insert({ character_id: char.id, campaign_id: data.campaign, type: 'dm_reply', content: note, sender_name: 'The Architect', is_dm: true });
    }
    setSaving(false); onSave();
  };

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const setStat = (key, val) => setData(prev => ({ ...prev, stats: { ...prev.stats, [key]: parseInt(val) || 8 } }));

  const awardAp = async () => {
    const amount = Math.max(0, parseInt(apGrant, 10) || 0);
    if (!amount || grantingAp) return;
    setGrantingAp(true);
    try {
      const result = await grantAp(supabase, { targetType: 'character', targetId: char.id, amount, reason: apReason || 'DM award' });
      const nextAtCurrent = atCurrent + (result?.at_granted || 0);
      const nextAtTotal = atTotal + (result?.at_granted || 0);
      setData(prev => ({ ...prev, apTotal: result?.ap_after ?? apTotal + amount, apCurrent: result?.ap_after ?? apTotal + amount, charLevel: result?.level_after ?? prev.charLevel, atCurrent: nextAtCurrent, atTotal: nextAtTotal, at_current: nextAtCurrent, at_total: nextAtTotal }));
      setApGrant('');
      setApReason('');
      onSave?.();
    } catch (e) {
      setNote(e.message || 'AP award failed.');
    } finally {
      setGrantingAp(false);
    }
  };

  const setManualLevel = async () => {
    const targetLevel = Math.max(1, Math.min(LEVEL_CAP, parseInt(levelDraft, 10) || 1));
    const currentLevel = data.charLevel || data.level || progress.level;
    const levelDelta = targetLevel - currentLevel;
    const nextApTotal = apForLevel(targetLevel);
    const nextAtCurrent = Math.max(0, atCurrent + levelDelta);
    const nextAtTotal = Math.max(0, atTotal + levelDelta);
    const nextData = {
      ...data,
      apTotal: nextApTotal,
      apCurrent: nextApTotal,
      charLevel: targetLevel,
      level: targetLevel,
      atCurrent: nextAtCurrent,
      atTotal: nextAtTotal,
      at_current: nextAtCurrent,
      at_total: nextAtTotal,
    };
    const { id, status, campaign_id, user_id, ...blob } = nextData;
    setSaving(true);
    try {
      const { error } = await supabase.from('characters').update({
        ap_total: nextApTotal,
        level: targetLevel,
        at_current: nextAtCurrent,
        at_total: nextAtTotal,
        atCurrent: nextAtCurrent,
        atTotal: nextAtTotal,
        data: blob,
      }).eq('id', char.id);
      if (error) throw error;
      setData(nextData);
      setLevelDraft(String(targetLevel));
      onSave?.();
    } catch (e) {
      setNote(e.message || 'Manual level update failed.');
    } finally {
      setSaving(false);
    }
  };

  const syncSpriteToVttSessions = async (url) => {
    const { data: sessions } = await supabase.from('vtt_sessions').select('id,tokens,map_states');
    await Promise.all((sessions || []).map(async (session) => {
      let changed = false;
      const tokens = Array.isArray(session.tokens) ? session.tokens.map(token => {
        if (String(token.characterId || token.character_id || '') !== String(char.id)) return token;
        changed = true;
        return { ...token, sprite_url: url };
      }) : session.tokens;
      const mapStates = { ...(session.map_states || {}) };
      Object.keys(mapStates).forEach(key => {
        const state = mapStates[key];
        if (!Array.isArray(state?.tokens)) return;
        mapStates[key] = {
          ...state,
          tokens: state.tokens.map(token => {
            if (String(token.characterId || token.character_id || '') !== String(char.id)) return token;
            changed = true;
            return { ...token, sprite_url: url };
          }),
        };
      });
      if (changed) await supabase.from('vtt_sessions').update({ tokens, map_states: mapStates, updated_at: new Date().toISOString() }).eq('id', session.id);
    }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(6px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, padding: '28px 32px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: COLORS.text }}>{char.name}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 16 }}>x</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <PortraitUpload
            currentUrl={data.portrait_url}
            onUploaded={async (url) => {
              set('portrait_url', url);
              await supabase.from('characters').update({
                data: { ...data, portrait_url: url }
              }).eq('id', char.id);
            }}
          />
        </div>
        <CharacterTokenForge
          char={data}
          portraitUrl={data.portrait_url}
          drafts={spriteDrafts}
          setDrafts={setSpriteDrafts}
          selectedUrl={selectedSpriteUrl}
          setSelectedUrl={(url) => { setSelectedSpriteUrl(url); set('sprite_url', url); }}
          generationCount={spriteGenerationCount}
          setGenerationCount={setSpriteGenerationCount}
          onSelectedUrl={async (url) => {
            const nextToken = { ...(data.token || {}), sprite_url: url, generation_count: spriteGenerationCount, status: 'selected' };
            setData(prev => ({ ...prev, sprite_url: url, token: nextToken }));
            await supabase.from('characters').update({ data: { ...data, sprite_url: url, token: nextToken } }).eq('id', char.id);
            await syncSpriteToVttSessions(url);
            onSave?.();
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => handleSave('approved')} style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>Approve</button>
          <button onClick={() => handleSave('rejected')} style={{ flex: 1, background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>Reject</button>
          <button onClick={() => handleSave()} disabled={saving} style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.borderMid}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.text, fontFamily: "'Cinzel', serif" }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Note to Player (sent on approve/reject)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional message to the player..." rows={2} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label8(), marginBottom: 8 }}>Campaign</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {campaigns.map(c => <div key={c.id}onClick={() => set('campaign', data.campaign === c.id ? null : c.id)} style={{ background: data.campaign === c.id ? COLORS.magicBg : 'transparent', border: `1px solid ${data.campaign === c.id ? COLORS.magic : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 10, color: data.campaign === c.id ? COLORS.magicText : COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>{c.subtitle}</div>)}
          </div>
        </div>

        <AssignOwnerPanel char={char} />

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...label8(), marginBottom: 6 }}>Race</div>
            <select value={data.race || ''} onChange={e => { set('race', e.target.value); set('rv', ''); }}
              style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }}>
              <option value="" style={{ background: '#13100d' }}>Select race</option>
              {RACES.map(r => <option key={r.id} value={r.id} style={{ background: '#13100d' }}>{r.name}</option>)}
            </select>
          </div>
          {(() => {
            const raceDef = RACES.find(r => r.id === data.race);
            if (!raceDef?.variants?.length) return null;
            return (
              <div style={{ flex: 1 }}>
                <div style={{ ...label8(), marginBottom: 6 }}>Variant</div>
                <select value={data.rv || ''} onChange={e => set('rv', e.target.value)}
                  style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }}>
                  <option value="" style={{ background: '#13100d' }}>None</option>
                  {raceDef.variants.map(v => <option key={v} value={v} style={{ background: '#13100d' }}>{v}</option>)}
                </select>
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...label8(), marginBottom: 6 }}>Class</div>
            <select value={data.cid || ''} onChange={e => set('cid', e.target.value)}
              style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }}>
              <option value="" style={{ background: '#13100d' }}>Select class</option>
              {ALL_CLASSES?.map(c => <option key={c.id} value={c.id} style={{ background: '#13100d' }}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ width: 120 }}>
            <div style={{ ...label8(), marginBottom: 6 }}>Morality</div>
            <input type="number" value={data.morality - 0} onChange={e => set('morality', parseInt(e.target.value) || 0)}
              style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
          </div>
        </div>
        {[['Name', 'name'], ['Backstory', 'backstory'], ['Notes', 'notes']].map(([lbl, key]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ ...label8(), marginBottom: 6 }}>{lbl}</div>
            {key === 'name'
              ? <input value={data[key] || ''} onChange={e => set(key, e.target.value)} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }} />
              : <textarea value={data[key] || ''} onChange={e => set(key, e.target.value)} rows={3} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />}
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label8(), marginBottom: 10 }}>Progression</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
            {[[ 'Level', data.charLevel || progress.level ], [ 'AP Total', apTotal ], [ 'AP Next', progress.level >= 50 ? 'Cap' : progress.neededForNext ], [ 'AT', String(atCurrent) + '/' + String(atTotal) ]].map(([lbl, val]) => (
              <div key={lbl} style={{ background: COLORS.card, border: '1px solid rgba(240,238,235,0.12)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ ...label8(), marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: COLORS.text, fontWeight: 800 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input type='number' min='1' value={apGrant} onChange={e => setApGrant(e.target.value)} placeholder='AP' style={{ width: 74, background: 'rgba(240,238,235,0.04)', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '6px 8px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
            <input value={apReason} onChange={e => setApReason(e.target.value)} placeholder='Reason' style={{ flex: 1, background: 'rgba(240,238,235,0.04)', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '6px 8px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
            <button onClick={awardAp} disabled={grantingAp || !apGrant} style={{ background: COLORS.magicBg, border: '1px solid rgba(159,136,255,0.55)', borderRadius: 5, padding: '7px 12px', cursor: grantingAp || !apGrant ? 'default' : 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", opacity: grantingAp || !apGrant ? 0.6 : 1 }}>{grantingAp ? 'Awarding...' : 'Award AP'}</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input type='number' min='1' max={LEVEL_CAP} value={levelDraft} onChange={e => setLevelDraft(e.target.value)} placeholder='Level' style={{ width: 74, background: 'rgba(240,238,235,0.04)', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '6px 8px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
            <div style={{ flex: 1, fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Sets AP to that level threshold and adjusts AT by the level difference.</div>
            <button onClick={setManualLevel} disabled={saving} style={{ background: 'rgba(240,238,235,0.06)', border: '1px solid rgba(240,238,235,0.18)', borderRadius: 5, padding: '7px 12px', cursor: saving ? 'default' : 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text, fontFamily: "'Cinzel', serif", opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Set Level'}</button>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['atCurrent', 'AT Current'], ['atTotal', 'AT Total']].map(([key, lbl]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", width: 70 }}>{lbl}</div>
                <input type='number' min='0' value={data[key] ?? 0} onChange={e => { const val = parseInt(e.target.value) || 0; set(key, val); set(key === 'atCurrent' ? 'at_current' : 'at_total', val); }} style={{ width: 50, background: 'rgba(240,238,235,0.04)', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 4, padding: '4px 6px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...label8(), marginBottom: 10 }}>Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALL_STATS.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", width: 60 }}>{s.label}</div>
              <input type="number" min="8" max="20" value={data.stats?.[s.key] || 8} onChange={e => setStat(s.key, e.target.value)} style={{ width: 50, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <DMMemoryPanel characterId={char.id} />
        </div>

        {/* Danger zone: permanent delete */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid rgba(224,90,90,0.25)` }}>
          <div style={{ ...label8(), marginBottom: 10, color: '#e05a5a' }}>Danger Zone</div>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', background: 'transparent', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 6, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e05a5a' }}>
              Delete Delete Character Permanently
            </button>
          ) : (
            <div style={{ background: 'rgba(224,90,90,0.06)', border: '1px solid rgba(224,90,90,0.35)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5, marginBottom: 12 }}>
                This permanently erases <strong>{char.name}</strong> from Supabase. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, background: 'rgba(224,90,90,0.15)', border: '1px solid rgba(224,90,90,0.6)', borderRadius: 6, padding: '9px', cursor: deleting ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e05a5a', fontWeight: 700, opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? 'Deleting...' : 'Confirm - Delete Forever'}
                </button>
                <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                  style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 16px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.dim }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// DM MEMORY PANEL
function DMMemoryPanel({ characterId, campaignId }) {
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState('');
  const [category, setCategory] = useState('note');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMemories(); }, [characterId, campaignId]);

  const fetchMemories = async () => {
    let q = supabase.from('dm_memory').select('*').order('created_at', { ascending: false });
    if (characterId) q = q.eq('character_id', characterId);
    else if (campaignId) q = q.eq('campaign_id', campaignId);
    const { data } = await q;
    if (data) setMemories(data);
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    setSaving(true);
    await supabase.from('dm_memory').insert({ character_id: characterId || null, campaign_id: campaignId || null, category, content: newMemory.trim() });
    setNewMemory(''); setSaving(false); fetchMemories();
  };

  const deleteMemory = async (id) => { await supabase.from('dm_memory').delete().eq('id', id); fetchMemories(); };
  const cats = ['note', 'secret', 'hook', 'npc', 'lore'];

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 10 }}>DM Memory</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {cats.map(c => <div key={c} onClick={() => setCategory(c)} style={{ background: category === c ? COLORS.deityBg : 'transparent', border: `1px solid ${category === c ? COLORS.deity : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: category === c ? COLORS.deityText : COLORS.dim, fontFamily: "'Cinzel', serif" }}>{c}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input value={newMemory} onChange={e => setNewMemory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMemory()} placeholder="Add a memory entry..." style={{ flex: 1, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={addMemory} disabled={saving} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif" }}>+</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
        {memories.map(m => (
          <div key={m.id} style={{ background: 'rgba(240,238,235,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ fontSize: 7, color: COLORS.deity, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.category}</div>
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{new Date(m.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>{m.content}</div>
              {(m.character_id || m.campaign_id) && (
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  {m.campaign_id ? `Campaign ${m.campaign_id}` : 'Character'}
                </div>
              )}
            </div>
            <button onClick={() => deleteMemory(m.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>x</button>
          </div>
        ))}
        {memories.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No memories recorded.</div>}
      </div>
    </div>
  );
}

// SESSION LOG EDITOR
function FormattedLog({ text }) {
  if (!text) return null;
  // Break a run-on entry before inline "Capitalized Label:" headers, then on newlines.
  const withBreaks = String(text).replace(/\s+([A-Z][^.:\-\n]{0,46}(?:\([^)]*\))?:)\s/g, '\n\n$1 ');
  const blocks = withBreaks.split(/\n+/).map(b => b.trim()).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {blocks.map((block, i) => {
        const isAllCaps = block.length < 60 && block === block.toUpperCase() && /[A-Z]/.test(block);
        const headerMatch = block.match(/^([A-Z][^.:-]{0,46}(?:\([^)]*\))?)\s*[:-]\s+([\s\S]*)$/);

        if (isAllCaps) {
          return (
            <div key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#e8d9a7', textTransform: 'uppercase', marginTop: i === 0 ? 0 : 4 }}>
              {block}
            </div>
          );
        }
        if (headerMatch && headerMatch[1].length < 42) {
          const [, head, rest] = headerMatch;
          return (
            <p key={i} style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: '#e8d9a7', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.04em' }}>{head}</strong>{rest ? ` - ${rest}` : ''}
            </p>
          );
        }
        return (
          <p key={i} style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

function SessionLogEditor({ campaign }) {
  const [log, setLog] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

  useEffect(() => { fetchLog(); }, [campaign.id]);

  const fetchLog = async () => {
    const { data } = await supabase.from('campaigns').select('session_log').eq('id', campaign.id).single();
    if (data?.session_log) setLog(data.session_log);
  };

  const addEntry = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    const entry = { id: Date.now(), title: sessionTitle || `Session ${log.length + 1}`, content: newEntry.trim(), timestamp: new Date().toISOString() };
    const updated = [...log, entry];
    await supabase.from('campaigns').update({ session_log: updated }).eq('id', campaign.id);
    setLog(updated); setNewEntry(''); setSessionTitle(''); setSaving(false);
  };

  const deleteEntry = async (id) => {
    const updated = log.filter(e => e.id !== id);
    await supabase.from('campaigns').update({ session_log: updated }).eq('id', campaign.id);
    setLog(updated);
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Session Log - {campaign.subtitle}</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px', marginBottom: 16 }}>
        <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="Session title (optional)..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${COLORS.border}`, padding: '6px 0', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="Write the session log entry..." rows={4} style={{ width: '100%', background: 'transparent', border: 'none', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={addEntry} disabled={saving || !newEntry.trim()} style={{ background: saving ? 'transparent' : COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 20px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Committing...' : '* Commit to Log'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...log].reverse().map(entry => (
          <div key={entry.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text }}>{entry.title}</div>
                <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>{new Date(entry.timestamp).toLocaleDateString()}</div>
              </div>
              <button onClick={() => deleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 14 }}>x</button>
            </div>
            <FormattedLog text={entry.content} />
          </div>
        ))}
        {log.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No entries yet. The chronicle awaits.</div>}
      </div>
    </div>
  );
}

function normalizeMapUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:|\/)/i.test(raw)) return raw;
  return `/Maps/${raw.replace(/^Maps[\\/]/i, '')}`;
}

// MAP MANAGER
function MapManager({ campaign }) {
  const [url, setUrl] = useState('');
  const [current, setCurrent] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewUrl = normalizeMapUrl(current || url);

  useEffect(() => {
    supabase.from('campaigns').select('map_url').eq('id', campaign.id).single().then(({ data }) => {
      if (data?.map_url) { setUrl(data.map_url); setCurrent(data.map_url); }
      else { setUrl(''); setCurrent(''); }
    });
  }, [campaign.id]);

  useEffect(() => { setPreviewFailed(false); }, [previewUrl]);

  const save = async () => {
    const next = normalizeMapUrl(url);
    setSaving(true);
    await supabase.from('campaigns').update({ map_url: next }).eq('id', campaign.id);
    setUrl(next);
    setCurrent(next);
    setSaving(false);
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Map - {campaign.subtitle}</div>
      <div style={{ minHeight: 280, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: 'rgba(240,238,235,0.025)', overflow: 'hidden', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt={`${campaign.subtitle || 'Campaign'} map`}
            onError={() => setPreviewFailed(true)}
            style={{ width: '100%', maxHeight: 560, objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.12em', color: COLORS.text, marginBottom: 8 }}>
              {previewUrl ? 'Map image not found' : 'No map selected'}
            </div>
            <div style={{ fontSize: 12, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Use a full URL or a file name from public/Maps, such as Avalora.png.
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input value={url} onChange={e => { setUrl(e.target.value); setCurrent(''); }} placeholder="Paste image URL or Maps file name..." style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={save} disabled={saving} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '9px 16px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700 }}>{saving ? 'Saving...' : 'Set Map'}</button>
      </div>
      {previewUrl && (
        <div style={{ marginTop: 8, fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Previewing {previewUrl}
        </div>
      )}
    </div>
  );
}
// MUSIC PANEL
function MusicPanel() {
  const [tracks, setTracks] = useState(MENU_MUSIC_TRACKS);
  const [search, setSearch] = useState('');
  const [currentTrack, setCurrentTrack] = useState(MENU_MUSIC_TRACKS[0] || null);
  const [libraryStatus, setLibraryStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadMenuMusicTracks()
      .then(rows => {
        if (cancelled) return;
        setTracks(rows);
        setCurrentTrack(current => current || rows[0] || null);
        setLibraryStatus('');
      })
      .catch(err => {
        console.warn('Could not load R2 music manifest; no music tracks are available yet.', err);
        setLibraryStatus('Using the confirmed R2 proof track.');
      });
    return () => { cancelled = true; };
  }, []);

  const filteredTracks = tracks.filter(t => {
    const haystack = `${t.title || ''} ${t.artist || ''} ${t.filename || t.path || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const playInMenuPlayer = async (track) => {
    if (!track) return;
    setCurrentTrack(track);
    musicEngine.setQueue(buildMenuMusicQueue(tracks, {
      avoidFirstFamily: getTrackFamilyKey(track),
    }));
    const result = await musicEngine.play(track);
    if (!result?.ok && result?.error?.name !== 'AbortError') {
      console.warn('DM music play failed:', result?.error);
    }
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Music Library</div>
      <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.45, marginBottom: 14 }}>
        R2-backed music library loaded from music-manifest.json in the public bucket.
      </div>
      {libraryStatus && (
        <div style={{ fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{libraryStatus}</div>
      )}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search music..."
        style={{ width: '100%', marginBottom: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }}
      />
      {currentTrack && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            {currentTrack.artwork && (
              <img src={currentTrack.artwork} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', border: `1px solid ${COLORS.border}`, background: COLORS.surface }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 4, letterSpacing: '0.04em' }}>{currentTrack.title}</div>
              <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>
                {currentTrack.artist || 'Unknown artist'}
              </div>
              <div style={{ fontSize: 8, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {currentTrack.album || 'Syntarion'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => playInMenuPlayer(currentTrack)}
            style={{
              width: '100%',
              background: COLORS.magicBg,
              border: `1px solid ${COLORS.magic}`,
              borderRadius: 6,
              padding: '10px 12px',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.magicText,
              fontWeight: 700,
            }}
          >
            Play In Menu Player
          </button>
        </div>
      )}
      <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 10 }}>
        {filteredTracks.length} of {tracks.length} track{tracks.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredTracks.map(track => {
          const trackKey = getTrackKey(track);
          const activeKey = currentTrack ? getTrackKey(currentTrack) : '';
          return (
            <button
              key={trackKey}
              onClick={() => playInMenuPlayer(track)}
              style={{
                textAlign: 'left',
                background: activeKey === trackKey ? COLORS.magicBg : COLORS.card,
                border: `1px solid ${activeKey === trackKey ? COLORS.magic : COLORS.border}`,
                borderRadius: 6,
                padding: '10px 12px',
                color: COLORS.text,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {track.artwork && <img src={track.artwork} alt="" style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', border: `1px solid ${COLORS.border}` }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11 }}>{track.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic', marginTop: 3 }}>{track.artist || 'Unknown artist'} - {track.album || 'Syntarion'}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function VitalsPanel({ row, onClose, campaignId }) {
  const isCreature = !row.character_id || row.character_id === row.character_name;
  const VITALS_KEY = `syntarion_vitals_${row.character_id}`;
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '{}')[k] - def; } catch { return def; } };
  const [vitals, setVitals] = useState({ current: load('vitals', null), max: load('vitalsMax', null) });
  const [stamina, setStamina] = useState({ current: load('stamina', null), max: load('staminaMax', null) });
  const [resolve, setResolve] = useState({ current: load('resolve', null), max: load('resolveMax', null) });

  useEffect(() => {
    if (!isCreature) {
      supabase.from('characters').select('data').eq('id', String(row.character_id)).maybeSingle().then(({ data }) => {
        if (!data?.data) return;
        const d = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        const s = d.stats || {};
        const v = (s.body || 8) + (s.will || 8), st = (s.body || 8) + (s.whim || 8), r = (s.soul || 8) + (s.dream || 8);
        setVitals(p => ({ current: p.current - v, max: p.max - v }));
        setStamina(p => ({ current: p.current - st, max: p.max - st }));
        setResolve(p => ({ current: p.current - r, max: p.max - r }));
      });
    }
  }, [row.character_id]);

  const save = (v, s, r) => localStorage.setItem(VITALS_KEY, JSON.stringify({
    vitals: v.current, vitalsMax: v.max, stamina: s.current, staminaMax: s.max, resolve: r.current, resolveMax: r.max
  }));

  const Tracker = ({ label, color, state, setState, others }) => {
    const cur = state.current - 0, max = state.max - 0;
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    const upd = (next) => { setState(next); save(label === 'Vitals' ? next : vitals, label === 'Stamina' ? next : stamina, label === 'Resolve' ? next : resolve); };
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color, letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => upd({ ...state, current: Math.max(0, (state.current - 0) - 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(224,90,90,0.15)', border: '1px solid rgba(224,90,90,0.4)', color: '#e05a5a', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
            <input type="number" value={state.current - ''} onChange={e => upd({ ...state, current: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}44`, borderRadius: 4, color, fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, outline: 'none', padding: '2px 0' }} />
            <span style={{ color: '#555', fontSize: 10 }}>/</span>
            <input type="number" value={state.max - ''} onChange={e => upd({ ...state, max: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.dim, fontFamily: "'Cinzel',serif", fontSize: 11, outline: 'none', padding: '2px 0' }} />
            <button onClick={() => upd({ ...state, current: Math.min(state.max - 999, (state.current - 0) + 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.35)', color: '#79f5a7', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
        <div style={{ height: 4, background: `${color}22`, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.2s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'rgba(20,14,10,0.95)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: COLORS.text }}>{row.character_name} - Health</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 9, color: COLORS.dim }}>x</button>
      </div>
      {isCreature && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia,serif', fontStyle: 'italic', marginBottom: 8 }}>Set max manually for this enemy.</div>}
      <Tracker label="Vitals" color="#e05a5a" state={vitals} setState={setVitals} />
      <Tracker label="Stamina" color="#e08a5a" state={stamina} setState={setStamina} />
      <Tracker label="Resolve" color="#79f5a7" state={resolve} setState={setResolve} />
    </div>
  );
}

// Character editor
// MAIN DM VIEW
// Character editor
const DM_TABS = ['Inbox', 'Characters', 'Campaigns', 'Chronicle', 'Scribe', 'Memory', 'Catalog', 'VTT'];

export default function DMView({ user, session, onHome, darkMode = true, module = null }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Inbox');
  const [characters, setCharacters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChar, setEditingChar] = useState(null);
  const [activeCampaignTab, setActiveCampaignTab] = useState(() => localStorage.getItem('dm_active_campaign') || null);
  const [dbCampaigns, setDbCampaigns] = useState([]);  
  const [campaignSubTab, setCampaignSubTab] = useState('log');
  const [activeSession, setActiveSession] = useState(null);
  const [manualLogText, setManualLogText] = useState('');
  const [manualCombatantName, setManualCombatantName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showArchive, setShowArchive] = useState(false);
  const [toast, setToast] = useState(null);
  const [convoToast, setConvoToast] = useState(null);
  const [sessionTimerLabel, setSessionTimerLabel] = useState(null);
  const [castorPendingCount, setCastorPendingCount] = useState(0);
  const [showCastor, setShowCastor] = useState(false);
  const [castorBadge, setCastorBadge] = useState(0);
  const [showHercules, setShowHercules] = useState(false);
  const [showAstragal, setShowAstragal] = useState(false);
  const [showArgus, setShowArgus] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showScribePanel, setShowScribePanel] = useState(false);
  const [showSolomon, setShowSolomon] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [showNPC, setShowNPC] = useState(false);
  const [showLarks, setShowLarks] = useState(false);
  const [showBazaar, setShowBazaar] = useState(false);
  const [showQuestor, setShowQuestor] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [headerClock, setHeaderClock] = useState(null);
  const [showSpeak, setShowSpeak] = useState(false);
  const [showProximity, setShowProximity] = useState(false);
  const [activeGameSessionId, setActiveGameSessionId] = useState(null);
  const [vttMinimized, setVttMinimized] = useState(false);

  useEffect(() => {
    if (!activeCampaignTab) { setActiveGameSessionId(null); return; }
    const cid = String(activeCampaignTab);
    supabase.from('sessions').select('id')
      .eq('campaign_id', cid).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setActiveGameSessionId(data?.id || null));

    const ch = supabase.channel(`active_game_session_${cid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `campaign_id=eq.${cid}` },
        ({ new: row }) => { if (row?.status === 'active') setActiveGameSessionId(row.id); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [activeCampaignTab]);
  
  
   // Live world clock for the header, scoped to the active campaign tab
useEffect(() => {
    if (!activeCampaignTab) { setHeaderClock(null); return; }
    const cid = String(activeCampaignTab);

    supabase.from('world_clock').select('*').eq('campaign_id', cid).maybeSingle()
      .then(({ data }) => { if (data) setHeaderClock(data); });

    const ch = supabase
      .channel(`world_clock_dm_${cid}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'world_clock',
        filter: `campaign_id=eq.${cid}`,
      }, ({ new: updated }) => {
        if (updated && String(updated.campaign_id) === cid) setHeaderClock(updated);
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [activeCampaignTab]);

  // LOBBY STATE
  const [checkedInPlayers, setCheckedInPlayers] = useState([]);

  const activeSessionRef = useRef(activeSession);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

  // CONVERSATION-OPENED SUBSCRIPTION - toast + commit to log
  useEffect(() => {
    const channel = supabase.channel('dm-dialogue-conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dialogue_conversations' }, async (payload) => {
        const convo = payload.new;
        if (!convo) return;

        setConvoToast({
          entityName: convo.entity_name || 'Someone',
          entityType: convo.entity_type,
          campaignId: convo.campaign_id,
        });
        setTimeout(() => setConvoToast(null), 6000);

        await supabase.from('dm_memory').insert({
          campaign_id: String(convo.campaign_id),
          category: 'note',
          content: `[CONVERSATION OPENED] with ${convo.entity_name || 'Unknown'} (${convo.entity_type})`,
        });

        const { data: hsession } = await supabase.from('hercules_sessions').select('id')
          .eq('campaign_id', String(convo.campaign_id)).eq('status', 'active')
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (hsession?.id) {
          await supabase.from('hercules_events').insert({
            session_id: hsession.id, type: 'dialogue',
            actor_name: 'System', actor_id: null,
            description: `A conversation opened with ${convo.entity_name || 'Unknown'}.`,
          });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // 1. LOBBY CHECK-IN SUBSCRIPTION
  useEffect(() => {
    const fetchCheckins = async () => {
      const { data } = await supabase.from('session_checkins').select('*');
      if (data) setCheckedInPlayers(data);
    };
    fetchCheckins();

    const channel = supabase.channel('lobby-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_checkins' },
        (payload) => {
          setCheckedInPlayers(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Deduplicate check-ins by character_id so the lobby is clean
  const uniqueCheckins = useMemo(() => {
    return Array.from(new Map(checkedInPlayers.map(p => [p.character_id, p])).values());
  }, [checkedInPlayers]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').not('session_id', 'is', null).order('created_at', { ascending: false });
    if (!data) return;
    const sessions = {};
    data.forEach(msg => {
      const key = msg.session_id;
      if (!sessions[key]) sessions[key] = { ...msg, session_id: key, ended: false, archived: false };
      if (msg.session_ended) sessions[key].ended = true;
      if (msg.archived) sessions[key].archived = true;
      if (!msg.is_dm && msg.sender_name && msg.sender_name !== 'The Architect') sessions[key].sender_name = msg.sender_name;
      if (!msg.is_dm && msg.character_name) sessions[key].character_name = msg.character_name;
      if (!msg.is_dm && msg.player_username) sessions[key].player_username = msg.player_username;
    });
    const sessionList = Object.values(sessions).sort((a, b) => {
      if (a.ended !== b.ended) return a.ended ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    setMessages(sessionList);
    setUnreadCount(sessionList.filter(s => !s.read && !s.ended && !s.is_dm && !s.archived).length);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase.channel('dm-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        fetchMessages();
        if (!payload.new.is_dm) {
          setToast({ name: payload.new.sender_name || 'A player', content: payload.new.content });
          setTimeout(() => setToast(null), 4000);
          if (payload.new.session_id && activeSessionRef.current?.session_id !== payload.new.session_id) {
            setActiveSession({
              session_id: payload.new.session_id,
              character_id: payload.new.character_id,
              character_name: payload.new.sender_name || payload.new.character_name || 'Player',
              player_username: payload.new.player_username || null,
              campaign_id: payload.new.campaign_id,
              player_id: payload.new.sender_id,
            });
                    }
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchMessages]);

  const fetchAll = async () => {
  setLoading(true);
  let campaignQuery = supabase.from('campaigns').select('*').order('created_at', { ascending: true });
  if (module?.id) campaignQuery = campaignQuery.eq('module_id', module.id);
  const { data: campData } = await campaignQuery;
  if (campData && campData.length > 0) {
    setDbCampaigns(campData);
    setActiveCampaignTab(prev => prev - campData[0].id);
  }
  await Promise.all([fetchCharacters(), fetchMessages()]);
  setLoading(false);
};

  const fetchCharacters = async () => {
    const { data } = await supabase.from('characters').select('*');
    if (data) setCharacters(data.map(row => ({
      ...row.data,
      id: row.id,
      status: row.status,
      campaign_id: row.campaign_id,
      user_id: row.user_id,
      apTotal: row.ap_total ?? row.apTotal ?? row.data?.apTotal ?? 0,
      apCurrent: row.ap_total ?? row.apCurrent ?? row.data?.apCurrent ?? 0,
      charLevel: row.level ?? row.charLevel ?? row.data?.charLevel ?? 1,
      atCurrent: row.at_current ?? row.atCurrent ?? row.data?.atCurrent ?? row.data?.apCurrent ?? 0,
      atTotal: row.at_total ?? row.atTotal ?? row.data?.atTotal ?? row.data?.apTotal ?? 0,
    }))); 
  };

  const markRead = async (sessionId) => { await supabase.from('messages').update({ read: true }).eq('session_id', sessionId).eq('is_dm', false); fetchMessages(); };
  const archiveSession = async (e, sessionId) => { e.stopPropagation(); await supabase.from('messages').update({ archived: true }).eq('session_id', sessionId); fetchMessages(); };
  const unarchiveSession = async (e, sessionId) => { e.stopPropagation(); await supabase.from('messages').update({ archived: false }).eq('session_id', sessionId); fetchMessages(); };

  const openSession = (session) => {
    markRead(session.session_id);
    setActiveSession({
      session_id: session.session_id,
      character_id: session.character_id,
      character_name: session.sender_name || session.character_name || 'Player',
      player_username: session.player_username || null,
      campaign_id: session.campaign_id,
      player_id: session.sender_id,
    });
  };

  const filtered = characters.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCampaign !== 'all' && c.campaign_id !== filterCampaign) return false;
    return true;
  });

  const activeMessages = messages.filter(s => !s.archived);
  const archivedMessages = messages.filter(s => s.archived);
  const displayedMessages = showArchive ? archivedMessages : activeMessages;
  const vttPlaceTokenRef = useRef(null);
  // 1. Add alongside existing vttPlaceTokenRef:
  const herculesAddCreature = useRef(null);

  // 2. Replace your existing <HerculesCombat ... /> at the bottom:
  <HerculesCombat
    defaultCampaignId={activeCampaignTab}
    onPlaceToken={tokenData => {
      vttPlaceTokenRef.current?.(tokenData);
    }}
    onRegisterAddCreature={fn => { herculesAddCreature.current = fn; }}
  />

const renderTab = () => {
  switch (activeTab) {
    case 'Inbox': return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowArchive(false)} style={{ background: !showArchive ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: !showArchive ? COLORS.text : COLORS.dim }}>Active {unreadCount > 0 && `(${unreadCount} unread)`}</button>
          <button onClick={() => setShowArchive(true)} style={{ background: showArchive ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: showArchive ? COLORS.text : COLORS.dim }}>Archive</button>
        </div>
        {displayedMessages.length === 0 && <div style={{ fontSize: 13, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{showArchive ? 'No archived messages.' : 'No active messages.'}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayedMessages.map(session => (
            <div key={session.session_id} onClick={() => openSession(session)} style={{ background: COLORS.card, border: `1px solid ${session.ended ? COLORS.border : COLORS.borderMid}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', opacity: session.ended ? 0.65 : 1, transition: 'all 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: COLORS.text }}>{session.sender_name || session.character_name || 'Unknown'}</div>
                    {!session.read && !session.ended && !session.is_dm && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.magic, flexShrink: 0 }} />}
                    {session.ended && <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '1px 5px' }}>ENDED</div>}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.content?.substring(0, 60)}{session.content?.length > 60 ? '...' : ''}</div>
                  <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 4 }}>{new Date(session.created_at).toLocaleString()}</div>
                </div>
                <button onClick={e => showArchive ? unarchiveSession(e, session.session_id) : archiveSession(e, session.session_id)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", flexShrink: 0, marginLeft: 8 }}>{showArchive ? 'Unarchive' : 'Archive'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    case 'Characters': return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'draft', 'awaiting_adventure', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ background: filterStatus === s ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: filterStatus === s ? COLORS.text : COLORS.dim, textTransform: 'capitalize' }}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ fontSize: 13, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No characters found.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(char => (
            <div key={char.id} onClick={() => setEditingChar(char)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              {(char.sprite_url || char.token?.sprite_url || char.portrait_url || char.data?.sprite_url || char.data?.token?.sprite_url || char.data?.portrait_url) && <img src={char.sprite_url || char.token?.sprite_url || char.portrait_url || char.data?.sprite_url || char.data?.token?.sprite_url || char.data?.portrait_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: `1px solid ${COLORS.border}` }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: COLORS.text }}>{char.name}</div>
                  <StatusBadge status={char.status} />
                </div>
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{getRaceDisplay(char.race, char.rv)} - {char.cid || 'No class'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    case 'Campaigns': return (
      <div>
        {dbCampaigns.length === 0 && <div style={{ fontSize: 13, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No campaigns found.</div>}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {dbCampaigns.map(c => (
            <button key={c.id} onClick={() => { setActiveCampaignTab(c.id); localStorage.setItem('dm_active_campaign', c.id); }} style={{ background: activeCampaignTab === c.id ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${activeCampaignTab === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: activeCampaignTab === c.id ? COLORS.text : COLORS.dim }}>{c.subtitle || c.id}</button>
          ))}
        </div>
        {activeCampaignTab && (() => {
          const camp = dbCampaigns.find(c => c.id === activeCampaignTab);
          if (!camp) return null;
          return (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {['log', 'memory', 'map', 'music'].map(sub => (
                  <button key={sub} onClick={() => setCampaignSubTab(sub)} style={{ background: campaignSubTab === sub ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: campaignSubTab === sub ? COLORS.text : COLORS.dim, textTransform: 'capitalize' }}>{sub}</button>
                ))}
              </div>
              {campaignSubTab === 'log' && <SessionLogEditor campaign={camp} />}
              {campaignSubTab === 'memory' && <DMMemoryPanel campaignId={camp.id} />}
              {campaignSubTab === 'map' && <MapManager campaign={camp} />}
              {campaignSubTab === 'music' && <MusicPanel />}
            </div>
          );
        })()}
      </div>
    );

    case 'Scribe': return <ScribeDMPanel embedded activeCampaignId={activeCampaignTab} />;

    case 'Chronicle': return <ChroniclePanel campaignId={activeCampaignTab} />;

    case 'Memory': return <DMMemoryPanel campaignId={activeCampaignTab} />;

    case 'Catalog': return <ItemCatalog />;

    case 'VTT': return (
      <div style={{
        position: 'fixed',
        top: vttMinimized ? 'auto' : 0,
        bottom: vttMinimized ? 0 : 'auto',
        left: vttMinimized ? 70 : 0,
        right: vttMinimized ? 'auto' : 0,
        width: vttMinimized ? 320 : '100vw',
        height: vttMinimized ? 200 : '100vh',
        zIndex: 10,
        borderRadius: vttMinimized ? 10 : 0,
        overflow: 'hidden',
        border: vttMinimized ? '1px solid rgba(200,168,74,0.3)' : 'none',
        boxShadow: vttMinimized ? '0 8px 32px rgba(0,0,0,0.6)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <VTTCanvas
          campaignId={activeCampaignTab}
          isDM={true}
          sessionId={activeGameSessionId}
          onRegisterPlaceToken={fn => { vttPlaceTokenRef.current = fn; }}
        />
        <button
          onClick={() => setVttMinimized(v => !v)}
          title={vttMinimized ? 'Expand VTT' : 'Minimize VTT'}
          style={{
            position: 'absolute', top: 8, left: 8, zIndex: 99999,
            background: 'rgba(16,13,10,0.85)', border: '1px solid rgba(240,238,235,0.18)',
            borderRadius: 5, width: 22, height: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(240,238,235,0.5)', fontSize: 14, lineHeight: 1,
            backdropFilter: 'blur(4px)',
          }}
        >{vttMinimized ? '+' : '-'}</button>
      </div>
    );

    default: return null;
  }
};

  const logDmAstragalToHercules = async payload => {
    const currentCampaignId = activeCampaignTab;

    const { data: hsession, error: sessionError } = await supabase
      .from('hercules_sessions')
      .select('id')
      .eq('campaign_id', String(currentCampaignId))
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !hsession?.id) {
      console.error('No active Hercules session found for DM Astragal roll:', sessionError);
      return;
    }

    const dice =
      payload?.diceResults ||
      payload?.results ||
      payload?.rolls ||
      payload?.dice ||
      [];

    const diceList = Array.isArray(dice)
      ? dice.map(d => Number(d?.value - d?.roll - d)).filter(n => !Number.isNaN(n))
      : [];

    const notation =
      payload?.notation ||
      `${payload?.count || diceList.length || 1}d${payload?.sides || payload?.die || 20}`;

    const diceTotal =
      payload?.diceTotal -
      diceList.reduce((sum, value) => sum + value, 0);

    const statModifier = Number(payload?.statModifier - payload?.statMod - 0);
    const flatModifier = Number(payload?.flatModifier - payload?.modifier - 0);
    const total = Number(payload?.total - payload?.result - diceTotal + statModifier + flatModifier);

    const diceText = diceList.length ? diceList.join(', ') : 'unknown';

    const { error } = await supabase.from('hercules_events').insert({
      session_id: hsession.id,
      type: 'dm_roll',
      actor_name: 'The Architect',
      actor_id: null,
      description:
        `The Architect rolls the bones: ${notation}. ` +
        `Dice: ${diceText}. ` +
        `Dice total: ${diceTotal}. ` +
        `Stat modifier: ${statModifier >= 0 ? '+' : ''}${statModifier}. ` +
        `Flat modifier: ${flatModifier >= 0 ? '+' : ''}${flatModifier}. ` +
        `Collected result: ${total}.`,
    });

    if (error) {
      console.error('Failed to log DM Astragal roll to Hercules:', error);
    }
  };

  const activeToolIds = [
    showAstragal && 'astragal',
    showHercules && 'hercules',
    showArgus && 'argus',
    showCastor && 'castor',
    showBestiary && 'bestiary',
    showScribePanel && 'scribe',
    showSolomon && 'solomon',
    showWorldMap && 'worldmap',
    showNPC && 'npc',
    showLarks && 'lark',
    showBazaar && 'bazaar',
    showQuestor && 'questor',
    showClock && 'clock',
    showLore && 'lore',
    showSpeak && 'speak',
    showProximity && 'proximity',
  ].filter(Boolean);
  const [topToolId, setTopToolId] = useState(null);
  const previousToolIds = useRef([]);

  useEffect(() => {
    const previous = previousToolIds.current;
    const newlyOpened = activeToolIds.filter(id => !previous.includes(id));
    if (newlyOpened.length > 0) setTopToolId(newlyOpened[newlyOpened.length - 1]);
    else if (activeToolIds.length && !activeToolIds.includes(topToolId)) setTopToolId(activeToolIds[activeToolIds.length - 1]);
    else if (!activeToolIds.length && topToolId) setTopToolId(null);
    previousToolIds.current = activeToolIds;
  }, [activeToolIds.join('|'), topToolId]);

  const panelPriority = (id) => {
    const isTop = activeToolIds.length < 2 || topToolId === id;
    return { isTop, onFocus: () => setTopToolId(id), zIndex: 200000 + (isTop ? 1000 : Math.max(0, activeToolIds.indexOf(id))) };
  };

  return (
    <div style={{ minHeight: '100svh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text, overflowX: 'hidden' }}>
      <HandbookBookmark user={user} darkMode={darkMode} allowEdit />
      <MenuMusicPlayer isMobile={isMobile} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {editingChar && <CharacterEditor char={editingChar} campaigns={dbCampaigns} onSave={() => { setEditingChar(null); fetchCharacters(); }} onClose={() => setEditingChar(null)} />}
      {activeSession && <ChatPanel session={activeSession} onClose={() => setActiveSession(null)} isDM={true} />}
      {showScribePanel && (
        <DraggablePanel {...panelPriority('scribe')} defaultX={108} defaultY={80} onClose={() => setShowScribePanel(false)} title="THE SCRIBE - Architect Access" width={420} accentColor={`${COLORS.deity}55`}>
          <ScribeDMPanel embedded activeCampaignId={activeCampaignTab} />
        </DraggablePanel>
      )}
      <PlayersPanel
        variant="dm"
        campaigns={dbCampaigns}
        onOpenCharacter={(char) => setEditingChar(char)}
        onMessage={(session) => setActiveSession(session)}
        showVTT={activeTab === 'VTT'}
        onPlaceOnVTT={async (char) => {
          if (vttPlaceTokenRef.current) {
            const { data: fresh } = await supabase.from('characters').select('data').eq('id', char.id).maybeSingle();
            const spriteUrl = fresh?.data?.sprite_url || fresh?.data?.token?.sprite_url || char.sprite_url || char.token?.sprite_url || null;
            const portraitUrl = fresh?.data?.portrait_url || char.portrait_url || null;
            vttPlaceTokenRef.current({
              label: (char.name || 'PC').slice(0, 3),
              fullName: char.name || null,
              color: '#4a9edd',
              type: 'player',
              characterId: char.id,
              race: char.race || null,
              sprite_url: spriteUrl,
              portrait_url: portraitUrl,
            });
          }
        }}
      />
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 300, background: '#13100d', border: `1px solid ${COLORS.magic}44`, borderRadius: 10, padding: '14px 18px', maxWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideIn 0.2s ease' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: COLORS.magic, marginBottom: 4, letterSpacing: '0.08em' }}>* New Message</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 4 }}>{toast.name}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.textSub, fontStyle: 'italic', lineHeight: 1.4 }}>{toast.content?.substring(0, 80)}{toast.content?.length > 80 ? '...' : ''}</div>
        </div>
      )}

      {convoToast && (
        <div style={{ position: 'fixed', bottom: toast ? 140 : 24, left: 24, zIndex: 300, background: '#13100d', border: '1px solid rgba(96,150,224,0.4)', borderRadius: 10, padding: '14px 18px', maxWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideIn 0.2s ease' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: '#7da8e0', marginBottom: 4, letterSpacing: '0.08em' }}>Dialogue Conversation Opened</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 8 }}>{convoToast.entityName} <span style={{ color: COLORS.dim, fontWeight: 400 }}>({convoToast.entityType})</span></div>
          <button onClick={() => { setShowSpeak(true); setConvoToast(null); }} style={{ background: 'rgba(96,150,224,0.12)', border: '1px solid rgba(96,150,224,0.4)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7da8e0' }}>Open Dialogue</button>
        </div>
      )}

      {showBestiary && (
        <DraggablePanel {...panelPriority('bestiary')} defaultX={108} defaultY={80} onClose={() => setShowBestiary(false)} title="BESTIARY - Creatures of Soteria" width={400} accentColor="rgba(168,230,163,0.3)">
          <BestiaryPanel isDM={true} campaignId={activeCampaignTab} embedded />
        </DraggablePanel>
      )}

              {showNPC && (
          <DraggablePanel {...panelPriority('npc')} defaultX={108} defaultY={80} onClose={() => setShowNPC(false)}
            title="NPC TRACKER - People of Soteria" width={480} accentColor="rgba(200,168,74,0.4)">
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
             <NPCPanel campaignId={activeCampaignTab} sessionId={activeGameSessionId} />
            </div>
          </DraggablePanel>
        )}

        {showLarks && (
          <DraggablePanel {...panelPriority('lark')} defaultX={108} defaultY={80} onClose={() => setShowLarks(false)} title="LARK - Letters & Correspondence" width={400} accentColor="rgba(200,168,74,0.35)">
            <LarkPanel char={null} campaignId={activeCampaignTab} isDM={true} embedded />
          </DraggablePanel>
        )}

        {showSpeak && (
          <DraggablePanel {...panelPriority('speak')} defaultX={108} defaultY={80} onClose={() => setShowSpeak(false)} title="Dialogue DIALOGUE - Speak as Soteria" width={420} accentColor="rgba(96,150,224,0.4)">
            <DMSpeakPanel campaignId={activeCampaignTab} sessionId={activeGameSessionId} embedded />
          </DraggablePanel>
        )}

        {showProximity && (
          <DraggablePanel {...panelPriority('proximity')} defaultX={108} defaultY={80} onClose={() => setShowProximity(false)} title="PARTY - Proximity & Check-In" width={420} accentColor="rgba(121,245,167,0.35)">
            <div style={{ overflowY: 'auto', height: '100%' }}>
              <PartyProximityPanel campaignId={activeCampaignTab} isDM={true} />
            </div>
          </DraggablePanel>
        )}

      {/* Header */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', flexShrink: 0, gap: 12 }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0, justifySelf: 'start' }}>Home</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>DM Mode</div>
            <div style={{ fontSize: 8, color: sessionTimerLabel ? COLORS.magic : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: sessionTimerLabel ? 700 : 400 }}>
              {sessionTimerLabel || "The Architect's Chamber"}
            </div>
          </div>
          {headerClock && <SoteriaClockDisplay clock={headerClock} compact />}
        </div>

        <div style={{ justifySelf: 'end' }}>
          <SessionManager
            onTimerLabel={setSessionTimerLabel}
            checkedInPlayers={uniqueCheckins}
          />
        </div>

       {showWorldMap && (
  <DraggablePanel {...panelPriority('worldmap')} defaultX={120} defaultY={40} onClose={() => setShowWorldMap(false)} title="WORLD MAP - Soteria" width={Math.min(window.innerWidth - 140, 900)} accentColor="rgba(200,168,74,0.4)">
    <div style={{ height: '70vh' }}>
      <WorldMapPanel campaignId={activeCampaignTab} isDM={true} characters={characters} />
    </div>
  </DraggablePanel>
)}

{showLore && (
  <DraggablePanel {...panelPriority('lore')} defaultX={108} defaultY={80} onClose={() => setShowLore(false)} title="[ LORE ] World Announcement" width={440} accentColor="rgba(200,168,74,0.5)">
    <LoreAnnouncePanel campaignId={activeSession?.campaign_id || activeCampaignTab} embedded />
  </DraggablePanel>
)}
        </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {DM_TABS.map(tab => {
          const isActive = tab === activeTab;
          const showBadge = tab === 'Inbox' && unreadCount > 0;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 12px' : '12px 18px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease', position: 'relative' }}>
              {tab}
              {showBadge && <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: COLORS.magic }} />}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 740, width: '100%', margin: '0 auto' }}>
          {loading ? <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13 }}>Consulting the archives...</div> : renderTab()}
        </div>
      </div>
      {showArgus && (
        <DraggablePanel {...panelPriority('argus')} defaultX={108} defaultY={80} onClose={() => setShowArgus(false)} title="ARGUS - Inventory Oversight" width={480} accentColor="rgba(200,168,74,0.35)">
          <ArgusDMPanel onClose={() => setShowArgus(false)} embedded />
        </DraggablePanel>
      )}
      {showHercules && (
        <DraggablePanel {...panelPriority('hercules')} defaultX={72} defaultY={40} onClose={() => setShowHercules(false)} title="HERCULES - Combat Tracker" width={920} accentColor="rgba(200,168,74,0.35)">
          <HerculesCombat defaultCampaignId={activeCampaignTab} embedded />
        </DraggablePanel>
      )}
      {showAstragal && (
        <DraggablePanel {...panelPriority('astragal')} defaultX={108} defaultY={80} onClose={() => setShowAstragal(false)} title="ASTRAGAL - Fate Cast in Bone" width={380} accentColor="rgba(240,238,235,0.18)">
          <div style={{ padding: 14 }}>
            <Astragal character={characters?.[0]} actionName="Astragal" statKey="will" notation="1d20" onResult={logDmAstragalToHercules} />
          </div>
        </DraggablePanel>
      )}
      {showSolomon && (
        <DraggablePanel {...panelPriority('solomon')} defaultX={108} defaultY={80} onClose={() => setShowSolomon(false)} title="SOLOMON - Loot Governance" width={400} accentColor="rgba(180,122,58,0.5)">
          <Solomon campaignId={activeCampaignTab} />
        </DraggablePanel>
      )}
      {showCastor && (
        <DraggablePanel {...panelPriority('castor')} defaultX={108} defaultY={80} onClose={() => setShowCastor(false)} title="CASTOR - Cast Requests" width={420} accentColor="rgba(56,189,248,0.35)">
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <CastorDMPanel onPendingChange={setCastorBadge} />
          </div>
        </DraggablePanel>
      )}
      {showBazaar && (
        <DraggablePanel {...panelPriority('bazaar')} defaultX={108} defaultY={80} onClose={() => setShowBazaar(false)} title="BAZAAR - Trade & Loot" width={420} accentColor="rgba(180,122,58,0.5)">
          <div style={{ padding: 14, height: '100%', overflowY: 'auto' }}>
            <BazaarDMPanel campaignId={activeCampaignTab} onClose={() => setShowBazaar(false)} />
          </div>
        </DraggablePanel>
      )}
      {showQuestor && (
        <DraggablePanel {...panelPriority('questor')} defaultX={108} defaultY={80} onClose={() => setShowQuestor(false)} title="QUESTOR - Quest Board" width={420} accentColor="rgba(200,168,74,0.4)">
          <QuestorDMPanel campaignId={activeCampaignTab} onClose={() => setShowQuestor(false)} />
        </DraggablePanel>
      )}
      {showClock && (
    <DraggablePanel {...panelPriority('clock')} defaultX={120} defaultY={80} onClose={() => setShowClock(false)} title="SOTERIA - World Clock" width={320} accentColor="rgba(201,185,145,0.3)">
      <div style={{ padding: 14 }}>
        <SoteriaClockPanel key={activeCampaignTab} campaignId={activeCampaignTab} />
      </div>
    </DraggablePanel>
  )}
      <FloatToolbar activeIds={activeToolIds} buttons={[
        {
          id: 'astragal',
          title: 'Astragal - Roll the dice',
          onClick: () => setShowAstragal(o => !o),
          children: <img src="/AstragalButton.png" alt="Astragal" draggable={false} style={{ width: '118%', height: '118%', objectFit: 'contain', pointerEvents: 'none' }} />,
        },
        {
          id: 'hercules',
          title: 'HERCULES - Combat Tracker',
          onClick: () => setShowHercules(o => !o),
          children: <img src="/HerculesCombat.png" alt="HERCULES" draggable={false} style={{ width: '150%', height: '150%', objectFit: 'contain', pointerEvents: 'none' }} />,
        },
        {
          id: 'argus',
          title: 'ARGUS - My Gear, Pack, and Revealed Chests',
          onClick: () => setShowArgus(o => !o),
          children: <img src="/Backpackicon.png" alt="ARGUS" draggable={false} style={{ width: '105%', height: '105%', objectFit: 'contain', pointerEvents: 'none' }} />,
        },
        {
          id: 'castor',
          title: 'CASTOR - Cast Request',
          onClick: () => setShowCastor(o => !o),
          badge: castorBadge,
          children: <img src="/castoricon.png" alt="CASTOR" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'bestiary',
          title: 'Bestiary - Creatures of Soteria',
          onClick: () => setShowBestiary(o => !o),
          children: <img src="/bestiaryicon.png" alt="Bestiary" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'scribe',
          title: 'The Scribe - Archives',
          onClick: () => setShowScribePanel(o => !o),
          children: <img src="/scribe-emblem.png" alt="Scribe" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'solomon',
          title: 'SOLOMON - Loot Governance',
          onClick: () => setShowSolomon(o => !o),
          children: <img src="/solomonicon.png" alt="SOLOMON" draggable={false} style={{ width: '120%', height: '120%', objectFit: 'contain', pointerEvents: 'none' }} />,
        },
        {
          id: 'worldmap',
          title: 'World Map - Soteria',
          onClick: () => setShowWorldMap(o => !o),
          children: <img src="/WorldMapIcon.png" alt="World Map" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'npc',
          title: 'NPC Tracker - People of Soteria',
          onClick: () => setShowNPC(o => !o),
          children: <img src="/npcicon.png" alt="NPC Tracker" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'lark',
          title: 'LARK - Player Correspondence',
          onClick: () => setShowLarks(o => !o),
          children: <img src="/Larkicon.png" alt="Lark" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'bazaar',
          title: 'BAZAAR - Trade & Loot',
          onClick: () => setShowBazaar(o => !o),
          children: <img src="/Bazaaricon.png" alt="Bazaar" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'questor',
          title: 'QUESTOR - Quest Board',
          onClick: () => setShowQuestor(o => !o),
          children: <img src="/Questoricon.png" alt="Questor" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'clock',
          title: 'Soteria World Clock',
          onClick: () => setShowClock(o => !o),
          children: <img src="/clockIcon.png" alt="Clock" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'lore',
          title: 'Lore Announce - Broadcast to World',
          onClick: () => setShowLore(o => !o),
          children: <img src="/loreicon.png" alt="Lore" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'speak',
          title: 'Dialogue - Speak as NPC or Beast',
          onClick: () => setShowSpeak(o => !o),
          children: <img src="/speakicon.png" alt="Speak" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'proximity',
          title: 'Party - Proximity & Check-In',
          onClick: () => setShowProximity(o => !o),
          children: <img src="/party.png" alt="Party" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        ]} />
    </div>
  );
}

