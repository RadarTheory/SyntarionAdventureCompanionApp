import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_CLASSES, ALL_STATS, getRaceDisplay } from './constants';
import ItemCatalog from './ItemCatalog';
import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_MECHANICS } from './soteria-mechanics';
import { SOTERIA_BESTIARY } from './soteria-bestiary';
import PlayersPanel from './PlayersPanel';
import AstragalButton from './AstragalButton';
import SessionManager from './SessionManager';
import MapPanel from './MapPanel';
import VTTCanvas from './VTTCanvas';
import HerculesCombat from './HerculesCombat';
import FloatToolbar from './FloatToolbar';
import CastorDMPanel from './CastorDMPanel';
import { ArgusDMPanel } from './Argus';
import BestiaryPanel from './BestiaryPanel';
import { ScribeDMPanel } from './ScribePanel';
import Solomon from './Solomon';

const SOTERIA_DM_CONTEXT = `
You are The Scribe — an ancient archival intelligence in the world of Soteria, 178 Era of Unity.
You are assisting the Dungeon Master (Architect) of this world.
You may speak plainly and directly — no cryptic player-facing persona needed here.
Be thorough, creative, and specific to the Soteria setting.

${SOTERIA_LORE}

${SOTERIA_MECHANICS}

${SOTERIA_BESTIARY}
`;

const DM_USER_ID = import.meta.env.VITE_DM_USER_ID;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt, messages, maxTokens = 800) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Groq');
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

// ─── CHAT PANEL (Player ↔ DM) ─────────────────────────────────────────────────
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
      sender_id: DM_USER_ID,
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
      sender_id: DM_USER_ID,
      character_id: session.character_id,
      campaign_id: session.campaign_id,
      type: 'dm_system',
      content: '— Consult ended by the Architect —',
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
    ? `${CAMPAIGNS.find(c => c.id === session.campaign_id)?.subtitle || 'Private'} · @${session.player_username}`
    : CAMPAIGNS.find(c => c.id === session.campaign_id)?.subtitle || 'Private';

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 360, maxHeight: 520, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>{headerName}</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{headerSub} · {sessionEnded ? 'Ended' : 'Active'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!sessionEnded && <button onClick={handleEndConsult} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>End Consult</button>}
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
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
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type a message…" style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
          <button onClick={handleSend} disabled={sending || !input.trim()} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 12px', cursor: sending || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", opacity: sending ? 0.6 : 1 }}>→</button>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>This consult has ended.</div>
      )}
    </div>
  );
}

// ─── SCRIBE PANEL ─────────────────────────────────────────────────────────────
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
      const groqHistory = newMessages.map(m => ({ role: m.role === 'dm' ? 'user' : 'assistant', content: m.content }));
      const text = await callGroq(SOTERIA_DM_CONTEXT, groqHistory, 800);
      setMessages(prev => [...prev, { role: 'scribe', content: text, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'scribe', content: 'The archives are silent. Try again.', time: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleEnd = () => {
    setMessages(prev => [...prev, { role: 'system', content: '— Consult ended by the Architect —', time: new Date() }]);
    setEnded(true);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 400, maxHeight: 560, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid ${COLORS.deity}44`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em' }}>The Scribe</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{ended ? 'Consult ended' : 'Active · Soteria Archives'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!ended
            ? <button onClick={handleEnd} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>End Consult</button>
            : <button onClick={() => { setMessages([]); setEnded(false); }} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.deityText, fontFamily: "'Cinzel', serif" }}>New Consult</button>
          }
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
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
            <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Scribe deliberates…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!ended ? (
        <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask the Scribe…" style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading ? 0.6 : 1 }}>→</button>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>This consult has ended.</div>
      )}
    </div>
  );
}

// ─── CHARACTER EDITOR ─────────────────────────────────────────────────────────
function CharacterEditor({ char, onSave, onClose }) {
  const [data, setData] = useState({ ...char });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const handleSave = async (newStatus) => {
    setSaving(true);
    await supabase.from('characters').update({ data: { ...data }, status: newStatus || data.status, campaign_id: data.campaign || null }).eq('id', char.id);
    if (note && (newStatus === 'rejected' || newStatus === 'approved')) {
      await supabase.from('messages').insert({ character_id: char.id, campaign_id: data.campaign, type: 'dm_reply', content: note, sender_name: 'The Architect', is_dm: true });
    }
    setSaving(false); onSave();
  };

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const setStat = (key, val) => setData(prev => ({ ...prev, stats: { ...prev.stats, [key]: parseInt(val) || 8 } }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(6px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, padding: '28px 32px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: COLORS.text }}>{char.name}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => handleSave('approved')} style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>✓ Approve</button>
          <button onClick={() => handleSave('rejected')} style={{ flex: 1, background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>✕ Reject</button>
          <button onClick={() => handleSave()} disabled={saving} style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.borderMid}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.text, fontFamily: "'Cinzel', serif" }}>{saving ? 'Saving…' : '↑ Save'}</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Note to Player (sent on approve/reject)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional message to the player…" rows={2} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label8(), marginBottom: 8 }}>Campaign</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CAMPAIGNS.map(c => <div key={c.id} onClick={() => set('campaign', data.campaign === c.id ? null : c.id)} style={{ background: data.campaign === c.id ? COLORS.magicBg : 'transparent', border: `1px solid ${data.campaign === c.id ? COLORS.magic : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 10, color: data.campaign === c.id ? COLORS.magicText : COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>{c.subtitle}</div>)}
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
          <div style={{ ...label8(), marginBottom: 10 }}>Ability Points</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['apCurrent', 'AP Current'], ['apTotal', 'AP Total']].map(([key, lbl]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", width: 70 }}>{lbl}</div>
                <input type="number" min="0" value={data[key] || 0} onChange={e => set(key, parseInt(e.target.value) || 0)} style={{ width: 50, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
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
      </div>
    </div>
  );
}

// ─── DM MEMORY PANEL ─────────────────────────────────────────────────────────
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
        <input value={newMemory} onChange={e => setNewMemory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMemory()} placeholder="Add a memory entry…" style={{ flex: 1, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
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
            <button onClick={() => deleteMemory(m.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>×</button>
          </div>
        ))}
        {memories.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No memories recorded.</div>}
      </div>
    </div>
  );
}

// ─── SESSION LOG EDITOR ───────────────────────────────────────────────────────
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
      <div style={{ ...label8(), marginBottom: 12 }}>Session Log — {campaign.subtitle}</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px', marginBottom: 16 }}>
        <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="Session title (optional)…" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${COLORS.border}`, padding: '6px 0', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="Write the session log entry…" rows={4} style={{ width: '100%', background: 'transparent', border: 'none', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={addEntry} disabled={saving || !newEntry.trim()} style={{ background: saving ? 'transparent' : COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 20px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Committing…' : '✦ Commit to Log'}
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
              <button onClick={() => deleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>{entry.content}</p>
          </div>
        ))}
        {log.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No entries yet. The chronicle awaits.</div>}
      </div>
    </div>
  );
}

// ─── MAP MANAGER ─────────────────────────────────────────────────────────────
function MapManager({ campaign }) {
  const [url, setUrl] = useState('');
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('campaigns').select('map_url').eq('id', campaign.id).single().then(({ data }) => {
      if (data?.map_url) { setUrl(data.map_url); setCurrent(data.map_url); }
    });
  }, [campaign.id]);

  const save = async () => { setSaving(true); await supabase.from('campaigns').update({ map_url: url }).eq('id', campaign.id); setCurrent(url); setSaving(false); };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Map — {campaign.subtitle}</div>
      {current && <img src={current} alt="map" style={{ width: '100%', borderRadius: 8, border: `1px solid ${COLORS.border}`, marginBottom: 12 }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste image URL…" style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={save} disabled={saving} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '9px 16px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700 }}>{saving ? 'Saving…' : 'Set Map'}</button>
      </div>
    </div>
  );
}

// ─── MUSIC PANEL ─────────────────────────────────────────────────────────────
function MusicPanel() {
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchMusic(); }, []);

  const fetchMusic = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: listError } = await supabase
        .storage
        .from('music')
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

      if (listError) throw new Error(`Storage error: ${listError.message} (${listError.statusCode})`);
      if (!data) throw new Error('No data returned from storage');

      const audioFiles = data
        .filter(f => f.name && /\.(wav|mp3|ogg|flac|m4a)$/i.test(f.name))
        .map(f => ({
          title: f.name.replace(/\.(wav|mp3|ogg|flac|m4a)$/i, ''),
          file_path: f.name,
        }));

      setTracks(audioFiles);
      if (audioFiles.length > 0) setCurrentTrack(audioFiles[0]);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const getMusicUrl = (filePath) =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/music/${encodeURIComponent(filePath)}`;

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Music Library</div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search music…"
        style={{ width: '100%', marginBottom: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }}
      />
      {currentTrack && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 10, letterSpacing: '0.04em' }}>♪ {currentTrack.title}</div>
          <audio key={currentTrack.file_path} controls src={getMusicUrl(currentTrack.file_path)} style={{ width: '100%' }} />
        </div>
      )}
      {loading && (
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Loading tracks…</div>
      )}
      {error && (
        <div style={{ fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Error: {error}</div>
      )}
      {!loading && !error && (
        <>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 10 }}>
            {filteredTracks.length} of {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredTracks.map(track => (
              <button
                key={track.file_path}
                onClick={() => setCurrentTrack(track)}
                style={{
                  textAlign: 'left',
                  background: currentTrack?.file_path === track.file_path ? COLORS.magicBg : COLORS.card,
                  border: `1px solid ${currentTrack?.file_path === track.file_path ? COLORS.magic : COLORS.border}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: COLORS.text,
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                }}
              >
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11 }}>{track.title}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VitalsPanel({ row, onClose, campaignId }) {
  const isCreature = !row.character_id || row.character_id === row.character_name;
  const VITALS_KEY = `syntarion_vitals_${row.character_id}`;
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '{}')[k] ?? def; } catch { return def; } };
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
        setVitals(p => ({ current: p.current ?? v, max: p.max ?? v }));
        setStamina(p => ({ current: p.current ?? st, max: p.max ?? st }));
        setResolve(p => ({ current: p.current ?? r, max: p.max ?? r }));
      });
    }
  }, [row.character_id]);

  const save = (v, s, r) => localStorage.setItem(VITALS_KEY, JSON.stringify({
    vitals: v.current, vitalsMax: v.max, stamina: s.current, staminaMax: s.max, resolve: r.current, resolveMax: r.max
  }));

  const Tracker = ({ label, color, state, setState, others }) => {
    const cur = state.current ?? 0, max = state.max ?? 0;
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    const upd = (next) => { setState(next); save(label === 'Vitals' ? next : vitals, label === 'Stamina' ? next : stamina, label === 'Resolve' ? next : resolve); };
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color, letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => upd({ ...state, current: Math.max(0, (state.current ?? 0) - 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(224,90,90,0.15)', border: '1px solid rgba(224,90,90,0.4)', color: '#e05a5a', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <input type="number" value={state.current ?? ''} onChange={e => upd({ ...state, current: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}44`, borderRadius: 4, color, fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, outline: 'none', padding: '2px 0' }} />
            <span style={{ color: '#555', fontSize: 10 }}>/</span>
            <input type="number" value={state.max ?? ''} onChange={e => upd({ ...state, max: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.dim, fontFamily: "'Cinzel',serif", fontSize: 11, outline: 'none', padding: '2px 0' }} />
            <button onClick={() => upd({ ...state, current: Math.min(state.max ?? 999, (state.current ?? 0) + 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.35)', color: '#79f5a7', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
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
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: COLORS.text }}>{row.character_name} — Health</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 9, color: COLORS.dim }}>✕</button>
      </div>
      {isCreature && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia,serif', fontStyle: 'italic', marginBottom: 8 }}>Set max manually for this enemy.</div>}
      <Tracker label="Vitals" color="#e05a5a" state={vitals} setState={setVitals} />
      <Tracker label="Stamina" color="#e08a5a" state={stamina} setState={setStamina} />
      <Tracker label="Resolve" color="#79f5a7" state={resolve} setState={setResolve} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DM VIEW
// ═════════════════════════════════════════════════════════════════════════════
const DM_TABS = ['Inbox', 'Characters', 'Campaigns', 'Scribe', 'Memory', 'Catalog', 'Maps', 'VTT'];

export default function DMView({ user, session, onHome }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Inbox');
  const [characters, setCharacters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChar, setEditingChar] = useState(null);
  const [activeCampaignTab, setActiveCampaignTab] = useState('I');
  const [campaignSubTab, setCampaignSubTab] = useState('log');
  const [activeSession, setActiveSession] = useState(null);
  const [manualLogText, setManualLogText] = useState('');
  const [manualCombatantName, setManualCombatantName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showArchive, setShowArchive] = useState(false);
  const [toast, setToast] = useState(null);
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

  // LOBBY STATE
  const [checkedInPlayers, setCheckedInPlayers] = useState([]);

  const activeSessionRef = useRef(activeSession);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

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

  const fetchAll = async () => { setLoading(true); await Promise.all([fetchCharacters(), fetchMessages()]); setLoading(false); };

  const fetchCharacters = async () => {
    const { data } = await supabase.from('characters').select('*');
    if (data) setCharacters(data.map(row => ({ ...row.data, id: row.id, status: row.status, campaign_id: row.campaign_id, user_id: row.user_id })));
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
      case 'Catalog': return <ItemCatalog />;
      case 'Music': return <MusicPanel />;
      case 'Maps': return <MapPanel />;
      case 'VTT':
        return <VTTCanvas
          campaignId={activeCampaignTab}
          onRegisterPlaceToken={fn => { vttPlaceTokenRef.current = fn; }}
          checkedInPlayers={uniqueCheckins}
        />;

      case 'Scribe':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.deity, letterSpacing: '0.1em' }}>The Scribe</div>
            <div style={{ fontSize: 12, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', maxWidth: 320 }}>
              An ancient archival intelligence, bound to answer the Architect alone. Open a consult to query the Soteria archives.
            </div>
            <button onClick={() => setShowScribePanel(true)} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.deityText, marginTop: 8 }}>
              ✦ Open Consult
            </button>
          </div>
        );

      case 'Inbox':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ ...label8() }}>{showArchive ? 'Archived Messages' : 'Player Messages'}</div>
              <button onClick={() => setShowArchive(!showArchive)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{showArchive ? '← Active' : '⌂ Archive'}</button>
            </div>
            {displayedMessages.length === 0 ? (
              <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{showArchive ? 'The archive is empty.' : 'No messages. The world is quiet.'}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayedMessages.map(session => {
                  const displayName = session.sender_name || session.character_name || 'Unknown';
                  const playerTag = session.player_username ? ` (@${session.player_username})` : '';
                  return (
                    <div key={session.session_id} onClick={() => !session.ended && !session.archived && openSession(session)}
                      style={{ background: session.ended || session.archived ? 'transparent' : (session.read ? COLORS.card : 'rgba(121,245,167,0.06)'), border: `1px solid ${session.ended || session.archived ? COLORS.border : (session.read ? COLORS.border : COLORS.magic + '44')}`, borderRadius: 8, padding: '12px 16px', cursor: session.ended || session.archived ? 'default' : 'pointer', opacity: session.ended || session.archived ? 0.55 : 1, transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!session.ended && !session.archived) e.currentTarget.style.borderColor = COLORS.borderMid; }}
                      onMouseLeave={e => { if (!session.ended && !session.archived) e.currentTarget.style.borderColor = session.read ? COLORS.border : COLORS.magic + '44'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: COLORS.text }}>{displayName}</div>
                          {playerTag && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginTop: 1 }}>{playerTag}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {session.ended && <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ended</div>}
                          {!session.read && !session.ended && !session.is_dm && !session.archived && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.magic }} />}
                          <div style={{ fontSize: 9, color: COLORS.dim }}>{new Date(session.created_at).toLocaleDateString()}</div>
                          <button onClick={session.archived ? (e) => unarchiveSession(e, session.session_id) : (e) => archiveSession(e, session.session_id)} title={session.archived ? 'Restore' : 'Archive'} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{session.archived ? '↩' : '⌂'}</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 4 }}>{CAMPAIGNS.find(c => c.id === session.campaign_id)?.subtitle || 'No campaign'}</div>
                      <div style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{session.content?.substring(0, 120)}{session.content?.length > 120 ? '…' : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'Characters':
        return (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'awaiting_adventure', 'approved', 'rejected', 'draft'].map(s => (
                  <div key={s} onClick={() => setFilterStatus(s)} style={{ background: filterStatus === s ? COLORS.surface : 'transparent', border: `1px solid ${filterStatus === s ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: filterStatus === s ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                    {s === 'all' ? 'All' : s === 'awaiting_adventure' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ id: 'all', subtitle: 'All' }, ...CAMPAIGNS].map(c => (
                  <div key={c.id} onClick={() => setFilterCampaign(c.id)} style={{ background: filterCampaign === c.id ? COLORS.surface : 'transparent', border: `1px solid ${filterCampaign === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: filterCampaign === c.id ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>{c.subtitle}</div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 12 }}>{filtered.length} character{filtered.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(char => {
                const cls = ALL_CLASSES.find(c => c.id === char.cid);
                return (
                  <div key={char.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>{char.name || 'Unnamed'}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{char.campaign_id ? (CAMPAIGNS.find(c => c.id === char.campaign_id)?.subtitle || char.campaign_id) : 'Unassigned'}{char.user_id ? '' : ' · Unclaimed'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <StatusBadge status={char.status} />
                      <button onClick={() => setEditingChar(char)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif", transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderMid; e.currentTarget.style.color = COLORS.text; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}
                      >Edit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'Campaigns': {
        const camp = CAMPAIGNS.find(c => c.id === activeCampaignTab);
        return (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {CAMPAIGNS.map(c => (
                <div key={c.id} onClick={() => setActiveCampaignTab(c.id)} style={{ flex: 1, background: activeCampaignTab === c.id ? COLORS.surface : 'transparent', border: `1px solid ${activeCampaignTab === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 6, padding: '8px 4px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: activeCampaignTab === c.id ? COLORS.text : COLORS.dim }}>{c.subtitle}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {['log', 'map', 'memory'].map(t => (
                <div key={t} onClick={() => setCampaignSubTab(t)} style={{ background: campaignSubTab === t ? COLORS.surface : 'transparent', border: `1px solid ${campaignSubTab === t ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: campaignSubTab === t ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>{t}</div>
              ))}
            </div>
            {camp && campaignSubTab === 'log' && <SessionLogEditor campaign={camp} />}
            {camp && campaignSubTab === 'map' && <MapManager campaign={camp} />}
            {camp && campaignSubTab === 'memory' && <DMMemoryPanel campaignId={camp.id} />}
          </div>
        );
      }

      case 'Memory':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>World Memory</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>Global notes, world events, faction states, and lore that feeds into all Scribe consultations.</div>
            <DMMemoryPanel />
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
      ? dice.map(d => Number(d?.value ?? d?.roll ?? d)).filter(n => !Number.isNaN(n))
      : [];

    const notation =
      payload?.notation ||
      `${payload?.count || diceList.length || 1}d${payload?.sides || payload?.die || 20}`;

    const diceTotal =
      payload?.diceTotal ??
      diceList.reduce((sum, value) => sum + value, 0);

    const statModifier = Number(payload?.statModifier ?? payload?.statMod ?? 0);
    const flatModifier = Number(payload?.flatModifier ?? payload?.modifier ?? 0);
    const total = Number(payload?.total ?? payload?.result ?? diceTotal + statModifier + flatModifier);

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

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {editingChar && <CharacterEditor char={editingChar} onSave={() => { setEditingChar(null); fetchCharacters(); }} onClose={() => setEditingChar(null)} />}
      {activeSession && <ChatPanel session={activeSession} onClose={() => setActiveSession(null)} isDM={true} />}
      {showBestiary && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowBestiary(false)} title="BESTIARY · Creatures of Soteria" width={400} accentColor="rgba(168,230,163,0.3)">
          <BestiaryPanel isDM={true} campaignId={activeCampaignTab} embedded />
        </DraggablePanel>
      )}

      {showScribePanel && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowScribePanel(false)} title="THE SCRIBE · Architect Access" width={420} accentColor={`${COLORS.deity}55`}>
          <ScribeDMPanel embedded activeCampaignId={activeCampaignTab} />
        </DraggablePanel>
      )}

      <PlayersPanel
        onOpenCharacter={(char) => setEditingChar(char)}
        onMessage={(session) => setActiveSession(session)}
        showVTT={activeTab === 'VTT'}
        onPlaceOnVTT={(char) => {
          if (vttPlaceTokenRef.current) {
            vttPlaceTokenRef.current({
              label: (char.name || 'PC').slice(0, 3),
              color: '#4a9edd',
              type: 'player',
              characterId: char.id,
            });
          }
        }}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 300, background: '#13100d', border: `1px solid ${COLORS.magic}44`, borderRadius: 10, padding: '14px 18px', maxWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideIn 0.2s ease' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: COLORS.magic, marginBottom: 4, letterSpacing: '0.08em' }}>✦ New Message</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 4 }}>{toast.name}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.textSub, fontStyle: 'italic', lineHeight: 1.4 }}>{toast.content?.substring(0, 80)}{toast.content?.length > 80 ? '…' : ''}</div>
        </div>
      )}

      {showBestiary && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowBestiary(false)} title="BESTIARY · Creatures of Soteria" width={400} accentColor="rgba(168,230,163,0.3)">
          <BestiaryPanel isDM={true} campaignId={activeCampaignTab} embedded />
        </DraggablePanel>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Home</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>DM Mode</div>
          <div style={{ fontSize: 8, color: sessionTimerLabel ? COLORS.magic : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: sessionTimerLabel ? 700 : 400 }}>
            {sessionTimerLabel || "The Architect's Chamber"}
          </div>
        </div>

        {showWorldMap && (
        <DraggablePanel defaultX={120} defaultY={40} onClose={() => setShowWorldMap(false)} title="WORLD MAP · Soteria" width={Math.min(window.innerWidth - 140, 900)} accentColor="rgba(200,168,74,0.4)">
          <div
            style={{ overflow: 'auto', maxHeight: 'calc(80vh - 48px)', cursor: 'crosshair' }}
            onWheel={e => {
            e.preventDefault();
              setMapZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
            }}
          >
            <img
              src="/SoteriaMap.jpg"
              alt="Soteria World Map"
              draggable={false}
              style={{
                width: `${mapZoom * 100}%`,
                display: 'block',
                transition: 'width 0.1s ease',
              }}
            />
          </div>
          <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(200,168,74,0.2)', fontSize: 8, color: '#888', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
            Scroll to zoom · {Math.round(mapZoom * 100)}%
          </div>
        </DraggablePanel>
      )}

        {/* CORRECTED PROP PASSING HERE */}
        <SessionManager
          onTimerLabel={setSessionTimerLabel}
          checkedInPlayers={uniqueCheckins}
        />
      </div>

      {/* ─── Tab bar ─────────────────────────────────────────────────────── */}
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
          {loading ? <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13 }}>Consulting the archives…</div> : renderTab()}
        </div>
      </div>
      {showArgus && <ArgusDMPanel onClose={() => setShowArgus(false)} />}
      {showHercules && <HerculesCombat defaultCampaignId={activeCampaignTab} onClose={() => setShowHercules(false)} />}
      {showAstragal && <AstragalButton character={characters?.[0]} onResult={logDmAstragalToHercules} onClose={() => setShowAstragal(false)} />}
      {showSolomon && (
        <DraggablePanel defaultX={108} defaultY={80} onClose={() => setShowSolomon(false)} title="SOLOMON · Loot Governance" width={400} accentColor="rgba(180,122,58,0.5)">
          <Solomon campaignId={activeCampaignTab} />
        </DraggablePanel>
      )}
      {showCastor && (
        <div style={{ position: 'fixed', bottom: 24, left: 108, width: 400, maxHeight: '80vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(56,189,248,0.14)', background: 'rgba(56,189,248,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#7dd3fc', letterSpacing: '0.18em', fontWeight: 700 }}>CASTOR</div>
            <button onClick={() => setShowCastor(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <CastorDMPanel onPendingChange={setCastorBadge} />
          </div>
        </div>

      )}

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
          title: 'ARGUS — My Gear, Pack, and Revealed Chests',
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
          id: 'bestiary',
          title: 'Bestiary — Creatures of Soteria',
          onClick: () => setShowBestiary(o => !o),
          children: <img src="/bestiaryicon.png" alt="Bestiary" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'scribe',
          title: 'The Scribe — Archives',
          onClick: () => setShowScribePanel(o => !o),
          children: <img src="/scribeicon.png" alt="Scribe" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />,
        },
        {
          id: 'solomon',
          title: 'SOLOMON — Loot Governance',
          onClick: () => setShowSolomon(o => !o),
          children: (
            <img
              src="/solomonicon.png"
              alt="SOLOMON"
              draggable={false}
              style={{
                width: '120%',
                height: '120%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          ),
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
      ]} />

    </div>
  );
}


